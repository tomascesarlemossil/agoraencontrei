import { NextResponse } from 'next/server'

/**
 * /baixar — redireciona para o instalador offline mais recente (.exe).
 *
 * Link estável e curto para o cliente baixar o "Sistema Administrador
 * AgoraEncontrei". Aponta para o release público do GitHub (tag fixa
 * `desktop-latest`), que o CI atualiza a cada build. Pode ser sobrescrito por
 * env (NEXT_PUBLIC_SOFTWARE_DOWNLOAD_URL) se o instalador mudar de hospedagem.
 *
 * O arquivo tem ~308 MB; o GitHub serve com suporte a Range (download
 * retomável), então quedas de conexão podem ser retomadas pelo navegador.
 */
const INSTALLER_URL =
  process.env.NEXT_PUBLIC_SOFTWARE_DOWNLOAD_URL ||
  'https://github.com/tomascesarlemossil/agoraencontrei/releases/download/desktop-latest/AgoraEncontrei-Software-Setup.exe'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.redirect(INSTALLER_URL, 302)
}
