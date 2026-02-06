/**
 * Sync Indicator Component
 * Shows the current sync status with visual feedback
 */

import React, {memo, useEffect, useRef} from 'react';
import {StyleSheet, View, Text, Animated} from 'react-native';
import {SyncStatus} from '../types';
import {APP_COLORS} from '../constants';

interface SyncIndicatorProps {
  status: SyncStatus;
  isConnected: boolean;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = memo(({status, isConnected}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === SyncStatus.SYNCING) {
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      // Stop spinning
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }

    // Fade in/out for success/error states
    if (status === SyncStatus.SUCCESS || status === SyncStatus.ERROR) {
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [status, spinAnim, opacityAnim]);

  if (!isConnected) {
    return null;
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = (): string => {
    switch (status) {
      case SyncStatus.SYNCING:
        return APP_COLORS.accent;
      case SyncStatus.SUCCESS:
        return APP_COLORS.success;
      case SyncStatus.ERROR:
        return APP_COLORS.danger;
      default:
        return APP_COLORS.textLight;
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case SyncStatus.SYNCING:
        return '\u21BB'; // Clockwise arrow
      case SyncStatus.SUCCESS:
        return '\u2713'; // Checkmark
      case SyncStatus.ERROR:
        return '\u2717'; // X mark
      default:
        return '\u2601'; // Cloud
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case SyncStatus.SYNCING:
        return 'Syncing...';
      case SyncStatus.SUCCESS:
        return 'Synced';
      case SyncStatus.ERROR:
        return 'Sync failed';
      default:
        return 'Connected';
    }
  };

  return (
    <Animated.View style={[styles.container, {opacity: opacityAnim}]}>
      <Animated.Text
        style={[
          styles.icon,
          {color: getStatusColor()},
          status === SyncStatus.SYNCING && {transform: [{rotate: spin}]},
        ]}>
        {getStatusIcon()}
      </Animated.Text>
      <Text style={[styles.text, {color: getStatusColor()}]}>
        {getStatusText()}
      </Text>
    </Animated.View>
  );
});

SyncIndicator.displayName = 'SyncIndicator';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  icon: {
    fontSize: 14,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SyncIndicator;
