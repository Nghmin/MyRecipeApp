// @ts-ignore
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React ,{useState , useEffect} from 'react';
// import HomeScreen from '../../screens/HomeScreen.tsx';
// import AccountScreen from '../../screens/AccountScreen.tsx';
// import RecipeOfMySelfScreen from '../../screens/RecipeOfMySelfScreen.tsx';
import LoginScreen from '../../screens/LoginScreen.tsx';
import RegisterScreen from '../../screens/RegisterScreen.tsx';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import MainTabView from '../MainTab/MainTabView.tsx'
const stacks = createNativeStackNavigator();
function MainStack() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (userState) => {
            setUser(userState);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    if (loading) return null;
    return ( 
        <stacks.Navigator screenOptions={{ headerShown: false }}>
            {user? (<>
                <stacks.Screen name="TabView" component={MainTabView}/>
                {/* <stacks.Screen name="Home" component={HomeScreen} />
                <stacks.Screen name="My Recipe" component={RecipeOfMySelfScreen}/>
                <stacks.Screen name="Account" component={AccountScreen} /> */}
            </>) : (<>
                <stacks.Screen name="Login" component={LoginScreen} />
                <stacks.Screen name="Register" component={RegisterScreen} />
            </>)}
        </stacks.Navigator>
    );
}
export default MainStack;