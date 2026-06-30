import React from 'react'
import { Image, StyleSheet } from 'react-native'

/**
 * Marca oficial AgoraEncontrei (logo horizontal com o monograma AE).
 * Usa o asset transparente, então fica bem sobre fundos claros (headers).
 */
const LOGO = require('../assets/logo-header.png')
const ASPECT = 2560 / 1440 // largura / altura do PNG oficial

export function Brand({ size = 22 }: { size?: number }) {
  // `size` = altura desejada; largura mantém a proporção do logo.
  return <Image source={LOGO} style={[styles.logo, { height: size, width: size * ASPECT }]} resizeMode="contain" />
}

const styles = StyleSheet.create({
  logo: { alignSelf: 'flex-start' },
})
