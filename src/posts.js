/* ─── 블로그 포스트 — 여기에 추가하세요 ──────────────
 *
 * category: 'dev' | 'server' | 'hardware' | 'retrospective' | 'etc'
 * content:  마크다운 문자열
 *
 * ─────────────────────────────────────────────────── */
export const POSTS = [
  {
    slug: 'hello-world',
    title: '블로그를 시작합니다',
    date: '2026-04-24',
    category: 'etc',
    excerpt: '첫 글입니다. 개발하면서 배운 것들, 만든 것들을 기록하려고 합니다.',
    content: `
# 블로그를 시작합니다

안녕하세요, 추윤선입니다.

개발하면서 배운 것들, 만들면서 겪은 것들을 기록하고 싶어서 블로그를 시작합니다.

## 주로 다룰 내용

- **Software** — Python, Java, Kotlin, C로 만드는 것들
- **Servers** — 게임 서버, 백엔드 인프라
- **Hardware** — 회로, 임베디드 관련
- **Retrospective** — 프로젝트 후기, 공부 기록

---

짧더라도 꾸준히 써보겠습니다.
    `.trim(),
  },
]

export const CATEGORIES = [
  { key: 'all',           label: 'All' },
  { key: 'dev',           label: 'Dev' },
  { key: 'server',        label: 'Servers' },
  { key: 'hardware',      label: 'Hardware' },
  { key: 'retrospective', label: 'Retrospective' },
  { key: 'etc',           label: 'Etc' },
]
