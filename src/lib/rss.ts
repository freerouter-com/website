import { blogPath, getPosts, postPath, type Lang } from './blog';

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const item = (post: Awaited<ReturnType<typeof getPosts>>[number], site: URL) => `
    <item>
      <title>${escape(post.data.title)}</title>
      <link>${new URL(postPath(post), site).href}</link>
      <guid isPermaLink="true">${new URL(postPath(post), site).href}</guid>
      <description>${escape(post.data.description)}</description>
      <pubDate>${post.data.publishedAt.toUTCString()}</pubDate>
      ${post.data.tags.map((tag) => `<category>${escape(tag)}</category>`).join('')}
    </item>`;

export async function buildRss(lang: Lang, site: URL): Promise<string> {
  const posts = await getPosts(lang);
  const title = lang === 'zh' ? 'Free Router 博客' : 'Free Router Blog';
  const description =
    lang === 'zh'
      ? '关于 Free Router 网关配置、路由策略与本地优先实践的记录。'
      : 'Notes on Free Router gateway configuration, routing, and working local first.';
  const items = posts.map((post) => item(post, site)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(title)}</title>
    <link>${new URL(blogPath(lang), site).href}</link>
    <description>${escape(description)}</description>
    <language>${lang === 'zh' ? 'zh-CN' : 'en-US'}</language>
    <atom:link href="${new URL(`${blogPath(lang)}rss.xml`, site).href}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
}

export const rssHeaders = { 'Content-Type': 'application/rss+xml; charset=utf-8' };