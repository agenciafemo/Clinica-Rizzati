// Evento de clique para configurar conversões no GA4 e no Meta Pixel via GTM.
(function () {
    'use strict';
    window.dataLayer = window.dataLayer || [];

    // Inclui links e botões que abrem o WhatsApp da clínica.
    document.addEventListener('click', function (event) {
        const target = event.target instanceof Element
            ? event.target.closest('a[href], button[onclick]')
            : null;
        if (!target) return;

        const destination = target.getAttribute('href') || target.getAttribute('onclick') || '';
        // Qualquer wa.me conta: assim o evento sobrevive a uma troca de numero.
        if (!/wa\.me\//i.test(destination)) return;

        window.dataLayer.push({ event: 'whatsapp_click' });
    }, true);
})();
