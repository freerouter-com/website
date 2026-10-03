import { getCollection, type CollectionEntry } from 'astro:content';

export type Lang = 'zh' | 'en';
export type Section = 'blog' | 'news';
// Both collections share the same shape: the language and slug are carried in the
// filename, so `section` is the only thing that tells a post and a news item apart.
export type Post = CollectionEntry<Section> & { lang: Lang; slug: string; section: Section };

const LANGUAGE_SUFFIX = /\.(zh|en)$/;
const format = (lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

// Entries are named `<slug>.<lang>.md`, so the language lives in the filename and both
// translations of an entry share the same slug — that is what pairs them together.
export const postLanguage = (id: string): Lang => (id.endsWith('.en') ? 'en' : 'zh');
export const postSlug = (id: string): string => id.replace(LANGUAGE_SUFFIX, '');

export const homePath = (lang: Lang) => (lang === 'zh' ? '/' : '/en/');
export const sectionPath = (lang: Lang, section: Section) =>
  lang === 'zh' ? `/${section}/` : `/en/${section}/`;
export const blogPath = (lang: Lang) => sectionPath(lang, 'blog');
export const newsPath = (lang: Lang) => sectionPath(lang, 'news');
export const rssPath = (lang: Lang, section: Section) => `${sectionPath(lang, section)}rss.xml`;
export const postPath = (post: Pick<Post, 'lang' | 'slug' | 'section'>) =>
  `${sectionPath(post.lang, post.section)}${post.slug}/`;
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

// News items credit where the story came from; blog posts have no source.
export type Source = { name: string; url?: string };
export const sourceOf = (post: Post): Source | undefined =>
  'source' in post.data ? { name: post.data.source, url: post.data.sourceUrl } : undefined;

export async function getPosts(section: Section, lang: Lang): Promise<Post[]> {
  const entries = await getCollection(section, ({ data }) => !data.draft);
  return entries
    .filter((entry) => postLanguage(entry.id) === lang)
    .map((entry) => ({
      ...entry,
      lang: postLanguage(entry.id),
      slug: postSlug(entry.id),
      section,
    }))
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()) as Post[];
}

export async function getTranslation(post: Post): Promise<Post | undefined> {
  const entries = await getCollection(post.section, ({ data }) => !data.draft);
  const entry = entries.find(
    (candidate) =>
      postLanguage(candidate.id) === otherLanguage(post.lang) &&
      postSlug(candidate.id) === post.slug,
  );
  return entry
    ? { ...entry, lang: postLanguage(entry.id), slug: postSlug(entry.id), section: post.section } as Post
    : undefined;
}
