import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationService, LocationCoordinates } from '@/services/locationService';

interface MapComponentProps {
  initialRegion?: Region;
  markers?: MarkerData[];
  onMarkerPress?: (marker: MarkerData) => void;
  onMapPress?: (coordinate: LocationCoordinates) => void;
  showUserLocation?: boolean;
  style?: any;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
}

export interface MarkerData {
  id: string;
  coordinate: LocationCoordinates;
  title?: string;
  description?: string;
  image?: any;
  color?: string;
}

const { width, height } = Dimensions.get('window');

export const MapComponent: React.FC<MapComponentProps> = ({
  initialRegion,
  markers = [],
  onMarkerPress,
  onMapPress,
  showUserLocation = true,
  style,
  zoomEnabled = true,
  scrollEnabled = true,
  rotateEnabled = true,
  pitchEnabled = true,
}) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      let mapRegion: Region;

      if (initialRegion) {
        mapRegion = initialRegion;
      } else {
        mapRegion = await locationService.getInitialMapRegion();
      }

      setRegion(mapRegion);
    } catch (error) {
      console.error('Error initializing map:', error);
      // Fallback region
      setRegion({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (marker: MarkerData) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  const handleMapPress = (event: any) => {
    if (onMapPress) {
      const coordinate = event.nativeEvent.coordinate;
      onMapPress(coordinate);
    }
  };

  if (loading || !region) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        onPress={handleMapPress}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => handleMarkerPress(marker)}
            pinColor={marker.color}
            image={marker.image}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default MapComponent;
