import React, {memo} from 'react';
import {StyleSheet, Pressable, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {APP_COLORS, LAYOUT, ANIMATION} from '../constants';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FAB: React.FC<FABProps> = memo(({onPress, icon = '+'}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: scale.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, ANIMATION.springConfig);
    rotation.value = withSpring(90, ANIMATION.springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATION.springConfig);
    rotation.value = withSpring(0, ANIMATION.springConfig);
  };

  return (
    <AnimatedPressable
      style={[styles.fab, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Text style={styles.icon}>{icon}</Text>
    </AnimatedPressable>
  );
});

FAB.displayName = 'FAB';

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: LAYOUT.fabMargin,
    right: LAYOUT.fabMargin,
    width: LAYOUT.fabSize,
    height: LAYOUT.fabSize,
    borderRadius: LAYOUT.fabSize / 2,
    backgroundColor: APP_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: APP_COLORS.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
    color: APP_COLORS.white,
    fontWeight: 'bold',
  },
});

export default FAB;
