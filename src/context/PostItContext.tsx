import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {PostIt, PostItColor, PostItSize, PostItPosition, PostItState} from '../types';
import {StorageService} from '../services';
import {createPostIt} from '../utils';

type PostItAction =
  | {type: 'LOAD_POSTITS'; payload: PostIt[]}
  | {type: 'ADD_POSTIT'; payload: PostIt}
  | {type: 'UPDATE_POSTIT'; payload: PostIt}
  | {type: 'DELETE_POSTIT'; payload: string}
  | {type: 'SELECT_POSTIT'; payload: string | null}
  | {type: 'UPDATE_POSITION'; payload: {id: string; position: PostItPosition}}
  | {type: 'UPDATE_SIZE'; payload: {id: string; size: PostItSize}}
  | {type: 'UPDATE_COLOR'; payload: {id: string; color: PostItColor}}
  | {type: 'UPDATE_TEXT'; payload: {id: string; text: string}}
  | {type: 'BRING_TO_FRONT'; payload: string}
  | {type: 'SET_MAX_ZINDEX'; payload: number}
  | {type: 'MERGE_POSTITS'; payload: PostIt[]};

const initialState: PostItState = {
  postIts: [],
  selectedId: null,
  maxZIndex: 0,
};

const postItReducer = (state: PostItState, action: PostItAction): PostItState => {
  switch (action.type) {
    case 'LOAD_POSTITS':
      const maxZ = action.payload.reduce(
        (max, p) => Math.max(max, p.zIndex),
        0,
      );
      return {
        ...state,
        postIts: action.payload,
        maxZIndex: maxZ,
      };

    case 'ADD_POSTIT':
      return {
        ...state,
        postIts: [...state.postIts, action.payload],
        maxZIndex: action.payload.zIndex,
      };

    case 'UPDATE_POSTIT':
      return {
        ...state,
        postIts: state.postIts.map(p =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };

    case 'DELETE_POSTIT':
      return {
        ...state,
        postIts: state.postIts.filter(p => p.id !== action.payload),
        selectedId:
          state.selectedId === action.payload ? null : state.selectedId,
      };

    case 'SELECT_POSTIT':
      return {
        ...state,
        selectedId: action.payload,
      };

    case 'UPDATE_POSITION':
      return {
        ...state,
        postIts: state.postIts.map(p =>
          p.id === action.payload.id
            ? {...p, position: action.payload.position, updatedAt: Date.now()}
            : p,
        ),
      };

    case 'UPDATE_SIZE':
      return {
        ...state,
        postIts: state.postIts.map(p =>
          p.id === action.payload.id
            ? {...p, size: action.payload.size, updatedAt: Date.now()}
            : p,
        ),
      };

    case 'UPDATE_COLOR':
      return {
        ...state,
        postIts: state.postIts.map(p =>
          p.id === action.payload.id
            ? {...p, color: action.payload.color, updatedAt: Date.now()}
            : p,
        ),
      };

    case 'UPDATE_TEXT':
      return {
        ...state,
        postIts: state.postIts.map(p =>
          p.id === action.payload.id
            ? {...p, text: action.payload.text, updatedAt: Date.now()}
            : p,
        ),
      };

    case 'BRING_TO_FRONT':
      const newMaxZ = state.maxZIndex + 1;
      return {
        ...state,
        postIts: state.postIts.map(p =>
          p.id === action.payload
            ? {...p, zIndex: newMaxZ, updatedAt: Date.now()}
            : p,
        ),
        maxZIndex: newMaxZ,
      };

    case 'SET_MAX_ZINDEX':
      return {
        ...state,
        maxZIndex: action.payload,
      };

    case 'MERGE_POSTITS':
      // Merge incoming post-its with existing ones
      // Use most recent version based on updatedAt timestamp
      const mergedMap = new Map<string, PostIt>();

      // Add existing post-its first
      state.postIts.forEach(postIt => {
        mergedMap.set(postIt.id, postIt);
      });

      // Merge with incoming post-its, keeping most recent
      action.payload.forEach(incomingPostIt => {
        const existing = mergedMap.get(incomingPostIt.id);
        if (!existing || incomingPostIt.updatedAt > existing.updatedAt) {
          mergedMap.set(incomingPostIt.id, incomingPostIt);
        }
      });

      const mergedPostIts = Array.from(mergedMap.values());
      const mergedMaxZ = mergedPostIts.reduce(
        (max, p) => Math.max(max, p.zIndex),
        0,
      );

      return {
        ...state,
        postIts: mergedPostIts,
        maxZIndex: mergedMaxZ,
      };

    default:
      return state;
  }
};

interface PostItContextType {
  state: PostItState;
  addPostIt: (
    text: string,
    color: PostItColor,
    position: PostItPosition,
    size?: PostItSize,
  ) => void;
  updatePostIt: (postIt: PostIt) => void;
  deletePostIt: (id: string) => void;
  selectPostIt: (id: string | null) => void;
  updatePosition: (id: string, position: PostItPosition) => void;
  updateSize: (id: string, size: PostItSize) => void;
  updateColor: (id: string, color: PostItColor) => void;
  updateText: (id: string, text: string) => void;
  bringToFront: (id: string) => void;
  getSelectedPostIt: () => PostIt | undefined;
  loadPostIts: (postIts: PostIt[]) => void;
  mergePostIts: (postIts: PostIt[]) => void;
}

const PostItContext = createContext<PostItContextType | undefined>(undefined);

export const PostItProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(postItReducer, initialState);

  // Load post-its from storage on mount
  useEffect(() => {
    const loadData = async () => {
      const postIts = await StorageService.loadPostIts();
      dispatch({type: 'LOAD_POSTITS', payload: postIts});
    };
    loadData();
  }, []);

  // Save post-its to storage whenever they change
  useEffect(() => {
    if (state.postIts.length > 0 || state.maxZIndex > 0) {
      StorageService.savePostIts(state.postIts);
    }
  }, [state.postIts]);

  const addPostIt = useCallback(
    (
      text: string,
      color: PostItColor,
      position: PostItPosition,
      size?: PostItSize,
    ) => {
      const newZIndex = state.maxZIndex + 1;
      const newPostIt = createPostIt(text, color, position, newZIndex, size);
      dispatch({type: 'ADD_POSTIT', payload: newPostIt});
    },
    [state.maxZIndex],
  );

  const updatePostIt = useCallback((postIt: PostIt) => {
    dispatch({type: 'UPDATE_POSTIT', payload: postIt});
  }, []);

  const deletePostIt = useCallback((id: string) => {
    dispatch({type: 'DELETE_POSTIT', payload: id});
  }, []);

  const selectPostIt = useCallback((id: string | null) => {
    dispatch({type: 'SELECT_POSTIT', payload: id});
  }, []);

  const updatePosition = useCallback((id: string, position: PostItPosition) => {
    dispatch({type: 'UPDATE_POSITION', payload: {id, position}});
  }, []);

  const updateSize = useCallback((id: string, size: PostItSize) => {
    dispatch({type: 'UPDATE_SIZE', payload: {id, size}});
  }, []);

  const updateColor = useCallback((id: string, color: PostItColor) => {
    dispatch({type: 'UPDATE_COLOR', payload: {id, color}});
  }, []);

  const updateText = useCallback((id: string, text: string) => {
    dispatch({type: 'UPDATE_TEXT', payload: {id, text}});
  }, []);

  const bringToFront = useCallback((id: string) => {
    dispatch({type: 'BRING_TO_FRONT', payload: id});
  }, []);

  const getSelectedPostIt = useCallback(() => {
    return state.postIts.find(p => p.id === state.selectedId);
  }, [state.postIts, state.selectedId]);

  const loadPostIts = useCallback((postIts: PostIt[]) => {
    dispatch({type: 'LOAD_POSTITS', payload: postIts});
  }, []);

  const mergePostIts = useCallback((postIts: PostIt[]) => {
    dispatch({type: 'MERGE_POSTITS', payload: postIts});
  }, []);

  const value: PostItContextType = {
    state,
    addPostIt,
    updatePostIt,
    deletePostIt,
    selectPostIt,
    updatePosition,
    updateSize,
    updateColor,
    updateText,
    bringToFront,
    getSelectedPostIt,
    loadPostIts,
    mergePostIts,
  };

  return (
    <PostItContext.Provider value={value}>{children}</PostItContext.Provider>
  );
};

export const usePostIt = (): PostItContextType => {
  const context = useContext(PostItContext);
  if (context === undefined) {
    throw new Error('usePostIt must be used within a PostItProvider');
  }
  return context;
};
