'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100';

type Tab = 'plans' | 'niches' | 'modules' | 'services' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'plans', label: 'Planos' },
  { key: 'niches', label: 'Nichos' },
  { key: 'modules', label: 'Módulos' },
  { key: 'services', label: 'Serviços' },
  { key: 'settings', label: 'Configurações' },
];

const TAB_ENDPOINTS: Record<Tab, string> = {
  plans: '/api/v1/master/config/plans',
  niches: '/api/v1/master/config/niches',
  modules: '/api/v1/master/config/modules',
  services: '/api/v1/master/config/services',
  settings: '/api/v1/master/config/settings',
};

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return { toasts, addToast };
}

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            t.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function api(
  path: string,
  token: string,
  options?: RequestInit,
) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
}

function emptyPlan() {
  return {
    name: '',
    slug: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxProperties: -1,
    maxLeadViews: -1,
    maxUsers: 1,
    features: '[]',
    modules: '[]',
    themes: '[]',
    highlighted: false,
    isActive: true,
  };
}

function emptyNiche() {
  return {
    name: '',
    slug: '',
    tomasPersona: '',
    tomasGreeting: '',
    itemLabel: '',
    defaultTheme: '',
    searchFields: '[]',
    categories: '[]',
    active: true,
  };
}

function emptyModule() {
  return {
    name: '',
    slug: '',
    description: '',
    priceMonthly: 0,
    priceOneTime: 0,
    billingType: 'recurring',
    category: 'feature',
    requiredPlan: '',
    icon: '',
    isActive: true,
  };
}

function emptyService() {
  return {
    name: '',
    slug: '',
    description: '',
    price: 0,
    billingType: 'one_time',
    category: 'service',
    icon: '',
    isActive: true,
  };
}

// ---------------------------------------------------------------------------
// Generic Table helpers
// ---------------------------------------------------------------------------

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  onEdit,
  onDeactivate,
}: {
  columns: Column<T>[];
  rows: T[];
  onEdit: (row: T) => void;
  onDeactivate: (row: T) => void;
}) {
  return (
    <div className="-mx-4 sm:mx-0 overflow-x-auto rounded-none sm:rounded-lg border-y sm:border border-gray-800">
      <table className="min-w-[600px] w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-300 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-300">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-gray-500"
              >
                Nenhum item encontrado.
              </td>
            </tr>
          )}
          {rows.map((row, idx) => (
            <tr
              key={row.id ?? row._id ?? idx}
              className="border-b border-gray-800/60 hover:bg-gray-900/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-200 whitespace-nowrap">
                  {col.render
                    ? col.render(row)
                    : String(row[col.key] ?? '—')}
                </td>
              ))}
              <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onEdit(row)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-amber-400 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDeactivate(row)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
                    title="Desativar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic form modal
// ---------------------------------------------------------------------------

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
}

function FormModal({
  title,
  fields,
  data,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  fields: FieldDef[];
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="relative w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl border border-gray-800 bg-gray-950 p-4 sm:p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.key}
              className={
                f.type === 'textarea'
                  ? 'col-span-1 md:col-span-2'
                  : ''
              }
            >
              <label className="mb-1 block text-xs font-medium text-gray-400">
                {f.label}
              </label>
              {f.type === 'text' && (
                <input
                  type="text"
                  value={data[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                />
              )}
              {f.type === 'number' && (
                <input
                  type="number"
                  value={data[f.key] ?? 0}
                  onChange={(e) =>
                    onChange(f.key, parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                />
              )}
              {f.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={!!data[f.key]}
                  onChange={(e) => onChange(f.key, e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-600 bg-gray-900 text-amber-500 accent-amber-500"
                />
              )}
              {f.type === 'textarea' && (
                <textarea
                  value={data[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono transition-colors"
                />
              )}
              {f.type === 'select' && (
                <select
                  value={data[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">— selecione —</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plans Tab
// ---------------------------------------------------------------------------

const PLAN_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nome', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'description', label: 'Descrição', type: 'text' },
  { key: 'priceMonthly', label: 'Preço Mensal (R$)', type: 'number' },
  { key: 'priceYearly', label: 'Preço Anual (R$)', type: 'number' },
  { key: 'maxProperties', label: 'Max Imóveis (-1 = ilimitado)', type: 'number' },
  { key: 'maxLeadViews', label: 'Max Leads (-1 = ilimitado)', type: 'number' },
  { key: 'maxUsers', label: 'Max Usuários', type: 'number' },
  { key: 'features', label: 'Features (JSON array)', type: 'textarea' },
  { key: 'modules', label: 'Módulos inclusos (JSON array de slugs)', type: 'textarea' },
  { key: 'themes', label: 'Temas permitidos (JSON array)', type: 'textarea' },
  { key: 'highlighted', label: 'Destaque', type: 'checkbox' },
  { key: 'isActive', label: 'Ativo', type: 'checkbox' },
];

const PLAN_COLUMNS: Column<any>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'priceMonthly',
    label: 'Mensal',
    render: (r) => `R$ ${Number(r.priceMonthly ?? 0).toFixed(2)}`,
  },
  {
    key: 'priceYearly',
    label: 'Anual',
    render: (r) => r.priceYearly ? `R$ ${Number(r.priceYearly).toFixed(2)}` : '—',
  },
  {
    key: 'maxProperties',
    label: 'Imóveis',
    render: (r) => r.maxProperties === -1 ? '∞' : String(r.maxProperties ?? 0),
  },
  {
    key: 'highlighted',
    label: 'Destaque',
    render: (r) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          r.highlighted
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-gray-800 text-gray-500'
        }`}
      >
        {r.highlighted ? 'Sim' : 'Não'}
      </span>
    ),
  },
  {
    key: 'isActive',
    label: 'Ativo',
    render: (r) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          r.isActive
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        {r.isActive ? 'Sim' : 'Não'}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Niches Tab
// ---------------------------------------------------------------------------

const NICHE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nome', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'tomasPersona', label: 'Tom Tomás (Persona)', type: 'textarea' },
  { key: 'tomasGreeting', label: 'Saudação Tomás', type: 'text' },
  { key: 'itemLabel', label: 'Item Label', type: 'text' },
  { key: 'defaultTheme', label: 'Tema Padrão', type: 'text' },
  { key: 'searchFields', label: 'Search Fields (JSON)', type: 'textarea' },
  { key: 'categories', label: 'Categorias (JSON)', type: 'textarea' },
  { key: 'active', label: 'Ativo', type: 'checkbox' },
];

const NICHE_COLUMNS: Column<any>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'tomasPersona',
    label: 'Tom Tomás',
    render: (r) => (
      <span className="max-w-[200px] truncate block" title={r.tomasPersona}>
        {r.tomasPersona
          ? r.tomasPersona.length > 40
            ? r.tomasPersona.slice(0, 40) + '...'
            : r.tomasPersona
          : '—'}
      </span>
    ),
  },
  { key: 'itemLabel', label: 'Item Label' },
  { key: 'defaultTheme', label: 'Tema Padrão' },
  {
    key: 'active',
    label: 'Ativo',
    render: (r) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          r.active
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        {r.active ? 'Sim' : 'Não'}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Modules Tab
// ---------------------------------------------------------------------------

const MODULE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nome', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'description', label: 'Descrição', type: 'textarea' },
  { key: 'priceMonthly', label: 'Preço Mensal (R$)', type: 'number' },
  { key: 'priceOneTime', label: 'Preço Avulso (R$)', type: 'number' },
  {
    key: 'billingType',
    label: 'Tipo Cobrança',
    type: 'select',
    options: [
      { value: 'recurring', label: 'Recorrente' },
      { value: 'one_time', label: 'Avulso' },
      { value: 'included', label: 'Incluso no Plano' },
    ],
  },
  {
    key: 'category',
    label: 'Categoria',
    type: 'select',
    options: [
      { value: 'feature', label: 'Feature' },
      { value: 'integration', label: 'Integração' },
      { value: 'ai', label: 'IA' },
      { value: 'design', label: 'Design' },
    ],
  },
  { key: 'requiredPlan', label: 'Plano Mínimo (slug)', type: 'text' },
  { key: 'icon', label: 'Ícone (Lucide)', type: 'text' },
  { key: 'isActive', label: 'Ativo', type: 'checkbox' },
];

const MODULE_COLUMNS: Column<any>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'priceMonthly',
    label: 'Mensal',
    render: (r) => r.priceMonthly ? `R$ ${Number(r.priceMonthly).toFixed(2)}` : '—',
  },
  { key: 'billingType', label: 'Cobrança' },
  { key: 'category', label: 'Categoria' },
  { key: 'requiredPlan', label: 'Plano Mín.' },
  {
    key: 'isActive',
    label: 'Ativo',
    render: (r) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          r.isActive
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        {r.isActive ? 'Sim' : 'Não'}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Services Tab
// ---------------------------------------------------------------------------

const SERVICE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nome', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'description', label: 'Descrição', type: 'textarea' },
  { key: 'price', label: 'Preço (R$)', type: 'number' },
  {
    key: 'billingType',
    label: 'Tipo Cobrança',
    type: 'select',
    options: [
      { value: 'one_time', label: 'Avulso' },
      { value: 'recurring', label: 'Recorrente' },
    ],
  },
  {
    key: 'category',
    label: 'Categoria',
    type: 'select',
    options: [
      { value: 'service', label: 'Serviço' },
      { value: 'consulting', label: 'Consultoria' },
      { value: 'premium', label: 'Premium' },
    ],
  },
  { key: 'icon', label: 'Ícone (Lucide)', type: 'text' },
  { key: 'isActive', label: 'Ativo', type: 'checkbox' },
];

const SERVICE_COLUMNS: Column<any>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'price',
    label: 'Preço',
    render: (r) => `R$ ${Number(r.price ?? 0).toFixed(2)}`,
  },
  { key: 'billingType', label: 'Cobrança' },
  { key: 'category', label: 'Categoria' },
  {
    key: 'isActive',
    label: 'Ativo',
    render: (r) => (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          r.isActive
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        {r.isActive ? 'Sim' : 'Não'}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Settings Section Card
// ---------------------------------------------------------------------------

const SETTINGS_SECTIONS = [
  'seoDefaults',
  'landingContent',
  'billingConfig',
  'featureFlags',
  'brandConfig',
] as const;

const SETTINGS_LABELS: Record<string, string> = {
  seoDefaults: 'SEO Padrão',
  landingContent: 'Conteúdo Landing',
  billingConfig: 'Configuração de Cobrança',
  featureFlags: 'Feature Flags',
  brandConfig: 'Configuração de Marca',
};

function SettingsSection({
  sectionKey,
  value,
  onChange,
}: {
  sectionKey: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (val: string) => {
    onChange(val);
    try {
      JSON.parse(val);
      setError('');
    } catch {
      setError('JSON inválido');
    }
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-900 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
          <span className="text-sm font-semibold text-white">
            {SETTINGS_LABELS[sectionKey] ?? sectionKey}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{sectionKey}</span>
      </button>
      {open && (
        <div className="border-t border-gray-800 px-4 py-3">
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            rows={10}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono transition-colors"
          />
          {error && (
            <p className="mt-1 text-xs text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminMasterPage() {
  const token = useAuthStore((s) => s.accessToken);
  const { toasts, addToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [loading, setLoading] = useState(false);

  // CRUD data
  const [items, setItems] = useState<any[]>([]);

  // Form modal
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings specific
  const [settingsData, setSettingsData] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch items
  // -----------------------------------------------------------------------

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api(TAB_ENDPOINTS[activeTab], token);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (activeTab === 'settings') {
        const data = json.data ?? json;
        const mapped: Record<string, string> = {};
        for (const key of SETTINGS_SECTIONS) {
          mapped[key] =
            data[key] !== undefined
              ? JSON.stringify(data[key], null, 2)
              : '{}';
        }
        setSettingsData(mapped);
      } else {
        const data = Array.isArray(json) ? json : json.data ?? json.items ?? [];
        setItems(data);
      }
    } catch (err: any) {
      addToast(`Erro ao carregar dados: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleCreate = () => {
    const empties: Record<Tab, () => Record<string, any>> = {
      plans: emptyPlan,
      niches: emptyNiche,
      modules: emptyModule,
      services: emptyService,
      settings: () => ({}),
    };
    setEditing(empties[activeTab]());
    setIsNew(true);
  };

  const handleEdit = (row: Record<string, any>) => {
    const clone = { ...row };
    // For niches, serialize array fields for editing
    if (activeTab === 'niches') {
      if (typeof clone.searchFields !== 'string') {
        clone.searchFields = JSON.stringify(clone.searchFields ?? [], null, 2);
      }
      if (typeof clone.categories !== 'string') {
        clone.categories = JSON.stringify(clone.categories ?? [], null, 2);
      }
    }
    // For plans, serialize array fields for editing
    if (activeTab === 'plans') {
      if (typeof clone.features !== 'string') {
        clone.features = JSON.stringify(clone.features ?? [], null, 2);
      }
      if (typeof clone.modules !== 'string') {
        clone.modules = JSON.stringify(clone.modules ?? [], null, 2);
      }
      if (typeof clone.themes !== 'string') {
        clone.themes = JSON.stringify(clone.themes ?? [], null, 2);
      }
      // Ensure decimal fields are numbers
      clone.priceMonthly = Number(clone.priceMonthly ?? 0);
      clone.priceYearly = Number(clone.priceYearly ?? 0);
    }
    // For modules, ensure decimal fields are numbers
    if (activeTab === 'modules') {
      clone.priceMonthly = Number(clone.priceMonthly ?? 0);
      clone.priceOneTime = Number(clone.priceOneTime ?? 0);
    }
    setEditing(clone);
    setIsNew(false);
  };

  const handleDeactivate = async (row: Record<string, any>) => {
    const confirmMsg = `Deseja realmente desativar "${row.name ?? row.slug ?? 'este item'}"?`;
    if (!window.confirm(confirmMsg)) return;
    if (!token) return;

    try {
      const id = row.id ?? row._id;
      const res = await api(
        `${TAB_ENDPOINTS[activeTab]}/${id}`,
        token,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addToast('Item desativado com sucesso.', 'success');
      fetchItems();
    } catch (err: any) {
      addToast(`Erro ao desativar: ${err.message}`, 'error');
    }
  };

  const handleSave = async () => {
    if (!editing || !token) return;
    setSaving(true);

    try {
      const id = editing.id ?? editing._id;
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew
        ? TAB_ENDPOINTS[activeTab]
        : `${TAB_ENDPOINTS[activeTab]}/${id}`;

      // Prepare body: parse JSON fields
      const body = { ...editing };
      if (activeTab === 'niches') {
        try {
          body.searchFields =
            typeof body.searchFields === 'string'
              ? JSON.parse(body.searchFields)
              : body.searchFields;
        } catch {
          addToast('searchFields contém JSON inválido.', 'error');
          setSaving(false);
          return;
        }
        try {
          body.categories =
            typeof body.categories === 'string'
              ? JSON.parse(body.categories)
              : body.categories;
        } catch {
          addToast('categories contém JSON inválido.', 'error');
          setSaving(false);
          return;
        }
      }
      if (activeTab === 'plans') {
        for (const arrKey of ['features', 'modules', 'themes']) {
          try {
            body[arrKey] =
              typeof body[arrKey] === 'string'
                ? JSON.parse(body[arrKey])
                : (body[arrKey] ?? []);
          } catch {
            addToast(`${arrKey} contém JSON inválido.`, 'error');
            setSaving(false);
            return;
          }
        }
        body.priceMonthly = Number(body.priceMonthly ?? 0);
        body.priceYearly = Number(body.priceYearly ?? 0) || null;
      }
      if (activeTab === 'modules') {
        body.priceMonthly = Number(body.priceMonthly ?? 0) || null;
        body.priceOneTime = Number(body.priceOneTime ?? 0) || null;
      }

      const res = await api(url, token, {
        method,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(
          errBody?.message ?? `HTTP ${res.status}`,
        );
      }

      addToast(
        isNew ? 'Item criado com sucesso!' : 'Item atualizado com sucesso!',
        'success',
      );
      setEditing(null);
      setIsNew(false);
      fetchItems();
    } catch (err: any) {
      addToast(`Erro ao salvar: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (key: string, value: any) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // -----------------------------------------------------------------------
  // Settings save
  // -----------------------------------------------------------------------

  const handleSaveSettings = async () => {
    if (!token) return;
    setSavingSettings(true);

    try {
      // Parse all JSON sections
      const payload: Record<string, any> = {};
      for (const key of SETTINGS_SECTIONS) {
        try {
          payload[key] = JSON.parse(settingsData[key] ?? '{}');
        } catch {
          addToast(`JSON inválido em "${SETTINGS_LABELS[key]}".`, 'error');
          setSavingSettings(false);
          return;
        }
      }

      const res = await api(TAB_ENDPOINTS.settings, token, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message ?? `HTTP ${res.status}`);
      }

      addToast('Configurações salvas com sucesso!', 'success');
    } catch (err: any) {
      addToast(`Erro ao salvar configurações: ${err.message}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // -----------------------------------------------------------------------
  // Field / Column config per tab
  // -----------------------------------------------------------------------

  const fieldsMap: Record<Tab, FieldDef[]> = {
    plans: PLAN_FIELDS,
    niches: NICHE_FIELDS,
    modules: MODULE_FIELDS,
    services: SERVICE_FIELDS,
    settings: [],
  };

  const columnsMap: Record<Tab, Column<any>[]> = {
    plans: PLAN_COLUMNS,
    niches: NICHE_COLUMNS,
    modules: MODULE_COLUMNS,
    services: SERVICE_COLUMNS,
    settings: [],
  };

  const modalTitles: Record<Tab, string> = {
    plans: isNew ? 'Novo Plano' : 'Editar Plano',
    niches: isNew ? 'Novo Nicho' : 'Editar Nicho',
    modules: isNew ? 'Novo Módulo' : 'Editar Módulo',
    services: isNew ? 'Novo Serviço' : 'Editar Serviço',
    settings: '',
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ToastContainer toasts={toasts} />

      {/* Modal */}
      {editing && activeTab !== 'settings' && (
        <FormModal
          title={modalTitles[activeTab]}
          fields={fieldsMap[activeTab]}
          data={editing}
          onChange={handleFormChange}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setIsNew(false);
          }}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShieldAlert size={22} className="text-amber-400 flex-shrink-0 sm:w-7 sm:h-7" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">
                Controle Master
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-400 line-clamp-1">
                Planos, módulos, serviços e configurações da plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <Loader2 size={28} className="animate-spin text-amber-400" />
            <span className="ml-3 text-sm text-gray-400">Carregando...</span>
          </div>
        ) : activeTab === 'settings' ? (
          /* ---------- Settings Tab ---------- */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings size={20} className="text-amber-400" />
                Configurações Globais
              </h2>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                {savingSettings ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Salvar Todas
              </button>
            </div>

            {SETTINGS_SECTIONS.map((key) => (
              <SettingsSection
                key={key}
                sectionKey={key}
                value={settingsData[key] ?? '{}'}
                onChange={(val) =>
                  setSettingsData((prev) => ({ ...prev, [key]: val }))
                }
              />
            ))}
          </div>
        ) : (
          /* ---------- CRUD Tabs ---------- */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h2>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-white hover:bg-amber-500 transition-colors flex-shrink-0"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Criar Novo</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>

            <DataTable
              columns={columnsMap[activeTab]}
              rows={items}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
