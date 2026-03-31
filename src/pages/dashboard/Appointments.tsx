import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin,
  User, Home, Eye, Users, FileText, Phone, MessageSquare, Bell,
} from 'lucide-react'

type ViewMode = 'month' | 'week' | 'day'

const appointments = [
  { id: 1, time: '09:00', duration: 60, type: 'Visita', client: 'Fernanda Costa', property: 'Apto 2q Vila Madalena', address: 'R. Aspicuelta, 234', corretor: 'Carlos L.', date: '2025-01-27', color: 'blue' },
  { id: 2, time: '11:30', duration: 60, type: 'Reunião', client: 'Pedro Almeida', property: 'Casa Granja Viana', address: 'Escritório', corretor: 'Mariana S.', date: '2025-01-27', color: 'purple' },
  { id: 3, time: '14:00', duration: 120, type: 'Assinatura', client: 'Beatriz Nunes', property: 'Contrato LEM-0094', address: 'Cartório Vila Mariana', corretor: 'Carlos L.', date: '2025-01-27', color: 'emerald' },
  { id: 4, time: '16:30', duration: 60, type: 'Visita', client: 'Marcos Oliveira', property: 'Casa Morumbi', address: 'Av. Morumbi, 5500', corretor: 'Mariana S.', date: '2025-01-27', color: 'blue' },
  { id: 5, time: '09:30', duration: 60, type: 'Visita', client: 'Juliana Rocha', property: 'Apto 4q Jardim Europa', address: 'R. Europa, 180', corretor: 'Carlos L.', date: '2025-01-28', color: 'blue' },
  { id: 6, time: '15:00', duration: 90, type: 'Avaliação', client: 'Roberto Faria', property: 'Terreno Osasco', address: 'R. Industrial, 44', corretor: 'Mariana S.', date: '2025-01-28', color: 'amber' },
  { id: 7, time: '10:00', duration: 60, type: 'Visita', client: 'André Santos', property: 'Apto 3q Pinheiros', address: 'R. Fradique Coutinho, 890', corretor: 'Carlos L.', date: '2025-01-29', color: 'blue' },
  { id: 8, time: '14:30', duration: 60, type: 'Reunião', client: 'Luciana Ferreira', property: '—', address: 'Escritório', corretor: 'Mariana S.', date: '2025-01-29', color: 'purple' },
]

const typeConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Visita': { color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Eye },
  'Reunião': { color: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30', icon: Users },
  'Assinatura': { color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: FileText },
  'Avaliação': { color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: Home },
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const monthDays = Array.from({ length: 31 }, (_, i) => i + 1)
const calendarGrid = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, null],
]

const getAppointmentsForDay = (day: number | null) => {
  if (!day) return []
  return appointments.filter(a => a.date === `2025-01-${String(day).padStart(2, '0')}`)
}

function AppointmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Novo Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground/70 block mb-1.5">Tipo</label>
            <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
              {['Visita','Reunião','Assinatura','Avaliação'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <Input label="Cliente" placeholder="Buscar cliente..." />
          <Input label="Imóvel" placeholder="Código ou nome do imóvel" />
          <div>
            <label className="text-xs font-medium text-foreground/70 block mb-1.5">Corretor</label>
            <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
              {['Carlos L.','Mariana S.'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" type="date" />
            <Input label="Hora" type="time" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 block mb-1.5">Observações</label>
            <textarea className="w-full h-16 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#d4a843] resize-none" placeholder="Notas..." />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-foreground/60">Enviar lembrete:</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 rounded border border-[#1a2035] bg-[#0a0e1a] flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#d4a843]" /></div>
              <span className="text-xs text-foreground/70">WhatsApp</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 rounded border border-[#1a2035] bg-[#0a0e1a]" />
              <span className="text-xs text-foreground/70">Email</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-[#1a2035]">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button>Agendar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardAppointments() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(27)

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Agenda</h1>
            <p className="text-sm text-foreground/50 mt-0.5">Janeiro 2025</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[#1a2035] rounded-lg p-0.5">
              {(['month','week','day'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === v ? 'bg-[#d4a843]/20 text-[#d4a843]' : 'text-foreground/50 hover:text-foreground'}`}
                >
                  {{ month: 'Mês', week: 'Semana', day: 'Dia' }[v]}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
            <Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Agendar</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Calendar Grid */}
          <div className="col-span-2">
            <Card>
              <CardContent className="p-4">
                {viewMode === 'month' && (
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {daysOfWeek.map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-foreground/40 py-1">{d}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {calendarGrid.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                          {week.map((day, di) => {
                            const dayAppts = getAppointmentsForDay(day)
                            const isToday = day === 27
                            return (
                              <div
                                key={di}
                                className={`min-h-16 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  !day ? 'opacity-0 pointer-events-none' :
                                  isToday ? 'bg-[#d4a843]/10 border border-[#d4a843]/30' :
                                  selectedDay === day ? 'bg-[#1a2035] border border-[#1a2035]' :
                                  'hover:bg-[#1a2035]/50 border border-transparent'
                                }`}
                                onClick={() => day && setSelectedDay(day)}
                              >
                                <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-[#d4a843]' : 'text-foreground/70'}`}>{day}</p>
                                {dayAppts.slice(0, 2).map(a => {
                                  const cfg = typeConfig[a.type]
                                  return (
                                    <div key={a.id} className={`text-[9px] px-1 py-0.5 rounded truncate mb-0.5 ${cfg.bg} ${cfg.color}`}>
                                      {a.time} {a.client}
                                    </div>
                                  )
                                })}
                                {dayAppts.length > 2 && <p className="text-[9px] text-foreground/40">+{dayAppts.length - 2} mais</p>}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode !== 'month' && (
                  <div className="space-y-3">
                    {appointments.filter(a => a.date === '2025-01-27').map(appt => {
                      const cfg = typeConfig[appt.type]
                      const Icon = cfg.icon
                      return (
                        <div key={appt.id} className={`flex gap-4 p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                          <div className="text-center min-w-12">
                            <p className={`text-sm font-bold ${cfg.color}`}>{appt.time}</p>
                            <p className="text-[10px] text-foreground/40">{appt.duration}min</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`h-4 w-4 ${cfg.color}`} />
                              <span className={`text-xs font-semibold ${cfg.color}`}>{appt.type}</span>
                              <span className="text-xs text-foreground/50">{appt.corretor}</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground/90">{appt.client}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Home className="h-3 w-3 text-foreground/40" />
                              <p className="text-xs text-foreground/60">{appt.property}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-foreground/40" />
                              <p className="text-xs text-foreground/50">{appt.address}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button className="p-1.5 rounded hover:bg-[#1a2035]"><Phone className="h-3.5 w-3.5 text-foreground/50" /></button>
                            <button className="p-1.5 rounded hover:bg-[#1a2035]"><MessageSquare className="h-3.5 w-3.5 text-foreground/50" /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {selectedDay ? `Agenda — ${selectedDay}/01` : 'Próximas Visitas'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(selectedDay ? getAppointmentsForDay(selectedDay) : appointments.slice(0, 4)).map(appt => {
                  const cfg = typeConfig[appt.type]
                  const Icon = cfg.icon
                  return (
                    <div key={appt.id} className={`p-3 rounded-lg border ${cfg.border} ${cfg.bg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        <span className={`text-xs font-semibold ${cfg.color}`}>{appt.time} — {appt.type}</span>
                      </div>
                      <p className="text-sm font-semibold">{appt.client}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-foreground/40" />
                        <p className="text-xs text-foreground/50 truncate">{appt.address}</p>
                      </div>
                      <p className="text-xs text-foreground/40 mt-1">{appt.corretor}</p>
                    </div>
                  )
                })}
                {selectedDay && getAppointmentsForDay(selectedDay).length === 0 && (
                  <p className="text-xs text-foreground/40 text-center py-4">Nenhum agendamento neste dia</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Legenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(typeConfig).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`p-1 rounded ${cfg.bg}`}><Icon className={`h-3 w-3 ${cfg.color}`} /></div>
                      <span className="text-xs text-foreground/70">{type}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  )
}
