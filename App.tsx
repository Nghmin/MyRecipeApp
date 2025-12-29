import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; 
import MainStack from './src/navigation/MainStack/MainStack';
function App() {
  return (
    <NavigationContainer>
      <MainStack/>
    </NavigationContainer>
  );
  }

export default App;
