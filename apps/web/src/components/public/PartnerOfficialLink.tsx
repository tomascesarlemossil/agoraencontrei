import Image from 'next/image'
import { ExternalLink, Globe } from 'lucide-react'

type PartnerOfficialLinkProps = {
  partnerName: string
  website: string
  logoSrc?: string
  className?: string
  compact?: boolean
}

export function PartnerOfficialLink({
  partnerName,
  website,
  logoSrc,
  className = '',
  compact = false,
}: PartnerOfficialLinkProps) {
  const host = website.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <a
      href={website}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-3 rounded-xl border font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3 text-sm'} ${className}`}
      style={{
        borderColor: 'rgba(201,168,76,0.55)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        color: '#C9A84C',
      }}
      aria-label={`Acessar site oficial da ${partnerName}`}
    >
      {logoSrc ? (
        <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white">
          <Image src={logoSrc} alt="" fill sizes="32px" className="object-cover" />
        </span>
      ) : (
        <Globe className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="min-w-0 text-left leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-normal opacity-80">
          Site oficial do parceiro
        </span>
        <span className="block truncate">{host}</span>
      </span>
      <ExternalLink className="h-4 w-4 flex-shrink-0" />
    </a>
  )
}
