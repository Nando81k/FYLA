import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  coordinates: LocationCoordinates;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DistanceInfo {
  distance: number; // in kilometers
  duration?: number; // in minutes (if available)
}

class LocationService {
  private hasPermission = false;

  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus === 'granted') {
        this.hasPermission = true;
        return true;
      } else {
        this.showLocationPermissionAlert();
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationInfo | null> {
    try {
      if (!this.hasPermission) {
        const permissionGranted = await this.requestLocationPermission();
        if (!permissionGranted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Get address from coordinates
      const address = await this.reverseGeocode(coordinates);

      return {
        coordinates,
        ...address,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async reverseGeocode(coordinates: LocationCoordinates): Promise<Partial<LocationInfo>> {
    try {
      const result = await Location.reverseGeocodeAsync(coordinates);
      
      if (result.length > 0) {
        const location = result[0];
        return {
          address: `${location.streetNumber || ''} ${location.street || ''}`.trim(),
          city: location.city || undefined,
          state: location.region || undefined,
          postalCode: location.postalCode || undefined,
          country: location.country || undefined,
        };
      }
      
      return {};
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {};
    }
  }

  async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
    try {
      const result = await Location.geocodeAsync(address);
      
      if (result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  calculateDistance(from: LocationCoordinates, to: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) * Math.cos(this.toRadians(to.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  async openDirections(destination: LocationCoordinates, destinationLabel?: string): Promise<void> {
    const { latitude, longitude } = destination;
    const label = destinationLabel || 'Destination';

    try {
      if (Platform.OS === 'ios') {
        // Try Apple Maps first
        const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d&t=m`;
        const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
        
        if (canOpenAppleMaps) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      }

      // Fallback to Google Maps
      const googleMapsUrl = Platform.select({
        ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
        android: `google.navigation:q=${latitude},${longitude}&mode=d`,
      });

      if (googleMapsUrl) {
        const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogleMaps) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
      }

      // Final fallback to web Google Maps
      const webGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      await Linking.openURL(webGoogleMapsUrl);

    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert(
        'Unable to Open Directions',
        'Please install a maps application to get directions.',
        [{ text: 'OK' }]
      );
    }
  }

  async openLocationInMaps(coordinates: LocationCoordinates, label?: string): Promise<void> {
    const { latitude, longitude } = coordinates;

    try {
      if (Platform.OS === 'ios') {
        const appleMapsUrl = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label || 'Location'}`;
        const canOpen = await Linking.canOpenURL(appleMapsUrl);
        
        if (canOpen) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      }

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      await Linking.openURL(googleMapsUrl);

    } catch (error) {
      console.error('Error opening location in maps:', error);
    }
  }

  private showLocationPermissionAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'This app needs access to your location to find nearby providers and provide directions. Please enable location permissions in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }

  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get initial region for maps centered on user's location
  async getInitialMapRegion(): Promise<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }> {
    const currentLocation = await this.getCurrentLocation();
    
    if (currentLocation) {
      return {
        latitude: currentLocation.coordinates.latitude,
        longitude: currentLocation.coordinates.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    // Default to a generic location (e.g., city center) if location unavailable
    return {
      latitude: 37.7749, // San Francisco default
      longitude: -122.4194,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }
}

export const locationService = new LocationService();
