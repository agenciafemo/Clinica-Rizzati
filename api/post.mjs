// GET /blog/<slug> — artigo renderizado no servidor, com dados estruturados para Google e IAs.

import { renderPage, WHATSAPP_ICON } from './_lib/layout.mjs';
import { getPublishedPost, listPostSummaries } from './_lib/supabase.mjs';
import {
    esc, formatDate, isoDate, imagePath, absoluteUrl, stripTags, wordCount, enhanceBody,
    parseKeywords, parseFaq, htmlResponse, initials,
} from './_lib/html.mjs';
import { BLOG_URL, SITE_URL, CLINIC_ID, WEBSITE_ID, WHATSAPP_URL, clinicNode, getAuthor, authorNode } from './_lib/site.mjs';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CSS = `
.read-progress { position: fixed; top: 80px; left: 0; right: 0; height: 3px; z-index: 999; background: transparent; pointer-events: none; }
.read-progress span { display: block; height: 100%; width: 0; background: var(--bronze); transition: width 0.1s linear; }

.article-hero { background: var(--bege-claro); padding: 56px 6vw 48px; border-bottom: 1px solid var(--line); }
.article-hero-inner { max-width: 820px; margin: 0 auto; }
.breadcrumb ol { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--font-sans); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(69,82,94,0.55); margin-bottom: 26px; }
.breadcrumb li + li::before { content: '/'; margin-right: 8px; opacity: 0.5; }
.breadcrumb a:hover { color: var(--bronze); }
.article-category { font-family: var(--font-sans); font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--bronze); display: block; margin-bottom: 14px; }
.article-title { font-family: var(--font-serif); font-size: clamp(2.2rem, 4.6vw, 3.4rem); font-weight: 500; color: var(--ink); line-height: 1.12; margin-bottom: 18px; letter-spacing: -0.005em; }
.article-dek { font-family: var(--font-serif); font-size: clamp(1.2rem, 2vw, 1.4rem); line-height: 1.55; color: rgba(69,82,94,0.78); margin-bottom: 28px; }
.article-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 28px; font-family: var(--font-sans); }
.byline { display: flex; align-items: center; gap: 12px; }
.byline-avatar { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; object-position: top; background: var(--navy); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 500; flex-shrink: 0; }
.byline-name { font-size: 0.95rem; color: var(--ink); }
.byline-name a { font-weight: 500; border-bottom: 1px solid rgba(200,136,108,0.4); }
.byline-name a:hover { color: var(--bronze); }
.byline-cred { font-size: 0.78rem; color: rgba(69,82,94,0.6); letter-spacing: 0.03em; }
.meta-facts { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.82rem; color: rgba(69,82,94,0.68); }
.meta-facts span + span::before { content: '·'; margin-right: 18px; opacity: 0.5; }

.article-layout { max-width: 1180px; margin: 0 auto; padding: 52px 6vw 70px; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 72px; align-items: start; }
.article-main { min-width: 0; max-width: 760px; }

.article-cover { margin: 0 0 40px; }
.article-cover img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; display: block; border-radius: 6px; background: var(--gray-light); }

.summary-box { background: var(--white); border: 1px solid rgba(200,136,108,0.35); border-left: 4px solid var(--bronze); border-radius: 0 6px 6px 0; padding: 22px 26px; margin-bottom: 32px; }
.summary-box h2 { font-family: var(--font-sans); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--bronze); margin-bottom: 8px; }
.summary-box p { font-family: var(--font-serif); font-size: 1.25rem; line-height: 1.6; color: var(--ink); }

.toc { background: var(--bege-claro); border-radius: 6px; padding: 20px 26px; margin-bottom: 40px; }
.toc summary { font-family: var(--font-sans); font-size: 11.5px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
.toc summary::-webkit-details-marker { display: none; }
.toc summary::after { content: '+'; font-size: 1.1rem; color: var(--bronze); transition: transform 0.25s ease; }
.toc details[open] summary::after { transform: rotate(45deg); }
.toc ol { margin: 14px 0 0; padding-left: 1.2rem; font-family: var(--font-sans); font-size: 0.95rem; line-height: 1.5; color: var(--navy); }
.toc li { margin: 8px 0; padding-left: 4px; }
.toc li::marker { color: var(--bronze); }
.toc a:hover { color: var(--bronze); }

.article-body { font-family: var(--font-serif); font-size: 1.28rem; line-height: 1.8; color: #4a5763; }
.article-body > * + * { margin-top: 1.1em; }
.article-body h2 { font-family: var(--font-serif); font-weight: 600; font-size: clamp(1.7rem, 2.6vw, 2.05rem); line-height: 1.25; color: var(--ink); margin-top: 2em; padding-left: 20px; position: relative; }
.article-body h2::before { content: ''; position: absolute; left: 0; top: 0.22em; bottom: 0.22em; width: 3px; background: var(--bronze); }
.article-body h3 { font-family: var(--font-serif); font-weight: 600; font-size: 1.5rem; color: var(--ink); margin-top: 1.6em; }
.article-body h2 + *, .article-body h3 + * { margin-top: 0.6em; }
.article-body ul, .article-body ol { padding-left: 1.4em; }
.article-body li + li { margin-top: 0.5em; }
.article-body li::marker { color: var(--bronze); }
.article-body strong { color: var(--ink); font-weight: 600; }
.article-body a { color: var(--bronze-dark); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
.article-body blockquote { border-left: 3px solid var(--azure); padding: 4px 0 4px 24px; font-style: italic; color: var(--ink); }
.article-body img { border-radius: 6px; height: auto; }
.article-body table { display: block; overflow-x: auto; border-collapse: collapse; font-family: var(--font-sans); font-size: 0.95rem; }
.article-body th, .article-body td { border: 1px solid var(--line); padding: 10px 14px; text-align: left; }
.article-body th { background: var(--bege-claro); color: var(--ink); }

.faq { margin-top: 56px; }
.faq > h2 { font-family: var(--font-serif); font-weight: 600; font-size: clamp(1.7rem, 2.6vw, 2.05rem); color: var(--ink); margin-bottom: 18px; }
.faq-item { border-top: 1px solid var(--line); }
.faq-item:last-child { border-bottom: 1px solid var(--line); }
.faq-item summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: 20px; padding: 20px 0; font-family: var(--font-serif); font-size: 1.3rem; font-weight: 600; line-height: 1.35; color: var(--ink); }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: '+'; font-family: var(--font-sans); font-weight: 300; font-size: 1.6rem; line-height: 1; color: var(--bronze); transition: transform 0.25s ease; flex-shrink: 0; }
.faq-item details[open] summary::after { transform: rotate(45deg); }
.faq-item summary h3 { font: inherit; }
.faq-answer { font-family: var(--font-serif); font-size: 1.2rem; line-height: 1.7; color: #4a5763; padding: 0 0 22px; }

.article-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 44px; font-family: var(--font-sans); }
.article-tags-label { font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(69,82,94,0.6); margin-right: 6px; }
.article-tags span.tag { font-size: 0.8rem; color: var(--navy); background: var(--bege-claro); border-radius: 999px; padding: 6px 14px; }

.disclaimer { margin-top: 36px; font-family: var(--font-sans); font-size: 0.85rem; line-height: 1.6; color: rgba(69,82,94,0.72); background: var(--gray-light); border-radius: 6px; padding: 16px 20px; }
.disclaimer strong { color: var(--ink); font-weight: 500; }

.share { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--line); font-family: var(--font-sans); }
.share-label { font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(69,82,94,0.6); margin-right: 8px; }
.share a, .share button { display: inline-flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--ink); border: 1px solid rgba(117,136,153,0.3); border-radius: 999px; padding: 8px 16px; transition: all 0.25s ease; }
.share a:hover, .share button:hover { border-color: var(--bronze); color: var(--bronze); }
.share svg { width: 15px; height: 15px; }

.author-card { display: grid; grid-template-columns: 96px 1fr; gap: 24px; align-items: center; margin-top: 40px; background: var(--bege-claro); border-radius: 8px; padding: 28px 30px; }
.author-card-photo { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; object-position: top; background: var(--navy); color: var(--white); display: flex; align-items: center; justify-content: center; font-family: var(--font-sans); font-size: 1.4rem; }
.author-card-label { font-family: var(--font-sans); font-size: 10.5px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--bronze); }
.author-card-name { font-family: var(--font-serif); font-size: 1.55rem; font-weight: 600; color: var(--ink); line-height: 1.2; margin: 2px 0; }
.author-card-cred { font-family: var(--font-sans); font-size: 0.8rem; color: rgba(69,82,94,0.65); letter-spacing: 0.03em; margin-bottom: 8px; }
.author-card-bio { font-family: var(--font-serif); font-size: 1.1rem; line-height: 1.55; color: #4a5763; }
.author-card-link { display: inline-block; margin-top: 10px; font-family: var(--font-sans); font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--bronze-dark); border-bottom: 1px solid rgba(200,136,108,0.4); }
.reviewed { margin-top: 14px; font-family: var(--font-sans); font-size: 0.85rem; color: rgba(69,82,94,0.72); }
.reviewed a { color: var(--ink); font-weight: 500; border-bottom: 1px solid rgba(200,136,108,0.4); }

.article-sidebar { position: sticky; top: 108px; display: flex; flex-direction: column; gap: 32px; }
.sidebar-title { font-family: var(--font-sans); font-size: 11.5px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink); padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid rgba(200,136,108,0.3); }
.related { display: flex; flex-direction: column; gap: 20px; list-style: none; }
.related-card { position: relative; display: grid; grid-template-columns: 82px 1fr; gap: 14px; align-items: center; }
.related-card img { width: 82px; height: 82px; object-fit: cover; border-radius: 5px; background: var(--gray-light); }
.related-cat { display: block; font-family: var(--font-sans); font-size: 9.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--bronze); margin-bottom: 4px; }
.related-card a { font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; line-height: 1.28; color: var(--ink); }
.related-card a::after { content: ''; position: absolute; inset: 0; }
.related-card:hover a { color: var(--bronze); }
.sidebar-cta { background: var(--ink); color: var(--white); border-radius: 8px; padding: 28px 24px; }
.sidebar-cta p { font-family: var(--font-serif); font-size: 1.3rem; line-height: 1.35; margin-bottom: 18px; }
.sidebar-cta a { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--bronze); color: var(--white); font-family: var(--font-sans); font-size: 0.78rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 13px 16px; border-radius: 3px; }
.sidebar-cta a:hover { background: var(--bronze-dark); }
.sidebar-cta svg { width: 16px; height: 16px; }

.not-found { max-width: 640px; margin: 0 auto; padding: 110px 6vw; text-align: center; }
.not-found h1 { font-family: var(--font-serif); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 500; color: var(--ink); margin-bottom: 14px; }
.not-found p { font-family: var(--font-serif); font-size: 1.25rem; color: rgba(69,82,94,0.75); margin-bottom: 28px; }
.not-found a { font-family: var(--font-sans); font-size: 0.85rem; letter-spacing: 0.12em; text-transform: uppercase; background: var(--navy); color: var(--white); padding: 14px 30px; display: inline-block; }

@media (max-width: 992px) {
    .article-layout { grid-template-columns: 1fr; gap: 56px; }
    .article-main { max-width: none; }
    .article-sidebar { position: static; }
}
@media (max-width: 640px) {
    .article-hero { padding: 40px 1.5rem 36px; }
    .article-layout { padding: 32px 1.5rem 56px; }
    .article-body { font-size: 1.18rem; }
    .meta-facts { flex-direction: column; gap: 2px; }
    .meta-facts span + span::before { content: none; }
    .author-card { grid-template-columns: 1fr; text-align: left; padding: 24px; }
    .summary-box, .toc { padding: 18px 20px; }
}
`;

const SCRIPT = `
(function () {
    var bar = document.querySelector('.read-progress span');
    var article = document.querySelector('.article-main');
    if (bar && article) {
        var ticking = false;
        function update() {
            var rect = article.getBoundingClientRect();
            var total = rect.height - window.innerHeight;
            var pct = total > 0 ? Math.min(100, Math.max(0, (-rect.top / total) * 100)) : 100;
            bar.style.width = pct + '%';
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    var copyBtn = document.getElementById('copyLink');
    if (copyBtn && navigator.clipboard) {
        copyBtn.addEventListener('click', function () {
            var label = copyBtn.querySelector('span');
            navigator.clipboard.writeText(copyBtn.getAttribute('data-url')).then(function () {
                label.textContent = 'Link copiado';
                setTimeout(function () { label.textContent = 'Copiar link'; }, 2200);
            });
        });
    } else if (copyBtn) {
        copyBtn.hidden = true;
    }
})();
`;

const ICONS = {
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.9 8.6H3.6V20h3.3V8.6zM5.3 3.5a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.5c0-3.1-1.6-5.1-4.3-5.1-1.5 0-2.5.8-2.9 1.6V8.6H10V20h3.3v-6c0-1.6.7-2.7 2-2.7s1.9 1 1.9 2.7v6h3.3v-6.5z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/></svg>',
};

function postUrl(slug) {
    return `${BLOG_URL}/${slug}`;
}

function pageTitle(post) {
    if (post.seo_title) return post.seo_title;
    const withBrand = `${post.title} | Clínica Rizzatti`;
    return withBrand.length <= 65 ? withBrand : post.title;
}

function pageDescription(post) {
    const raw = post.meta_description || post.excerpt || stripTags(post.body_html);
    return raw.length > 160 ? `${raw.slice(0, 157).replace(/\s+\S*$/, '')}…` : raw;
}

function avatar(author, className, size) {
    return author.image
        ? `<img class="${className}" src="${esc(author.image)}" alt="${esc(author.name)}" width="${size}" height="${size}" loading="lazy">`
        : `<span class="${className}" aria-hidden="true">${esc(initials(author.name))}</span>`;
}

function renderHero(post, author) {
    const published = formatDate(post.published_at);
    const updatedDiffers = post.updated_at && post.published_at
        && new Date(post.updated_at).toDateString() !== new Date(post.published_at).toDateString();

    return `
    <header class="article-hero">
        <div class="article-hero-inner">
            <nav class="breadcrumb" aria-label="Você está em">
                <ol>
                    <li><a href="/">Home</a></li>
                    <li><a href="/blog">Blog</a></li>
                    <li aria-current="page">${esc(post.category || 'Artigo')}</li>
                </ol>
            </nav>
            <span class="article-category">${esc(post.category || 'Blog')}</span>
            <h1 class="article-title">${esc(post.title)}</h1>
            ${post.excerpt ? `<p class="article-dek">${esc(post.excerpt)}</p>` : ''}
            <div class="article-meta">
                <div class="byline">
                    ${avatar(author, 'byline-avatar', 46)}
                    <div>
                        <div class="byline-name">Por <a href="${esc(author.url)}" rel="author">${esc(author.name)}</a></div>
                        ${author.credentials ? `<div class="byline-cred">${esc(author.credentials)}</div>` : ''}
                    </div>
                </div>
                <div class="meta-facts">
                    ${published ? `<span>Publicado em <time datetime="${isoDate(post.published_at)}">${esc(published)}</time></span>` : ''}
                    ${updatedDiffers ? `<span>Atualizado em <time datetime="${isoDate(post.updated_at)}">${esc(formatDate(post.updated_at))}</time></span>` : ''}
                    ${post.read_time_minutes ? `<span>${post.read_time_minutes} min de leitura</span>` : ''}
                </div>
            </div>
        </div>
    </header>`;
}

function renderToc(toc, hasFaq) {
    const items = [...toc];
    if (hasFaq) items.push({ id: 'perguntas-frequentes', text: 'Perguntas frequentes' });
    if (items.length < 3) return '';
    return `
        <nav class="toc" aria-label="Neste artigo">
            <details open>
                <summary>Neste artigo</summary>
                <ol>${items.map((i) => `<li><a href="#${esc(i.id)}">${esc(i.text)}</a></li>`).join('')}</ol>
            </details>
        </nav>`;
}

function renderFaq(faq) {
    if (!faq.length) return '';
    return `
        <section class="faq" id="perguntas-frequentes" aria-labelledby="faqTitle">
            <h2 id="faqTitle">Perguntas frequentes</h2>
            ${faq.map((item, i) => `
            <div class="faq-item">
                <details${i === 0 ? ' open' : ''}>
                    <summary><h3>${esc(item.question)}</h3></summary>
                    <div class="faq-answer">${esc(item.answer).replace(/\n+/g, '<br>')}</div>
                </details>
            </div>`).join('')}
        </section>`;
}

function renderShare(post, url) {
    const text = encodeURIComponent(`${post.title} ${url}`);
    const u = encodeURIComponent(url);
    return `
        <div class="share">
            <span class="share-label">Compartilhe</span>
            <a href="https://wa.me/?text=${text}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WHATSAPP_ICON}</svg>WhatsApp</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">${ICONS.facebook}Facebook</a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener">${ICONS.linkedin}LinkedIn</a>
            <button type="button" id="copyLink" data-url="${esc(url)}">${ICONS.link}<span>Copiar link</span></button>
        </div>`;
}

function renderAuthorCard(post, author) {
    const reviewer = post.reviewed_by && post.reviewed_by !== post.author ? getAuthor(post.reviewed_by) : null;
    return `
        <aside class="author-card" aria-label="Sobre o autor">
            ${avatar(author, 'author-card-photo', 96)}
            <div>
                <span class="author-card-label">Escrito por</span>
                <p class="author-card-name">${esc(author.name)}</p>
                ${author.credentials ? `<p class="author-card-cred">${esc(author.jobTitle)} · ${esc(author.credentials)}</p>` : ''}
                <p class="author-card-bio">${esc(author.bio)}</p>
                <a class="author-card-link" href="${esc(author.url)}">${author.type === 'Person' ? 'Ver perfil completo' : 'Conheça o corpo clínico'}</a>
            </div>
        </aside>
        ${reviewer ? `<p class="reviewed">Conteúdo revisado por <a href="${esc(reviewer.url)}">${esc(reviewer.name)}</a>${reviewer.credentials ? ` (${esc(reviewer.credentials)})` : ''}${post.updated_at ? ` em <time datetime="${isoDate(post.updated_at)}">${esc(formatDate(post.updated_at))}</time>` : ''}.</p>` : ''}`;
}

function pickRelated(post, summaries) {
    const others = summaries.filter((p) => p.slug !== post.slug);
    const sameCat = others.filter((p) => post.category && p.category === post.category);
    const rest = others.filter((p) => !sameCat.includes(p));
    return [...sameCat, ...rest].slice(0, 4);
}

function renderSidebar(related) {
    return `
    <aside class="article-sidebar">
        ${related.length ? `
        <div>
            <h2 class="sidebar-title">Continue lendo</h2>
            <ul class="related">
                ${related.map((p) => `
                <li class="related-card">
                    <img src="${esc(imagePath(p.cover_image_url))}" alt="" width="82" height="82" loading="lazy" decoding="async">
                    <div>
                        <span class="related-cat">${esc(p.category || 'Blog')}</span>
                        <a href="/blog/${encodeURIComponent(p.slug)}">${esc(p.title)}</a>
                    </div>
                </li>`).join('')}
            </ul>
        </div>` : ''}
        <div class="sidebar-cta">
            <p>Quer uma avaliação personalizada com nossa equipe?</p>
            <a href="${WHATSAPP_URL}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WHATSAPP_ICON}</svg>Agendar via WhatsApp</a>
        </div>
    </aside>`;
}

function structuredData(post, { url, title, description, image, faq, keywords, words }) {
    const reviewer = post.reviewed_by ? authorNode(post.reviewed_by) : null;
    const graph = [
        {
            '@type': 'MedicalWebPage',
            '@id': `${url}#webpage`,
            url,
            name: title,
            description,
            inLanguage: 'pt-BR',
            isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID, url: `${SITE_URL}/`, name: 'Rizzatti Dermatologia e Saúde' },
            breadcrumb: { '@id': `${url}#breadcrumb` },
            primaryImageOfPage: { '@type': 'ImageObject', url: image },
            datePublished: isoDate(post.published_at),
            dateModified: isoDate(post.updated_at || post.published_at),
            specialty: 'https://schema.org/Dermatology',
            audience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
            ...(reviewer ? { reviewedBy: reviewer, lastReviewed: isoDate(post.updated_at || post.published_at) } : {}),
        },
        {
            '@type': 'BlogPosting',
            '@id': `${url}#article`,
            headline: post.title.slice(0, 110),
            description,
            image: [image],
            datePublished: isoDate(post.published_at),
            dateModified: isoDate(post.updated_at || post.published_at),
            author: authorNode(post.author),
            publisher: { '@id': CLINIC_ID },
            mainEntityOfPage: { '@id': `${url}#webpage` },
            isPartOf: { '@type': 'Blog', '@id': `${BLOG_URL}#blog`, name: 'Blog de Dermatologia Rizzatti', url: BLOG_URL },
            articleSection: post.category || undefined,
            keywords: keywords.length ? keywords : undefined,
            wordCount: words,
            inLanguage: 'pt-BR',
            ...(post.summary ? { abstract: post.summary } : {}),
        },
        {
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
                { '@type': 'ListItem', position: 3, name: post.title, item: url },
            ],
        },
        clinicNode(),
    ];

    if (faq.length) {
        graph.push({
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
        });
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

function renderNotFound() {
    return renderPage({
        title: 'Artigo não encontrado | Clínica Rizzatti',
        description: 'O artigo que você procura não está disponível.',
        canonical: BLOG_URL,
        robots: 'noindex, follow',
        css: CSS,
        body: `<main class="not-found">
            <h1>Artigo não encontrado</h1>
            <p>Este conteúdo pode ter sido removido ou o endereço está incorreto.</p>
            <a href="/blog">Ver todos os artigos</a>
        </main>`,
    });
}

export default {
    async fetch(request) {
        const slug = new URL(request.url).searchParams.get('slug') || '';
        if (!SLUG_PATTERN.test(slug)) {
            return htmlResponse(renderNotFound(), { status: 404 });
        }

        const [postResult, summariesResult] = await Promise.allSettled([
            getPublishedPost(slug),
            listPostSummaries(),
        ]);

        if (postResult.status === 'rejected') {
            console.error('[post] erro ao buscar post:', postResult.reason);
            const res = htmlResponse(renderPage({
                title: 'Blog | Clínica Rizzatti',
                description: 'Não foi possível carregar o artigo agora.',
                canonical: postUrl(slug),
                robots: 'noindex, follow',
                css: CSS,
                body: `<main class="not-found"><h1>Não foi possível carregar o artigo</h1><p>Tente novamente em instantes.</p><a href="/blog">Voltar ao blog</a></main>`,
            }), { status: 503, cache: 'none' });
            res.headers.set('Retry-After', '120');
            return res;
        }

        const post = postResult.value;
        if (!post) {
            return htmlResponse(renderNotFound(), { status: 404 });
        }

        const summaries = summariesResult.status === 'fulfilled' ? summariesResult.value : [];
        const author = getAuthor(post.author);
        const url = postUrl(post.slug);
        const title = pageTitle(post);
        const description = pageDescription(post);
        const coverPath = imagePath(post.cover_image_url);
        const image = absoluteUrl(coverPath);
        const coverAlt = post.cover_image_alt || post.title;
        const faq = parseFaq(post.faq);
        const keywords = parseKeywords([post.focus_keyword, post.keywords].filter(Boolean).join(','));
        const { body, toc } = enhanceBody(post.body_html);
        const words = wordCount(post.body_html);

        const articleMeta = [
            `<meta property="article:published_time" content="${esc(isoDate(post.published_at))}">`,
            `<meta property="article:modified_time" content="${esc(isoDate(post.updated_at || post.published_at))}">`,
            post.category ? `<meta property="article:section" content="${esc(post.category)}">` : '',
            `<meta property="article:author" content="${esc(absoluteUrl(author.url))}">`,
            ...keywords.map((k) => `<meta property="article:tag" content="${esc(k)}">`),
        ].filter(Boolean).join('\n    ');

        const html = renderPage({
            title,
            description,
            canonical: url,
            ogType: 'article',
            ogImage: image,
            ogImageAlt: coverAlt,
            extraMeta: articleMeta,
            preloadImage: post.cover_image_url ? coverPath : '',
            structuredData: structuredData(post, { url, title, description, image, faq, keywords, words }),
            css: CSS,
            script: SCRIPT,
            body: `
    <div class="read-progress" aria-hidden="true"><span></span></div>
    <main>
    ${renderHero(post, author)}
    <div class="article-layout">
        <div class="article-main">
            <article>
                ${post.cover_image_url ? `<figure class="article-cover"><img src="${esc(coverPath)}" alt="${esc(coverAlt)}" width="1400" height="788" fetchpriority="high"></figure>` : ''}
                ${post.summary ? `<section class="summary-box" aria-labelledby="summaryTitle"><h2 id="summaryTitle">Em resumo</h2><p>${esc(post.summary)}</p></section>` : ''}
                ${renderToc(toc, faq.length > 0)}
                <div class="article-body">${body}</div>
                ${renderFaq(faq)}
                ${keywords.length ? `<div class="article-tags"><span class="article-tags-label">Assuntos</span>${keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}
                <p class="disclaimer"><strong>Aviso importante:</strong> este conteúdo tem caráter informativo e não substitui a consulta médica. Diagnóstico e tratamento dependem de avaliação individual com um dermatologista.</p>
            </article>
            ${renderShare(post, url)}
            ${renderAuthorCard(post, author)}
        </div>
        ${renderSidebar(pickRelated(post, summaries))}
    </div>
    </main>`,
        });

        return htmlResponse(html);
    },
};
