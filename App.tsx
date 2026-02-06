import React, {useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {PostItProvider, SyncProvider} from './src/context';
import {HomeScreen, SettingsScreen} from './src/screens';

type Screen = 'home' | 'settings';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const navigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SyncProvider>
        <PostItProvider>
          {currentScreen === 'home' ? (
            <HomeScreen onSettingsPress={navigateToSettings} />
          ) : (
            <SettingsScreen onBack={navigateToHome} />
          )}
        </PostItProvider>
      </SyncProvider>
    </SafeAreaProvider>
  );
};

export default App;
