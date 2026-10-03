import {
  getPosts,
  postPath,
  rssPath,
  sectionPath,
  sourceOf,
  type Lang,
  type Post,
  type Section,
} from './content';

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const FEED: Record<Section, Record<Lang, { title: string; description: string }>> = {
  blog: {
    zh: {
      title: 'Free Router 博客',
      description: '关于 Free Router 网关配置、路由策略与本地优先实践的记录。',
    },
    en: {
      title: 'Free Router Blog',
      description: 'Notes on Free Router gateway configuration, routing, and working local first.',
    },
  },
  news: {
    zh: {
      title: 'Free Router LLM 新闻',
      description: '每周梳理值得关注的 LLM 模型、工具与生态动态，以及它们对本地网关使用者的意义。',
    },
    en: {
      title: 'Free Router LLM News',
      description:
        'A weekly read on the LLM models, tooling, and ecosystem moves worth knowing — and what they mean if you run your own gateway.',
    },
  },
};

const item = (post: Post, site: URL) => {
  const source = sourceOf(post);
  return `
    <item>
      <title>${escape(post.data.title)}</title>
      <link>${new URL(postPath(post), site).href}</link>
      <guid isPermaLink="true">${new URL(postPath(post), site).href}</guid>
      <description>${escape(post.data.description)}</description>
      <pubDate>${post.data.publishedAt.toUTCString()}</pubDate>
      ${source ? `<source url="${escape(source.url ?? new URL(sectionPath(post.lang, 'news'), site).href)}">${escape(source.name)}</source>` : ''}
      ${post.data.tags.map((tag) => `<category>${escape(tag)}</category>`).join('')}
    </item>`;
};

export async function buildRss(section: Section, lang: Lang, site: URL): Promise<string> {
  const posts = await getPosts(section, lang);
  const meta = FEED[section][lang];
  const items = posts.map((post) => item(post, site)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(meta.title)}</title>
    <link>${new URL(sectionPath(lang, section), site).href}</link>
    <description>${escape(meta.description)}</description>
    <language>${lang === 'zh' ? 'zh-CN' : 'en-US'}</language>
    <atom:link href="${new URL(rssPath(lang, section), site).href}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
}

export const rssHeaders = { 'Content-Type': 'application/rss+xml; charset=utf-8' };
