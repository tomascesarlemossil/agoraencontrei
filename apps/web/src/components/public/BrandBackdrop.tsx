/**
 * BrandBackdrop — papel de parede institucional do AgoraEncontrei.
 *
 * Camada fixa (atrás de todo o conteúdo) com o contraste de verde escuro
 * militar pedido pela direção e o monograma AE em cada lateral da tela.
 *
 * Comportamento responsivo proposital:
 *  - Abaixo de `2xl` (telas comuns: celular, tablet, notebook) o conteúdo
 *    ocupa a largura toda e cobre o fundo — NENHUMA mudança visual, leitura
 *    e layout permanecem idênticos ao que já existia.
 *  - A partir de `2xl` (telas largas), o painel de conteúdo passa a ter uma
 *    largura máxima e o verde militar aparece nas laterais (gutters), com um
 *    logo centralizado em cada lado — "um logo de cada lado da tela".
 *
 * Como é `position: fixed`, os logos ficam fixos enquanto a página rola
 * (efeito de marca d'água / papel de parede), reforçando a identidade sem
 * competir com o conteúdo.
 */
export function BrandBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 select-none"
      style={{
        // Verde escuro militar, alinhado ao chrome (#143A1F) com leve profundidade.
        background:
          'radial-gradient(1200px 800px at 50% 0%, #1a4527 0%, #143A1F 42%, #0a1c0d 100%)',
      }}
    >
      {/* Logo lateral esquerda — só aparece quando existe gutter (2xl+). */}
      <div
        className="absolute inset-y-0 left-0 hidden 2xl:flex items-center justify-center"
        style={{ width: 'calc((100vw - 1600px) / 2)' }}
      >
        <img
          src="/brand/ae-monogram.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{ width: 'min(150px, 62%)', height: 'auto', opacity: 0.92 }}
        />
      </div>

      {/* Logo lateral direita. */}
      <div
        className="absolute inset-y-0 right-0 hidden 2xl:flex items-center justify-center"
        style={{ width: 'calc((100vw - 1600px) / 2)' }}
      >
        <img
          src="/brand/ae-monogram.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{ width: 'min(150px, 62%)', height: 'auto', opacity: 0.92 }}
        />
      </div>
    </div>
  )
}
