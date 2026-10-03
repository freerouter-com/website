import { getCollection, type CollectionEntry } from 'astro:content';

export type Lang = 'zh' | 'en';
export type Post = CollectionEntry<'blog'> & { lang: Lang; slug: string };

const LANGUAGE_SUFFIX = /\.(zh|en)$/;
const format = (lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

// Posts are named `<slug>.<lang>.md`, so the language lives in the filename and both
// translations of a post share the same slug — that is what pairs them together.
export const postLanguage = (id: string): Lang => (id.endsWith('.en') ? 'en' : 'zh');
export const postSlug = (id: string): string => id.replace(LANGUAGE_SUFFIX, '');

export const homePath = (lang: Lang) => (lang === 'zh' ? '/' : '/en/');
export const blogPath = (lang: Lang) => (lang === 'zh' ? '/blog/' : '/en/blog/');
export const rssPath = (lang: Lang) => `${blogPath(lang)}rss.xml`;
export const postPath = (post: Pick<Post, 'lang' | 'slug'>) => `${blogPath(post.lang)}${post.slug}/`;
export const otherLanguage = (lang: Lang): Lang => (lang === 'zh' ? 'en' : 'zh');

export const formatDate = (date: Date, lang: Lang) => format(lang).format(date);

// Chinese reads far slower per token than English, so the two are counted separately.
export function readingTime(body: string | undefined, lang: Lang): number {
  if (lang === 'zh') {
    const characters = (body?.match(/[㐀-鿿]/g) || []).length;
    return Math.max(1, Math.round(characters / 400));
  }
  const words = (body?.match(/[A-Za-z0-9'’-]+/g) || []).length;
  return Math.max(1, Math.round(words / 220));
}

export async function getPosts(lang: Lang): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts
    .map((post) => ({ ...post, lang: postLanguage(post.id), slug: postSlug(post.id) }))
    .filter((post) => post.lang === lang)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getTranslation(post: Post): Promise<Post | undefined> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const entry = posts.find(
    (candidate) =>
      postLanguage(candidate.id) === otherLanguage(post.lang) &&
      postSlug(candidate.id) === post.slug,
  );
  return entry ? { ...entry, lang: postLanguage(entry.id), slug: postSlug(entry.id) } : undefined;
}