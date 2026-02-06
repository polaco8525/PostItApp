import React, {useState, useCallback} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PostIt, PostItColor} from '../types';
import {APP_COLORS, LAYOUT} from '../constants';
import {usePostIt} from '../context';
import {getRandomPosition} from '../utils';
import {
  PostItCard,
  FAB,
  PostItModal,
  Header,
  EmptyState,
} from '../components';

interface HomeScreenProps {
  onSettingsPress?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({onSettingsPress}) => {
  const {width, height} = useWindowDimensions();
  const {state, addPostIt, updateText, updateColor, deletePostIt, selectPostIt} = usePostIt();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPostIt, setEditingPostIt] = useState<PostIt | undefined>();

  const handleAddPostIt = useCallback(() => {
    setEditingPostIt(undefined);
    setModalVisible(true);
  }, []);

  const handlePostItPress = useCallback((postIt: PostIt) => {
    setEditingPostIt(postIt);
    setModalVisible(true);
  }, []);

  const handlePostItLongPress = useCallback(
    (postIt: PostIt) => {
      selectPostIt(postIt.id);
      setEditingPostIt(postIt);
      setModalVisible(true);
    },
    [selectPostIt],
  );

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditingPostIt(undefined);
    selectPostIt(null);
  }, [selectPostIt]);

  const handleSave = useCallback(
    (text: string, color: PostItColor) => {
      if (editingPostIt) {
        updateText(editingPostIt.id, text);
        updateColor(editingPostIt.id, color);
      } else {
        const position = getRandomPosition(
          width - 40,
          height - LAYOUT.headerHeight - 100,
          {width: 150, height: 150},
        );
        addPostIt(text, color, position);
      }
      handleModalClose();
    },
    [editingPostIt, width, height, addPostIt, updateText, updateColor, handleModalClose],
  );

  const handleDelete = useCallback(() => {
    if (editingPostIt) {
      deletePostIt(editingPostIt.id);
      handleModalClose();
    }
  }, [editingPostIt, deletePostIt, handleModalClose]);

  const sortedPostIts = [...state.postIts].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Header
        title="PostIt App"
        subtitle={`${state.postIts.length} nota${state.postIts.length !== 1 ? 's' : ''}`}
        onSettingsPress={onSettingsPress}
      />

      <View style={styles.board}>
        {state.postIts.length === 0 ? (
          <EmptyState />
        ) : (
          sortedPostIts.map(postIt => (
            <PostItCard
              key={postIt.id}
              postIt={postIt}
              isSelected={state.selectedId === postIt.id}
              onPress={() => handlePostItPress(postIt)}
              onLongPress={() => handlePostItLongPress(postIt)}
            />
          ))
        )}
      </View>

      <FAB onPress={handleAddPostIt} />

      <PostItModal
        visible={modalVisible}
        postIt={editingPostIt}
        onClose={handleModalClose}
        onSave={handleSave}
        onDelete={editingPostIt ? handleDelete : undefined}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  board: {
    flex: 1,
    position: 'relative',
  },
});

export default HomeScreen;
