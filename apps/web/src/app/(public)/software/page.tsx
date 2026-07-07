'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * /software — página de vendas do Sistema Administrador AgoraEncontrei.
 *
 * Antes era um HTML estático em public/software/index.html, que o Next.js
 * (output: 'standalone') não servia de forma confiável em /software → 404.
 * Agora é uma rota App Router real: mesma decisão clara (Online ☁️ vs Offline 💻),
 * com o checkout offline postando para o proxy same-origin /api/v1/billing/saas/offline-purchase.
 */

type OfflinePlan = {
  id: 'offline-mensal' | 'offline-anual' | 'offline-vitalicia'
  label: string
}

const C = {
  bg: '#0a0e1a',
  panel: '#121829',
  panel2: '#1a2138',
  ink: '#eef2ff',
  muted: '#9aa7c7',
  brand: '#4f7cff',
  brand2: '#22d3a6',
  line: '#26304d',
}

const GLOBAL_CSS = `
  .sw-wrap{max-width:1080px;margin:0 auto;padding:0 20px}
  .sw-btn{display:inline-block;padding:14px 26px;border-radius:999px;font-weight:700;font-size:16px;cursor:pointer;border:none;transition:transform .15s;text-align:center}
  .sw-btn:hover{transform:translateY(-2px)}
  .sw-btn-primary{background:linear-gradient(135deg,${C.brand},${C.brand2});color:#fff;box-shadow:0 10px 30px rgba(79,124,255,.35)}
  .sw-btn-ghost{background:transparent;color:${C.ink};border:1px solid ${C.line}}
  .sw-tag{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.brand2};background:rgba(34,211,166,.1);padding:6px 14px;border-radius:999px;border:1px solid rgba(34,211,166,.25)}
  .sw-decide{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  @media(max-width:760px){.sw-decide{grid-template-columns:1fr}}
  .sw-opt{background:linear-gradient(180deg,${C.panel},${C.panel2});border:1px solid ${C.line};border-radius:20px;padding:34px;text-align:center;display:flex;flex-direction:column}
  .sw-opt .ic{font-size:44px}.sw-opt h3{font-size:24px;margin:10px 0 4px}
  .sw-opt .px{font-size:15px;color:${C.brand2};font-weight:700;margin-bottom:14px}
  .sw-opt ul{list-style:none;text-align:left;margin:6px 0 22px;flex:1;padding:0}
  .sw-opt li{padding:7px 0 7px 28px;position:relative;color:#cfd8f0;font-size:15px}
  .sw-opt li::before{content:"✓";position:absolute;left:0;color:${C.brand2};font-weight:800}
  .sw-opt .who{font-size:13px;color:${C.muted};margin-bottom:18px;min-height:38px}
  .sw-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:stretch}
  @media(max-width:760px){.sw-plans{grid-template-columns:1fr}}
  .sw-plan{background:${C.panel};border:1px solid ${C.line};border-radius:16px;padding:26px;display:flex;flex-direction:column}
  .sw-plan.hot{border-color:${C.brand};box-shadow:0 0 0 1px ${C.brand},0 16px 40px rgba(79,124,255,.18);position:relative}
  .sw-plan.hot .rib{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,${C.brand},${C.brand2});color:#fff;font-size:12px;font-weight:800;padding:4px 14px;border-radius:999px}
  .sw-plan h3{font-size:19px}.sw-plan .tl{color:${C.muted};font-size:13px;min-height:34px}
  .sw-plan .price{font-size:34px;font-weight:800;margin:10px 0 2px}.sw-plan .price small{font-size:15px;color:${C.muted}}
  .sw-plan .obs{color:${C.brand2};font-size:12px;font-weight:700;margin-bottom:14px;min-height:16px}
  .sw-plan ul{list-style:none;margin:6px 0 18px;flex:1;padding:0}
  .sw-plan li{padding:6px 0 6px 24px;position:relative;font-size:14px;color:#cfd8f0}
  .sw-plan li::before{content:"✓";position:absolute;left:0;color:${C.brand2};font-weight:800}
  .sw-plan .sw-btn{width:100%}
  .sw-guide{background:linear-gradient(135deg,rgba(79,124,255,.08),rgba(34,211,166,.06));border:1px solid ${C.line};border-radius:18px;padding:28px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
  @media(max-width:760px){.sw-guide{grid-template-columns:1fr}}
  .sw-guide h4{font-size:17px;margin-bottom:6px}.sw-guide p{color:${C.muted};font-size:14.5px}
  .sw-form input{width:100%;padding:12px 13px;border-radius:10px;border:1px solid ${C.line};background:${C.bg};color:${C.ink};font-size:16px}
  .sw-form label{display:block;font-size:13px;color:${C.muted};margin:10px 0 4px}
`

const OFFLINE_PLANS: { id: OfflinePlan['id']; label: string; hot?: boolean; title: string; tl: string; price: string; unit: string; obs: string; cta: string; feats: string[] }[] = [
  {
    id: 'offline-mensal', label: 'Offline Mensal (R$ 197/mês)', title: 'Mensal',
    tl: 'Comece sem compromisso de longo prazo.', price: 'R$ 197', unit: '/mês',
    obs: 'cobrança recorrente', cta: 'Assinar mensal',
    feats: ['Tudo da edição offline', 'Atualizações + suporte', 'Licença auto-renovável', 'Cancele quando quiser'],
  },
  {
    id: 'offline-anual', label: 'Offline Anual (R$ 1.970/ano)', hot: true, title: 'Anual',
    tl: '2 meses grátis no plano de 12 meses.', price: 'R$ 1.970', unit: '/ano',
    obs: '≈ R$ 164/mês · recorrente', cta: 'Assinar anual',
    feats: ['Tudo do Mensal', 'Economia de ~2 meses', 'Atualizações + suporte', 'Prioridade no suporte'],
  },
  {
    id: 'offline-vitalicia', label: 'Offline Vitalícia (R$ 2.497)', title: 'Vitalícia',
    tl: 'Pague uma vez, use para sempre.', price: 'R$ 2.497', unit: ' único',
    obs: 'pagamento único', cta: 'Comprar vitalícia',
    feats: ['Licença sem mensalidade', '1 ano de atualizações inclusas', 'Suporte opcional depois', 'Ideal para quem prefere comprar'],
  },
]

export default function SoftwarePage() {
  const [plan, setPlan] = useState<OfflinePlan | null>(null)
  const [form, setForm] = useState({ name: '', email: '', cpfCnpj: '', phone: '' })
  const [msg, setMsg] = useState<{ text: string; kind: '' | 'ok' | 'err' }>({ text: '', kind: '' })
  const [loading, setLoading] = useState(false)

  const open = useCallback((p: OfflinePlan) => {
    setPlan(p)
    setMsg({ text: '', kind: '' })
  }, [])
  const close = useCallback(() => setPlan(null), [])

  // Vindo de /parceiros/cadastro (?plan=offline-anual) já abrimos o checkout
  // com o plano escolhido — sem o cliente precisar reencontrar o plano aqui.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('plan')
    const match = OFFLINE_PLANS.find((p) => p.id === id)
    if (match) {
      setPlan({ id: match.id, label: match.label })
      requestAnimationFrame(() => document.getElementById('offline')?.scrollIntoView({ behavior: 'smooth' }))
    }
  }, [])

  const submit = useCallback(async () => {
    const { name, email, cpfCnpj, phone } = form
    if (!name.trim() || !email.trim() || !cpfCnpj.trim()) {
      setMsg({ text: 'Preencha nome, e-mail e CPF/CNPJ.', kind: 'err' })
      return
    }
    setLoading(true)
    setMsg({ text: 'Gerando pagamento...', kind: '' })
    try {
      // same-origin: o Next faz rewrite de /api/v1/* para a API (evita api.* e CORS)
      const r = await fetch('/api/v1/billing/saas/offline-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), cpfCnpj: cpfCnpj.trim(), phone: phone.trim(), plan: plan?.id }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setMsg({ text: d.error || 'Não foi possível gerar a cobrança.', kind: 'err' })
        return
      }
      if (d.recurring) {
        setMsg({ text: '✓ Assinatura criada! O Asaas enviou o boleto/PIX ao seu e-mail.', kind: 'ok' })
      } else if (d.paymentUrl) {
        setMsg({ text: '✓ Cobrança criada! Abrindo o pagamento...', kind: 'ok' })
        setTimeout(() => { window.location.href = d.paymentUrl }, 1200)
      } else {
        setMsg({ text: '✓ Pedido registrado! Verifique seu e-mail.', kind: 'ok' })
      }
    } catch {
      setMsg({ text: 'Erro de conexão. Tente novamente.', kind: 'err' })
    } finally {
      setLoading(false)
    }
  }, [form, plan])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif", lineHeight: 1.6, minHeight: '100vh' }}>
      <style>{GLOBAL_CSS}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)', background: 'rgba(10,14,26,.7)', borderBottom: `1px solid ${C.line}` }}>
        <div className="sw-wrap">
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div style={{ fontWeight: 800, fontSize: 19 }}>
              Sistema Administrador <span style={{ color: C.brand2 }}>AgoraEncontrei</span>
            </div>
            <a href="#decidir" className="sw-btn sw-btn-primary" style={{ padding: '9px 18px', fontSize: 14 }}>Ver opções</a>
          </nav>
        </div>
      </header>

      <section style={{ padding: '72px 0 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="sw-wrap" style={{ position: 'relative' }}>
          <span className="sw-tag">Sistema imobiliário completo</span>
          <h1 style={{ fontSize: 'clamp(32px,5.5vw,52px)', lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.03em', margin: '16px 0' }}>
            Use <em style={{ fontStyle: 'normal', background: `linear-gradient(135deg,${C.brand},${C.brand2})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>na nuvem</em> ou{' '}
            <em style={{ fontStyle: 'normal', background: `linear-gradient(135deg,${C.brand},${C.brand2})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>no seu PC</em>.<br />Você decide.
          </h1>
          <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: C.muted, maxWidth: 620, margin: '0 auto 8px' }}>
            CRM, imóveis, contratos, aluguéis, repasses e cobrança — com a IA Tomás. Assine online em minutos ou instale offline na sua máquina.
          </p>
          <p style={{ marginTop: 18 }}><a href="#decidir" className="sw-btn sw-btn-primary">Escolher minha edição ↓</a></p>
        </div>
      </section>

      <section style={{ padding: '56px 0' }} id="decidir">
        <div className="sw-wrap">
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, textAlign: 'center', marginBottom: 10 }}>Qual é a sua?</h2>
          <p style={{ color: C.muted, textAlign: 'center', maxWidth: 600, margin: '0 auto 40px', fontSize: 17 }}>
            Duas formas de usar o mesmo sistema. Escolha pelo que faz sentido para você.
          </p>
          <div className="sw-decide">
            <div className="sw-opt">
              <div className="ic">☁️</div>
              <h3>Online (na nuvem)</h3>
              <div className="px">a partir de R$ 97/mês</div>
              <p className="who">Para quem quer começar rápido, acessar de qualquer lugar e não se preocupar com TI.</p>
              <ul>
                <li>No ar em minutos, sem instalar nada</li>
                <li>Acesso pelo celular, tablet ou PC</li>
                <li>Atualizações e backup automáticos</li>
                <li>Planos Lite, Pro e Enterprise</li>
              </ul>
              <a href="/parceiros/planos" className="sw-btn sw-btn-primary">Ver planos e assinar online</a>
            </div>
            <div className="sw-opt">
              <div className="ic">💻</div>
              <h3>Offline (no seu PC)</h3>
              <div className="px">a partir de R$ 197/mês</div>
              <p className="who">Para quem quer os dados na própria máquina, trabalhar sem internet ou migrar de um sistema antigo.</p>
              <ul>
                <li>Instalado no Windows, dados locais</li>
                <li>Funciona sem internet no dia a dia</li>
                <li>Importa o backup do seu sistema atual</li>
                <li>Atualizações e suporte inclusos</li>
              </ul>
              <a href="#offline" className="sw-btn sw-btn-ghost">Ver planos offline ↓</a>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '56px 0', background: '#070b16' }} id="offline">
        <div className="sw-wrap">
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, textAlign: 'center', marginBottom: 10 }}>Edição Offline — escolha o plano</h2>
          <p style={{ color: C.muted, textAlign: 'center', maxWidth: 600, margin: '0 auto 40px', fontSize: 17 }}>
            Instalador para Windows, com licença ativada por chave. Pague e receba o link de download + a chave por e-mail.
          </p>
          <div className="sw-plans">
            {OFFLINE_PLANS.map((p) => (
              <div className={`sw-plan${p.hot ? ' hot' : ''}`} key={p.id}>
                {p.hot && <div className="rib">MELHOR VALOR</div>}
                <h3>{p.title}</h3>
                <p className="tl">{p.tl}</p>
                <div className="price">{p.price}<small>{p.unit}</small></div>
                <div className="obs">{p.obs}</div>
                <ul>{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
                <button className={`sw-btn ${p.hot ? 'sw-btn-primary' : 'sw-btn-ghost'}`} onClick={() => open({ id: p.id, label: p.label })}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '56px 0' }}>
        <div className="sw-wrap">
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, textAlign: 'center', marginBottom: 10 }}>Ainda na dúvida?</h2>
          <p style={{ color: C.muted, textAlign: 'center', maxWidth: 600, margin: '0 auto 40px', fontSize: 17 }}>Um guia rápido para não errar.</p>
          <div className="sw-guide">
            <div><h4>☁️ Escolha o Online se…</h4><p>você quer praticidade, acessar de qualquer lugar, atender pelo celular e não cuidar de servidor. Começa barato (R$97) e cresce com você.</p></div>
            <div><h4>💻 Escolha o Offline se…</h4><p>você faz questão de ter os dados na sua máquina, trabalha em local com internet ruim, ou está saindo de um sistema desktop antigo e quer migrar mantendo o controle.</p></div>
          </div>
        </div>
      </section>

      {plan && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,16,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 18 }}
        >
          <div className="sw-form" style={{ width: 420, maxWidth: '100%', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, padding: 28 }}>
            <h3 style={{ fontSize: 20, marginBottom: 4 }}>Comprar: {plan.label}</h3>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>
              Preencha para gerar a cobrança. Ao confirmar o pagamento, a chave + o instalador chegam no seu e-mail.
            </p>
            <label>Nome completo</label>
            <input value={form.name} onChange={set('name')} autoComplete="name" />
            <label>E-mail</label>
            <input value={form.email} onChange={set('email')} type="email" autoComplete="email" />
            <label>CPF ou CNPJ</label>
            <input value={form.cpfCnpj} onChange={set('cpfCnpj')} inputMode="numeric" />
            <label>Telefone (opcional)</label>
            <input value={form.phone} onChange={set('phone')} inputMode="tel" />
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 16 }}>
              <button className="sw-btn sw-btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                {loading ? 'Aguarde...' : 'Gerar pagamento'}
              </button>
              <button className="sw-btn sw-btn-ghost" onClick={close}>Cancelar</button>
            </div>
            <div style={{ marginTop: 12, fontSize: 14, minHeight: 20, color: msg.kind === 'err' ? '#ff8a8a' : msg.kind === 'ok' ? C.brand2 : C.muted }}>
              {msg.text}
            </div>
          </div>
        </div>
      )}

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '30px 0', color: C.muted, fontSize: 14, textAlign: 'center' }}>
        <div className="sw-wrap">
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: C.ink }}>
            Sistema Administrador <span style={{ color: C.brand2 }}>AgoraEncontrei</span>
          </div>
          © 2026 AgoraEncontrei — Imobiliária Lemos. Online ou offline, o controle é seu.
        </div>
      </footer>
    </div>
  )
}
