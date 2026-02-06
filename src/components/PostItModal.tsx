import React, {useState, useEffect, memo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {PostIt, PostItColor} from '../types';
import {APP_COLORS, LAYOUT, ANIMATION} from '../constants';
import ColorPicker from './ColorPicker';

interface PostItModalProps {
  visible: boolean;
  postIt?: PostIt;
  onClose: () => void;
  onSave: (text: string, color: PostItColor) => void;
  onDelete?: () => void;
}

const PostItModal: React.FC<PostItModalProps> = memo(
  ({visible, postIt, onClose, onSave, onDelete}) => {
    const [text, setText] = useState('');
    const [color, setColor] = useState<PostItColor>('yellow');
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);

    useEffect(() => {
      if (visible) {
        setText(postIt?.text || '');
        setColor(postIt?.color || 'yellow');
        opacity.value = withTiming(1, ANIMATION.timingConfig);
        translateY.value = withSpring(0, ANIMATION.springConfig);
      } else {
        opacity.value = withTiming(0, ANIMATION.timingConfig);
        translateY.value = withSpring(50, ANIMATION.springConfig);
      }
    }, [visible, postIt, opacity, translateY]);

    const overlayStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
      transform: [{translateY: translateY.value}],
      opacity: opacity.value,
    }));

    const handleSave = () => {
      if (text.trim()) {
        onSave(text.trim(), color);
        setText('');
        setColor('yellow');
      }
    };

    const handleClose = () => {
      setText('');
      setColor('yellow');
      onClose();
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View style={[styles.overlay, overlayStyle]}>
            <Pressable style={styles.overlayPressable} onPress={handleClose} />
          </Animated.View>

          <Animated.View style={[styles.content, contentStyle]}>
            <Text style={styles.title}>
              {postIt ? 'Editar Post-it' : 'Novo Post-it'}
            </Text>

            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Digite sua nota..."
              placeholderTextColor={APP_COLORS.textLight}
              multiline
              autoFocus
              textAlignVertical="top"
            />

            <Text style={styles.label}>Cor:</Text>
            <ColorPicker selectedColor={color} onColorSelect={setColor} />

            <View style={styles.buttons}>
              {postIt && onDelete && (
                <Pressable
                  style={[styles.button, styles.deleteButton]}
                  onPress={onDelete}>
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

PostItModal.displayName = 'PostItModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APP_COLORS.overlay,
  },
  overlayPressable: {
    flex: 1,
  },
  content: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    padding: LAYOUT.modalPadding,
    width: '90%',
    maxWidth: 400,
    shadowColor: APP_COLORS.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginTop: 8,
    marginBottom: 8,
  },
  input: {
    height: LAYOUT.inputHeight,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: APP_COLORS.text,
    backgroundColor: APP_COLORS.background,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cancelButtonText: {
    color: APP_COLORS.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: APP_COLORS.accent,
  },
  saveButtonText: {
    color: APP_COLORS.white,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: APP_COLORS.danger,
    marginRight: 'auto',
  },
  deleteButtonText: {
    color: APP_COLORS.white,
    fontWeight: '600',
  },
});

export default PostItModal;
