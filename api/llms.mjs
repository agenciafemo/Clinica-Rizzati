// GET /llms.txt — resumo do site em Markdown para assistentes de IA (formato llmstxt.org).
// Sinal de baixo custo: nenhum grande provedor confirma usar este arquivo; a visibilidade
// em IA depende principalmente do HTML renderizado no servidor e dos dados estruturados.

import { listPublishedPosts } from './_lib/supabase.mjs';
import { SITE_URL, BLOG_URL, CLINIC, WHATSAPP_URL } from './_lib/site.mjs';
import { STATIC_PAGES } from './_lib/pages.mjs';

function link(page) {
    return `- [${page.title}](${SITE_URL}${page.path}): ${page.description}`;
}

export default {
    async fetch() {
        let posts = [];
        let degraded = false;
        try {
            posts = await listPublishedPosts({ limit: 200 });
        } catch (err) {
            console.error('[llms] artigos indisponíveis:', err);
            degraded = true;
        }

        const section = (name) => STATIC_PAGES.filter((p) => p.section === name).map(link).join('\n');
        const a = CLINIC.address;

        const text = `# ${CLINIC.name}

> Clínica de dermatologia em ${a.addressLocality}-${a.addressRegion}, no Passeio Pedra Branca. Atende dermatologia clínica, dermatologia cirúrgica (incluindo cirurgia micrográfica de Mohs), dermatologia estética, dermatologia corporal e tricologia, com os dermatologistas Dra. Karoline Rizzatti e Dr. Timotio Dorn.

- Endereço: ${a.streetAddress}, ${a.addressLocality}-${a.addressRegion}, Brasil
- Agendamento: WhatsApp (48) 99173-5899 — ${WHATSAPP_URL}
- Instagram: ${CLINIC.instagram}
- O conteúdo do blog é informativo e não substitui consulta médica.

## A clínica

${section('clinica')}

## Corpo clínico

${section('medicos')}

## Especialidades

${section('especialidades')}

## Blog

- [Blog de Dermatologia Rizzatti](${BLOG_URL}): artigos escritos pela equipe médica.
${posts.map((p) => `- [${p.title}](${BLOG_URL}/${p.slug}): ${(p.summary || p.meta_description || p.excerpt || '').replace(/\s+/g, ' ').trim()}`).join('\n')}
`;

        return new Response(text, {
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Cache-Control': degraded ? 'public, max-age=0, s-maxage=60' : 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    },
};
