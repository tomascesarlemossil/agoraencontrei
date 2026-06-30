import React, { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import { AppProvider, useApp } from './src/context/AppContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { registerForPush } from './src/services/notifications'

SplashScreen.preventAutoHideAsync().catch(() => {})

function Root() {
  const { ready, isDarkMode, colors, notificationsEnabled } = useApp()

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  // Registra para push quando o usuário tem notificações ligadas.
  useEffect(() => {
    if (ready && notificationsEnabled) registerForPush().catch(() => {})
  }, [ready, notificationsEnabled])

  if (!ready) return null

  const navTheme = isDarkMode
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.card, primary: colors.gold, text: colors.text, border: colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, primary: colors.navy, text: colors.text, border: colors.border } }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  )
}
