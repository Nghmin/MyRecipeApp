import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import React from 'react';
import HomeScreen from '../../screens/HomeScreen.tsx';
import AccountScreen from '../../screens/AccountScreen.tsx';
import RecipeOfMysSelfScreen from '../../screens/RecipeOfMySelfScreen.tsx';

const Tab = createBottomTabNavigator();

function getTabBarIcon(routeName: string, focused: boolean, color: string, size: number) {
    let iconName; // Để trống ban đầu vì chúng ta sẽ gán giá trị sau
    if (routeName === 'Home') {
        iconName = focused ? 'home-circle' : 'home-circle-outline';
    } else if(routeName === 'My Recipe'){
        iconName = focused ? 'book-account' : 'book-account-outline';
    } else if (routeName === 'Account') {
        iconName = focused ? 'account-circle' : 'account-circle-outline';
    }

    if (!iconName) iconName = 'help-circle-outline';
    return <Icon name={iconName} size={size} color={color} />;
}

function MainTabView() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) =>
                    getTabBarIcon(route.name, focused, color, size),
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="My Recipe" component={RecipeOfMysSelfScreen}/>
            <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
}
export default MainTabView;