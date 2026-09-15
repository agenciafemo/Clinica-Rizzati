// GET /blog — listagem do blog renderizada no servidor (legível por Google e crawlers de IA).

import { renderPage } from './_lib/layout.mjs';
import { listPublishedPosts } from './_lib/supabase.mjs';
import { esc, formatDate, isoDate, imagePath, absoluteUrl, normalize, parseKeywords, htmlResponse, initials } from './_lib/html.mjs';
import { BLOG_URL, SITE_URL, CLINIC_ID, WEBSITE_ID, clinicNode, getAuthor, authorNode } from './_lib/site.mjs';

const TITLE = 'Blog de Dermatologia | Clínica Rizzatti em Palhoça-SC';
const DESCRIPTION = 'Artigos escritos por dermatologistas da Clínica Rizzatti, em Palhoça-SC, sobre câncer de pele, queda de cabelo, tratamentos estéticos e cuidados com a pele.';

const CSS = `
.blog-header { background: var(--bege-claro); padding: 72px 6vw 44px; text-align: center; border-bottom: 1px solid var(--line); }
.blog-header-tag { font-family: var(--font-sans); font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--bronze); display: block; margin-bottom: 14px; }
.blog-header h1 { font-family: var(--font-serif); font-size: clamp(2.4rem, 5vw, 3.8rem); font-weight: 400; line-height: 1.1; color: var(--ink); margin-bottom: 14px; }
.blog-header h1 em { color: var(--bronze); }
.blog-header-sub { font-family: var(--font-serif); font-size: 1.3rem; color: rgba(69,82,94,0.75); max-width: 620px; margin: 0 auto 30px; line-height: 1.5; }
.blog-search { position: relative; max-width: 560px; margin: 0 auto 26px; }
.blog-search svg { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--navy); pointer-events: none; }
.blog-search input { width: 100%; font-family: var(--font-sans); font-size: 0.98rem; color: var(--ink); background: var(--white); border: 1px solid rgba(117,136,153,0.25); border-radius: 999px; padding: 15px 22px 15px 52px; transition: border-color 0.25s ease, box-shadow 0.25s ease; }
.blog-search input:focus { outline: none; border-color: var(--bronze); box-shadow: 0 0 0 4px rgba(200,136,108,0.14); }
.blog-filters { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.blog-filter { font-family: var(--font-sans); font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--navy); background: var(--white); border: 1px solid rgba(117,136,153,0.25); border-radius: 999px; padding: 9px 18px; transition: all 0.25s ease; }
.blog-filter span { opacity: 0.55; margin-left: 4px; }
.blog-filter:hover { border-color: var(--navy); }
.blog-filter[aria-pressed="true"] { background: var(--navy); border-color: var(--navy); color: var(--white); }

.blog-wrap { max-width: 1200px; margin: 0 auto; padding: 64px 6vw 90px; }

.featured { position: relative; display: grid; grid-template-columns: 1.3fr 1fr; gap: 52px; align-items: center; margin-bottom: 76px; }
.featured-img { aspect-ratio: 16 / 10; overflow: hidden; border-radius: 6px; background: var(--gray-light); }
.featured-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
.featured:hover .featured-img img { transform: scale(1.04); }
.featured-label { display: flex; align-items: center; gap: 12px; font-family: var(--font-sans); font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px; }
.featured-label .badge { color: var(--white); background: var(--bronze); padding: 5px 10px; border-radius: 2px; }
.featured-label .cat { color: var(--bronze); }
.featured h2 { font-family: var(--font-serif); font-size: clamp(1.9rem, 3vw, 2.6rem); font-weight: 500; line-height: 1.15; color: var(--ink); margin-bottom: 16px; }
.featured h2 a::after { content: ''; position: absolute; inset: 0; }
.featured:hover h2 a { color: var(--bronze); }
.featured-excerpt { font-family: var(--font-serif); font-size: 1.22rem; line-height: 1.6; color: rgba(69,82,94,0.8); margin-bottom: 24px; }

.byline { display: flex; align-items: center; gap: 12px; font-family: var(--font-sans); }
.byline-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; object-position: top; flex-shrink: 0; background: var(--navy); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 500; }
.byline-name { font-size: 0.92rem; font-weight: 500; color: var(--ink); }
.byline-meta { font-size: 0.8rem; color: rgba(69,82,94,0.62); letter-spacing: 0.02em; }

.section-head { display: flex; align-items: center; gap: 20px; margin-bottom: 36px; }
.section-head h2 { font-family: var(--font-sans); font-size: 12px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink); white-space: nowrap; }
.section-head::after { content: ''; flex: 1; height: 1px; background: var(--line); }

.post-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 48px 36px; }
.post-card { position: relative; display: flex; flex-direction: column; }
.post-card[hidden] { display: none; }
.post-card-img { aspect-ratio: 16 / 10; overflow: hidden; border-radius: 5px; background: var(--gray-light); margin-bottom: 20px; }
.post-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
.post-card:hover .post-card-img img { transform: scale(1.05); }
.post-card-cat { font-family: var(--font-sans); font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--bronze); margin-bottom: 10px; }
.post-card h3 { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 500; line-height: 1.25; color: var(--ink); margin-bottom: 10px; }
.post-card h3 a::after { content: ''; position: absolute; inset: 0; }
.post-card:hover h3 a { color: var(--bronze); }
.post-card-excerpt { font-family: var(--font-serif); font-size: 1.08rem; line-height: 1.55; color: rgba(69,82,94,0.75); margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.post-card-meta { margin-top: auto; font-family: var(--font-sans); font-size: 0.78rem; color: rgba(69,82,94,0.6); letter-spacing: 0.02em; }

.blog-message { text-align: center; padding: 60px 20px; font-family: var(--font-serif); font-size: 1.3rem; color: rgba(69,82,94,0.65); }
.blog-message a { color: var(--bronze); text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 992px) {
    .featured { grid-template-columns: 1fr; gap: 26px; margin-bottom: 60px; }
    .post-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
    .blog-header { padding: 52px 1.5rem 34px; }
    .blog-wrap { padding: 44px 1.5rem 70px; }
    .post-grid { grid-template-columns: 1fr; gap: 42px; }
}
`;

const SCRIPT = `
(function () {
    var input = document.getElementById('blogSearch');
    var filters = document.getElementById('blogFilters');
    var featured = document.getElementById('featured');
    var grid = document.getElementById('postGrid');
    var heading = document.getElementById('gridHeading');
    var empty = document.getElementById('noResults');
    if (!input || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.post-card'));
    var activeCat = 'all';
    var defaultHeading = heading ? heading.textContent : '';

    function normalize(s) {
        return (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
    }

    function apply() {
        var term = normalize(input.value);
        var filtering = term !== '' || activeCat !== 'all';
        var visible = 0;

        cards.forEach(function (card) {
            var isFeaturedCopy = card.hasAttribute('data-featured-copy');
            var matchCat = activeCat === 'all' || card.getAttribute('data-cat') === activeCat;
            var matchTerm = term === '' || card.getAttribute('data-search').indexOf(term) !== -1;
            var show = matchCat && matchTerm && (filtering || !isFeaturedCopy);
            card.hidden = !show;
            if (show) visible++;
        });

        if (featured) featured.hidden = filtering;
        var headWrap = heading && heading.parentElement;
        if (headWrap && headWrap.hasAttribute('data-only-when-filtering')) headWrap.hidden = !filtering;
        if (heading) {
            heading.textContent = filtering
                ? (visible === 1 ? '1 artigo encontrado' : visible + ' artigos encontrados')
                : defaultHeading;
        }
        if (empty) empty.hidden = visible !== 0;
    }

    input.addEventListener('input', apply);

    if (filters) {
        filters.addEventListener('click', function (e) {
            var btn = e.target.closest('.blog-filter');
            if (!btn) return;
            activeCat = btn.getAttribute('data-cat');
            filters.querySelectorAll('.blog-filter').forEach(function (b) {
                b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
            });
            apply();
        });
    }
})();
`;

const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5" stroke-linecap="round"></path></svg>';

function postUrl(post) {
    return `/blog/${encodeURIComponent(post.slug)}`;
}

function bylineAvatar(authorName) {
    const author = getAuthor(authorName);
    return author.image
        ? `<img class="byline-avatar" src="${esc(author.image)}" alt="" width="42" height="42" loading="lazy">`
        : `<span class="byline-avatar" aria-hidden="true">${esc(initials(authorName))}</span>`;
}

function readTime(post) {
    return post.read_time_minutes ? `${post.read_time_minutes} min de leitura` : '';
}

function searchIndex(post) {
    return esc(normalize([post.title, post.excerpt, post.category, post.author, post.focus_keyword, post.keywords].filter(Boolean).join(' ')));
}

function renderFeatured(post) {
    const img = imagePath(post.cover_image_url);
    const alt = post.cover_image_alt || post.title;
    const meta = [formatDate(post.published_at), readTime(post)].filter(Boolean).join(' · ');
    return `
    <article class="featured" id="featured">
        <div class="featured-img">
            <img src="${esc(img)}" alt="${esc(alt)}" width="1400" height="875" fetchpriority="high">
        </div>
        <div>
            <div class="featured-label"><span class="badge">Em destaque</span><span class="cat">${esc(post.category || 'Blog')}</span></div>
            <h2><a href="${postUrl(post)}">${esc(post.title)}</a></h2>
            ${post.excerpt ? `<p class="featured-excerpt">${esc(post.excerpt)}</p>` : ''}
            <div class="byline">
                ${bylineAvatar(post.author)}
                <div>
                    <div class="byline-name">${esc(post.author || 'Equipe Rizzatti')}</div>
                    <div class="byline-meta"><time datetime="${isoDate(post.published_at)}">${esc(meta)}</time></div>
                </div>
            </div>
        </div>
    </article>`;
}

function renderCard(post, { featuredCopy = false } = {}) {
    const img = imagePath(post.cover_image_url);
    const alt = post.cover_image_alt || post.title;
    const meta = [post.author || 'Equipe Rizzatti', formatDate(post.published_at, 'short'), readTime(post)].filter(Boolean).join(' · ');
    return `
        <article class="post-card" data-cat="${esc(post.category || '')}" data-search="${searchIndex(post)}"${featuredCopy ? ' data-featured-copy hidden' : ''}>
            <div class="post-card-img"><img src="${esc(img)}" alt="${esc(alt)}" width="800" height="500" loading="lazy" decoding="async"></div>
            <span class="post-card-cat">${esc(post.category || 'Blog')}</span>
            <h3><a href="${postUrl(post)}">${esc(post.title)}</a></h3>
            ${post.excerpt ? `<p class="post-card-excerpt">${esc(post.excerpt)}</p>` : ''}
            <div class="post-card-meta"><time datetime="${isoDate(post.published_at)}">${esc(meta)}</time></div>
        </article>`;
}

function renderFilters(posts) {
    const counts = new Map();
    posts.forEach((p) => { if (p.category) counts.set(p.category, (counts.get(p.category) || 0) + 1); });
    if (counts.size < 2) return '';
    const buttons = [...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
        .map(([cat, n]) => `<button type="button" class="blog-filter" data-cat="${esc(cat)}" aria-pressed="false">${esc(cat)}<span>${n}</span></button>`)
        .join('');
    return `<div class="blog-filters" id="blogFilters" role="group" aria-label="Filtrar por categoria">
        <button type="button" class="blog-filter" data-cat="all" aria-pressed="true">Todos<span>${posts.length}</span></button>${buttons}
    </div>`;
}

function renderHeader(posts) {
    const hasPosts = posts.length > 0;
    return `
    <header class="blog-header">
        <span class="blog-header-tag">Conteúdo &amp; Cuidado</span>
        <h1>Blog de Dermatologia <em>Rizzatti</em></h1>
        <p class="blog-header-sub">Artigos escritos pela nossa equipe médica sobre pele, cabelo e bem-estar.</p>
        ${hasPosts ? `
        <div class="blog-search" role="search">
            ${SEARCH_ICON}
            <label for="blogSearch" class="sr-only">Buscar artigos</label>
            <input type="search" id="blogSearch" placeholder="Buscar artigos..." autocomplete="off">
        </div>
        ${renderFilters(posts)}` : ''}
    </header>`;
}

function structuredData(posts) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${BLOG_URL}#webpage`,
                url: BLOG_URL,
                name: TITLE,
                description: DESCRIPTION,
                inLanguage: 'pt-BR',
                isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID, url: `${SITE_URL}/`, name: 'Rizzatti Dermatologia e Saúde', publisher: { '@id': CLINIC_ID } },
                breadcrumb: { '@id': `${BLOG_URL}#breadcrumb` },
                mainEntity: { '@id': `${BLOG_URL}#blog` },
            },
            {
                '@type': 'Blog',
                '@id': `${BLOG_URL}#blog`,
                url: BLOG_URL,
                name: 'Blog de Dermatologia Rizzatti',
                description: DESCRIPTION,
                inLanguage: 'pt-BR',
                publisher: { '@id': CLINIC_ID },
                blogPost: posts.map((p) => ({
                    '@type': 'BlogPosting',
                    '@id': `${BLOG_URL}/${p.slug}#article`,
                    url: `${BLOG_URL}/${p.slug}`,
                    headline: p.title,
                    description: p.meta_description || p.excerpt || '',
                    image: absoluteUrl(imagePath(p.cover_image_url)),
                    datePublished: isoDate(p.published_at),
                    dateModified: isoDate(p.updated_at || p.published_at),
                    articleSection: p.category || undefined,
                    keywords: parseKeywords([p.focus_keyword, p.keywords].filter(Boolean).join(',')),
                    author: authorNode(p.author),
                })),
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${BLOG_URL}#breadcrumb`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
                ],
            },
            clinicNode(),
        ],
    };
}

function renderBody(posts) {
    if (posts.length === 0) {
        return `<main>${renderHeader(posts)}
        <div class="blog-wrap"><p class="blog-message">Em breve, novos artigos por aqui.</p></div></main>`;
    }

    const [first, ...rest] = posts;
    const cards = [renderCard(first, { featuredCopy: true }), ...rest.map((p) => renderCard(p))].join('');

    return `<main>${renderHeader(posts)}
    <div class="blog-wrap">
        ${renderFeatured(first)}
        <section aria-labelledby="gridHeading">
            <div class="section-head"${rest.length === 0 ? ' data-only-when-filtering hidden' : ''}><h2 id="gridHeading">Artigos recentes</h2></div>
            <div class="post-grid" id="postGrid">${cards}</div>
            <p class="blog-message" id="noResults" hidden>Nenhum artigo encontrado. Tente outra palavra ou <a href="/blog">veja todos os artigos</a>.</p>
        </section>
    </div></main>`;
}

export default {
    async fetch() {
        let posts;
        try {
            posts = await listPublishedPosts();
        } catch (err) {
            console.error('[blog] erro ao listar posts:', err);
            const html = renderPage({
                title: TITLE,
                description: DESCRIPTION,
                canonical: BLOG_URL,
                robots: 'noindex, follow',
                css: CSS,
                body: `<main>${renderHeader([])}<div class="blog-wrap"><p class="blog-message">Não foi possível carregar os artigos agora. Tente novamente em instantes.</p></div></main>`,
            });
            const res = htmlResponse(html, { status: 503, cache: 'none' });
            res.headers.set('Retry-After', '120');
            return res;
        }

        const first = posts[0];
        const html = renderPage({
            title: TITLE,
            description: DESCRIPTION,
            canonical: BLOG_URL,
            ogImage: first ? absoluteUrl(imagePath(first.cover_image_url)) : undefined,
            preloadImage: first ? imagePath(first.cover_image_url) : '',
            structuredData: structuredData(posts),
            css: CSS,
            body: renderBody(posts),
            script: posts.length ? SCRIPT : '',
        });
        return htmlResponse(html);
    },
};
