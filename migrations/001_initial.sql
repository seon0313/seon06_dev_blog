-- ─── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  key        TEXT    PRIMARY KEY,
  label      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Posts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  excerpt      TEXT    NOT NULL DEFAULT '',
  content      TEXT    NOT NULL DEFAULT '',
  category_key TEXT    NOT NULL REFERENCES categories(key),
  published    INTEGER NOT NULL DEFAULT 0,  -- 0=draft, 1=published
  published_at TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_category   ON posts(category_key);
CREATE INDEX IF NOT EXISTS idx_posts_published  ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug       ON posts(slug);

-- ─── Tags ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ─── Pages (About 등 정적 페이지) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL DEFAULT '',
  published  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Seed: default categories ─────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (key, label, sort_order) VALUES
  ('dev',           'Dev',           1),
  ('server',        'Servers',       2),
  ('hardware',      'Hardware',      3),
  ('retrospective', 'Retrospective', 4),
  ('etc',           'Etc',           5);

-- ─── Seed: hello-world post ───────────────────────────────────────────────────
INSERT OR IGNORE INTO posts (slug, title, excerpt, content, category_key, published, published_at)
VALUES (
  'hello-world',
  '블로그를 시작합니다',
  '첫 글입니다. 개발하면서 배운 것들, 만든 것들을 기록하려고 합니다.',
  '# 블로그를 시작합니다

안녕하세요, 추윤선입니다.

개발하면서 배운 것들, 만들면서 겪은 것들을 기록하고 싶어서 블로그를 시작합니다.

## 주로 다룰 내용

- **Software** — Python, Java, Kotlin, C로 만드는 것들
- **Servers** — 게임 서버, 백엔드 인프라
- **Hardware** — 회로, 임베디드 관련
- **Retrospective** — 프로젝트 후기, 공부 기록

---

짧더라도 꾸준히 써보겠습니다.',
  'etc',
  1,
  '2026-04-24T00:00:00Z'
);
