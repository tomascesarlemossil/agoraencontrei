'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { propertiesApi, leadsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  Building2,
  UserCheck,
  TrendingUp,
  Eye,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  Banknote,
  FileText,
  Wand2,
} from 'lucide-react'

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['property-stats'],
    queryFn: () => propertiesApi.stats(accessToken!),
    enabled: !!accessToken,
  })

  const { data: leadsData } = useQuery({
    queryKey: ['leads-summary'],
    queryFn: () => leadsApi.list(accessToken!, { limit: 5 }),
    enabled: !!accessToken,
  })

  const kpis = [
    {
      title: 'Total de Imóveis',
      value: formatNumber(stats?.total ?? 0),
      sub: `${stats?.active ?? 0} ativos`,
      icon: Building2,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950',
      href: '/dashboard/properties',
    },
    {
      title: 'Leads Recebidos',
      value: formatNumber(leadsData?.meta?.total ?? 0),
      sub: 'Total de contatos',
      icon: UserCheck,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
      href: '/dashboard/leads',
    },
    {
      title: 'Imóveis Vendidos',
      value: formatNumber(stats?.sold ?? 0),
      sub: `${stats?.rented ?? 0} alugados`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950',
      href: '/dashboard/properties?status=SOLD',
    },
    {
      title: 'Cidades com Imóveis',
      value: formatNumber(stats?.byCityTop5?.length ?? 0),
      sub: 'Cidades atendidas',
      icon: Home,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950',
      href: '/dashboard/properties',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está um resumo do seu negócio hoje
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/properties/new', icon: PlusCircle, label: 'Novo Imóvel',    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { href: '/dashboard/contratos/novo', icon: FileText,   label: 'Novo Contrato', color: 'text-green-600',  bg: 'bg-green-50'  },
          { href: '/dashboard/leads',          icon: UserCheck,  label: 'Ver Leads',     color: 'text-purple-600', bg: 'bg-purple-50' },
          { href: '/dashboard/lemosbank',      icon: Banknote,   label: 'LemosBank',     color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-transparent transition-all"
          >
            <div className={`p-2 rounded-lg ${a.bg}`}>
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.title} href={kpi.href} className="block cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imóveis por tipo */}
        <Link href="/dashboard/properties" className="block cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Imóveis por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.byType?.length ? (
                <div className="space-y-3">
                  {stats.byType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{translateType(item.type)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(item._count / (stats.total || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{item._count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum imóvel cadastrado</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Top cidades */}
        <Link href="/dashboard/properties" className="block cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Top 5 Cidades</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.byCityTop5?.length ? (
                <div className="space-y-3">
                  {stats.byCityTop5.map((item, i) => (
                    <div key={item.city} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm flex-1">{item.city}</span>
                      <span className="text-sm font-medium">{item._count} imóveis</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma cidade registrada</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/properties" className="block cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
          <StatusCard
            icon={CheckCircle}
            label="Disponíveis"
            value={stats?.active ?? 0}
            color="text-green-500"
            bg="bg-green-50 dark:bg-green-950"
          />
        </Link>
        <Link href="/dashboard/properties" className="block cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
          <StatusCard
            icon={Clock}
            label="Alugados"
            value={stats?.rented ?? 0}
            color="text-yellow-500"
            bg="bg-yellow-50 dark:bg-yellow-950"
          />
        </Link>
        <Link href="/dashboard/properties?status=SOLD" className="block cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
          <StatusCard
            icon={AlertCircle}
            label="Vendidos"
            value={stats?.sold ?? 0}
            color="text-red-500"
            bg="bg-red-50 dark:bg-red-950"
          />
        </Link>
      </div>
    </div>
  )
}

function StatusCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xl font-bold">{formatNumber(value)}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function translateType(type: string) {
  const map: Record<string, string> = {
    house: 'Casas',
    apartment: 'Apartamentos',
    land: 'Terrenos',
    commercial: 'Comercial',
    rural: 'Rural',
    studio: 'Studios',
    condo: 'Condomínios',
    office: 'Escritórios',
  }
  return map[type] ?? type
}
