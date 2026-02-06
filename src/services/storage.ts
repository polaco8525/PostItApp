import AsyncStorage from '@react-native-async-storage/async-storage';
import {PostIt, PostItState} from '../types';

const STORAGE_KEY = '@PostItApp:postIts';
const STATE_KEY = '@PostItApp:state';

export const StorageService = {
  async savePostIts(postIts: PostIt[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(postIts);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving post-its:', error);
      throw error;
    }
  },

  async loadPostIts(): Promise<PostIt[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue) as PostIt[];
      }
      return [];
    } catch (error) {
      console.error('Error loading post-its:', error);
      return [];
    }
  },

  async saveState(state: Partial<PostItState>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(state);
      await AsyncStorage.setItem(STATE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving state:', error);
      throw error;
    }
  },

  async loadState(): Promise<Partial<PostItState> | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STATE_KEY);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue) as Partial<PostItState>;
      }
      return null;
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, STATE_KEY]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  async deletePostIt(id: string): Promise<void> {
    try {
      const postIts = await this.loadPostIts();
      const filteredPostIts = postIts.filter(postIt => postIt.id !== id);
      await this.savePostIts(filteredPostIts);
    } catch (error) {
      console.error('Error deleting post-it:', error);
      throw error;
    }
  },

  async updatePostIt(updatedPostIt: PostIt): Promise<void> {
    try {
      const postIts = await this.loadPostIts();
      const index = postIts.findIndex(p => p.id === updatedPostIt.id);
      if (index !== -1) {
        postIts[index] = updatedPostIt;
        await this.savePostIts(postIts);
      }
    } catch (error) {
      console.error('Error updating post-it:', error);
      throw error;
    }
  },
};
