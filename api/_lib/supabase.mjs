// Leitura dos posts publicados via API REST do Supabase (PostgREST).
// Usa a publishable key: as políticas RLS garantem que só posts publicados são retornados.

import { supabaseConfig } from './site.mjs';

const TIMEOUT_MS = 8000;

export class SupabaseUnavailableError extends Error {}

async function query(path) {
    const res = await fetch(`${supabaseConfig.url}/rest/v1/${path}`, {
        headers: {
            apikey: supabaseConfig.anonKey,
            Accept: 'application/json',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((err) => {
        throw new SupabaseUnavailableError(`Falha de rede ao consultar o Supabase: ${err.message}`);
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new SupabaseUnavailableError(`Supabase respondeu ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json();
}

// select=* mantém compatibilidade com bancos que ainda não receberam as colunas novas de SEO.
export function listPublishedPosts({ limit = 100 } = {}) {
    return query(`blog_posts?select=*&status=eq.published&order=published_at.desc.nullslast&limit=${limit}`);
}

// Só colunas que existem desde a primeira versão do schema: seguro antes e depois da migração de SEO.
export function listPostSummaries({ limit = 30 } = {}) {
    return query(`blog_posts?select=slug,title,category,cover_image_url,published_at,updated_at&status=eq.published&order=published_at.desc.nullslast&limit=${limit}`);
}

export async function getPublishedPost(slug) {
    const rows = await query(
        `blog_posts?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`
    );
    return rows[0] || null;
}
