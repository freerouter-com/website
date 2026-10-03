import type { APIRoute } from 'astro';
import { buildRss, rssHeaders } from '../../lib/rss';

export const GET: APIRoute = async ({ site, url }) =>
  new Response(await buildRss('news', 'zh', new URL(site ?? url.origin)), { headers: rssHeaders });
