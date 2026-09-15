// GET /sitemap.xml — páginas do site + artigos publicados, gerado a cada requisição (com cache de CDN).

import { listPostSummaries } from './_lib/supabase.mjs';
import { isoDate } from './_lib/html.mjs';
import { SITE_URL, BLOG_URL } from './_lib/site.mjs';
import { STATIC_PAGES } from './_lib/pages.mjs';

function xmlEscape(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function urlEntry(loc, lastmod) {
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

export default {
    async fetch() {
        let posts = [];
        let degraded = false;
        try {
            posts = await listPostSummaries({ limit: 1000 });
        } catch (err) {
            console.error('[sitemap] artigos indisponíveis, gerando só páginas estáticas:', err);
            degraded = true;
        }

        const latest = posts.reduce((max, p) => {
            const d = p.updated_at || p.published_at;
            return d && (!max || d > max) ? d : max;
        }, null);

        const entries = [
            ...STATIC_PAGES.map((p) => urlEntry(`${SITE_URL}${p.path}`)),
            urlEntry(BLOG_URL, latest ? isoDate(latest) : ''),
            ...posts.map((p) => urlEntry(`${BLOG_URL}/${p.slug}`, isoDate(p.updated_at || p.published_at))),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': degraded ? 'public, max-age=0, s-maxage=60' : 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
            },
        });
    },
};
