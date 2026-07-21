import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { S } from './src/store';

import FoodScreen from './src/screens/FoodScreen';
import GymScreen from './src/screens/GymScreen';
import PlanScreen from './src/screens/PlanScreen';
import MeScreen from './src/screens/MeScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    S.init();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Food') iconName = 'restaurant';
              else if (route.name === 'Gym') iconName = 'barbell';
              else if (route.name === 'Plan') iconName = 'clipboard';
              else if (route.name === 'Me') iconName = 'person';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#64748b',
            tabBarStyle: {
              backgroundColor: '#1e293b',
              borderTopColor: '#334155',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8
            },
            headerShown: false,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600'
            }
          })}
        >
          <Tab.Screen name="Food" component={FoodScreen} />
          <Tab.Screen name="Gym" component={GymScreen} />
          <Tab.Screen name="Plan" component={PlanScreen} />
          <Tab.Screen name="Me" component={MeScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
