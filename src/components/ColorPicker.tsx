import React, {memo} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {PostItColor} from '../types';
import {POST_IT_COLORS, POST_IT_COLOR_OPTIONS, APP_COLORS, LAYOUT, ANIMATION} from '../constants';

interface ColorPickerProps {
  selectedColor: PostItColor;
  onColorSelect: (color: PostItColor) => void;
}

interface ColorItemProps {
  color: PostItColor;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ColorItem: React.FC<ColorItemProps> = memo(({color, isSelected, onPress}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, ANIMATION.springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATION.springConfig);
  };

  return (
    <AnimatedPressable
      style={[
        styles.colorItem,
        animatedStyle,
        {
          backgroundColor: POST_IT_COLORS[color],
          borderWidth: isSelected ? 3 : 1,
          borderColor: isSelected ? APP_COLORS.accent : APP_COLORS.border,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  );
});

ColorItem.displayName = 'ColorItem';

const ColorPicker: React.FC<ColorPickerProps> = memo(
  ({selectedColor, onColorSelect}) => {
    return (
      <View style={styles.container}>
        {POST_IT_COLOR_OPTIONS.map(color => (
          <ColorItem
            key={color}
            color={color}
            isSelected={selectedColor === color}
            onPress={() => onColorSelect(color)}
          />
        ))}
      </View>
    );
  },
);

ColorPicker.displayName = 'ColorPicker';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: LAYOUT.colorPickerMargin,
    padding: LAYOUT.colorPickerMargin,
  },
  colorItem: {
    width: LAYOUT.colorPickerItemSize,
    height: LAYOUT.colorPickerItemSize,
    borderRadius: LAYOUT.colorPickerItemSize / 2,
    shadowColor: APP_COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ColorPicker;
