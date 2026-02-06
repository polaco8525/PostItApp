import {v4 as uuidv4} from 'uuid';
import {PostIt, PostItColor, PostItSize, PostItPosition} from '../types';
import {POST_IT_DIMENSIONS} from '../constants';

export const generateId = (): string => {
  return uuidv4();
};

export const createPostIt = (
  text: string,
  color: PostItColor,
  position: PostItPosition,
  zIndex: number,
  size?: PostItSize,
): PostIt => {
  const now = Date.now();
  return {
    id: generateId(),
    text,
    color,
    size: size || {
      width: POST_IT_DIMENSIONS.defaultWidth,
      height: POST_IT_DIMENSIONS.defaultHeight,
    },
    position,
    createdAt: now,
    updatedAt: now,
    zIndex,
  };
};

export const clampValue = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const clampSize = (size: PostItSize): PostItSize => {
  return {
    width: clampValue(
      size.width,
      POST_IT_DIMENSIONS.minWidth,
      POST_IT_DIMENSIONS.maxWidth,
    ),
    height: clampValue(
      size.height,
      POST_IT_DIMENSIONS.minHeight,
      POST_IT_DIMENSIONS.maxHeight,
    ),
  };
};

export const clampPosition = (
  position: PostItPosition,
  size: PostItSize,
  containerWidth: number,
  containerHeight: number,
): PostItPosition => {
  return {
    x: clampValue(position.x, 0, containerWidth - size.width),
    y: clampValue(position.y, 0, containerHeight - size.height),
  };
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRandomPosition = (
  containerWidth: number,
  containerHeight: number,
  postItSize: PostItSize,
): PostItPosition => {
  const maxX = containerWidth - postItSize.width - 20;
  const maxY = containerHeight - postItSize.height - 20;
  return {
    x: Math.random() * Math.max(maxX, 20) + 10,
    y: Math.random() * Math.max(maxY, 20) + 10,
  };
};

export const getRandomColor = (): PostItColor => {
  const colors: PostItColor[] = [
    'yellow',
    'pink',
    'blue',
    'green',
    'orange',
    'purple',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
