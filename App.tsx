import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; 
import MainStack from './src/navigation/MainStack/MainStack';
import { toastConfig } from './src/config/ToastConfig';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/theme/ThemeContext';
  
function App() {
  return (
      <>
        <ThemeProvider>
          <NavigationContainer>
            <MainStack/>
          </NavigationContainer>
        </ThemeProvider>
        <Toast config={toastConfig} />
      </>
    );
  }

export default App;
