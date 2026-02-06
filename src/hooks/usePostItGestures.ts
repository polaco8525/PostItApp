import {useCallback} from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture} from 'react-native-gesture-handler';
import {PostItPosition, PostItSize} from '../types';
import {POST_IT_DIMENSIONS, ANIMATION} from '../constants';
import {clampValue} from '../utils';

interface UsePostItGesturesProps {
  initialPosition: PostItPosition;
  initialSize: PostItSize;
  onPositionChange: (position: PostItPosition) => void;
  onSizeChange: (size: PostItSize) => void;
  onSelect: () => void;
  onBringToFront: () => void;
  containerWidth: number;
  containerHeight: number;
}

export const usePostItGestures = ({
  initialPosition,
  initialSize,
  onPositionChange,
  onSizeChange,
  onSelect,
  onBringToFront,
  containerWidth,
  containerHeight,
}: UsePostItGesturesProps) => {
  // Shared values for position
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);

  // Shared values for size
  const width = useSharedValue(initialSize.width);
  const height = useSharedValue(initialSize.height);

  // Shared values for gesture state
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  // Context for gesture continuity
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const contextWidth = useSharedValue(0);
  const contextHeight = useSharedValue(0);

  // Update position when props change
  const updatePosition = useCallback(
    (position: PostItPosition) => {
      translateX.value = withSpring(position.x, ANIMATION.springConfig);
      translateY.value = withSpring(position.y, ANIMATION.springConfig);
    },
    [translateX, translateY],
  );

  // Update size when props change
  const updateSize = useCallback(
    (size: PostItSize) => {
      width.value = withSpring(size.width, ANIMATION.springConfig);
      height.value = withSpring(size.height, ANIMATION.springConfig);
    },
    [width, height],
  );

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
      isPressed.value = true;
      scale.value = withSpring(1.02, ANIMATION.springConfig);
      runOnJS(onSelect)();
      runOnJS(onBringToFront)();
    })
    .onUpdate(event => {
      const newX = clampValue(
        contextX.value + event.translationX,
        0,
        containerWidth - width.value,
      );
      const newY = clampValue(
        contextY.value + event.translationY,
        0,
        containerHeight - height.value,
      );
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      isPressed.value = false;
      scale.value = withSpring(1, ANIMATION.springConfig);
      runOnJS(onPositionChange)({
        x: translateX.value,
        y: translateY.value,
      });
    });

  // Pinch gesture for resizing (alternative to corner drag)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      contextWidth.value = width.value;
      contextHeight.value = height.value;
      runOnJS(onSelect)();
    })
    .onUpdate(event => {
      const newWidth = clampValue(
        contextWidth.value * event.scale,
        POST_IT_DIMENSIONS.minWidth,
        POST_IT_DIMENSIONS.maxWidth,
      );
      const newHeight = clampValue(
        contextHeight.value * event.scale,
        POST_IT_DIMENSIONS.minHeight,
        POST_IT_DIMENSIONS.maxHeight,
      );
      width.value = newWidth;
      height.value = newHeight;
    })
    .onEnd(() => {
      runOnJS(onSizeChange)({
        width: width.value,
        height: height.value,
      });
    });

  // Resize corner drag gesture
  const createResizeGesture = () => {
    return Gesture.Pan()
      .onStart(() => {
        contextWidth.value = width.value;
        contextHeight.value = height.value;
        runOnJS(onSelect)();
      })
      .onUpdate(event => {
        const newWidth = clampValue(
          contextWidth.value + event.translationX,
          POST_IT_DIMENSIONS.minWidth,
          POST_IT_DIMENSIONS.maxWidth,
        );
        const newHeight = clampValue(
          contextHeight.value + event.translationY,
          POST_IT_DIMENSIONS.minHeight,
          POST_IT_DIMENSIONS.maxHeight,
        );
        width.value = newWidth;
        height.value = newHeight;
      })
      .onEnd(() => {
        runOnJS(onSizeChange)({
          width: width.value,
          height: height.value,
        });
      });
  };

  // Combined gesture
  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated style for the post-it container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
      ],
      width: width.value,
      height: height.value,
    };
  });

  // Animated style for resize handle
  const resizeHandleStyle = useAnimatedStyle(() => {
    return {
      opacity: isPressed.value ? 0.8 : 0.5,
    };
  });

  return {
    panGesture,
    pinchGesture,
    combinedGesture,
    createResizeGesture,
    animatedStyle,
    resizeHandleStyle,
    updatePosition,
    updateSize,
    translateX,
    translateY,
    width,
    height,
  };
};
