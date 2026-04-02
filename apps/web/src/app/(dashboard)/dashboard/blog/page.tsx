'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, ExternalLink, X, Save, Loader2, Globe } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const CATEGORIES = [
  { value: '', label: 'Sem categoria' },
  { value: 'mercado', label: 'Mercado Imobiliário' },
  { value: 'imoveis', label: 'Dicas de Imóveis' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'leiloes', label: 'Leilões' },
  { value: 'legislacao', label: 'Legislação' },
  { value: 'noticias', label: 'Notícias' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'prefeitura', label: 'Prefeitura / IPTU' },
]

const SUGGESTED_KEYWORDS = [
  'imóveis franca', 'casas franca', 'apartamentos franca', 'terrenos franca',
  'imobiliária franca', 'aluguel franca', 'comprar imóvel franca',
  'financiamento imobiliário', 'caixa econômica federal', 'minha casa minha vida',
  'leilão imóvel', 'leilão judicial', 'ITBI', 'IPTU franca', 'lei do inquilinato',
  'investimento imobiliário', 'renda passiva', 'imóvel comercial franca',
  'administração de imóveis', 'vistoria imóvel', 'contrato locação',
]

type Post = {
  id: string; title: string; slug: string; excerpt?: string; content: string
  coverImage?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string
  category?: string; tags?: string; published: boolean; featured: boolean
  authorName: string; views: number; publishedAt?: string; createdAt: string
}

const EMPTY_POST: Partial<Post> = {
  title: '', excerpt: '', content: '', category: '', tags: '', coverImage: '',
  seoTitle: '', seoDescription: '', seoKeywords: '', published: false, featured: false,
  authorName: 'Equipe Imobiliária Lemos',
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') ?? ''
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Post> | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [tab, setTab] = useState<'content' | 'seo'>('content')

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/blog/admin/posts?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setPosts(data.data ?? [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  async function savePost() {
    if (!editing?.title?.trim()) return
    setSaving(true)
    try {
      const method = editing.id ? 'PATCH' : 'POST'
      const url = editing.id ? `${API_URL}/api/v1/blog/${editing.id}` : `${API_URL}/api/v1/blog`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(editing),
      })
      if (res.ok) { setEditing(null); fetchPosts() }
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  async function togglePublished(post: Post) {
    await fetch(`${API_URL}/api/v1/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ published: !post.published }),
    })
    fetchPosts()
  }

  async function deletePost(id: string) {
    setDeleting(id)
    await fetch(`${API_URL}/api/v1/blog/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setDeleting(null)
    fetchPosts()
  }

  function field(key: keyof Post) {
    return {
      value: (editing?.[key] ?? '') as string,
      onChange: (e: any) => setEditing(prev => ({ ...prev, [key]: e.target.value })),
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog</h1>
          <p className="text-white/60 text-sm mt-0.5">Gerencie artigos e conteúdo para SEO</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY_POST })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
          style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
        >
          <Plus className="w-4 h-4" /> Novo Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white/40" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum post criado ainda.</p>
          <p className="text-sm">Crie seu primeiro artigo para alavancar o SEO!</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Título</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium hidden lg:table-cell">Visualizações</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium hidden lg:table-cell">Data</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.featured && <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                      <span className="text-white font-medium line-clamp-1">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 hidden md:table-cell">{post.category || '—'}</td>
                  <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{post.views}</td>
                  <td className="px-4 py-3 text-white/50 hidden lg:table-cell">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(post)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${post.published ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                      {post.published ? <><Eye className="w-3 h-3" /> Publicado</> : <><EyeOff className="w-3 h-3" /> Rascunho</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {post.published && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                        </a>
                      )}
                      <button onClick={() => setEditing(post)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-white/50" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Excluir este post?')) deletePost(post.id) }}
                        disabled={deleting === post.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" /> : <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="bg-[#1a2744] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-bold text-lg text-white">{editing.id ? 'Editar Post' : 'Novo Post'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(['content', 'seo'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-semibold transition-colors ${tab === t ? 'text-white border-b-2 border-yellow-400' : 'text-white/50 hover:text-white/80'}`}
                >
                  {t === 'content' ? 'Conteúdo' : 'SEO & Metadados'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {tab === 'content' ? (
                <>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Título *</label>
                    <input {...field('title')} placeholder="Título do artigo" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60 font-semibold mb-1 block">Categoria</label>
                      <select {...field('category')} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50">
                        {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ backgroundColor: '#1a2744' }}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/60 font-semibold mb-1 block">Autor</label>
                      <input {...field('authorName')} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Tags (separadas por vírgula)</label>
                    <input {...field('tags')} placeholder="imóveis, franca, financiamento" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Imagem de Capa (URL)</label>
                    <input {...field('coverImage')} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Resumo (excerpt)</label>
                    <textarea {...field('excerpt')} rows={2} placeholder="Breve descrição do artigo..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Conteúdo</label>
                    <textarea {...field('content')} rows={12} placeholder="Escreva o conteúdo aqui. Suporte a HTML básico." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50 resize-y font-mono" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Fonte (ex: Valor Econômico)</label>
                    <input {...field('source')} placeholder="Nome da fonte" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">URL da Fonte</label>
                    <input {...field('sourceUrl')} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editing.published ?? false} onChange={e => setEditing(p => ({ ...p, published: e.target.checked }))} className="w-4 h-4" />
                      <span className="text-sm text-white/70">Publicar</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editing.featured ?? false} onChange={e => setEditing(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4" />
                      <span className="text-sm text-white/70">Destaque</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/40 pb-1">Otimize este post para aparecer nos resultados do Google.</p>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Título SEO (max 60 caracteres)</label>
                    <input {...field('seoTitle')} placeholder={editing.title} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50" />
                    <p className="text-xs text-white/30 mt-1">{(editing.seoTitle ?? '').length}/60 caracteres</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Descrição SEO (max 160 caracteres)</label>
                    <textarea {...field('seoDescription')} rows={3} placeholder="Descrição que aparece no Google..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50 resize-none" />
                    <p className="text-xs text-white/30 mt-1">{(editing.seoDescription ?? '').length}/160 caracteres</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 font-semibold mb-1 block">Palavras-chave SEO</label>
                    <input {...field('seoKeywords')} placeholder="imóveis franca, casas franca, ..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50" />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {SUGGESTED_KEYWORDS.map(kw => (
                        <button
                          key={kw}
                          onClick={() => setEditing(p => ({ ...p, seoKeywords: [p?.seoKeywords, kw].filter(Boolean).join(', ') }))}
                          className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/30 transition-colors"
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="p-4 rounded-xl border border-white/10 mt-2" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs text-white/40 mb-2">Prévia no Google:</p>
                    <p className="text-blue-400 text-sm font-medium">{editing.seoTitle ?? editing.title ?? 'Título do artigo'}</p>
                    <p className="text-green-400 text-xs">agoraencontrei.com.br/blog/{editing.slug ?? 'slug-do-post'}</p>
                    <p className="text-white/50 text-xs mt-1">{editing.seoDescription ?? editing.excerpt ?? 'Descrição do artigo aparecerá aqui...'}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-white/10">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button
                onClick={savePost}
                disabled={saving || !editing.title?.trim()}
                className="flex-2 flex-grow flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
