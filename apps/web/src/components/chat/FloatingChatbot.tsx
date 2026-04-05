'use client'

import { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'

const QUICK_REPLIES = [
  '🏠 Quero comprar um imóvel',
  '🔑 Quero alugar um imóvel',
  '📊 Avaliar meu imóvel',
  '💰 Financiamento imobiliário',
  '📞 Falar com corretor',
]

// Smart response rules based on keywords
function getBotResponse(text: string): { message: string; redirect?: string; delay?: number } {
  const t = text.toLowerCase()

  if (/comprar|compra|venda|vender|quero comprar/i.test(t)) {
    return {
      message: `Ótima escolha! 😊 Temos mais de 900 imóveis à venda em Franca e região — casas, apartamentos, terrenos e imóveis comerciais.\n\nPosso te conectar com nossa corretora Noêmia ou um de nossos especialistas para um atendimento personalizado. Qual tipo de imóvel você está procurando?`,
    }
  }
  if (/alug|locar|inquilino|locação/i.test(t)) {
    return {
      message: `Temos ótimas opções de locação! 🔑 Casas e apartamentos em vários bairros de Franca/SP, com contratos seguros e suporte completo durante toda a vigência.\n\nVou te conectar pelo WhatsApp com nossa equipe para mostrar as melhores opções disponíveis para você.`,
      redirect: 'Quero alugar um imóvel — vi no site',
      delay: 2000,
    }
  }
  if (/avaliar|avaliação|quanto vale|valor do meu|precificar/i.test(t)) {
    return {
      message: `Fazemos avaliações gratuitas! 📊 Com mais de 20 anos de experiência no mercado de Franca, podemos te ajudar a descobrir o valor real do seu imóvel com base em dados atuais.\n\nClique no link abaixo para preencher o formulário de avaliação:`,
    }
  }
  if (/financiamento|financiar|parcela|banco|caixa|crédito imobiliário/i.test(t)) {
    return {
      message: `Trabalhamos com os principais bancos: Caixa Econômica, Bradesco, Itaú, Santander, BB, Inter, SICOOB, Sicredi e BEXT. 🏦\n\nPosso simular as parcelas para você ou te conectar com nosso especialista em financiamento. Qual o valor aproximado do imóvel que você quer financiar?`,
    }
  }
  if (/fgts|fundo de garantia/i.test(t)) {
    return {
      message: `Sim, é possível usar o FGTS! ✅ Ele pode ser usado como entrada, para amortizar parcelas ou abater o saldo devedor em financiamentos pela Caixa Econômica Federal (Minha Casa Minha Vida).\n\nPosso te conectar com nossa equipe para verificar sua situação específica.`,
      redirect: 'Quero usar o FGTS para comprar um imóvel',
      delay: 2500,
    }
  }
  if (/casa|apartamento|terreno|chácara|sítio|galpão|comercial|cobertura|kitnet/i.test(t)) {
    const tipo = t.includes('casa') ? 'casa' : t.includes('apart') ? 'apartamento' : t.includes('terreno') ? 'terreno' : 'imóvel'
    return {
      message: `Temos excelentes opções de ${tipo} em Franca! 🏡 Para mostrar as melhores alternativas dentro do seu perfil e orçamento, vou te conectar com um de nossos corretores agora.`,
      redirect: `Quero ver opções de ${tipo} em Franca/SP`,
      delay: 2000,
    }
  }
  if (/bairro|centro|jardim|vila|região|franca/i.test(t)) {
    return {
      message: `Atendemos todos os bairros de Franca/SP e região! 📍 Centro, Jardim Consolação, São José, Aeroporto, Cidade Nova, Parque das Esmeraldas e muito mais.\n\nQual bairro você prefere? Posso verificar a disponibilidade para você.`,
    }
  }
  if (/corretor|atendente|falar|contato|telefone|whatsapp|ligar/i.test(t)) {
    return {
      message: `Claro! Nossa equipe está disponível de seg. a sex. das 8h às 18h e sábados das 8h às 12h. 📱\n\nVou te conectar pelo WhatsApp agora com a nossa corretora!`,
      redirect: text,
      delay: 1200,
    }
  }
  if (/horário|funciona|aberto|quando/i.test(t)) {
    return {
      message: `Nosso horário de atendimento é:\n📅 Segunda a Sexta: 8h às 18h\n📅 Sábados: 8h às 12h\n\n📍 Rua João Ramalho, 1060 — Centro, Franca/SP\n📞 (16) 3723-0045 | (16) 98101-0004\n\nTambém atendemos pelo WhatsApp! 💬`,
    }
  }
  if (/endereço|localização|onde fica|como chegar/i.test(t)) {
    return {
      message: `Estamos localizados na:\n📍 Rua João Ramalho, 1060 — Centro, Franca/SP\n\nFácil acesso! Venha nos visitar ou fale com a gente pelo WhatsApp para agendar um atendimento. 😊`,
    }
  }
  if (/2via|segunda via|boleto|aluguel vencido|atraso/i.test(t)) {
    return {
      message: `Para 2ª via de boleto, acesse nossa página de serviços ou fale com a gente:\n\n🔗 /servicos/2via-boleto\n📱 WhatsApp: (16) 98101-0004\n\nProcessamos rápido para não ter atraso! ✅`,
    }
  }
  if (/proprietário|extrato|repasse|recebi/i.test(t)) {
    return {
      message: `Proprietários podem consultar o extrato de repasses e aluguéis diretamente em nosso portal:\n\n🔗 /servicos/extrato-proprietario\n\nOu fale diretamente com nossa equipe administrativa! 📋`,
    }
  }

  // Generic fallback
  return {
    message: `Entendido! 😊 Para te ajudar da melhor forma, vou conectar você com um de nossos corretores especializados pelo WhatsApp. Eles conhecem todo o portfólio da Imobiliária Lemos e poderão te atender pessoalmente!`,
    redirect: text,
    delay: 1500,
  }
}

export function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string; isTyping?: boolean }[]>([
    { role: 'bot', text: 'Olá! 👋 Sou a assistente virtual da Imobiliária Lemos.\n\nEstou aqui para ajudar você a encontrar o imóvel ideal ou tirar suas dúvidas. Como posso te ajudar?' },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return
    const cleanText = text.replace(/^[🏠🔑📊💰📞]\s*/, '')
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setIsTyping(true)
    // Re-focus input after clearing
    setTimeout(() => inputRef.current?.focus(), 50)

    const { message, redirect, delay } = getBotResponse(cleanText)

    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'bot', text: message }])

      if (redirect !== undefined) {
        setTimeout(() => {
          const waText = encodeURIComponent(`Olá! ${redirect || cleanText}`)
          window.open(`https://wa.me/5516981010004?text=${waText}`, '_blank')
        }, delay ?? 1500)
      }
    }, 800)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div
          className="w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl border"
          style={{ borderColor: 'rgba(27,43,91,0.15)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #e6c96a)' }}
              >
                <span style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif', fontSize: 11 }}>IL</span>
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">Imobiliária Lemos</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-white/60 text-xs">Assistente virtual</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1 ml-2"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="bg-white h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold mr-2 flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a8a)' }}
                  >
                    IL
                  </div>
                )}
                <div
                  className="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap"
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

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a8a)' }}
                >
                  IL
                </div>
                <div className="bg-gray-100 rounded-2xl px-3 py-2 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick replies (only on first message) */}
            {messages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_REPLIES.map(qr => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-xs px-2.5 py-1.5 rounded-full border-2 transition-all hover:brightness-110 font-medium"
                    style={{ borderColor: '#C9A84C', color: '#1B2B5B', backgroundColor: 'rgba(201,168,76,0.08)' }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-gray-50 border-t px-4 py-2" style={{ borderColor: '#f0ece4' }}>
            <a
              href="https://wa.me/5516981010004?text=Olá! Vim pelo site e gostaria de atendimento."
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar pelo WhatsApp agora
            </a>
          </div>

          {/* Input */}
          <div className="bg-white border-t flex items-center gap-2 p-3" style={{ borderColor: '#f0ece4' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder={isTyping ? 'Aguarde...' : 'Digite sua mensagem...'}
              className="flex-1 text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#1B2B5B] placeholder-gray-400"
              style={{ borderColor: '#e0dbd0', backgroundColor: '#ffffff', color: '#111827', caretColor: '#1B2B5B', opacity: 1 }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="p-2 rounded-xl transition-all hover:brightness-110 disabled:opacity-40"
              style={{ backgroundColor: '#1B2B5B', color: 'white' }}
              aria-label="Enviar mensagem"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-105 hover:shadow-2xl relative"
        style={{ backgroundColor: '#1B2B5B' }}
        aria-label="Chat com Imobiliária Lemos"
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {/* Notification dot */}
        {!open && (
          <div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#C9A84C' }}
          >
            <span className="text-[#1B2B5B] text-[9px] font-extrabold">1</span>
          </div>
        )}
      </button>
    </div>
  )
}
