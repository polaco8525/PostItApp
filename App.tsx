import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PostItProvider, SyncProvider} from './src/context';
import {HomeScreen, SettingsScreen} from './src/screens';
import {configureGoogleSignIn} from './src/services';

type Screen = 'home' | 'settings';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Initialize Google Sign-In on app start
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const navigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
  };

  return (
    <SafeAreaProvider>
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
