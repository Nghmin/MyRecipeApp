import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; 
import MainStack from './src/navigation/MainStack/MainStack';
import { toastConfig } from './src/config/ToastConfig';
import Toast from 'react-native-toast-message';

function App() {
  return (
      <>
        <NavigationContainer>
          <MainStack/>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </>
    );
  }

export default App;
