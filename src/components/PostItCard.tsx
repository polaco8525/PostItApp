import React, {useCallback, memo} from 'react';
import {StyleSheet, Text, View, Pressable, useWindowDimensions} from 'react-native';
import Animated from 'react-native-reanimated';
import {GestureDetector} from 'react-native-gesture-handler';
import {PostIt} from '../types';
import {POST_IT_COLORS, APP_COLORS, POST_IT_DIMENSIONS} from '../constants';
import {usePostItGestures} from '../hooks';
import {usePostIt} from '../context';

interface PostItCardProps {
  postIt: PostIt;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const PostItCard: React.FC<PostItCardProps> = memo(
  ({postIt, isSelected, onPress, onLongPress}) => {
    const {width: screenWidth, height: screenHeight} = useWindowDimensions();
    const {updatePosition, updateSize, bringToFront, selectPostIt} = usePostIt();

    const handlePositionChange = useCallback(
      (position: {x: number; y: number}) => {
        updatePosition(postIt.id, position);
      },
      [postIt.id, updatePosition],
    );

    const handleSizeChange = useCallback(
      (size: {width: number; height: number}) => {
        updateSize(postIt.id, size);
      },
      [postIt.id, updateSize],
    );

    const handleSelect = useCallback(() => {
      selectPostIt(postIt.id);
    }, [postIt.id, selectPostIt]);

    const handleBringToFront = useCallback(() => {
      bringToFront(postIt.id);
    }, [postIt.id, bringToFront]);

    const {
      panGesture,
      createResizeGesture,
      animatedStyle,
      resizeHandleStyle,
    } = usePostItGestures({
      initialPosition: postIt.position,
      initialSize: postIt.size,
      onPositionChange: handlePositionChange,
      onSizeChange: handleSizeChange,
      onSelect: handleSelect,
      onBringToFront: handleBringToFront,
      containerWidth: screenWidth,
      containerHeight: screenHeight - 100,
    });

    const backgroundColor = POST_IT_COLORS[postIt.color];
    const resizeGesture = createResizeGesture();

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            animatedStyle,
            {
              backgroundColor,
              zIndex: postIt.zIndex,
              borderWidth: isSelected ? 2 : 0,
              borderColor: isSelected ? APP_COLORS.accent : 'transparent',
            },
          ]}>
          <Pressable
            style={styles.content}
            onPress={onPress}
            onLongPress={onLongPress}>
            <Text
              style={styles.text}
              numberOfLines={
                Math.floor(postIt.size.height / 24) - 1
              }>
              {postIt.text}
            </Text>
          </Pressable>

          {/* Resize Handle */}
          <GestureDetector gesture={resizeGesture}>
            <Animated.View style={[styles.resizeHandle, resizeHandleStyle]}>
              <View style={styles.resizeIcon}>
                <View style={styles.resizeLine} />
                <View style={[styles.resizeLine, styles.resizeLineShort]} />
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: POST_IT_DIMENSIONS.borderRadius,
    shadowColor: APP_COLORS.black,
    shadowOffset: {
      width: POST_IT_DIMENSIONS.shadowOffset,
      height: POST_IT_DIMENSIONS.shadowOffset,
    },
    shadowOpacity: 0.25,
    shadowRadius: POST_IT_DIMENSIONS.shadowRadius,
    elevation: 5,
  },
  content: {
    flex: 1,
    padding: POST_IT_DIMENSIONS.padding,
  },
  text: {
    fontSize: 14,
    color: APP_COLORS.textOnPostIt,
    lineHeight: 20,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: POST_IT_DIMENSIONS.resizeHandleSize,
    height: POST_IT_DIMENSIONS.resizeHandleSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeIcon: {
    width: 12,
    height: 12,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  resizeLine: {
    width: 10,
    height: 2,
    backgroundColor: APP_COLORS.textOnPostIt,
    opacity: 0.5,
    marginBottom: 2,
    transform: [{rotate: '-45deg'}],
  },
  resizeLineShort: {
    width: 6,
  },
});

PostItCard.displayName = 'PostItCard';

export default PostItCard;
