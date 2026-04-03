'use client'

interface BankButtonProps {
  name: string
  abbr: string
  color: string
  bg: string
  logo: string | null
  href: string
}

export function BankButton({ name, abbr, color, bg, logo, href }: BankButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={`Simular financiamento no ${name}`}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 px-2 hover:shadow-md transition-all hover:scale-105 cursor-pointer group"
      style={{ borderColor: color + '30', backgroundColor: bg }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          className="h-6 w-auto object-contain"
          style={{ maxWidth: 56 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
            const sibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null
            if (sibling) sibling.style.display = 'block'
          }}
        />
      ) : null}
      <span
        className="text-xs font-extrabold tracking-wide"
        style={{ color, display: logo ? 'none' : 'block' }}
      >
        {abbr}
      </span>
      <span className="text-[9px] text-center leading-tight font-semibold" style={{ color }}>
        {name}
      </span>
    </a>
  )
}
