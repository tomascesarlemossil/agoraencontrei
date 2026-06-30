import React from 'react'
import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useApp } from '../context/AppContext'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { triggerHaptic } from '../utils/performance'
import { Brand } from '../components/Brand'
import type { RootStackParamList } from '../navigation/types'

function Row({ icon, label, right, onPress, color, textColor }: any) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={[styles.row, { borderBottomColor: color }]}>
      <Ionicons name={icon} size={20} color={textColor} />
      <Text style={[styles.rowTxt, { color: textColor }]}>{label}</Text>
      {right}
    </Pressable>
  )
}

export function ProfileScreen() {
  const { colors, isDarkMode, toggleDarkMode, notificationsEnabled, toggleNotifications, user, signOut } = useApp()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  return (
    <ScrollView style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + SPACING.base, paddingBottom: insets.bottom + SPACING.xl }}>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: colors.navy }]}>
          <Text style={styles.avatarTxt}>{(user?.name || user?.email || 'AE').slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || user?.email || 'Visitante'}</Text>
        {!user && <Text style={[styles.hint, { color: colors.textSecondary }]}>Entre para ver favoritos e propostas</Text>}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Row icon="moon" label="Modo Escuro" textColor={colors.text} color={colors.border}
          right={<Switch value={isDarkMode} onValueChange={() => { triggerHaptic('light'); toggleDarkMode() }} trackColor={{ true: colors.gold }} />} />
        <Row icon="notifications" label="Notificações" textColor={colors.text} color={colors.border}
          right={<Switch value={notificationsEnabled} onValueChange={() => { triggerHaptic('light'); toggleNotifications() }} trackColor={{ true: colors.gold }} />} />
        <Row icon="language" label="Idioma — Português" textColor={colors.text} color={colors.border}
          right={<Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />} />
        <Row icon="heart" label="Meus Favoritos" textColor={colors.text} color={colors.border}
          onPress={() => { triggerHaptic('light'); navigation.navigate('Favorites') }}
          right={<Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />} />
        <Row icon="ribbon" label="Avaliação Imediata de Imóvel" textColor={colors.text} color={colors.border}
          onPress={() => { triggerHaptic('light'); navigation.navigate('Avaliacao') }}
          right={<Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />} />
      </View>

      <View style={{ alignItems: 'center', marginTop: SPACING.lg }}>
        {user ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Sair"
            onPress={() => { triggerHaptic('warning'); signOut() }}
            style={[styles.btn, { borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>Sair</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Entrar"
            onPress={() => { triggerHaptic('light'); navigation.navigate('Auth', { mode: 'login' }) }}
            style={[styles.btn, { backgroundColor: colors.navy, borderColor: colors.navy }]}>
            <Text style={{ color: colors.white, fontWeight: '700' }}>Entrar / Cadastrar</Text>
          </Pressable>
        )}
        <View style={{ marginTop: SPACING.lg }}><Brand size={18} /></View>
        <Text style={[styles.ver, { color: colors.textSecondary }]}>v0.1.0 · dados ao vivo</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', marginBottom: SPACING.base },
  avatar: { width: 72, height: 72, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '800' },
  name: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginTop: SPACING.sm },
  hint: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  section: { marginHorizontal: SPACING.base, borderRadius: RADIUS.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base, padding: SPACING.base, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTxt: { flex: 1, fontSize: FONT_SIZE.base },
  btn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, borderWidth: 1.5 },
  ver: { fontSize: FONT_SIZE.xs, marginTop: SPACING.sm },
})
