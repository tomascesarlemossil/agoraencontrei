'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Loader2, Search, Power, PauseCircle, XCircle,
  CheckCircle2, ExternalLink, RefreshCw,
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
    </div>
  );
}
