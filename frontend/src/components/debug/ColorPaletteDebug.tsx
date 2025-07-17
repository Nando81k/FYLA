import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

const ColorPaletteDebug: React.FC = () => {
  const { colors, typography, spacing, borderRadius, isDark, toggleTheme } = useTheme();

  const ColorSwatch = ({ color, label }: { color: string; label: string }) => (
    <View style={styles.swatchContainer}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.swatchLabel, { color: colors.text.secondary }]}>{label}</Text>
      <Text style={[styles.swatchValue, { color: colors.text.tertiary }]}>{color}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Color Palette Debug - {isDark ? 'Dark' : 'Light'} Mode
        </Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.toggleButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.toggleText, { color: colors.text.inverse }]}>
            Switch to {isDark ? 'Light' : 'Dark'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Primary Colors</Text>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.primary} label="Primary" />
          <ColorSwatch color={colors.accent} label="Accent" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Background Colors</Text>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.background.primary} label="Primary BG" />
          <ColorSwatch color={colors.background.secondary} label="Secondary BG" />
        </View>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.background.tertiary} label="Tertiary BG" />
          <ColorSwatch color={colors.background.accent} label="Accent BG" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Text Colors</Text>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.text.primary} label="Primary Text" />
          <ColorSwatch color={colors.text.secondary} label="Secondary Text" />
        </View>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.text.tertiary} label="Tertiary Text" />
          <ColorSwatch color={colors.text.accent} label="Accent Text" />
        </View>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.text.muted} label="Muted Text" />
          <ColorSwatch color={colors.text.inverse} label="Inverse Text" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Border Colors</Text>
        <View style={styles.swatchRow}>
          <ColorSwatch color={colors.border.light} label="Light Border" />
          <ColorSwatch color={colors.border.medium} label="Medium Border" />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  swatchContainer: {
    alignItems: 'center',
    flex: 1,
  },
  swatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  swatchLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  swatchValue: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default ColorPaletteDebug;
