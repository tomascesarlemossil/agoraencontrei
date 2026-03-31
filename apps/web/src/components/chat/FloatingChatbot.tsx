'use client'

import { useState } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'

const QUICK_REPLIES = [
  'Quero comprar um imóvel',
  'Quero alugar um imóvel',
  'Avaliar meu imóvel',
  'Falar com um corretor',
]

const WELCOME = 'Olá! 👋 Sou a assistente virtual da Imobiliária Lemos. Como posso ajudar você hoje?'

export function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: WELCOME },
  ])
  const [input, setInput] = useState('')

  function sendMessage(text: string) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')

    // Route to WhatsApp for human handoff
    const waText = encodeURIComponent(`Olá! ${text}`)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: 'Entendido! Vou te conectar com um de nossos corretores pelo WhatsApp para um atendimento personalizado. 📱',
        },
      ])
      setTimeout(() => {
        window.open(`https://wa.me/5516981010004?text=${waText}`, '_blank')
      }, 800)
    }, 600)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div
          className="w-80 rounded-2xl overflow-hidden shadow-2xl border"
          style={{ borderColor: 'rgba(27,43,91,0.15)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: '#C9A84C' }}
              >
                IL
              </div>
              <div>
                <p className="text-white text-xs font-bold">Imobiliária Lemos</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-white/50 text-xs">Online agora</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="bg-white h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                  style={{
                    backgroundColor: msg.role === 'bot' ? '#f0ece4' : '#1B2B5B',
                    color: msg.role === 'bot' ? '#374151' : 'white',
                    borderBottomLeftRadius: msg.role === 'bot' ? '4px' : undefined,
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : undefined,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick replies (only on first message) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_REPLIES.map(qr => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-xs px-2.5 py-1.5 rounded-full border transition-all hover:brightness-110"
                    style={{ borderColor: '#C9A84C', color: '#1B2B5B', backgroundColor: 'rgba(201,168,76,0.1)' }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="bg-white border-t flex items-center gap-2 p-3" style={{ borderColor: '#f0ece4' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Digite sua mensagem..."
              className="flex-1 text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1"
              style={{ borderColor: '#e0dbd0', '--ring-color': '#1B2B5B' } as any}
            />
            <button
              onClick={() => sendMessage(input)}
              className="p-2 rounded-xl transition-all hover:brightness-110"
              style={{ backgroundColor: '#1B2B5B', color: 'white' }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-105 hover:shadow-2xl"
        style={{ backgroundColor: '#1B2B5B' }}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {/* Notification dot */}
        {!open && (
          <div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            1
          </div>
        )}
      </button>
    </div>
  )
}
