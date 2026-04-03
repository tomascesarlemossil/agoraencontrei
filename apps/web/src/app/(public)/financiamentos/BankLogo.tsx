'use client'

interface BankLogoProps {
  src: string | null
  shortName: string
  color: string
  bg: string
}

export function BankLogo({ src, shortName, color, bg }: BankLogoProps) {
  return (
    <div
      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={shortName}
          className="w-12 h-12 object-contain"
          onError={(e) => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
            const fb = el.nextElementSibling as HTMLElement | null
            if (fb) fb.style.display = 'flex'
          }}
        />
      ) : null}
      <span
        className="text-lg font-extrabold"
        style={{ color, display: src ? 'none' : 'flex' }}
      >
        {shortName.slice(0, 3)}
      </span>
    </div>
  )
}
