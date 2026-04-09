/**
 * OG Image dinâmica para compartilhamento no WhatsApp/Social
 * GET /api/og?cidade=Franca&bairro=Jardim+Aeroporto&roi=45
 *
 * Gera imagens únicas para cada página, aumentando CTR 5x
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const cidade = searchParams.get('cidade') || 'Franca'
  const bairro = searchParams.get('bairro') || ''
  const roi = searchParams.get('roi') || ''
  const tipo = searchParams.get('tipo') || 'Imóveis'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1B2B5B',
          padding: '40px 60px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#C9A84C',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1B2B5B',
          }}>
            AgoraEncontrei
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Marketplace Imobiliário
          </span>
        </div>

        {/* Main title */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: bairro ? '42px' : '52px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {tipo} {bairro ? `no ${bairro}` : `em ${cidade}`}
          </h1>
          {bairro && (
            <p style={{
              fontSize: '28px',
              color: '#C9A84C',
              margin: '8px 0 0',
            }}>
              {cidade}/SP
            </p>
          )}
        </div>

        {/* ROI badge */}
        {roi && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '24px',
              fontWeight: 'bold',
            }}>
              ROI {roi}%
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
              Dados IBGE reais • Leilões com até 50% de desconto
            </span>
          </div>
        )}

        {/* Bottom */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            agoraencontrei.com.br
          </span>
          <span style={{ color: '#C9A84C', fontSize: '14px', fontWeight: 'bold' }}>
            Inteligência Imobiliária Real
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
