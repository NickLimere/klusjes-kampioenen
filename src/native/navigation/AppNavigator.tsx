import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../contexts/UserContext';

// Import screens
import Dashboard from '../screens/Dashboard';
import History from '../screens/History';
import Rewards from '../screens/Rewards';
import Profile from '../screens/Profile';
import Admin from '../screens/Admin';
import Login from '../screens/Login';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Rewards" component={Rewards} />
      <Tab.Screen name="Profile" component={Profile} />
      {isAdmin && <Tab.Screen name="Admin" component={Admin} />}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { currentUser } = useUser();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={Login} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 