import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { HomeScreen } from '../screens/HomeScreen'
import { SearchScreen } from '../screens/SearchScreen'
import { AuctionsScreen } from '../screens/AuctionsScreen'
import { PartnersScreen } from '../screens/PartnersScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator()

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Início: 'home',
  Busca: 'search',
  Leilões: 'pricetags',
  Parceiros: 'business',
  Perfil: 'person',
}

export function MainNavigator() {
  const { colors } = useApp()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] || 'ellipse'} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Busca" component={SearchScreen} />
      <Tab.Screen name="Leilões" component={AuctionsScreen} />
      <Tab.Screen name="Parceiros" component={PartnersScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
