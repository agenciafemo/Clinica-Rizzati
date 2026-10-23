// Evento para configurar conversões no GA4 e no Meta Pixel via GTM.
(function () {
    'use strict';
    window.dataLayer = window.dataLayer || [];

    document.addEventListener('click', function (event) {
        const target = event.target instanceof Element
            ? event.target.closest('a[href]')
            : null;
        if (!target) return;

        const destination = target.getAttribute('href') || '';
        if (!/^https:\/\/wa\.me\/5548991735899(?:\b|\/|\?)/i.test(destination)) return;

        window.dataLayer.push({ event: 'whatsapp_click' });
    }, true);
})();
