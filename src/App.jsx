import { lazy, Suspense, useEffect, useState } from 'react'
import { marked } from 'marked'
import Logo from './Logo.jsx'

// 관리자 화면은 방문자에게 필요 없으니 따로 떼어 필요할 때만 받음
const Admin = lazy(() => import('./Admin.jsx'))

marked.use({ breaks: true })

const PORTFOLIO_URL = 'https://seon06.dev'
const GITHUB_URL    = 'https://github.com/seon0313'

/* ─── API ─────────────────────────────────────────────── */
// index.html이 JS보다 먼저 시작해 둔 요청이 있으면 그 결과를 한 번만 씀
function getJSON(url) {
  const pre = window.__prefetch?.[url]
  if (pre) {
    delete window.__prefetch[url]
    return pre.catch(() => fetchJSON(url))
  }
  return fetchJSON(url)
}

function fetchJSON(url) {
  return fetch(url).then(r => (r.ok ? r.json() : Promise.reject(r.status)))
}

async function fetchCategories() {
  const { categories } = await getJSON('/api/categories')
  return categories
}

async function fetchPosts(category) {
  const params = category && category !== 'all' ? `?category=${category}` : ''
  const { posts } = await getJSON(`/api/posts${params}`)
  return posts
}

async function fetchPost(slug) {
  try {
    const { post } = await getJSON(`/api/posts/${slug}`)
    return post
  } catch {
    return null
  }
}

/* ─── Hash Router ────────────────────────────────────── */
function useRoute() {
  const getPath = () => window.location.hash.slice(1) || '/'
  const [path, setPath] = useState(getPath)
  useEffect(() => {
    const h = () => setPath(getPath())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return path
}

function navigate(to) {
  window.location.hash = to
  window.scrollTo({ top: 0 })
}

/* ─── App ────────────────────────────────────────────── */
export default function App() {
  const path = useRoute()

  if (path.startsWith('/admin')) return <Suspense fallback={null}><Admin /></Suspense>

  const match = path.match(/^\/post\/(.+)$/)
  const slug  = match ? decodeURIComponent(match[1]) : null

  return (
    <div className="b-site">
      <div className="b-glow" aria-hidden="true" />
      <Nav slug={slug} />
      <main className="b-main">
        {slug ? <PostDetail slug={slug} /> : <PostList />}
      </main>
      <Footer />
    </div>
  )
}

/* ─── Nav ────────────────────────────────────────────── */
function Nav({ slug }) {
  return (
    <header className="b-nav">
      <div className="b-container b-nav-inner">
        <div className="b-brand">
          <a href={PORTFOLIO_URL} aria-label="seon06.dev 메인으로"><Logo size={26} /></a>
          <a href={PORTFOLIO_URL} className="b-hide-sm">seon06<em>.dev</em></a>
          <span className="b-crumb">
            / {slug ? <><a href="#/">blog</a> / <b>{slug}</b></> : <b>blog</b>}
          </span>
        </div>
        <nav className="b-nav-links" aria-label="외부 링크">
          <a href={PORTFOLIO_URL} className="b-hide-sm">~/home</a>
          <a href={GITHUB_URL} className="b-gh" target="_blank" rel="noopener noreferrer">github</a>
        </nav>
      </div>
    </header>
  )
}

/* ─── Post List ──────────────────────────────────────── */
function PostList() {
  const [active,     setActive]     = useState('all')
  const [categories, setCategories] = useState([{ key: 'all', label: 'All' }])
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchPosts(active)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [active])

  const latest = posts[0]?.published_at
  const cmd = active === 'all' ? 'ls -t ~/blog' : `ls -t ~/blog/${active}`

  return (
    <div className="b-container">
      <section className="b-hero">
        <div className="b-prompt b-rise">
          <span className="b-ps">➜</span><span className="b-path">~</span>
          <span className="b-cmd">{cmd}</span><span className="b-caret" aria-hidden="true" />
        </div>
        <h1 className="b-title b-rise b-d1"><span className="b-grad">Blog</span><span className="b-slash"> /</span></h1>
        <p className="b-sub b-rise b-d2">개발하면서 배운 것들, 만든 것들의 기록.</p>
        {!loading && (
          <p className="b-stat b-rise b-d2">
            <span><b>{posts.length}</b> posts</span>
            {latest && <span>last update <b>{formatDate(latest)}</b></span>}
          </p>
        )}
      </section>

      <div className="b-filters b-rise b-d3" role="group" aria-label="카테고리 필터">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={active === key}
            onClick={() => setActive(key)}
          >--{(label || key).toLowerCase()}</button>
        ))}
      </div>

      {loading ? (
        <div className="b-empty">불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="b-empty">$ ls: 아직 글이 없습니다.</div>
      ) : (
        <div className="b-list">
          {posts.map(post => (
            <PostRow key={post.slug} post={post} categories={categories} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostRow({ post, categories }) {
  const cat = categories.find(c => c.key === post.category_key)
  const open = () => navigate(`/post/${post.slug}`)

  return (
    <article
      className="b-row"
      tabIndex={0}
      role="link"
      aria-label={post.title}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter') open() }}
    >
      <time className="b-date" dateTime={post.published_at}>{formatDate(post.published_at)}</time>
      <div className="b-row-body">
        <span className="b-cat">{(cat?.label ?? post.category_key ?? '').toLowerCase()}</span>
        <h2>{post.title}</h2>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="b-read">cat {post.slug}.md →</span>
      </div>
    </article>
  )
}

/* ─── Post Detail ────────────────────────────────────── */
function PostDetail({ slug }) {
  const [post,    setPost]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchPost(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [slug])

  const back = <button type="button" className="b-back" onClick={() => navigate('/')}>← cd ..</button>

  if (loading) {
    return <div className="b-container b-detail">{back}<p className="b-muted">불러오는 중...</p></div>
  }

  if (!post) {
    return <div className="b-container b-detail">{back}<p className="b-muted">cat: {slug}.md: 글을 찾을 수 없습니다.</p></div>
  }

  const html = marked.parse(post.content || '')

  return (
    <article className="b-container b-detail">
      {back}
      <header>
        <p className="b-file">~/blog/<b>{post.slug}.md</b></p>
        <h1 className="b-detail-title">{post.title}</h1>
        {post.excerpt && <p className="b-detail-excerpt">{post.excerpt}</p>}
        <div className="b-meta">
          <span className="b-cat">{post.category_key}</span>
          <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          <span>{readingMinutes(post.content)} min read</span>
        </div>
      </header>

      <div className="b-divider" />

      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}

/* ─── Footer (statusline) ────────────────────────────── */
function Footer() {
  return (
    <footer className="b-statusline">
      <div className="b-container b-statusline-inner">
        <span className="b-mode">NORMAL</span>
        <a href={PORTFOLIO_URL}><Logo size={14} />seon06.dev</a>
        <span className="b-hide-sm">⎇ blog</span>
        <span className="b-grow" />
        <span className="b-hide-sm">React · Cloudflare Pages</span>
        <span>© {new Date().getFullYear()} 추윤선</span>
      </div>
    </footer>
  )
}

/* ─── Utils ──────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/* 한글 기준 분당 약 500자 */
function readingMinutes(content = '') {
  const text = content.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`\[\]()!-]/g, ' ')
  return Math.max(1, Math.round(text.replace(/\s+/g, '').length / 500))
}
