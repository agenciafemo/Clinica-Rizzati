// Utilitários de renderização: escape, datas, imagens, índice e leitura.

import { SITE_URL } from './site.mjs';

const TIME_ZONE = 'America/Sao_Paulo';

export function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// JSON dentro de <script type="application/ld+json"> não pode conter "</script>".
export function jsonLd(data) {
    return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function formatDate(iso, style = 'long') {
    if (!iso) return '';
    const opts = style === 'short'
        ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE }
        : { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE };
    return new Date(iso).toLocaleDateString('pt-BR', opts);
}

export function isoDate(iso) {
    return iso ? new Date(iso).toISOString() : '';
}

// Aceita URL http(s) ou nome de arquivo do próprio site; qualquer outra coisa vira o fallback.
export function imagePath(value, fallback = '/CLINICA.jpg') {
    const v = String(value || '').trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w .\-/]+\.(jpe?g|png|webp|avif|gif)$/i.test(v)) {
        return encodeURI(`/${v.replace(/^\.?\/+/, '')}`);
    }
    return fallback;
}

export function absoluteUrl(path) {
    return /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path}`;
}

export function stripTags(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function wordCount(html) {
    const text = stripTags(html);
    return text ? text.split(' ').length : 0;
}

export function readingMinutes(html) {
    return Math.max(1, Math.ceil(wordCount(html) / 200));
}

export function normalize(str) {
    return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function slugifyHeading(text) {
    return normalize(text).replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70) || 'secao';
}

// Garante id em cada <h2> (âncoras do índice) e lazy-loading nas imagens do corpo.
export function enhanceBody(html) {
    const used = new Set();
    const toc = [];

    const body = String(html || '')
        .replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs, inner) => {
            const text = stripTags(inner);
            const existing = attrs.match(/\sid\s*=\s*["']([^"']+)["']/i);
            let id = existing ? existing[1] : slugifyHeading(text);
            if (!existing) {
                let n = 2;
                const base = id;
                while (used.has(id)) id = `${base}-${n++}`;
            }
            used.add(id);
            toc.push({ id, text });
            return existing ? match : `<h2${attrs} id="${id}">${inner}</h2>`;
        })
        .replace(/<img(?![^>]*\sloading=)/gi, '<img loading="lazy" decoding="async"');

    return { body, toc };
}

export function parseKeywords(value) {
    return String(value || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
}

export function parseFaq(value) {
    let list = value;
    if (typeof list === 'string') {
        try { list = JSON.parse(list); } catch { list = []; }
    }
    if (!Array.isArray(list)) return [];
    return list
        .map((item) => ({ question: String(item?.question || '').trim(), answer: String(item?.answer || '').trim() }))
        .filter((item) => item.question && item.answer);
}

export function initials(name) {
    return String(name || 'RZ')
        .replace(/^(Dra?\.)\s*/i, '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

export function htmlResponse(html, { status = 200, cache = 'public' } = {}) {
    const cacheControl = cache === 'none'
        ? 'no-store'
        : 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400';
    return new Response(html, {
        status,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': cacheControl,
        },
    });
}
