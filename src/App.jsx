import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { POSTS, CATEGORIES } from './posts.js'

marked.use({ breaks: true })

const PORTFOLIO_URL = 'https://seon06.dev'
// blog.seon06.dev — Cloudflare Pages custom domain
const GITHUB_URL    = 'https://github.com/seon0313'

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
  const match = path.match(/^\/post\/(.+)$/)
  const post  = match ? POSTS.find(p => p.slug === match[1]) : null

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Nav />
      {post ? <PostDetail post={post} /> : <PostList />}
      <Footer />
    </div>
  )
}

/* ─── Nav ────────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={styles.nav}>
      <a
        href="#/"
        style={styles.navLogo}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >YS · Blog</a>
      <div style={styles.navLinks}>
        <a
          href={PORTFOLIO_URL}
          style={styles.navLink}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >Portfolio ↗</a>
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
  const [active, setActive] = useState('all')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const filtered = active === 'all' ? POSTS : POSTS.filter(p => p.category === active)

  return (
    <main style={styles.listMain}>
      {/* Hero */}
      <div style={styles.listHero}>
        <p style={{
          ...styles.heroLabel,
          animation: visible ? 'fadeUp 0.7s var(--ease-out) 0.1s both' : 'none',
        }}>✦ Writing</p>
        <h1 style={{
          ...styles.listTitle,
          animation: visible ? 'fadeUp 0.8s var(--ease-out) 0.2s both' : 'none',
        }}>Blog</h1>
        <p style={{
          ...styles.listSubtitle,
          animation: visible ? 'fadeUp 0.8s var(--ease-out) 0.3s both' : 'none',
        }}>
          개발하면서 배운 것들, 만든 것들의 기록.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        ...styles.tabsRow,
        animation: visible ? 'fadeUp 0.7s var(--ease-out) 0.4s both' : 'none',
      }}>
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{ ...styles.tab, ...(active === key ? styles.tabActive : {}) }}
          >{label}</button>
        ))}
      </div>

      {/* Post list */}
      <div style={{
        ...styles.postList,
        animation: visible ? 'fadeUp 0.8s var(--ease-out) 0.5s both' : 'none',
      }}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>아직 글이 없습니다.</p>
          </div>
        ) : (
          filtered.map((post, i) => <PostCard key={post.slug} post={post} index={i} />)
        )}
      </div>
    </main>
  )
}

function PostCard({ post }) {
  const [hovered, setHovered] = useState(false)
  const cat = CATEGORIES.find(c => c.key === post.category)

  return (
    <article
      style={{ ...styles.postCard, ...(hovered ? styles.postCardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/post/${post.slug}`)}
    >
      <div style={styles.postCardLeft}>
        <time style={styles.postDate}>{formatDate(post.date)}</time>
      </div>
      <div style={styles.postCardRight}>
        <span style={styles.catBadge}>{cat?.label ?? post.category}</span>
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
function PostDetail({ post }) {
  const cat = CATEGORIES.find(c => c.key === post.category)
  const html = marked.parse(post.content)

  return (
    <main style={styles.detailMain}>
      <div style={styles.detailInner}>
        {/* Back */}
        <button
          style={styles.backBtn}
          onClick={() => navigate('/')}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >← Back</button>

        {/* Header */}
        <header style={styles.detailHeader}>
          <div style={styles.detailMeta}>
            <span style={styles.catBadge}>{cat?.label ?? post.category}</span>
            <time style={styles.postDate}>{formatDate(post.date)}</time>
          </div>
          <h1 style={styles.detailTitle}>{post.title}</h1>
          <p style={styles.detailExcerpt}>{post.excerpt}</p>
        </header>

        <div style={styles.detailDivider} />

        {/* Content */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  )
}

/* ─── Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={styles.footer}>
      <span style={styles.footerLogo}>YS</span>
      <span style={styles.footerCopy}>© {new Date().getFullYear()} 추윤선 · Built with React + Cloudflare Pages</span>
    </footer>
  )
}

/* ─── Utils ──────────────────────────────────────────── */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

/* ─── Styles ─────────────────────────────────────────── */
const styles = {
  /* Nav */
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

  /* List */
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

  /* Tabs */
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

  /* Post list */
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
  postCardHover: {
    opacity: 1,
  },
  postCardLeft: {
    paddingTop: '4px',
  },
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

  /* Empty */
  emptyState: {
    padding: '80px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderTop: '1px solid var(--line)',
  },
  emptyText: {
    fontFamily: 'var(--font-body)',
    fontSize: '15px', color: 'var(--text-muted)',
  },

  /* Detail */
  detailMain: {
    padding: '120px 48px 100px',
  },
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
  detailDivider: {
    height: '1px', background: 'var(--line)',
  },

  /* Footer */
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
