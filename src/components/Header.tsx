import React, {memo} from 'react';
import {StyleSheet, View, Text, StatusBar, TouchableOpacity} from 'react-native';
import {APP_COLORS, LAYOUT} from '../constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSettingsPress?: () => void;
}

const Header: React.FC<HeaderProps> = memo(({title, subtitle, onSettingsPress}) => {
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={APP_COLORS.accent}
        barStyle="light-content"
      />
      <View style={styles.content}>
        <View style={styles.spacer} />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.actions}>
          {onSettingsPress && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={onSettingsPress}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.settingsIcon}>&#9881;</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

Header.displayName = 'Header';

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.headerHeight,
    backgroundColor: APP_COLORS.accent,
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: APP_COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: APP_COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  actions: {
    width: 40,
    alignItems: 'flex-end',
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 22,
    color: APP_COLORS.white,
  },
});

export default Header;
