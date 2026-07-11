import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './src/navigation/MainStack/MainStack';
import { toastConfig } from './src/config/ToastConfig';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/theme/ThemeContext';
import { UserProvider } from './src/theme/UserContext';

function App() {
  return (
    <>
      <ThemeProvider>
        <UserProvider>
          <NavigationContainer>
            <MainStack />
          </NavigationContainer>
        </UserProvider>
      </ThemeProvider>
      <Toast config={toastConfig} />
    </>
  );
}

export default App;
