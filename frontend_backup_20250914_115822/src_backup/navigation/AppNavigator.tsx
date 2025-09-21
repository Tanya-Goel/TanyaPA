import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import ChatScreen from '../screens/ChatScreen';
import LogsScreen from '../screens/LogsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'ChatTab') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'LogsTab') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'RemindersTab') {
              iconName = focused ? 'alarm' : 'alarm-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.glass,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="ChatTab" 
          component={ChatScreen}
          options={{
            title: 'Chat',
          }}
        />
        <Tab.Screen 
          name="LogsTab" 
          component={LogsScreen}
          options={{
            title: 'Logs',
          }}
        />
        <Tab.Screen 
          name="RemindersTab" 
          component={RemindersScreen}
          options={{
            title: 'Reminders',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
