'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, Receipt, CheckCircle, Clock, AlertCircle,
  Mail, MessageCircle, Plus, X, Printer, ChevronDown,
  RotateCcw, Calendar,
} from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers as any) },
    credentials: 'include',
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro') }
  if (res.status === 204) return null
  return res.json()
}

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  PAID:    { label: 'Pago',      icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50' },
  PENDING: { label: 'Pendente',  icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LATE:    { label: 'Atrasado',  icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50' },
}

// ── Dar Baixa Modal ───────────────────────────────────────────────────────────
function DarBaixaModal({
  rental,
  token,
  onClose,
}: {
  rental: any
  token: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState(String(rental.totalAmount ?? rental.rentAmount ?? ''))
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [bankName, setBankName] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [payObs, setPayObs] = useState('')
  const [paid, setPaid] = useState(false)
  const [paidRentalId, setPaidRentalId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const payMutation = useMutation({
    mutationFn: () =>
      financeApi.pagarAluguel(token, rental.id, {
        paymentDate: payDate,
        paidAmount: paidAmount ? Number(paidAmount) : undefined,
        paymentMethod,
        bankName: bankName || undefined,
        docNumber: docNumber || undefined,
        observations: payObs || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-rentals'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      setPaid(true)
      setPaidRentalId(rental.id)
      setMsg({ type: 'success', text: 'Pagamento registrado com sucesso!' })
    },
    onError: (e: any) => setMsg({ type: 'error', text: e.message }),
  })

  const handlePrint = async () => {
    try {
      const data = await apiFetch(`/api/v1/finance/rentals/${rental.id}/recibo`, token)
      if (data?.reciboUrl) {
        window.open(data.reciboUrl, '_blank')
      } else {
        window.print()
      }
    } catch {
      window.print()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Dar Baixa no Aluguel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Rental info */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <p className="font-medium text-gray-900">
              {rental.contract?.tenant?.name ?? rental.contract?.tenantName ?? 'Inquilino'}
            </p>
            <p className="text-gray-500 text-xs">{rental.contract?.propertyAddress ?? '—'}</p>
            <p className="text-blue-600 font-semibold">{fmt(rental.totalAmount ?? rental.rentAmount)}</p>
          </div>

          {!paid ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Data do pagamento</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor recebido</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  placeholder={fmt(rental.totalAmount ?? rental.rentAmount)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
                  <option value="DEPOSITO">Depósito em Conta</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARTAO_DEBITO">Cartão Débito</option>
                  <option value="CARTAO_CREDITO">Cartão Crédito</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Banco / Instituição</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="Ex: Bradesco, Nubank..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nº Documento / Comprovante</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    placeholder="Nº do comprovante"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Observações</label>
                <textarea
                  value={payObs}
                  onChange={e => setPayObs(e.target.value)}
                  rows={2}
                  placeholder="Observações sobre o pagamento..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {msg && (
                <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {msg.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => payMutation.mutate()}
                  disabled={payMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {payMutation.isPending ? 'Registrando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Pagamento registrado com sucesso!
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Recibo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Email Modal ───────────────────────────────────────────────────────────────
function EmailModal({ rental, token, onClose }: { rental: any; token: string; onClose: () => void }) {
  const [email, setEmail] = useState(rental.contract?.tenant?.email ?? '')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) { setMsg({ type: 'error', text: 'Informe o email' }); return }
    setLoading(true)
    try {
      await apiFetch(`/api/v1/finance/rentals/${rental.id}/send-email`, token, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMsg({ type: 'success', text: 'Email enviado com sucesso!' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Enviar por Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email do destinatário</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="inquilino@email.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {msg && (
            <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {msg.text}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── WhatsApp Modal ────────────────────────────────────────────────────────────
function WhatsAppModal({ rental, token, onClose }: { rental: any; token: string; onClose: () => void }) {
  const [phone, setPhone] = useState(rental.contract?.tenant?.phone ?? '')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!phone.trim()) { setMsg({ type: 'error', text: 'Informe o telefone' }); return }
    setLoading(true)
    try {
      await apiFetch(`/api/v1/finance/rentals/${rental.id}/send-whatsapp`, token, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      })
      setMsg({ type: 'success', text: 'Mensagem WhatsApp enviada!' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Enviar por WhatsApp</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefone do destinatário</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          {msg && (
            <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {msg.text}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Nova Cobrança Avulsa Modal ────────────────────────────────────────────────
function NovaCobrancaModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [contractId, setContractId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [billingType, setBillingType] = useState<'BOLETO' | 'PIX'>('PIX')
  const [result, setResult] = useState<any>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: contractsData } = useQuery({
    queryKey: ['finance-contracts-select'],
    queryFn: () => financeApi.contracts(token, { status: 'ACTIVE', limit: '100' }),
  })
  const contracts = contractsData?.data ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractId) { setMsg({ type: 'error', text: 'Selecione um contrato' }); return }
    if (!amount || !dueDate) { setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios' }); return }
    setLoading(true)
    try {
      const data = await apiFetch('/api/v1/finance/charges', token, {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          description,
          amount: Number(amount),
          dueDate,
          billingType,
        }),
      })
      setResult(data)
      setMsg({ type: 'success', text: 'Cobrança criada com sucesso!' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">Nova Cobrança Avulsa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Contrato *</label>
            <select
              value={contractId}
              onChange={e => setContractId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Selecione um contrato...</option>
              {contracts.map((c: any) => (
                <option key={c.id} value={c.id}>
                  #{c.legacyId} — {c.tenant?.name ?? c.tenantName ?? 'Inquilino'} | {c.propertyAddress ?? '—'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Descrição</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Multa por atraso, taxa condominial..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Vencimento *</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Forma de cobrança</label>
            <div className="flex gap-2">
              {(['BOLETO', 'PIX'] as const).map(bt => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setBillingType(bt)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                    billingType === bt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {bt === 'BOLETO' ? 'Boleto' : 'PIX'}
                </button>
              ))}
            </div>
          </div>

          {msg && (
            <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {msg.text}
            </div>
          )}

          {result && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {result.boletoUrl && (
                <a href={result.boletoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline font-medium">
                  Abrir Boleto
                </a>
              )}
              {result.pixCode && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Código PIX:</p>
                  <code className="text-xs break-all bg-white border border-gray-200 rounded p-2 block">{result.pixCode}</code>
                </div>
              )}
              {result.pixQrCode && (
                <img src={result.pixQrCode} alt="QR Code PIX" className="w-32 h-32 mx-auto" />
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              {result ? 'Fechar' : 'Cancelar'}
            </button>
            {!result && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Cobrança'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CobrancasPage() {
  const token = useAuthStore(s => s.accessToken)
  const qc = useQueryClient()

  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('LATE')
  const [page, setPage]       = useState(1)
  const [month, setMonth]     = useState('')  // YYYY-MM, vazio = todos
  // Modal state
  const [baixaRental, setBaixaRental]         = useState<any>(null)
  const [emailRental, setEmailRental]         = useState<any>(null)
  const [whatsappRental, setWhatsappRental]   = useState<any>(null)
  const [showNovaCobranca, setShowNovaCobranca] = useState(false)
  const [estornando, setEstornando]           = useState<string | null>(null)

  const params: Record<string, string> = { page: String(page), limit: '30' }
  if (status) params.status = status
  if (search) params.search = search

  // Se mês selecionado, usa endpoint by-month; caso contrário usa rentals geral
  const { data, isLoading } = useQuery({
    queryKey: ['finance-rentals', page, status, search, month],
    queryFn:  () => month
      ? financeApi.rentalsByMonth(token!, { ...params, month })
      : financeApi.rentals(token!, params),
    enabled:  !!token,
  })

  const handleEstorno = async (rentalId: string) => {
    if (!token) return
    if (!confirm('Confirmar estorno deste pagamento? O aluguel voltará para PENDENTE.')) return
    setEstornando(rentalId)
    try {
      await financeApi.estornarAluguel(token, rentalId)
      qc.invalidateQueries({ queryKey: ['finance-rentals'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    } catch (e: any) {
      alert('Erro ao estornar: ' + e.message)
    } finally {
      setEstornando(null)
    }
  }

  const rentals = data?.data ?? []
  const meta    = data?.meta

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-yellow-50">
          <Receipt className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emissão de Cobranças</h1>
          <p className="text-sm text-gray-500">Aluguéis pendentes, atrasados e pagos</p>
        </div>
        {meta && (
          <span className="ml-auto text-sm text-gray-400 mr-2">{meta.total} registros</span>
        )}
        <button
          onClick={() => setShowNovaCobranca(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1B2B5B' }}
        >
          <Plus className="w-4 h-4" />
          Nova Cobrança Avulsa
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'LATE',    label: 'Em Atraso',  color: 'bg-red-600 text-white',    inactive: 'bg-red-50 text-red-700 hover:bg-red-100' },
          { id: 'PENDING', label: 'Pendentes',   color: 'bg-yellow-500 text-white', inactive: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
          { id: 'PAID',    label: 'Pagos',       color: 'bg-green-600 text-white',  inactive: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { id: '',        label: 'Todos',       color: 'bg-gray-700 text-white',   inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatus(tab.id); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${status === tab.id ? tab.color : tab.inactive}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros: Mês + Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-shrink-0">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="month"
            value={month}
            onChange={e => { setMonth(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            title="Filtrar por mês"
          />
        </div>
        <SearchInputWithVoice
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          onVoiceResult={(t) => { setSearch(t); setPage(1) }}
          placeholder="Buscar inquilino, proprietário, endereço..."
          className="flex-1 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum aluguel encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rentals.map((r: any) => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING
            const Icon = cfg.icon
            return (
              <div key={r.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${r.status === 'LATE' ? 'border-red-100' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {r.contract?.legacyId && (
                        <span className="text-xs text-gray-400 font-mono">#{r.contract.legacyId}</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 truncate">
                      {r.contract?.tenant?.name ?? r.contract?.tenantName ?? 'Inquilino'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{r.contract?.propertyAddress ?? '—'}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Venc.: {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}</span>
                      {r.paymentDate && <span>Pago: {new Date(r.paymentDate).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className={`text-lg font-bold ${cfg.color}`}>{fmt(r.totalAmount ?? r.rentAmount)}</p>
                    {r.contract?.id && (
                      <Link href={`/dashboard/contratos/${r.contract.id}`} className="text-xs text-blue-500 hover:underline">
                        Ver contrato
                      </Link>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Dar Baixa */}
                      {(r.status === 'PENDING' || r.status === 'LATE') && (
                        <button
                          onClick={() => setBaixaRental(r)}
                          className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-100 font-medium transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Dar Baixa
                        </button>
                      )}
                      {/* Estorno */}
                      {r.status === 'PAID' && (
                        <button
                          onClick={() => handleEstorno(r.id)}
                          disabled={estornando === r.id}
                          title="Estornar pagamento"
                          className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 font-medium transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {estornando === r.id ? '...' : 'Estornar'}
                        </button>
                      )}
                      {/* Email */}
                      <button
                        onClick={() => setEmailRental(r)}
                        title="Enviar por Email"
                        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </button>
                      {/* WhatsApp */}
                      <button
                        onClick={() => setWhatsappRental(r)}
                        title="Enviar por WhatsApp"
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-100 font-medium transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {baixaRental && token && (
        <DarBaixaModal rental={baixaRental} token={token} onClose={() => setBaixaRental(null)} />
      )}
      {emailRental && token && (
        <EmailModal rental={emailRental} token={token} onClose={() => setEmailRental(null)} />
      )}
      {whatsappRental && token && (
        <WhatsAppModal rental={whatsappRental} token={token} onClose={() => setWhatsappRental(null)} />
      )}
      {showNovaCobranca && token && (
        <NovaCobrancaModal token={token} onClose={() => setShowNovaCobranca(false)} />
      )}
    </div>
  )
}
