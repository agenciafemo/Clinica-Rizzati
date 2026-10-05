// Pixel da Meta — fonte única do site.
// Trocar o ID aqui vale para todas as páginas, inclusive o blog.
// O ID fica no Gerenciador de Eventos > Fontes de dados (15 a 16 dígitos).
// Enquanto estiver vazio, nada é carregado: nenhum script da Meta, nenhum cookie.
var PIXEL_ID = '';

(function () {
    if (!PIXEL_ID) return;

    /* global fbq */
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');

    // Clique em qualquer caminho para o WhatsApp conta como contato iniciado.
    // Cobre tanto os links <a href="wa.me/..."> quanto os botões com onclick.
    document.addEventListener('click', function (event) {
        var alvo = event.target.closest('a[href*="wa.me"], [onclick*="wa.me"]');
        if (!alvo) return;
        fbq('track', 'Contact', {
            content_name: document.title,
            source_url: location.pathname,
        });
    }, true);
})();
