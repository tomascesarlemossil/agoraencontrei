'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Loader2, Search, Power, PauseCircle, XCircle,
  CheckCircle2, ExternalLink, RefreshCw, KeyRound, Copy, Check, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  plan: string;
  planStatus: string;
  planPrice?: number | null;
  isActive: boolean;
  propertyCount?: number;
  totalCommission?: number;
  createdAt: string;
  settings?: { customerEmail?: string } | null;
}

interface ResetResult {
  email: string;
  setupLink: string;
  emailSent: boolean;
  whatsappSent: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  TRIAL:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  ACTIVE:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PAST_DUE:  'bg-orange-500/15 text-orange-300 border-orange-500/30',
  SUSPENDED: 'bg-red-500/15 text-red-300 border-red-500/30',
  CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const PLANS = ['LITE', 'PRO', 'ENTERPRISE'];

export default function AdminTenantsPage() {
  const { getValidToken } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Modal "Reenviar acesso"
  const [resetTenant, setResetTenant] = useState<Tenant | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const notify = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`${API_URL}/api/v1/master/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao carregar tenants');
      const json = await res.json();
      setTenants(json.data ?? []);
    } catch (e) {
      notify((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }, [getValidToken, notify]);

  useEffect(() => { load(); }, [load]);

  // Generic action runner — re-fetches the list afterwards.
  const runAction = useCallback(async (
    id: string,
    label: string,
    request: (token: string) => Promise<Response>,
  ) => {
    setBusyId(id);
    try {
      const token = await getValidToken();
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      const res = await request(token);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Falha ao ${label}`);
      }
      notify(`${label} concluído.`, true);
      await load();
    } catch (e) {
      notify((e as Error).message, false);
    } finally {
      setBusyId(null);
    }
  }, [getValidToken, notify, load]);

  const activate = (t: Tenant) => runAction(t.id, 'ativar', (token) =>
    fetch(`${API_URL}/api/v1/tenants/${t.id}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    }));

  const suspend = (t: Tenant) => {
    if (!confirm(`Suspender o site "${t.name}"? O site sairá do ar até ser reativado.`)) return;
    runAction(t.id, 'suspender', (token) =>
      fetch(`${API_URL}/api/v1/tenants/${t.id}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }));
  };

  const cancel = (t: Tenant) => {
    if (!confirm(`Cancelar o tenant "${t.name}"? O site é desativado mas os dados são preservados.`)) return;
    runAction(t.id, 'cancelar', (token) =>
      fetch(`${API_URL}/api/v1/tenants/${t.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }));
  };

  const changePlan = (t: Tenant, plan: string) => {
    if (plan === t.plan) return;
    runAction(t.id, `mudar plano para ${plan}`, (token) =>
      fetch(`${API_URL}/api/v1/master/tenant/${t.id}/config`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      }));
  };

  const openReset = (t: Tenant) => {
    setResetTenant(t);
    setResetEmail('');
    setResetResult(null);
    setResetError(null);
    setCopied(false);
  };

  const closeReset = () => {
    setResetTenant(null);
    setResetLoading(false);
  };

  const submitReset = async () => {
    if (!resetTenant) return;
    setResetLoading(true);
    setResetError(null);
    setResetResult(null);
    try {
      const token = await getValidToken();
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      const newEmail = resetEmail.trim();
      const res = await fetch(`${API_URL}/api/v1/master/tenant/${resetTenant.id}/reset-access`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmail ? { newEmail } : {}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || 'Falha ao gerar link de acesso');
      }
      setResetResult({
        email: body.email,
        setupLink: body.setupLink,
        emailSent: !!body.emailSent,
        whatsappSent: !!body.whatsappSent,
      });
      await load();
    } catch (e) {
      setResetError((e as Error).message);
    } finally {
      setResetLoading(false);
    }
  };

  const copyLink = async () => {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.setupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify('Não foi possível copiar automaticamente. Selecione o link manualmente.', false);
    }
  };

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase().trim();
    return !q || t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${
          toast.ok ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100'
                   : 'bg-red-900/90 border-red-500/40 text-red-100'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 flex items-center gap-3">
          <Building2 size={26} className="text-amber-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Parceiros & Tenants</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400 line-clamp-1">
              Ative, suspenda, cancele e altere o plano de cada site parceiro
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs sm:text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} /> <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou subdomínio..."
            className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-amber-400" />
            <span className="ml-3 text-sm text-gray-400">Carregando tenants...</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">Nenhum tenant encontrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60 text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Imóveis</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((t) => {
                  const busy = busyId === t.id;
                  const cancelled = t.planStatus === 'CANCELLED';
                  return (
                    <tr key={t.id} className="hover:bg-gray-900/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{t.name}</div>
                        <a
                          href={`https://${t.customDomain || `${t.subdomain}.agoraencontrei.com.br`}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400"
                        >
                          {t.customDomain || `${t.subdomain}.agoraencontrei.com.br`}
                          <ExternalLink size={11} />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={PLANS.includes(t.plan) ? t.plan : ''}
                          onChange={(e) => changePlan(t, e.target.value)}
                          disabled={busy || cancelled}
                          className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                        >
                          {!PLANS.includes(t.plan) && <option value="">{t.plan}</option>}
                          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[t.planStatus] ?? STATUS_STYLES.CANCELLED
                        }`}>
                          {t.planStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{t.propertyCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {busy && <Loader2 size={14} className="animate-spin text-amber-400" />}
                          <button
                            onClick={() => openReset(t)}
                            disabled={busy}
                            title="Reenviar acesso (trocar e-mail / gerar link de senha)"
                            className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            <KeyRound size={13} /> Reenviar acesso
                          </button>
                          {t.planStatus !== 'ACTIVE' && !cancelled && (
                            <button
                              onClick={() => activate(t)}
                              disabled={busy}
                              title="Ativar"
                              className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} /> Ativar
                            </button>
                          )}
                          {t.planStatus === 'ACTIVE' && (
                            <button
                              onClick={() => suspend(t)}
                              disabled={busy}
                              title="Suspender"
                              className="flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-xs text-orange-300 hover:bg-orange-500/20 disabled:opacity-50"
                            >
                              <PauseCircle size={13} /> Suspender
                            </button>
                          )}
                          {cancelled ? (
                            <button
                              onClick={() => activate(t)}
                              disabled={busy}
                              title="Reativar"
                              className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <Power size={13} /> Reativar
                            </button>
                          ) : (
                            <button
                              onClick={() => cancel(t)}
                              disabled={busy}
                              title="Cancelar"
                              className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <XCircle size={13} /> Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-600">
          {filtered.length} tenant(s). Suspender tira o site do ar temporariamente;
          cancelar desativa de forma permanente preservando os dados.
        </p>
      </div>

      {/* Modal — Reenviar acesso */}
      {resetTenant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeReset}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-amber-400 flex-shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-white">Reenviar acesso</h2>
                  <p className="text-xs text-gray-400">{resetTenant.name}</p>
                </div>
              </div>
              <button
                onClick={closeReset}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-800 hover:text-white"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {!resetResult ? (
              <>
                <div className="mb-4 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
                  <p className="text-xs text-gray-500">E-mail atual do parceiro</p>
                  <p className="text-sm text-gray-200 break-all">
                    {resetTenant.settings?.customerEmail || '(não definido)'}
                  </p>
                </div>

                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Novo e-mail (deixe vazio para manter)
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="novo@email.com"
                  autoComplete="off"
                  className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                  style={{ fontSize: '16px' }}
                />

                {resetError && (
                  <p className="mb-3 rounded-lg border border-red-500/40 bg-red-900/30 px-3 py-2 text-xs text-red-200">
                    {resetError}
                  </p>
                )}

                <button
                  onClick={submitReset}
                  disabled={resetLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-950 hover:bg-amber-400 disabled:opacity-60"
                >
                  {resetLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Gerando...</>
                    : <><KeyRound size={16} /> Gerar link de acesso</>}
                </button>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
                  O link permite ao parceiro definir a senha e acessar a conta.
                  Ele aparece aqui para você copiar e enviar — funciona mesmo sem e-mail/WhatsApp configurados.
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-2">
                  <p className="text-xs text-emerald-200">
                    Link gerado para <span className="font-semibold break-all">{resetResult.email}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-300/80">
                    {resetResult.emailSent && resetResult.whatsappSent
                      ? 'Enviado por e-mail e WhatsApp.'
                      : resetResult.emailSent
                        ? 'Enviado por e-mail.'
                        : resetResult.whatsappSent
                          ? 'Enviado por WhatsApp.'
                          : 'Não enviado automaticamente — copie o link e envie manualmente.'}
                  </p>
                </div>

                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Link de definição de senha
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={resetResult.setupLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:border-amber-500 focus:outline-none"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    onClick={copyLink}
                    title="Copiar link"
                    className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      copied
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
                  </button>
                </div>

                <button
                  onClick={closeReset}
                  className="mt-4 w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
