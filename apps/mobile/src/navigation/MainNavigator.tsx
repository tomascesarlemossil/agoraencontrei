import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { HomeScreen } from '../screens/HomeScreen'
import { SearchScreen } from '../screens/SearchScreen'
import { AuctionsScreen } from '../screens/AuctionsScreen'
import { PartnersScreen } from '../screens/PartnersScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import type { TKey } from '../utils/i18n'

const Tab = createBottomTabNavigator()

// Route name estável → (ícone, chave i18n). O label é traduzido em runtime.
const TABS: { name: string; icon: keyof typeof Ionicons.glyphMap; key: TKey; component: React.ComponentType<any> }[] = [
  { name: 'Home', icon: 'home', key: 'home', component: HomeScreen },
  { name: 'Search', icon: 'search', key: 'search', component: SearchScreen },
  { name: 'Auctions', icon: 'pricetags', key: 'auctions', component: AuctionsScreen },
  { name: 'Partners', icon: 'business', key: 'partners', component: PartnersScreen },
  { name: 'Profile', icon: 'person', key: 'profile', component: ProfileScreen },
]

export function MainNavigator() {
  const { colors, t } = useApp()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: t(tab.key),
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  )
}
