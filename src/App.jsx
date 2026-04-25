import { useEffect, useState } from 'react'
import { marked } from 'marked'
import Admin from './Admin.jsx'

marked.use({ breaks: true })

const PORTFOLIO_URL = 'https://seon06.dev'
const GITHUB_URL    = 'https://github.com/seon0313'

/* ─── API ─────────────────────────────────────────────── */
async function fetchCategories() {
  const res = await fetch('/api/categories')
  const { categories } = await res.json()
  return categories
}

async function fetchPosts(category) {
  const params = category && category !== 'all' ? `?category=${category}` : ''
  const res = await fetch(`/api/posts${params}`)
  const { posts } = await res.json()
  return posts
}

async function fetchPost(slug) {
  const res = await fetch(`/api/posts/${slug}`)
  if (!res.ok) return null
  const { post } = await res.json()
  return post
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

  if (path.startsWith('/admin')) return <Admin />

  const match = path.match(/^\/post\/(.+)$/)
  const slug  = match ? match[1] : null

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Nav />
      {slug ? <PostDetail slug={slug} /> : <PostList />}
      <Footer />
    </div>
  )
}

/* ─── Nav ────────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={styles.nav} className="c-nav">
      <a
        href="#/"
        style={styles.navLogo}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >YS · Blog</a>
      <div style={styles.navLinks} className="c-nav-links">
        <a
          href={PORTFOLIO_URL}
          style={styles.navLink}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >Webpage ↗</a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...styles.navLink, ...styles.navCta }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = 'var(--bg)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)' }}
        >GitHub ↗</a>
      </div>
    </nav>
  )
}

/* ─── Post List ──────────────────────────────────────── */
function PostList() {
  const [active,     setActive]     = useState('all')
  const [visible,    setVisible]    = useState(false)
  const [categories, setCategories] = useState([{ key: 'all', label: 'All' }])
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)

  // 카테고리 로드 (최초 1회)
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  // 포스트 로드 (카테고리 바뀔 때마다)
  useEffect(() => {
    setLoading(true)
    fetchPosts(active)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [active])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <main style={styles.listMain} className="c-list-main">
      {/* Hero */}
      <div style={styles.listHero}>
        <p style={{ ...styles.heroLabel, animation: visible ? 'fadeUp 0.7s var(--ease-out) 0.1s both' : 'none' }}>
          ✦ Writing
        </p>
        <h1 className="c-list-title" style={{ ...styles.listTitle, animation: visible ? 'fadeUp 0.8s var(--ease-out) 0.2s both' : 'none' }}>
          Blog
        </h1>
        <p style={{ ...styles.listSubtitle, animation: visible ? 'fadeUp 0.8s var(--ease-out) 0.3s both' : 'none' }}>
          개발하면서 배운 것들, 만든 것들의 기록.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ ...styles.tabsRow, animation: visible ? 'fadeUp 0.7s var(--ease-out) 0.4s both' : 'none' }}>
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{ ...styles.tab, ...(active === key ? styles.tabActive : {}) }}
          >{label}</button>
        ))}
      </div>

      {/* Post list */}
      <div style={{ ...styles.postList, animation: visible ? 'fadeUp 0.8s var(--ease-out) 0.5s both' : 'none' }}>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>불러오는 중...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>아직 글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard key={post.slug} post={post} categories={categories} index={i} />
          ))
        )}
      </div>
    </main>
  )
}

function PostCard({ post, categories }) {
  const [hovered, setHovered] = useState(false)
  const cat = categories.find(c => c.key === post.category_key)

  return (
    <article
      className="c-post-card"
      style={{ ...styles.postCard, ...(hovered ? styles.postCardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/post/${post.slug}`)}
    >
      <div style={styles.postCardLeft}>
        <time style={styles.postDate}>{formatDate(post.published_at)}</time>
      </div>
      <div style={styles.postCardRight}>
        <span style={styles.catBadge}>{cat?.label ?? post.category_key}</span>
        <h2 style={{ ...styles.postTitle, ...(hovered ? { color: 'var(--accent)' } : {}) }}>
          {post.title}
        </h2>
        <p style={styles.postExcerpt}>{post.excerpt}</p>
        <span style={{ ...styles.readMore, ...(hovered ? { color: 'var(--accent)' } : {}) }}>
          Read more →
        </span>
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

  if (loading) {
    return (
      <main style={styles.detailMain} className="c-detail-main">
        <div style={styles.detailInner}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>불러오는 중...</p>
        </div>
      </main>
    )
  }

  if (!post) {
    return (
      <main style={styles.detailMain} className="c-detail-main">
        <div style={styles.detailInner}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>글을 찾을 수 없습니다.</p>
        </div>
      </main>
    )
  }

  const html = marked.parse(post.content)

  return (
    <main style={styles.detailMain} className="c-detail-main">
      <div style={styles.detailInner}>
        <button
          style={styles.backBtn}
          onClick={() => navigate('/')}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >← Back</button>

        <header style={styles.detailHeader}>
          <div style={styles.detailMeta}>
            <span style={styles.catBadge}>{post.category_key}</span>
            <time style={styles.postDate}>{formatDate(post.published_at)}</time>
          </div>
          <h1 style={styles.detailTitle}>{post.title}</h1>
          <p style={styles.detailExcerpt}>{post.excerpt}</p>
        </header>

        <div style={styles.detailDivider} />

        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  )
}

/* ─── Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={styles.footer} className="c-footer">
      <span style={styles.footerLogo}>YS</span>
      <span style={styles.footerCopy}>© {new Date().getFullYear()} 추윤선 · Built with React + Cloudflare Pages</span>
    </footer>
  )
}

/* ─── Utils ──────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

/* ─── Styles ─────────────────────────────────────────── */
const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 48px',
    backdropFilter: 'blur(12px)',
    background: 'rgba(247,246,242,0.85)',
    borderBottom: '1px solid var(--line)',
  },
  navLogo: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px', fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--text)',
    transition: 'opacity 0.2s',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: '8px' },
  navLink: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px', fontWeight: 400,
    color: 'var(--text-muted)',
    padding: '6px 14px',
    transition: 'color 0.2s',
  },
  navCta: {
    color: 'var(--text)',
    border: '1px solid var(--line)',
    borderRadius: '100px',
    transition: 'background 0.2s, color 0.2s',
  },

  listMain: {
    maxWidth: '860px', margin: '0 auto',
    padding: '140px 48px 100px',
  },
  listHero: {
    marginBottom: '56px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  heroLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px', fontWeight: 500,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  listTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(64px, 8vw, 96px)',
    fontWeight: 300, lineHeight: 1.0,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  listSubtitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(18px, 2vw, 24px)',
    fontWeight: 300, fontStyle: 'italic',
    color: 'var(--text-muted)',
  },

  tabsRow: {
    display: 'flex', gap: '6px', flexWrap: 'wrap',
    marginBottom: '48px',
  },
  tab: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px', fontWeight: 400,
    padding: '6px 16px',
    borderRadius: '100px',
    border: '1px solid var(--line)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.18s',
  },
  tabActive: {
    background: 'var(--text)',
    color: 'var(--bg)',
    borderColor: 'var(--text)',
  },

  postList: {
    display: 'flex', flexDirection: 'column',
  },
  postCard: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '32px',
    padding: '36px 0',
    borderTop: '1px solid var(--line)',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  postCardHover: { opacity: 1 },
  postCardLeft: { paddingTop: '4px' },
  postCardRight: {
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  postDate: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px', fontWeight: 400,
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
  },
  catBadge: {
    display: 'inline-block',
    fontFamily: 'var(--font-body)',
    fontSize: '10px', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--accent)',
  },
  postTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px', fontWeight: 400,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    color: 'var(--text)',
    transition: 'color 0.2s',
  },
  postExcerpt: {
    fontFamily: 'var(--font-body)',
    fontSize: '15px', fontWeight: 300,
    lineHeight: 1.7,
    color: 'var(--text-muted)',
  },
  readMore: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px', fontWeight: 400,
    color: 'var(--text-muted)',
    transition: 'color 0.2s',
    marginTop: '4px',
  },

  emptyState: {
    padding: '80px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderTop: '1px solid var(--line)',
  },
  emptyText: {
    fontFamily: 'var(--font-body)',
    fontSize: '15px', color: 'var(--text-muted)',
  },

  detailMain: { padding: '120px 48px 100px' },
  detailInner: {
    maxWidth: '720px', margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: '32px',
  },
  backBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px', fontWeight: 400,
    color: 'var(--text-muted)',
    background: 'none', border: 'none',
    cursor: 'pointer', padding: '0',
    transition: 'color 0.2s',
    alignSelf: 'flex-start',
  },
  detailHeader: {
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  detailMeta: {
    display: 'flex', alignItems: 'center', gap: '16px',
  },
  detailTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: 300, lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  detailExcerpt: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px', fontWeight: 300,
    fontStyle: 'italic',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  detailDivider: { height: '1px', background: 'var(--line)' },

  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 48px',
    borderTop: '1px solid var(--line)',
  },
  footerLogo: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px', fontWeight: 600,
    letterSpacing: '0.05em',
  },
  footerCopy: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
}
