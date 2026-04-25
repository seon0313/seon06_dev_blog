import { useEffect, useState, useCallback, useRef } from 'react'
import { marked } from 'marked'

marked.use({ breaks: true })

/* ─── Mobile detection ───────────────────────────────── */
function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= bp)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return mobile
}

/* ─── CSS for things JS can't easily reach ───────────── */
function AdminStyles() {
  return (
    <style>{`
      /* table → card (모바일에서만) */
      @media (max-width: 640px) {
        .adm-table, .adm-table tbody { display: block; }
        .adm-table thead  { display: none; }
        .adm-table tr {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          gap: 6px; padding: 16px 0;
          border-bottom: 1px solid var(--line); border-top: none;
        }
        .adm-table td { display: block; padding: 0 !important; border: none !important; }

        /* posts 열 순서 */
        .adm-p-title   { flex: 1 1 calc(100% - 90px); min-width: 0; order: 1; }
        .adm-p-status  { order: 2; flex-shrink: 0; }
        .adm-p-cat     { order: 3; }
        .adm-p-date    { order: 4; font-size: 12px !important; }
        .adm-p-actions { order: 5; flex: 0 0 100%; margin-top: 4px; }
        .adm-p-actions > div { justify-content: flex-start !important; }

        /* categories 열 순서 */
        .adm-c-key     { order: 1; }
        .adm-c-label   { order: 2; flex: 1; font-weight: 500; }
        .adm-c-order   { order: 3; font-size: 12px !important; }
        .adm-c-actions { order: 4; flex: 0 0 100%; margin-top: 4px; }
        .adm-c-actions > div { justify-content: flex-start !important; }
      }
    `}</style>
  )
}

/* ─── API helpers ────────────────────────────────────── */
function adminFetch(path, opts = {}) {
  const token = sessionStorage.getItem('admin_token')
  return fetch(`/api/admin${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  })
}

function toSlug(text) {
  const s = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
  return s || new Date().toISOString().slice(0, 10)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

/* ─── Root ───────────────────────────────────────────── */
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token'))
  function logout() { sessionStorage.removeItem('admin_token'); setToken(null) }
  if (!token) return <><AdminStyles /><AdminLogin onLogin={setToken} /></>
  return <><AdminStyles /><AdminShell onLogout={logout} /></>
}

/* ─── Login ──────────────────────────────────────────── */
function AdminLogin({ onLogin }) {
  const isMobile = useIsMobile()
  const [pw, setPw]           = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/admin/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json()
      if (data.ok) { sessionStorage.setItem('admin_token', data.token); onLogin(data.token) }
      else setError('비밀번호가 틀렸습니다.')
    } catch { setError('서버 오류가 발생했습니다.') }
    finally { setLoading(false) }
  }

  return (
    <div style={S.loginWrap}>
      <div style={{ ...S.loginBox, ...(isMobile ? { width: 'calc(100% - 48px)', padding: '32px 20px' } : {}) }}>
        <div style={S.loginLogo}>YS</div>
        <h1 style={S.loginTitle}>Admin</h1>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="password" placeholder="Password" autoFocus
            value={pw} onChange={e => setPw(e.target.value)} style={S.input} />
          {error && <p style={S.errText}>{error}</p>}
          <button type="submit" disabled={loading} style={S.btnPrimary}>
            {loading ? '...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Shell ──────────────────────────────────────────── */
function AdminShell({ onLogout }) {
  const isMobile                      = useIsMobile()
  const [panel, setPanel]             = useState('posts')
  const [editingSlug, setEditingSlug] = useState(null)
  const goList = () => { setPanel('posts'); setEditingSlug(null) }

  // 사이드바: 데스크톱 = 좌측 고정 / 모바일 = 상단 바
  const sidebarStyle = isMobile
    ? { position: 'fixed', top: 0, left: 0, right: 0, width: '100%', height: 'auto',
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        padding: '10px 14px', gap: '6px',
        background: 'var(--bg)', borderBottom: '1px solid var(--line)', zIndex: 100,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch' }
    : S.sidebar

  const mainStyle = isMobile
    ? { marginLeft: 0, marginTop: '56px', padding: '20px 16px', flex: 1 }
    : S.main

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <aside style={sidebarStyle}>
        {/* 로고: 모바일에서 숨김 */}
        {!isMobile && <div style={S.sidebarLogo}>YS Admin</div>}

        {/* 네비게이션 */}
        <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '2px', flex: 1 }}>
          <SideBtn label="Posts" active={panel === 'posts'}
            onClick={() => { setPanel('posts'); setEditingSlug(null) }} />
          <SideBtn label="Categories" active={panel === 'categories'}
            onClick={() => { setPanel('categories'); setEditingSlug(null) }} />
        </nav>

        {/* 블로그 링크 + 로그아웃 */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column',
          gap: isMobile ? '6px' : '8px', alignItems: isMobile ? 'center' : undefined, flexShrink: 0 }}>
          <a href="#/" style={{ ...S.sideLink, ...(isMobile ? { fontSize: '12px', padding: '6px 8px' } : {}) }}>
            ← 블로그
          </a>
          <button onClick={onLogout}
            style={{ ...S.logoutBtn, ...(isMobile ? { fontSize: '12px', padding: '5px 10px' } : {}) }}>
            로그아웃
          </button>
        </div>
      </aside>

      <main style={mainStyle}>
        {panel === 'posts' && editingSlug === null && (
          <PostsPanel onEdit={slug => setEditingSlug(slug)} onNew={() => setEditingSlug('')} />
        )}
        {panel === 'posts' && editingSlug !== null && (
          <PostEditor slug={editingSlug || null} onDone={goList} />
        )}
        {panel === 'categories' && <CategoriesPanel />}
      </main>
    </div>
  )
}

function SideBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...S.sideItem, ...(active ? S.sideItemActive : {}) }}>
      {label}
    </button>
  )
}

/* ─── Posts Panel ────────────────────────────────────── */
function PostsPanel({ onEdit, onNew }) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await adminFetch('/posts'); const { posts } = await res.json(); setPosts(posts ?? []) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function del(slug, title) {
    if (!confirm(`"${title}" 을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    await adminFetch(`/posts/${slug}`, { method: 'DELETE' }); load()
  }

  async function togglePublish(post) {
    await adminFetch(`/posts/${post.slug}`, {
      method: 'PUT', body: JSON.stringify({ ...post, published: post.published ? 0 : 1 }),
    }); load()
  }

  return (
    <section>
      <div style={S.panelHead}>
        <h2 style={S.panelTitle}>Posts</h2>
        <button onClick={onNew} style={S.btnPrimary}>+ 새 글</button>
      </div>

      {loading ? <p style={S.muted}>불러오는 중...</p>
        : posts.length === 0 ? <div style={S.emptyBox}><p style={S.muted}>게시글이 없습니다.</p></div>
        : (
          <table style={S.table} className="adm-table">
            <thead><tr>
              {['제목 / 슬러그', '카테고리', '상태', '작성일', ''].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.slug} style={S.tr}>
                  <td style={S.td} className="adm-p-title">
                    <span style={{ fontWeight: 500, display: 'block' }}>{p.title}</span>
                    <span style={{ ...S.muted, fontSize: '12px' }}>{p.slug}</span>
                  </td>
                  <td style={S.td} className="adm-p-cat">
                    <span style={S.catChip}>{p.category_key}</span>
                  </td>
                  <td style={S.td} className="adm-p-status">
                    <button onClick={() => togglePublish(p)}
                      style={{ ...S.badge, ...(p.published ? S.badgeOn : S.badgeOff) }}>
                      {p.published ? '발행됨' : '초안'}
                    </button>
                  </td>
                  <td style={{ ...S.td, ...S.muted, fontSize: '13px' }} className="adm-p-date">
                    {fmtDate(p.created_at)}
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }} className="adm-p-actions">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => onEdit(p.slug)} style={S.btnSm}>수정</button>
                      <button onClick={() => del(p.slug, p.title)} style={{ ...S.btnSm, ...S.btnDanger }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  )
}

/* ─── Post Editor ────────────────────────────────────── */
const EMPTY = { slug: '', title: '', excerpt: '', content: '', category_key: '', published: 0 }

function PostEditor({ slug, onDone }) {
  const isMobile                      = useIsMobile()
  const isNew                         = slug === null
  const [form, setForm]               = useState(EMPTY)
  const [categories, setCategories]   = useState([])
  const [preview, setPreview]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [loading, setLoading]         = useState(!isNew)
  const [error, setError]             = useState('')
  const [slugAuto, setSlugAuto]       = useState(isNew)
  const textareaRef                   = useRef(null)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(({ categories }) => {
      const cats = categories.filter(c => c.key !== 'all')
      setCategories(cats)
      if (isNew && cats.length) setForm(f => ({ ...f, category_key: f.category_key || cats[0].key }))
    })
  }, [isNew])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    adminFetch(`/posts/${slug}`).then(r => r.json()).then(({ post }) => {
      if (post) setForm({ slug: post.slug, title: post.title, excerpt: post.excerpt,
        content: post.content, category_key: post.category_key, published: post.published })
    }).finally(() => setLoading(false))
  }, [isNew, slug])

  useEffect(() => {
    if (slugAuto && isNew) setForm(f => ({ ...f, slug: toSlug(f.title) }))
  }, [form.title, slugAuto, isNew])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function onKeyDown(e) {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = textareaRef.current; const s = el.selectionStart
    const next = form.content.slice(0, s) + '  ' + form.content.slice(el.selectionEnd)
    set('content', next)
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
  }

  async function save(publishOverride) {
    setSaving(true); setError('')
    const payload = { ...form, published: publishOverride !== undefined ? publishOverride : form.published }
    try {
      const res  = await adminFetch(isNew ? '/posts' : `/posts/${slug}`,
        { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || '저장 실패')
      onDone()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <p style={S.muted}>불러오는 중...</p>

  return (
    <section>
      {/* Toolbar */}
      <div style={S.panelHead}>
        <h2 style={S.panelTitle}>{isNew ? '새 글 작성' : '글 수정'}</h2>
        <div style={isMobile
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%' }
          : { display: 'flex', gap: '8px', flexWrap: 'wrap' }
        }>
          <button onClick={() => setPreview(p => !p)} style={S.btnSm}>
            {preview ? '✏️ 편집' : '👁 미리보기'}
          </button>
          <button onClick={() => save(0)} disabled={saving} style={S.btnSm}>초안 저장</button>
          <button onClick={() => save(1)} disabled={saving} style={S.btnPrimary}>
            {form.published ? '저장' : '발행'}
          </button>
          <button onClick={onDone}
            style={{ ...S.btnSm, ...S.btnDanger, ...(isMobile ? { gridColumn: '1 / -1' } : {}) }}>
            취소
          </button>
        </div>
      </div>

      {error && <p style={{ ...S.errText, marginBottom: '16px' }}>{error}</p>}

      {/* Meta fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '12px', marginBottom: '20px',
      }}>
        <Field label="제목">
          <input style={S.input} placeholder="제목을 입력하세요"
            value={form.title} onChange={e => set('title', e.target.value)} />
        </Field>
        <Field label={`슬러그 (URL)${slugAuto && isNew ? ' — 자동' : ''}`}>
          <input style={S.input} placeholder="my-post-slug" value={form.slug}
            onChange={e => { setSlugAuto(false); set('slug', e.target.value) }} />
        </Field>
        <Field label="카테고리">
          <select style={S.input} value={form.category_key} onChange={e => set('category_key', e.target.value)}>
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="발행 상태">
          <select style={S.input} value={form.published} onChange={e => set('published', parseInt(e.target.value))}>
            <option value={0}>초안</option>
            <option value={1}>발행됨</option>
          </select>
        </Field>
        <Field label="요약 (글 목록에 표시)" style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
          <input style={S.input} placeholder="한 줄 요약"
            value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />
        </Field>
      </div>

      {/* Editor hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ ...S.muted, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {preview ? 'Preview' : 'Markdown'}
        </span>
        {!preview && !isMobile && <span style={{ ...S.muted, fontSize: '11px' }}>Tab = 2칸 들여쓰기</span>}
      </div>

      {preview ? (
        <div style={{ ...S.previewBox, ...(isMobile ? { minHeight: '300px', padding: '16px' } : {}) }}>
          {form.content
            ? <div className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(form.content) }} />
            : <p style={S.muted}>내용이 없습니다.</p>}
        </div>
      ) : (
        <textarea ref={textareaRef}
          style={{ ...S.textarea, ...(isMobile ? { height: '360px', padding: '14px', fontSize: '13px' } : {}) }}
          value={form.content} onChange={e => set('content', e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={'# 제목\n\n마크다운으로 작성하세요.\n\n## 소제목\n\n내용...'}
          spellCheck={false}
        />
      )}
    </section>
  )
}

function Field({ label, children, style }) {
  return (
    <label style={{ ...S.fieldLabel, ...style }}>
      <span style={S.fieldLabelText}>{label}</span>
      {children}
    </label>
  )
}

/* ─── Categories Panel ───────────────────────────────── */
function CategoriesPanel() {
  const isMobile                    = useIsMobile()
  const [cats, setCats]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [newF, setNewF]             = useState({ key: '', label: '', sort_order: '' })
  const [editing, setEditing]       = useState(null)
  const [editF, setEditF]           = useState({})
  const [error, setError]           = useState('')
  const [adding, setAdding]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const { categories } = await res.json()
      setCats(categories.filter(c => c.key !== 'all'))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    setError('')
    if (!newF.key || !newF.label) { setError('key와 label을 모두 입력하세요.'); return }
    setAdding(true)
    const res  = await adminFetch('/categories', {
      method: 'POST', body: JSON.stringify({ ...newF, sort_order: Number(newF.sort_order) || 99 }),
    })
    const data = await res.json()
    setAdding(false)
    if (!data.ok) { setError(data.error); return }
    setNewF({ key: '', label: '', sort_order: '' }); load()
  }

  async function saveEdit(key) {
    setError('')
    const res  = await adminFetch(`/categories/${key}`, { method: 'PUT', body: JSON.stringify(editF) })
    const data = await res.json()
    if (!data.ok) { setError(data.error); return }
    setEditing(null); load()
  }

  async function del(cat) {
    setError('')
    if (!confirm(`"${cat.label}" 카테고리를 삭제하시겠습니까?`)) return
    const res  = await adminFetch(`/categories/${cat.key}`, { method: 'DELETE' })
    const data = await res.json()
    if (!data.ok) { setError(data.error); return }
    load()
  }

  return (
    <section>
      <div style={S.panelHead}>
        <h2 style={S.panelTitle}>Categories</h2>
      </div>

      {/* Add form */}
      <div style={{
        ...S.addRow,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-end',
      }}>
        <Field label="Key (영문, 소문자)">
          <input style={S.input} placeholder="my-category" value={newF.key}
            onChange={e => setNewF(f => ({ ...f, key: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && add()} />
        </Field>
        <Field label="Label (표시 이름)">
          <input style={S.input} placeholder="My Category" value={newF.label}
            onChange={e => setNewF(f => ({ ...f, label: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && add()} />
        </Field>
        {!isMobile && (
          <Field label="순서">
            <input style={{ ...S.input, width: '80px' }} type="number" placeholder="99"
              value={newF.sort_order} onChange={e => setNewF(f => ({ ...f, sort_order: e.target.value }))} />
          </Field>
        )}
        <button onClick={add} disabled={adding}
          style={{ ...S.btnPrimary, alignSelf: isMobile ? 'stretch' : 'flex-end', marginBottom: isMobile ? 0 : '1px' }}>
          {adding ? '...' : '+ 추가'}
        </button>
      </div>

      {error && <p style={{ ...S.errText, marginBottom: '16px' }}>{error}</p>}

      {loading ? <p style={S.muted}>불러오는 중...</p> : (
        <table style={S.table} className="adm-table">
          <thead><tr>
            {['Key', 'Label', '순서', ''].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {cats.map(cat => (
              <tr key={cat.key} style={S.tr}>
                {editing === cat.key ? (
                  <>
                    <td style={S.td} className="adm-c-key"><code style={S.code}>{cat.key}</code></td>
                    <td style={S.td} className="adm-c-label">
                      <input style={{ ...S.input, padding: '5px 10px' }}
                        value={editF.label} onChange={e => setEditF(f => ({ ...f, label: e.target.value }))} />
                    </td>
                    <td style={S.td} className="adm-c-order">
                      <input type="number" style={{ ...S.input, padding: '5px 10px', width: '80px' }}
                        value={editF.sort_order} onChange={e => setEditF(f => ({ ...f, sort_order: parseInt(e.target.value) }))} />
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }} className="adm-c-actions">
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => saveEdit(cat.key)} style={S.btnPrimary}>저장</button>
                        <button onClick={() => setEditing(null)} style={S.btnSm}>취소</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={S.td} className="adm-c-key"><code style={S.code}>{cat.key}</code></td>
                    <td style={S.td} className="adm-c-label">{cat.label}</td>
                    <td style={{ ...S.td, ...S.muted, fontSize: '13px' }} className="adm-c-order">{cat.sort_order}</td>
                    <td style={{ ...S.td, textAlign: 'right' }} className="adm-c-actions">
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditing(cat.key); setEditF({ label: cat.label, sort_order: cat.sort_order }) }} style={S.btnSm}>수정</button>
                        <button onClick={() => del(cat)} style={{ ...S.btnSm, ...S.btnDanger }}>삭제</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

/* ─── Styles ─────────────────────────────────────────── */
const S = {
  loginWrap:  { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
  loginBox:   { width: '340px', padding: '48px 40px', border: '1px solid var(--line)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '28px' },
  loginLogo:  { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text)', textAlign: 'center' },
  loginTitle: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, color: 'var(--text)', textAlign: 'center', margin: 0 },

  sidebar: { width: '200px', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 16px', borderRight: '1px solid var(--line)', background: 'var(--bg)', zIndex: 10 },
  main:    { marginLeft: '200px', flex: 1, padding: '40px 48px', maxWidth: '1100px' },

  sidebarLogo:    { fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text)', padding: '6px 12px' },
  sideItem:       { fontFamily: 'var(--font-body)', fontSize: '14px', padding: '9px 12px', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  sideItemActive: { background: 'var(--text)', color: 'var(--bg)' },
  sideLink:       { fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', padding: '6px 12px', display: 'block', textDecoration: 'none', whiteSpace: 'nowrap' },
  logoutBtn:      { fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--line)', borderRadius: '6px', padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap' },

  panelHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--line)', gap: '12px', flexWrap: 'wrap' },
  panelTitle: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, color: 'var(--text)', margin: 0 },
  emptyBox:   { padding: '60px 0', textAlign: 'center', borderTop: '1px solid var(--line)' },

  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' },
  th:    { textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' },
  tr:    { borderBottom: '1px solid var(--line)' },
  td:    { padding: '14px 14px', fontSize: '14px', color: 'var(--text)', verticalAlign: 'middle' },

  badge:    { display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'opacity 0.15s' },
  badgeOn:  { background: '#d1fae5', color: '#065f46' },
  badgeOff: { background: '#f3f4f6', color: '#6b7280' },
  catChip:  { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--line)', color: 'var(--text-muted)' },

  input:          { width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px', background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', marginTop: '4px' },
  fieldLabel:     { fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', flex: 1 },
  fieldLabelText: { fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '4px' },

  textarea:   { width: '100%', height: '520px', padding: '20px', border: '1px solid var(--line)', borderRadius: '6px', fontFamily: '"Fira Code","Cascadia Code",monospace', fontSize: '14px', lineHeight: 1.65, background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  previewBox: { minHeight: '520px', padding: '28px 32px', border: '1px solid var(--line)', borderRadius: '6px', background: 'var(--bg)' },

  addRow:  { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--line)' },
  code:    { fontFamily: 'monospace', fontSize: '13px', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' },

  btnPrimary: { fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, padding: '8px 16px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSm:      { fontFamily: 'var(--font-body)', fontSize: '13px', padding: '7px 13px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnDanger:  { color: '#c0392b', borderColor: '#fca5a5' },

  muted:   { fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' },
  errText: { fontFamily: 'var(--font-body)', fontSize: '13px', color: '#c0392b' },
}
