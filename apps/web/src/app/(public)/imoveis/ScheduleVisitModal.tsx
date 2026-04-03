'use client'

import { useState } from 'react'
import { X, Calendar, Clock, User, Phone, Mail, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Generate time slots 08:00 to 18:00 in 30 min intervals
function generateTimeSlots() {
  const slots: string[] = []
  for (let h = 8; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 18) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

// Generate next 30 days (excluding Sundays)
function generateAvailableDates() {
  const dates: Date[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1) // start tomorrow
  while (dates.length < 30) {
    if (d.getDay() !== 0) { // skip Sundays
      dates.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return dates
}

interface Props {
  propertyId: string
  propertyTitle: string
  propertySlug: string
}

export function ScheduleVisitModal({ propertyId, propertyTitle, propertySlug }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'date' | 'info' | 'done'>('date')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dates = generateAvailableDates()
  const times = generateTimeSlots()

  function resetAndOpen() {
    setStep('date')
    setSelectedDate('')
    setSelectedTime('')
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setError('')
    setOpen(true)
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setError('Informe seu nome e telefone.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/public/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          propertyTitle,
          propertySlug,
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          email: email.trim() || undefined,
          preferredDate: selectedDate,
          preferredTime: selectedTime,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Erro ao agendar')
      setStep('done')
    } catch {
      setError('Erro ao agendar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <>
      <button
        onClick={resetAndOpen}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-lg shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)', color: 'white' }}
      >
        <Calendar className="w-4 h-4" />
        Agendar Visita
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#e8e4dc' }}>
              <div>
                <h2 className="font-bold text-lg" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Agendar Visita</h2>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{propertyTitle}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {step === 'done' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0f7f0' }}>
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B' }}>Visita Agendada!</h3>
                  <p className="text-gray-600 text-sm mb-1">
                    <strong>{selectedDate.split('-').reverse().join('/')}</strong> às <strong>{selectedTime}</strong>
                  </p>
                  <p className="text-gray-500 text-sm">Nossa equipe entrará em contato para confirmar.</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-6 px-8 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{ backgroundColor: '#1B2B5B', color: 'white' }}
                  >
                    Fechar
                  </button>
                </div>
              ) : step === 'date' ? (
                <>
                  {/* Date picker */}
                  <p className="text-sm font-semibold text-gray-700 mb-3">Escolha uma data:</p>
                  <div className="grid grid-cols-5 gap-2 mb-5">
                    {dates.slice(0, 20).map(d => {
                      const iso = d.toISOString().slice(0, 10)
                      const isSelected = selectedDate === iso
                      return (
                        <button
                          key={iso}
                          onClick={() => setSelectedDate(iso)}
                          className="flex flex-col items-center py-2.5 px-1 rounded-xl border text-xs font-medium transition-all"
                          style={isSelected
                            ? { backgroundColor: '#1B2B5B', color: 'white', borderColor: '#1B2B5B' }
                            : { borderColor: '#e8e4dc', color: '#374151' }}
                        >
                          <span className="text-xs opacity-70">{DAY_NAMES[d.getDay()]}</span>
                          <span className="text-base font-bold">{d.getDate()}</span>
                          <span className="text-xs opacity-70">{MONTH_NAMES[d.getMonth()]}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Time picker */}
                  {selectedDate && (
                    <>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Escolha um horário:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {times.map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className="py-2 rounded-xl border text-sm font-medium transition-all"
                            style={selectedTime === t
                              ? { backgroundColor: '#1B2B5B', color: 'white', borderColor: '#1B2B5B' }
                              : { borderColor: '#e8e4dc', color: '#374151' }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep('info')}
                    className="w-full mt-5 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-40"
                    style={{ backgroundColor: '#1B2B5B', color: 'white' }}
                  >
                    Continuar
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#f0ece4' }}>
                    <p className="font-semibold" style={{ color: '#1B2B5B' }}>
                      {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        <User className="w-3.5 h-3.5" /> Nome *
                      </label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                        style={{ borderColor: '#e8e4dc' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        <Phone className="w-3.5 h-3.5" /> Telefone / WhatsApp *
                      </label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(16) 9 9999-9999"
                        type="tel"
                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                        style={{ borderColor: '#e8e4dc' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        <Mail className="w-3.5 h-3.5" /> E-mail (opcional)
                      </label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        type="email"
                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                        style={{ borderColor: '#e8e4dc' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        Observações (opcional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Algum detalhe especial para a visita?"
                        rows={2}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 resize-none"
                        style={{ borderColor: '#e8e4dc' }}
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setStep('date')}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-gray-50"
                      style={{ borderColor: '#e8e4dc', color: '#374151' }}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-2 flex-grow py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-50"
                      style={{ backgroundColor: '#1B2B5B', color: 'white' }}
                    >
                      {loading ? 'Agendando...' : 'Confirmar Visita'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
