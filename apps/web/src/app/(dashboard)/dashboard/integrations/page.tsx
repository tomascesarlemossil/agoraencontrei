'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plug, Loader2, Check, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100';

interface Field { key: string; label: string; secret: boolean }
interface Integration {
  provider: string;
  label: string;
  description: string;
  fields: Field[];
  connected: boolean;
  source: 'tenant' | 'platform' | 'none';
  isActive: boolean;
  values: Record<string, string>;
}

const SOURCE_BADGE: Record<string, { text: string; cls: string }> = {
  tenant:   { text: 'Conectado (sua conta)', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  platform: { text: 'Usando padrão da plataforma', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  none:     { text: 'Não configurado', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

export default function IntegrationsPage() {
  const { getValidToken } = useAuth();
  const [items, setItems] = useState<Integration[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`${API_URL}/api/v1/integrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao carregar integrações');
      const json = await res.json();
      const list: Integration[] = json.data ?? [];
      setItems(list);
      setDrafts(Object.fromEntries(list.map(i => [i.provider, { ...i.values }])));
    } catch (e) {
      notify((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }, [getValidToken, notify]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (provider: string) => {
    setBusy(provider);
    try {
      const token = await getValidToken();
      if (!token) throw new Error('Sessão expirada.');
      const res = await fetch(`${API_URL}/api/v1/integrations/${provider}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: drafts[provider] ?? {} }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message || b.error || 'Falha ao salvar');
      }
      notify('Integração salva.', true);
      await load();
    } catch (e) {
      notify((e as Error).message, false);
    } finally {
      setBusy(null);
    }
  }, [getValidToken, drafts, notify, load]);

  const remove = useCallback(async (provider: string) => {
    if (!confirm('Remover suas credenciais? A integração volta a usar o padrão da plataforma.')) return;
    setBusy(provider);
    try {
      const token = await getValidToken();
      if (!token) throw new Error('Sessão expirada.');
      const res = await fetch(`${API_URL}/api/v1/integrations/${provider}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao remover');
      notify('Credenciais removidas.', true);
      await load();
    } catch (e) {
      notify((e as Error).message, false);
    } finally {
      setBusy(null);
    }
  }, [getValidToken, notify, load]);

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

      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 flex items-center gap-3">
          <Plug size={26} className="text-amber-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Integrações</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400 line-clamp-1">
              Conecte suas próprias contas — WhatsApp, Asaas, Cloudinary, e-mail e mais
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

      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((it) => {
              const badge = SOURCE_BADGE[it.source] ?? SOURCE_BADGE.none;
              const isBusy = busy === it.provider;
              const draft = drafts[it.provider] ?? {};
              return (
                <div key={it.provider} className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {it.label}
                        {it.connected && <Check size={15} className="text-emerald-400" />}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-400">{it.description}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {it.fields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                          {f.label}
                        </label>
                        <input
                          type={f.secret ? 'password' : 'text'}
                          value={draft[f.key] ?? ''}
                          onChange={(e) => setDrafts((prev) => ({
                            ...prev,
                            [it.provider]: { ...prev[it.provider], [f.key]: e.target.value },
                          }))}
                          placeholder={f.secret ? '••••••••' : ''}
                          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => save(it.provider)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Salvar
                    </button>
                    {it.source === 'tenant' && (
                      <button
                        onClick={() => remove(it.provider)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Remover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-xs text-gray-600">
          Suas credenciais sobrepõem o padrão da plataforma. Campos secretos são
          mascarados — deixe em branco para manter o valor já salvo.
        </p>
      </div>
    </div>
  );
}
