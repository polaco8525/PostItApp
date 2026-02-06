import {PostItColor} from '../types';

export const POST_IT_COLORS: Record<PostItColor, string> = {
  yellow: '#FFEB3B',
  pink: '#F48FB1',
  blue: '#81D4FA',
  green: '#A5D6A7',
  orange: '#FFCC80',
  purple: '#CE93D8',
};

export const POST_IT_COLORS_DARK: Record<PostItColor, string> = {
  yellow: '#FBC02D',
  pink: '#EC407A',
  blue: '#29B6F6',
  green: '#66BB6A',
  orange: '#FFA726',
  purple: '#AB47BC',
};

export const POST_IT_COLOR_OPTIONS: PostItColor[] = [
  'yellow',
  'pink',
  'blue',
  'green',
  'orange',
  'purple',
];

export const APP_COLORS = {
  background: '#F5F5F5',
  backgroundDark: '#121212',
  text: '#212121',
  textLight: '#757575',
  textOnPostIt: '#333333',
  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(0, 0, 0, 0.25)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: '#E0E0E0',
  accent: '#2196F3',
  danger: '#F44336',
  success: '#4CAF50',
};
