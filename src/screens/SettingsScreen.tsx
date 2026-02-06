/**
 * Settings Screen
 * Manages Google Drive sync settings and account connection
 */

import React, {useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {APP_COLORS} from '../constants';
import {SyncStatus} from '../types';
import {usePostIt, useSync} from '../context';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({onBack}) => {
  const {state, loadPostIts} = usePostIt();
  const {
    syncState,
    signIn,
    signOut,
    syncNow,
    toggleAutoSync,
    formatLastSync,
  } = useSync();

  const handleSignIn = useCallback(async () => {
    try {
      const user = await signIn();
      if (user) {
        // Perform initial sync after sign in
        setTimeout(async () => {
          const result = await syncNow(state.postIts);
          if (result.success && result.postIts) {
            loadPostIts(result.postIts);
          }
        }, 500);
      }
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
    }
  }, [signIn, syncNow, state.postIts, loadPostIts]);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Disconnect Google Account',
      'Are you sure you want to disconnect your Google account? Your local post-its will be preserved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Sign Out Error', error.message);
            }
          },
        },
      ],
    );
  }, [signOut]);

  const handleSyncNow = useCallback(async () => {
    try {
      const result = await syncNow(state.postIts);
      if (result.success && result.postIts) {
        loadPostIts(result.postIts);
        Alert.alert('Sync Complete', result.message);
      } else if (!result.success) {
        Alert.alert('Sync Failed', result.message);
      }
    } catch (error: any) {
      Alert.alert('Sync Error', error.message);
    }
  }, [syncNow, state.postIts, loadPostIts]);

  const getSyncStatusText = (): string => {
    switch (syncState.status) {
      case SyncStatus.SYNCING:
        return 'Syncing...';
      case SyncStatus.SUCCESS:
        return 'Sync successful';
      case SyncStatus.ERROR:
        return syncState.error || 'Sync failed';
      default:
        return formatLastSync();
    }
  };

  const getSyncStatusColor = (): string => {
    switch (syncState.status) {
      case SyncStatus.SYNCING:
        return APP_COLORS.accent;
      case SyncStatus.SUCCESS:
        return APP_COLORS.success;
      case SyncStatus.ERROR:
        return APP_COLORS.danger;
      default:
        return APP_COLORS.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Google Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Account</Text>
          <View style={styles.card}>
            {syncState.isConnected && syncState.user ? (
              <View style={styles.userInfo}>
                {syncState.user.photo ? (
                  <Image
                    source={{uri: syncState.user.photo}}
                    style={styles.userPhoto}
                  />
                ) : (
                  <View style={styles.userPhotoPlaceholder}>
                    <Text style={styles.userPhotoPlaceholderText}>
                      {syncState.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{syncState.user.name}</Text>
                  <Text style={styles.userEmail}>{syncState.user.email}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.notConnected}>
                <Text style={styles.notConnectedText}>
                  Connect your Google account to backup and sync your post-its
                  across devices.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                syncState.isConnected ? styles.buttonDanger : styles.buttonPrimary,
              ]}
              onPress={syncState.isConnected ? handleSignOut : handleSignIn}
              disabled={syncState.status === SyncStatus.SYNCING}>
              <Text
                style={[
                  styles.buttonText,
                  syncState.isConnected
                    ? styles.buttonTextDanger
                    : styles.buttonTextPrimary,
                ]}>
                {syncState.isConnected ? 'Disconnect' : 'Connect with Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Settings Section */}
        {syncState.isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync Settings</Text>
            <View style={styles.card}>
              {/* Auto Sync Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Auto Sync</Text>
                  <Text style={styles.settingDescription}>
                    Automatically sync changes when you modify post-its
                  </Text>
                </View>
                <Switch
                  value={syncState.autoSyncEnabled}
                  onValueChange={toggleAutoSync}
                  trackColor={{
                    false: APP_COLORS.border,
                    true: APP_COLORS.accent,
                  }}
                  thumbColor={APP_COLORS.white}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Sync Status */}
              <View style={styles.syncStatus}>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Sync Status</Text>
                  <View style={styles.syncStatusValue}>
                    {syncState.status === SyncStatus.SYNCING && (
                      <ActivityIndicator
                        size="small"
                        color={APP_COLORS.accent}
                        style={styles.syncSpinner}
                      />
                    )}
                    <Text
                      style={[
                        styles.syncStatusText,
                        {color: getSyncStatusColor()},
                      ]}>
                      {getSyncStatusText()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Manual Sync Button */}
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleSyncNow}
                disabled={syncState.status === SyncStatus.SYNCING}>
                {syncState.status === SyncStatus.SYNCING ? (
                  <ActivityIndicator size="small" color={APP_COLORS.accent} />
                ) : (
                  <Text style={styles.buttonTextSecondary}>Sync Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Sync</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>{'>'}</Text>
              <Text style={styles.infoText}>
                Your post-its are stored in a private folder in your Google Drive
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>{'>'}</Text>
              <Text style={styles.infoText}>
                Syncing merges your local and cloud data intelligently
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>{'>'}</Text>
              <Text style={styles.infoText}>
                Conflicts are resolved using the most recent version
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>{'>'}</Text>
              <Text style={styles.infoText}>
                Post-its count: {state.postIts.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: APP_COLORS.accent,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: APP_COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPhotoPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: APP_COLORS.white,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: APP_COLORS.textLight,
    marginTop: 2,
  },
  notConnected: {
    marginBottom: 16,
  },
  notConnectedText: {
    fontSize: 15,
    color: APP_COLORS.textLight,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: APP_COLORS.accent,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: APP_COLORS.accent,
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: APP_COLORS.danger,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: APP_COLORS.white,
  },
  buttonTextSecondary: {
    color: APP_COLORS.accent,
  },
  buttonTextDanger: {
    color: APP_COLORS.danger,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
  },
  settingDescription: {
    fontSize: 13,
    color: APP_COLORS.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: APP_COLORS.border,
    marginVertical: 12,
  },
  syncStatus: {
    paddingVertical: 8,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncStatusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
  },
  syncStatusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncSpinner: {
    marginRight: 8,
  },
  syncStatusText: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 14,
    color: APP_COLORS.accent,
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: APP_COLORS.textLight,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;
