export type PostItColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple';

export interface PostItSize {
  width: number;
  height: number;
}

export interface PostItPosition {
  x: number;
  y: number;
}

export interface PostIt {
  id: string;
  text: string;
  color: PostItColor;
  size: PostItSize;
  position: PostItPosition;
  createdAt: number;
  updatedAt: number;
  zIndex: number;
}

export interface PostItState {
  postIts: PostIt[];
  selectedId: string | null;
  maxZIndex: number;
}
