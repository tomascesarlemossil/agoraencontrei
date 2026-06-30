import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useApp } from '../context/AppContext'
import { MainNavigator } from './MainNavigator'
import { PropertyDetailScreen } from '../screens/PropertyDetailScreen'
import { AvaliacaoScreen } from '../screens/AvaliacaoScreen'
import { AuthScreen } from '../screens/AuthScreen'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { colors } = useApp()
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={MainNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Imóvel', headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="Avaliacao" component={AvaliacaoScreen} options={{ title: 'Avaliação Imediata' }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Entrar' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Meus Favoritos' }} />
    </Stack.Navigator>
  )
}
