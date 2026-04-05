'use client'

import { useState } from 'react'

export type Membro = {
  id: string
  name: string
  role: string
  creci: string
  phone: string
  email: string
  photo: string
  specialties: string[]
  bio: string
}

export function MembroCard({ membro }: { membro: Membro }) {
  const [imgError, setImgError] = useState(false)
  const firstName = membro.name.split(' ')[0]
  const whatsappMsg = encodeURIComponent(`Olá, ${firstName}! Gostaria de informações sobre imóveis da Imobiliária Lemos.`)
  const whatsappUrl = `https://wa.me/${membro.phone}?text=${whatsappMsg}`
  const initial = membro.name.charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-stone-100 flex flex-col">
      {/* Header gradiente */}
      <div className="relative h-32 sm:h-48 flex items-end justify-center"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 70%, #1B2B5B 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Avatar */}
        <div className="relative translate-y-1/2 z-10">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 shadow-xl bg-amber-400 flex items-center justify-center"
            style={{ borderColor: '#C9A84C' }}>
            {imgError ? (
              <span className="text-2xl sm:text-4xl" style={{ color: '#1B2B5B', fontWeight: 'bold', lineHeight: 1 }}>
                {initial}
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={membro.photo}
                alt={membro.name}
                className={`w-full h-full object-cover ${
                  membro.photo.includes('icon') ? 'object-center' : 'object-top'
                }`}
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pt-12 sm:pt-16 pb-4 sm:pb-6 px-3 sm:px-6 text-center flex flex-col flex-1">
        <h3 className="text-sm sm:text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          {membro.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{membro.role}</p>
        {membro.creci && (
          <p className="text-xs font-semibold mt-1" style={{ color: '#C9A84C' }}>
            CRECI {membro.creci}
          </p>
        )}
        {membro.bio && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 leading-relaxed flex-1">{membro.bio}</p>
        )}

        {/* Especialidades */}
        {membro.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center mt-2 sm:mt-4">
            {membro.specialties.map((s) => (
              <span key={s} className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium"
                style={{ backgroundColor: '#f0f4ff', color: '#1B2B5B' }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Botão WhatsApp individual */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 sm:mt-5 flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2 sm:py-3 rounded-2xl text-sm sm:text-base font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
        >
          <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Falar com {firstName}
        </a>
      </div>
    </div>
  )
}
