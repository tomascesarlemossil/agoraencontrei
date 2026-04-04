'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, User, Building2, Users, Home, ChevronDown, ChevronUp, Send, CheckCircle2, FileText } from 'lucide-react'

const WHATSAPP_NUMBER = '5516981010004'

type FichaType = 'proposta-compra' | 'proposta-locacao' | 'cadastro-locatario-pf' | 'cadastro-locatario-pj' | 'cadastro-fiador-pf' | 'cadastro-locador'

const FICHAS = [
  {
    id: 'proposta-compra' as FichaType,
    title: 'Proposta de Compra',
    icon: Home,
    color: '#1B2B5B',
    description: 'Faça uma proposta formal de compra de imóvel.',
    fields: [
      { key: 'nome', label: 'Nome completo *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cpf', label: 'CPF *', type: 'text', required: true, placeholder: '000.000.000-00', options: undefined },
      { key: 'rg', label: 'RG', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'telefone', label: 'Telefone / WhatsApp *', type: 'tel', required: true, placeholder: undefined, options: undefined },
      { key: 'email', label: 'E-mail *', type: 'email', required: true, placeholder: undefined, options: undefined },
      { key: 'profissao', label: 'Profissão', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'renda', label: 'Renda mensal (R$)', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'imovel', label: 'Referência ou endereço do imóvel *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'valor', label: 'Valor da proposta (R$) *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'formaPagamento', label: 'Forma de pagamento *', type: 'select', required: true, placeholder: undefined, options: ['À vista', 'Financiamento bancário', 'FGTS + financiamento', 'Permuta', 'Parcelado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', required: false, placeholder: undefined, options: undefined },
    ],
  },
  {
    id: 'proposta-locacao' as FichaType,
    title: 'Proposta de Locação',
    icon: FileText,
    color: '#2563eb',
    description: 'Faça uma proposta de locação de imóvel.',
    fields: [
      { key: 'nome', label: 'Nome completo *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cpf', label: 'CPF *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'telefone', label: 'Telefone / WhatsApp *', type: 'tel', required: true, placeholder: undefined, options: undefined },
      { key: 'email', label: 'E-mail *', type: 'email', required: true, placeholder: undefined, options: undefined },
      { key: 'profissao', label: 'Profissão / Empresa', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'renda', label: 'Renda mensal (R$) *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'imovel', label: 'Referência ou endereço do imóvel *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'prazo', label: 'Prazo desejado do contrato', type: 'select', required: false, placeholder: undefined, options: ['12 meses', '24 meses', '30 meses', '36 meses', 'Indefinido'] },
      { key: 'garantia', label: 'Tipo de garantia', type: 'select', required: false, placeholder: undefined, options: ['Fiador', 'Seguro fiança', 'Título de capitalização', 'Depósito caução'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', required: false, placeholder: undefined, options: undefined },
    ],
  },
  {
    id: 'cadastro-locatario-pf' as FichaType,
    title: 'Cadastro de Locatário — Pessoa Física',
    icon: User,
    color: '#16a34a',
    description: 'Ficha de cadastro para locação — pessoa física.',
    fields: [
      { key: 'nome', label: 'Nome completo *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cpf', label: 'CPF *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'rg', label: 'RG *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'orgaoEmissor', label: 'Órgão emissor', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'dataNascimento', label: 'Data de nascimento', type: 'date', required: false, placeholder: undefined, options: undefined },
      { key: 'estadoCivil', label: 'Estado civil', type: 'select', required: false, placeholder: undefined, options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
      { key: 'naturalidade', label: 'Naturalidade', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'profissao', label: 'Profissão *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'empresa', label: 'Empresa / Empregador', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'renda', label: 'Renda mensal (R$) *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'telefone', label: 'Telefone / WhatsApp *', type: 'tel', required: true, placeholder: undefined, options: undefined },
      { key: 'email', label: 'E-mail *', type: 'email', required: true, placeholder: undefined, options: undefined },
      { key: 'enderecoAtual', label: 'Endereço atual completo', type: 'textarea', required: false, placeholder: undefined, options: undefined },
      { key: 'tempoResidencia', label: 'Tempo no endereço atual', type: 'text', required: false, placeholder: undefined, options: undefined },
    ],
  },
  {
    id: 'cadastro-locatario-pj' as FichaType,
    title: 'Cadastro de Locatário — Pessoa Jurídica',
    icon: Building2,
    color: '#7c3aed',
    description: 'Ficha de cadastro para locação — empresa.',
    fields: [
      { key: 'razaoSocial', label: 'Razão Social *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cnpj', label: 'CNPJ *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'ie', label: 'Inscrição Estadual', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'representante', label: 'Representante legal *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cpfRepresentante', label: 'CPF do representante *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'atividade', label: 'Atividade / Ramo', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'faturamento', label: 'Faturamento mensal (R$)', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'telefone', label: 'Telefone comercial *', type: 'tel', required: true, placeholder: undefined, options: undefined },
      { key: 'email', label: 'E-mail *', type: 'email', required: true, placeholder: undefined, options: undefined },
      { key: 'enderecoComercial', label: 'Endereço comercial completo', type: 'textarea', required: false, placeholder: undefined, options: undefined },
    ],
  },
  {
    id: 'cadastro-fiador-pf' as FichaType,
    title: 'Cadastro de Fiador — Pessoa Física',
    icon: Users,
    color: '#dc2626',
    description: 'Ficha de cadastro para fiador pessoa física.',
    fields: [
      { key: 'nome', label: 'Nome completo *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cpf', label: 'CPF *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'rg', label: 'RG *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'dataNascimento', label: 'Data de nascimento', type: 'date', required: false, placeholder: undefined, options: undefined },
      { key: 'estadoCivil', label: 'Estado civil', type: 'select', required: false, placeholder: undefined, options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
      { key: 'profissao', label: 'Profissão *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'empresa', label: 'Empresa / Empregador', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'renda', label: 'Renda mensal (R$) *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'imovelGarantia', label: 'Imóvel de garantia (endereço) *', type: 'textarea', required: true, placeholder: undefined, options: undefined },
      { key: 'valorImovel', label: 'Valor aproximado do imóvel (R$)', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'telefone', label: 'Telefone / WhatsApp *', type: 'tel', required: true, placeholder: undefined, options: undefined },
      { key: 'email', label: 'E-mail', type: 'email', required: false, placeholder: undefined, options: undefined },
    ],
  },
  {
    id: 'cadastro-locador' as FichaType,
    title: 'Cadastro de Locador (Proprietário)',
    icon: Home,
    color: '#C9A84C',
    description: 'Cadastre seu imóvel para administração pela Imobiliária Lemos.',
    fields: [
      { key: 'nome', label: 'Nome completo *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'cpf', label: 'CPF *', type: 'text', required: true, placeholder: undefined, options: undefined },
      { key: 'rg', label: 'RG', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'estadoCivil', label: 'Estado civil', type: 'select', required: false, placeholder: undefined, options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
      { key: 'telefone', label: 'Telefone / WhatsApp *', type: 'tel', required: true, placeholder: undefined, options: undefined },
      { key: 'email', label: 'E-mail *', type: 'email', required: true, placeholder: undefined, options: undefined },
      { key: 'enderecoProprietario', label: 'Endereço do proprietário', type: 'textarea', required: false, placeholder: undefined, options: undefined },
      { key: 'enderecoImovel', label: 'Endereço completo do imóvel *', type: 'textarea', required: true, placeholder: undefined, options: undefined },
      { key: 'tipoImovel', label: 'Tipo do imóvel', type: 'select', required: false, placeholder: undefined, options: ['Casa', 'Apartamento', 'Comercial', 'Terreno', 'Galpão'] },
      { key: 'areaTotal', label: 'Área total (m²)', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'quartos', label: 'Quartos', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'valorDesejado', label: 'Valor desejado (R$)', type: 'text', required: false, placeholder: undefined, options: undefined },
      { key: 'finalidade', label: 'Finalidade', type: 'select', required: false, placeholder: undefined, options: ['Locação', 'Venda', 'Locação e Venda'] },
      { key: 'dadosBancarios', label: 'Banco / Agência / Conta para repasse', type: 'textarea', required: false, placeholder: undefined, options: undefined },
      { key: 'observacoes', label: 'Observações', type: 'textarea', required: false, placeholder: undefined, options: undefined },
    ],
  },
]

interface Field {
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
}

interface Ficha {
  id: FichaType
  title: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  description: string
  fields: Field[]
}

function formatFieldsAsWhatsApp(fichaTitle: string, fields: Field[], values: Record<string, string>) {
  const lines = [`*${fichaTitle.toUpperCase()}*\n`]
  fields.forEach(f => {
    const val = values[f.key]
    if (val) lines.push(`*${f.label.replace(' *', '')}:* ${val}`)
  })
  lines.push(`\n_Enviado via Portal Imobiliária Lemos_`)
  return lines.join('\n')
}

function FichaForm({ ficha }: { ficha: Ficha }) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  function set(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = formatFieldsAsWhatsApp(ficha.title, ficha.fields, values)
    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
    setSubmitted(true)
  }

  return (
    <div className="border rounded-2xl overflow-hidden" style={{ borderColor: '#e8e4dc' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ficha.color}15` }}>
          <ficha.icon className="w-5 h-5" style={{ color: ficha.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{ficha.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{ficha.description}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t p-5 bg-gray-50" style={{ borderColor: '#e8e4dc' }}>
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-bold text-gray-900 mb-1">Ficha enviada pelo WhatsApp!</p>
              <p className="text-sm text-gray-500 mb-4">Nossa equipe analisará seus dados e entrará em contato.</p>
              <button onClick={() => { setSubmitted(false); setValues({}) }} className="text-sm font-medium hover:opacity-80" style={{ color: ficha.color }}>
                Enviar outra ficha
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ficha.fields.map(f => (
                <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      value={values[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                      required={f.required}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 bg-white"
                      style={{ borderColor: '#e8e4dc' }}
                    >
                      <option value="">Selecione...</option>
                      {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      value={values[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                      required={f.required}
                      rows={3}
                      placeholder={f.placeholder}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 resize-none bg-white"
                      style={{ borderColor: '#e8e4dc' }}
                    />
                  ) : (
                    <input
                      type={f.type}
                      value={values[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                      required={f.required}
                      placeholder={f.placeholder}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 bg-white"
                      style={{ borderColor: '#e8e4dc' }}
                    />
                  )}
                </div>
              ))}

              <div className="sm:col-span-2 flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <Send className="w-4 h-4" /> Enviar pelo WhatsApp
                </button>
              </div>

              <p className="sm:col-span-2 text-xs text-gray-500 text-center">
                Ao enviar, você será redirecionado para o WhatsApp com os dados preenchidos.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function FichasCadastraisPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      <section className="py-16 text-center" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
            <ClipboardList className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>Fichas Cadastrais</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Para a maior comodidade e agilidade no processo de locação e compra, preencha os formulários abaixo. Os dados serão enviados diretamente para nossa equipe pelo WhatsApp.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        {FICHAS.map(ficha => (
          <FichaForm key={ficha.id} ficha={ficha} />
        ))}

        <div className="text-center pt-4">
          <Link href="/servicos" className="text-sm font-medium hover:opacity-80" style={{ color: '#1B2B5B' }}>
            ← Voltar aos serviços
          </Link>
        </div>
      </section>
    </div>
  )
}
