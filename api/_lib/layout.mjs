// Estrutura comum das páginas do blog: <head>, menu, CTA, rodapé e scripts.
// Visual idêntico ao restante do site. Todos os links usam caminho absoluto,
// pois as páginas são servidas em /blog e /blog/<slug>.

import { esc, jsonLd } from './html.mjs';
import { SITE_URL, WHATSAPP_URL } from './site.mjs';

const WHATSAPP_ICON = '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>';

export { WHATSAPP_ICON };

const BASE_CSS = `
:root {
    --navy: #758899; --navy-dark: #6b7a8a; --ink: #45525e; --bronze: #c8886c; --bronze-dark: #b0735a;
    --azure: #d7bea8; --white: #FFFFFF; --gray-light: #efebe8; --bege: #e8e0d5; --bege-claro: #f3eee7;
    --line: rgba(117,136,153,0.16);
    --font-primary: 'Bodoni Moda', serif; --font-serif: 'Cormorant Garamond', Georgia, serif; --font-sans: 'Jost', system-ui, sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 350ms; animation-timing-function: ease-in-out; }
html { scroll-behavior: smooth; scroll-padding-top: 100px; }
body { font-family: var(--font-primary); color: var(--navy); line-height: 1.6; overflow-x: hidden; background: var(--white); padding-top: 80px; }
a { text-decoration: none; color: inherit; transition: color 0.3s ease, background 0.3s ease, border-color 0.3s ease; }
button { font-family: var(--font-sans); border: none; cursor: pointer; background: transparent; }
img { max-width: 100%; }
[hidden] { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
:focus-visible { outline: 2px solid var(--bronze); outline-offset: 3px; }

.site-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; height: 80px; padding: 0 3rem; display: flex; justify-content: space-between; align-items: center; background: rgba(117, 136, 153, 0.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(213, 149, 96, 0.15); box-shadow: 0 4px 32px rgba(0, 0, 0, 0.15); }
.logo, .nav-menu, .nav-cta, .nav-divider, .hamburger { position: relative; z-index: 1; }
.logo { display: flex; align-items: center; }
.logo-img { height: 44px; width: auto; display: block; filter: brightness(0) invert(1); opacity: 0.95; }
.nav-menu { display: flex; gap: 2.5rem; list-style: none; align-items: center; }
.nav-menu a { font-family: var(--font-sans); font-size: 12px; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.75); position: relative; padding: 4px 0; }
.nav-menu a:hover, .nav-menu a.active { color: var(--white); }
.nav-menu a::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--bronze); transition: width 0.35s ease; }
.nav-menu a:hover::after, .nav-menu a.active::after { width: 100%; }
.nav-dropdown { position: relative; }
.dropdown-arrow { display: inline-block; font-size: 9px; margin-left: 4px; transition: transform 0.3s ease; }
.nav-dropdown:hover .dropdown-arrow, .nav-dropdown.open .dropdown-arrow { transform: rotate(180deg); }
.dropdown-menu { position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(6px); min-width: 230px; list-style: none; padding: 10px 0; background: rgba(117,136,153,0.97); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(213,149,96,0.15); border-top: 2px solid var(--bronze); box-shadow: 0 16px 40px rgba(0,0,0,0.25); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease; z-index: 20; }
.nav-dropdown:hover .dropdown-menu, .nav-dropdown.open .dropdown-menu { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.dropdown-menu a { display: block; padding: 10px 26px; font-size: 11px; letter-spacing: 0.15em; white-space: nowrap; }
.dropdown-menu a::after { content: none; }
.dropdown-menu a:hover { background: rgba(200,136,108,0.18); }
.nav-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.12); margin: 0 1.5rem; }
.nav-cta { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-sans); font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; background: #efebe8; color: var(--bronze); border: 1px solid rgba(213,149,96,0.5); padding: 10px 24px; white-space: nowrap; transition: all 0.35s ease; }
.nav-cta:hover { background: var(--bronze); color: #758899; border-color: var(--bronze); }
.hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 6px; }
.hamburger span { width: 25px; height: 2px; background: var(--white); }

.page-cta { background: var(--azure); text-align: center; padding: 80px 2rem; }
.page-cta-title { font-family: var(--font-serif); font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; color: var(--navy); margin-bottom: 12px; }
.page-cta-sub { font-family: var(--font-sans); font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(56,71,93,0.7); margin-bottom: 32px; }
.page-cta-btn { background: var(--navy); color: var(--white); font-family: var(--font-sans); font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; padding: 16px 40px; display: inline-block; transition: all 0.3s ease; }
.page-cta-btn:hover { background: var(--ink); transform: translateY(-2px); }

footer { background: var(--navy-dark); color: var(--white); padding: 5rem 2rem 2rem; position: relative; overflow: hidden; }
footer::before { content: ''; position: absolute; inset: 0; background-image: url('/BACK.png'); background-size: 300px; opacity: 0.04; mix-blend-mode: screen; pointer-events: none; }
.footer-content { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
.footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1.4fr; gap: 3rem; margin-bottom: 4rem; }
.footer-col { display: flex; flex-direction: column; align-items: flex-start; }
.footer-logo-img { height: 38px; width: auto; filter: brightness(0) invert(1); opacity: 0.9; margin-bottom: 1.5rem; }
.footer-desc { font-size: 0.95rem; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 350px; }
.footer-title { font-family: var(--font-sans); font-size: 1rem; font-weight: 500; margin-bottom: 1.5rem; letter-spacing: 0.15em; text-transform: uppercase; }
.footer-menu { display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem; }
.footer-menu a, .footer-contact-info a { color: rgba(255,255,255,0.7); }
.footer-menu a:hover, .footer-contact-info a:hover { color: var(--bronze); }
.footer-contact-info { display: flex; flex-direction: column; gap: 1.2rem; font-size: 0.95rem; color: rgba(255,255,255,0.7); line-height: 1.6; }
.contact-item { display: flex; align-items: flex-start; gap: 0.8rem; }
.contact-item svg { width: 20px; height: 20px; color: var(--bronze); flex-shrink: 0; margin-top: 2px; }
.footer-doctors { display: flex; flex-wrap: wrap; gap: 2.5rem; padding-top: 2rem; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
.footer-doctor-item { display: flex; flex-direction: column; }
.footer-doctor-name { font-family: var(--font-sans); font-size: 1.05rem; font-weight: 500; margin-bottom: 0.4rem; }
.footer-doctor-cred { font-size: 0.85rem; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
.footer-dev { font-family: var(--font-sans); }
.footer-dev a { color: var(--white); font-weight: 500; letter-spacing: 0.05em; }

@media (max-width: 768px) {
    .site-nav { padding: 0 1.5rem; }
    .nav-menu { display: none; position: absolute; top: 80px; left: 0; right: 0; flex-direction: column; background: var(--navy-dark); padding: 2rem; gap: 1.5rem; }
    .nav-menu.active { display: flex; }
    .nav-dropdown { width: 100%; text-align: center; }
    .dropdown-menu, .nav-dropdown:hover .dropdown-menu, .nav-dropdown.open .dropdown-menu { position: static; transform: none; opacity: 1; visibility: visible; pointer-events: auto; background: rgba(0,0,0,0.15); border: none; box-shadow: none; max-height: 0; overflow: hidden; padding: 0; transition: max-height 0.35s ease, padding 0.35s ease; }
    .nav-dropdown.open .dropdown-menu { max-height: 400px; padding: 8px 0; }
    .dropdown-menu a { padding: 10px 16px; text-align: center; }
    .hamburger { display: flex; margin-left: auto; margin-right: 0.9rem; }
    .nav-divider { display: none; }
    .logo-img { height: 30px; }
    .nav-cta { font-size: 10px; padding: 8px 12px; letter-spacing: 0.12em; }
    .nav-cta svg { width: 14px; height: 14px; }
    .page-cta { padding: 60px 1.5rem; }
    .footer-grid { grid-template-columns: 1fr; gap: 2.5rem; }
    .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
}
`;

const BASE_SCRIPT = `
(function () {
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            var open = navMenu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }
    var dropdown = document.querySelector('.nav-dropdown');
    var toggle = document.querySelector('.dropdown-toggle');
    if (dropdown && toggle) {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            var open = dropdown.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
        });
    }
})();
`;

export function renderPage({ title, description, canonical, robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', ogType = 'website', ogImage, ogImageAlt = '', extraMeta = '', structuredData, css = '', body, script = '', preloadImage = '' }) {
    const image = ogImage || `${SITE_URL}/LOGO.png`;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="robots" content="${esc(robots)}">
    <link rel="canonical" href="${esc(canonical)}">
    <link rel="icon" type="image/png" sizes="any" href="/FLOR.png">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/FLOR.png">
    <meta name="theme-color" content="#758899">
    <meta property="og:site_name" content="Rizzatti Dermatologia e Saúde">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:type" content="${esc(ogType)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta property="og:image" content="${esc(image)}">
    ${ogImageAlt ? `<meta property="og:image:alt" content="${esc(ogImageAlt)}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(image)}">
    ${extraMeta}
    ${preloadImage ? `<link rel="preload" as="image" href="${esc(preloadImage)}" fetchpriority="high">` : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>${BASE_CSS}${css}</style>
    ${structuredData ? jsonLd(structuredData) : ''}
</head>
<body>
${renderNav()}
${body}
${renderCta()}
${renderFooter()}
<script>${BASE_SCRIPT}${script}</script>
</body>
</html>`;
}

function renderNav() {
    return `<nav class="site-nav" aria-label="Menu principal">
    <a href="/" class="logo" aria-label="Rizzatti Dermatologia e Saúde — página inicial">
        <img src="/LOGO.png" alt="Rizzatti Dermatologia e Saúde" class="logo-img" width="150" height="44">
    </a>
    <ul class="nav-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/sobre.html">Sobre</a></li>
        <li class="nav-dropdown">
            <a href="#" class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Especialidades <span class="dropdown-arrow" aria-hidden="true">&#9662;</span></a>
            <ul class="dropdown-menu">
                <li><a href="/clinica.html">Dermatologia Clínica</a></li>
                <li><a href="/cirurgica.html">Dermatologia Cirúrgica</a></li>
                <li><a href="/estetica-facial.html">Dermatologia Estética</a></li>
                <li><a href="/estetica-corporal.html">Dermatologia Corporal</a></li>
                <li><a href="/tricologica.html">Tricologia</a></li>
                <li><a href="/tecnologias.html">Tecnologias</a></li>
            </ul>
        </li>
        <li><a href="/corpo-clinico.html">Corpo Clínico</a></li>
        <li><a href="/tecnologias.html">Tecnologias</a></li>
        <li><a href="/blog" class="active" aria-current="page">Blog</a></li>
        <li><a href="/#contato">Contato</a></li>
    </ul>
    <div class="nav-divider"></div>
    <button class="hamburger" id="hamburger" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <a class="nav-cta" href="${WHATSAPP_URL}" target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WHATSAPP_ICON}</svg>
        Agendar Consulta
    </a>
</nav>`;
}

function renderCta() {
    return `<section class="page-cta">
    <h2 class="page-cta-title">Pronto para cuidar da sua <em>pele?</em></h2>
    <p class="page-cta-sub">Agende uma avaliação com nossa equipe especializada.</p>
    <a href="${WHATSAPP_URL}" target="_blank" rel="noopener" class="page-cta-btn">Agendar via WhatsApp →</a>
</section>`;
}

function renderFooter() {
    return `<footer>
    <div class="footer-content">
        <div class="footer-grid">
            <div class="footer-col">
                <img src="/LOGO.png" alt="Rizzatti Dermatologia e Saúde" class="footer-logo-img" width="130" height="38" loading="lazy">
                <p class="footer-desc">Cuidado completo da sua pele, em um só lugar. Dermatologia, Estética e Tricologia avançada em Palhoça-SC.</p>
            </div>
            <div class="footer-col">
                <h2 class="footer-title">Navegação</h2>
                <div class="footer-menu">
                    <a href="/">Home</a>
                    <a href="/sobre.html">Sobre a clínica</a>
                    <a href="/#servicos">Especialidades</a>
                    <a href="/blog">Blog</a>
                    <a href="/#contato">Localização</a>
                </div>
            </div>
            <div class="footer-col">
                <h2 class="footer-title">Contato</h2>
                <address class="footer-contact-info" style="font-style:normal">
                    <div class="contact-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>Rua Rubens de Arruda Ramos<br>Passeio Pedra Branca, Palhoça-SC</span>
                    </div>
                    <div class="contact-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <a href="${WHATSAPP_URL}" target="_blank" rel="noopener">(48) 99148-5818</a>
                    </div>
                    <div class="contact-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" stroke-width="1.5"></rect><circle cx="12" cy="12" r="3" stroke-width="1.5"></circle><line x1="16.5" y1="7.5" x2="16.5" y2="7.5" stroke-width="2" stroke-linecap="round"></line></svg>
                        <a href="https://instagram.com/clinica.rizzatti" target="_blank" rel="noopener">@clinica.rizzatti</a>
                    </div>
                </address>
            </div>
        </div>
        <div class="footer-doctors">
            <div class="footer-doctor-item">
                <span class="footer-doctor-name">Dra. Karoline Rizzatti</span>
                <span class="footer-doctor-cred">CRM/SC 17360 · RQE 13318</span>
            </div>
            <div class="footer-doctor-item">
                <span class="footer-doctor-name">Dr. Timotio Dorn</span>
                <span class="footer-doctor-cred">CRM/SC 22594 · RQE 13225</span>
            </div>
        </div>
        <div class="footer-bottom">
            <div class="footer-copyright">© ${new Date().getFullYear()} Rizzatti Dermatologia e Saúde. Todos os direitos reservados.</div>
            <div class="footer-dev">Site desenvolvido por <a href="#" target="_blank" rel="noopener">//FEMO</a></div>
        </div>
    </div>
</footer>`;
}
