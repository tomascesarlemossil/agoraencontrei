/**
 * SkipNav — Skip Navigation Link para acessibilidade WCAG 2.1 AA
 * Permite que usuários de teclado/leitores de tela pulem direto para o conteúdo principal.
 * Visível apenas ao receber foco (via Tab).
 */
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-yellow-400 focus:text-black focus:font-bold focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-black"
    >
      Pular para o conteúdo principal
    </a>
  )
}

export default SkipNav
