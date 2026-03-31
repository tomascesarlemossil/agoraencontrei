import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-9xl gold-text font-bold mb-4">404</p>
        <h1 className="font-display text-3xl text-cream-200 mb-3">Página não encontrada</h1>
        <p className="font-sans text-cream-200/50 mb-8 max-w-sm mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link to="/" className="btn-gold inline-flex">
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
