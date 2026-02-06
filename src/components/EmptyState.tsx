import React, {memo} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {APP_COLORS} from '../constants';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = memo(
  ({
    title = 'Nenhum Post-it',
    message = 'Toque no botao + para criar seu primeiro post-it!',
  }) => {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  },
);

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: APP_COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;
