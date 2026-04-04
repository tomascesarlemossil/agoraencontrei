'use client'

import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle, ShoppingCart, Home, Car, User, FileText } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Props {
  propertyId: string
  propertyTitle: string
  propertyPrice?: number
  propertyReference?: string
}

const PAYMENT_METHODS = [
  { value: 'FINANCIAMENTO', label: 'Financiamento bancário' },
  { value: 'FGTS', label: 'FGTS + Financiamento' },
  { value: 'A_VISTA', label: 'À vista (próprio)' },
  { value: 'PERMUTA', label: 'Permuta (imóvel/veículo)' },
  { value: 'CONSORCIO', label: 'Consórcio' },
  { value: 'PARCELADO', label: 'Parcelado com proprietário' },
]

const BANKS = [
  'Caixa Econômica Federal', 'Banco do Brasil', 'Bradesco', 'Itaú',
  'Santander', 'SICOOB', 'Sicredi', 'Outro',
]

const VEHICLE_TYPES = ['Carro', 'Caminhonete', 'Caminhão', 'Moto', 'Ônibus', 'Outro']

type Step = 'dados' | 'proposta' | 'permuta' | 'confirmacao' | 'sucesso'

interface FormState {
  // Dados do comprador
  nome: string
  cpf: string
  email: string
  telefone: string
  // Proposta
  valorProposta: string
  formaPagamento: string
  entradaValor: string
  entradaFGTS: string
  bancoFinanciamento: string
  prazoFinanciamento: string
  // Permuta imóvel
  temPermutaImovel: boolean
  permutaImovelTipo: string
  permutaImovelDescricao: string
  permutaImovelValor: string
  permutaImovelCidade: string
  // Permuta veículo
  temPermutaVeiculo: boolean
  permutaVeiculoTipo: string
  permutaVeiculoMarca: string
  permutaVeiculoModelo: string
  permutaVeiculoAno: string
  permutaVeiculoValor: string
  // Observações
  observacoes: string
}

const INITIAL: FormState = {
  nome: '', cpf: '', email: '', telefone: '',
  valorProposta: '', formaPagamento: '', entradaValor: '', entradaFGTS: '',
  bancoFinanciamento: '', prazoFinanciamento: '30',
  temPermutaImovel: false,
  permutaImovelTipo: '', permutaImovelDescricao: '', permutaImovelValor: '', permutaImovelCidade: '',
  temPermutaVeiculo: false,
  permutaVeiculoTipo: '', permutaVeiculoMarca: '', permutaVeiculoModelo: '',
  permutaVeiculoAno: '', permutaVeiculoValor: '',
  observacoes: '',
}

function formatCPF(v: string) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}

function formatPhone(v: string) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{4,5})(\d{4})$/,'$1-$2')
}

function formatCurrency(v: string) {
  const n = v.replace(/\D/g,'')
  if (!n) return ''
  return (parseInt(n) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseCurrency(v: string): number {
  return parseFloat(v.replace(/[^\d,]/g, '').replace(',', '.')) * 100 || 0
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white'
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1'

export function PropostaOnline({ propertyId, propertyTitle, propertyPrice, propertyReference }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('dados')
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const STEPS: Step[] = ['dados', 'proposta', 'permuta', 'confirmacao']
  const stepIndex = STEPS.indexOf(step)

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const proposta = {
        valorProposta: parseCurrency(form.valorProposta),
        formaPagamento: form.formaPagamento,
        entradaValor: parseCurrency(form.entradaValor),
        entradaFGTS: parseCurrency(form.entradaFGTS),
        bancoFinanciamento: form.bancoFinanciamento,
        prazoFinanciamento: form.prazoFinanciamento,
        permutaImovel: form.temPermutaImovel ? {
          tipo: form.permutaImovelTipo,
          descricao: form.permutaImovelDescricao,
          valor: parseCurrency(form.permutaImovelValor),
          cidade: form.permutaImovelCidade,
        } : null,
        permutaVeiculo: form.temPermutaVeiculo ? {
          tipo: form.permutaVeiculoTipo,
          marca: form.permutaVeiculoMarca,
          modelo: form.permutaVeiculoModelo,
          ano: form.permutaVeiculoAno,
          valor: parseCurrency(form.permutaVeiculoValor),
        } : null,
        observacoes: form.observacoes,
      }

      const res = await fetch(`${API_URL}/api/v1/public/proposta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nome,
          email: form.email || undefined,
          phone: form.telefone,
          cpf: form.cpf || undefined,
          propertyId,
          proposta,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Erro ao enviar proposta. Tente novamente.')
      }
      setStep('sucesso')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
        style={{ backgroundColor: '#1B2B5B', color: 'white' }}
      >
        <ShoppingCart className="w-4 h-4" />
        Comprar 100% Online
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#f0ece4' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#1B2B5B' }}>Proposta de Compra Online</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{propertyTitle}</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {step === 'sucesso' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Proposta Enviada!</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Recebemos sua proposta para <strong>{propertyTitle}</strong>.
              Nossa equipe irá analisar junto ao proprietário e retornará em até <strong>24 horas</strong>.
            </p>
            {propertyReference && (
              <p className="text-xs text-gray-500 mb-6">Código do imóvel: <strong>{propertyReference}</strong></p>
            )}
            <button
              onClick={() => { setOpen(false); setStep('dados'); setForm(INITIAL) }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Steps indicator */}
            <div className="flex items-center gap-0 px-5 py-3 bg-gray-50 border-b text-xs font-medium" style={{ borderColor: '#f0ece4' }}>
              {[
                { key: 'dados', icon: <User className="w-3.5 h-3.5" />, label: 'Dados' },
                { key: 'proposta', icon: <FileText className="w-3.5 h-3.5" />, label: 'Proposta' },
                { key: 'permuta', icon: <Home className="w-3.5 h-3.5" />, label: 'Permuta' },
                { key: 'confirmacao', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Confirmar' },
              ].map((s, i) => {
                const current = s.key === step
                const done = STEPS.indexOf(s.key as Step) < stepIndex
                return (
                  <div key={s.key} className="flex items-center">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                      current ? 'text-white' : done ? 'text-green-600' : 'text-gray-500'
                    }`} style={current ? { backgroundColor: '#C9A84C' } : {}}>
                      {s.icon}
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {i < 3 && <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5" />}
                  </div>
                )
              })}
            </div>

            <div className="p-5 space-y-4">
              {/* STEP: Dados do comprador */}
              {step === 'dados' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#C9A84C' }} /> Dados do Comprador
                  </h3>
                  <div>
                    <label className={labelCls}>Nome completo *</label>
                    <input className={inputCls} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="João da Silva" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>CPF</label>
                      <input className={inputCls} value={form.cpf}
                        onChange={e => set('cpf', formatCPF(e.target.value))}
                        placeholder="000.000.000-00" maxLength={14} />
                    </div>
                    <div>
                      <label className={labelCls}>Telefone / WhatsApp *</label>
                      <input className={inputCls} type="tel" value={form.telefone}
                        onChange={e => set('telefone', formatPhone(e.target.value))}
                        placeholder="(16) 99999-9999" maxLength={15} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input className={inputCls} type="email" value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="joao@email.com" />
                  </div>
                </div>
              )}

              {/* STEP: Proposta de valor */}
              {step === 'proposta' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: '#C9A84C' }} /> Proposta de Valor
                  </h3>
                  {propertyPrice && (
                    <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#f8f6f1' }}>
                      <span className="text-gray-500">Preço de tabela: </span>
                      <span className="font-bold" style={{ color: '#1B2B5B' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(propertyPrice)}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Valor da proposta *</label>
                    <input className={inputCls} value={form.valorProposta}
                      onChange={e => set('valorProposta', formatCurrency(e.target.value))}
                      placeholder="R$ 0,00" />
                  </div>
                  <div>
                    <label className={labelCls}>Forma de pagamento *</label>
                    <select className={inputCls} value={form.formaPagamento} onChange={e => set('formaPagamento', e.target.value)}>
                      <option value="">Selecionar...</option>
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  {(form.formaPagamento === 'FINANCIAMENTO' || form.formaPagamento === 'FGTS') && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Entrada (R$)</label>
                          <input className={inputCls} value={form.entradaValor}
                            onChange={e => set('entradaValor', formatCurrency(e.target.value))}
                            placeholder="R$ 0,00" />
                        </div>
                        {form.formaPagamento === 'FGTS' && (
                          <div>
                            <label className={labelCls}>FGTS (R$)</label>
                            <input className={inputCls} value={form.entradaFGTS}
                              onChange={e => set('entradaFGTS', formatCurrency(e.target.value))}
                              placeholder="R$ 0,00" />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Banco preferido</label>
                          <select className={inputCls} value={form.bancoFinanciamento} onChange={e => set('bancoFinanciamento', e.target.value)}>
                            <option value="">Selecionar...</option>
                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Prazo (anos)</label>
                          <select className={inputCls} value={form.prazoFinanciamento} onChange={e => set('prazoFinanciamento', e.target.value)}>
                            {[10, 15, 20, 25, 30, 35].map(y => <option key={y} value={y}>{y} anos</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className={labelCls}>Observações</label>
                    <textarea className={inputCls} rows={3} value={form.observacoes}
                      onChange={e => set('observacoes', e.target.value)}
                      placeholder="Informações adicionais sobre sua proposta..." />
                  </div>
                </div>
              )}

              {/* STEP: Permuta */}
              {step === 'permuta' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Home className="w-4 h-4" style={{ color: '#C9A84C' }} /> Permuta (opcional)
                  </h3>
                  <p className="text-xs text-gray-500">Possui imóvel ou veículo para oferecer como parte do pagamento?</p>

                  {/* Imóvel para permuta */}
                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#e8e4dc' }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.temPermutaImovel}
                        onChange={e => set('temPermutaImovel', e.target.checked)}
                        className="w-4 h-4 rounded accent-[#C9A84C]" />
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-gray-500" /> Imóvel para permuta
                      </span>
                    </label>
                    {form.temPermutaImovel && (
                      <div className="space-y-3 pt-2 border-t" style={{ borderColor: '#f0ece4' }}>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Tipo</label>
                            <select className={inputCls} value={form.permutaImovelTipo} onChange={e => set('permutaImovelTipo', e.target.value)}>
                              <option value="">Tipo...</option>
                              {['Casa', 'Apartamento', 'Terreno', 'Sala comercial', 'Galpão', 'Outro'].map(t =>
                                <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Cidade</label>
                            <input className={inputCls} value={form.permutaImovelCidade}
                              onChange={e => set('permutaImovelCidade', e.target.value)} placeholder="São Paulo, SP" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Descrição</label>
                          <textarea className={inputCls} rows={2} value={form.permutaImovelDescricao}
                            onChange={e => set('permutaImovelDescricao', e.target.value)}
                            placeholder="Ex: Casa 3 quartos, 150m², bairro Centro" />
                        </div>
                        <div>
                          <label className={labelCls}>Valor estimado</label>
                          <input className={inputCls} value={form.permutaImovelValor}
                            onChange={e => set('permutaImovelValor', formatCurrency(e.target.value))}
                            placeholder="R$ 0,00" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Veículo para permuta */}
                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#e8e4dc' }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.temPermutaVeiculo}
                        onChange={e => set('temPermutaVeiculo', e.target.checked)}
                        className="w-4 h-4 rounded accent-[#C9A84C]" />
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-gray-500" /> Veículo para permuta
                      </span>
                    </label>
                    {form.temPermutaVeiculo && (
                      <div className="space-y-3 pt-2 border-t" style={{ borderColor: '#f0ece4' }}>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Tipo</label>
                            <select className={inputCls} value={form.permutaVeiculoTipo} onChange={e => set('permutaVeiculoTipo', e.target.value)}>
                              <option value="">Tipo...</option>
                              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Ano</label>
                            <input className={inputCls} value={form.permutaVeiculoAno}
                              onChange={e => set('permutaVeiculoAno', e.target.value.replace(/\D/g,'').slice(0,4))}
                              placeholder="2020" maxLength={4} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Marca</label>
                            <input className={inputCls} value={form.permutaVeiculoMarca}
                              onChange={e => set('permutaVeiculoMarca', e.target.value)} placeholder="Toyota" />
                          </div>
                          <div>
                            <label className={labelCls}>Modelo</label>
                            <input className={inputCls} value={form.permutaVeiculoModelo}
                              onChange={e => set('permutaVeiculoModelo', e.target.value)} placeholder="Hilux SW4" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Valor estimado (FIPE)</label>
                          <input className={inputCls} value={form.permutaVeiculoValor}
                            onChange={e => set('permutaVeiculoValor', formatCurrency(e.target.value))}
                            placeholder="R$ 0,00" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP: Confirmação */}
              {step === 'confirmacao' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#C9A84C' }} /> Confirmar Proposta
                  </h3>
                  <div className="rounded-xl p-4 space-y-2.5 text-sm" style={{ backgroundColor: '#f8f6f1' }}>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Imóvel:</span>
                      <span className="font-semibold text-gray-800 text-right max-w-[60%] line-clamp-1">{propertyTitle}</span>
                    </div>
                    {propertyReference && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Código:</span>
                        <span className="font-semibold text-gray-800">{propertyReference}</span>
                      </div>
                    )}
                    <div className="border-t pt-2" style={{ borderColor: '#e8e4dc' }}>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Comprador:</span>
                        <span className="font-semibold text-gray-800">{form.nome}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Telefone:</span>
                        <span className="font-semibold text-gray-800">{form.telefone}</span>
                      </div>
                      {form.cpf && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">CPF:</span>
                          <span className="font-semibold text-gray-800">{form.cpf}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-2" style={{ borderColor: '#e8e4dc' }}>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Proposta:</span>
                        <span className="font-bold" style={{ color: '#1B2B5B' }}>{form.valorProposta || '(não informado)'}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Pagamento:</span>
                        <span className="font-semibold text-gray-800">
                          {PAYMENT_METHODS.find(m => m.value === form.formaPagamento)?.label || '(não informado)'}
                        </span>
                      </div>
                    </div>
                    {(form.temPermutaImovel || form.temPermutaVeiculo) && (
                      <div className="border-t pt-2" style={{ borderColor: '#e8e4dc' }}>
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Permuta:</span>
                        {form.temPermutaImovel && (
                          <p className="text-gray-700 mt-1">🏠 Imóvel: {form.permutaImovelDescricao || form.permutaImovelTipo} — {form.permutaImovelValor}</p>
                        )}
                        {form.temPermutaVeiculo && (
                          <p className="text-gray-700 mt-1">🚗 {form.permutaVeiculoMarca} {form.permutaVeiculoModelo} {form.permutaVeiculoAno} — {form.permutaVeiculoValor}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ao enviar esta proposta, você concorda que a Imobiliária Lemos entrará em contato para negociação.
                    Esta proposta não constitui contrato e está sujeita à aprovação do proprietário.
                  </p>
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 p-5 border-t" style={{ borderColor: '#f0ece4' }}>
              {stepIndex > 0 ? (
                <button
                  onClick={() => setStep(STEPS[stepIndex - 1])}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e8e4dc', color: '#1B2B5B' }}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              )}

              {step !== 'confirmacao' ? (
                <button
                  onClick={() => {
                    if (step === 'dados' && (!form.nome || !form.telefone)) {
                      setError('Preencha nome e telefone para continuar.')
                      return
                    }
                    setError('')
                    setStep(STEPS[stepIndex + 1])
                  }}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  {loading ? 'Enviando...' : '✓ Enviar Proposta'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
