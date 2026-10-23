# Site da Dra. Karoline Rizzatti

Landing page (index.html) preparada para o domínio drakarolinerizzatti.com. A página de links (links.html) é publicada em links.clinicarizzatti.com.br pelo projeto Vercel da Clínica Rizzatti. A identidade visual acompanha o site da clínica. O agendamento utiliza o WhatsApp da clínica: 5548991735899.

Na publicação da clínica, `proxy.js` serve `karoline/links.html` na raiz do subdomínio. O DNS é administrado na HostGator: registro A `links` → `76.76.21.21`, conforme instrução da Vercel. O subdomínio já foi associado ao projeto `clinica-rizzati` na Vercel.

## Revisão antes da troca de domínio

- Validar textos, fotos, CRM/SC 17360 e RQE 13315 com a Dra. Karoline.
- Confirmar os links de Instagram, clínica, mapa e WhatsApp.
- Após a aprovação e publicação no domínio pessoal, remover `noindex` de `index.html`. O canonical da página inicial já aponta para `https://drakarolinerizzatti.com/`.
- Manter a página de links fora do índice enquanto funcionar apenas como acesso rápido do Instagram. O endereço público é `https://links.clinicarizzatti.com.br/`; o `og:url` já aponta para ele.
- Para a futura LP no domínio pessoal, importar este repositório como um projeto Vercel separado, definindo `karoline` como Root Directory. O arquivo vercel.json desta pasta fornece a rota /links.
- Conectar drakarolinerizzatti.com e www.drakarolinerizzatti.com ao novo projeto e atualizar o DNS somente após validar a prévia da Vercel. O site antigo permanece ativo até essa etapa.
- Conferir a LP, imagens, WhatsApp e GTM no domínio pessoal após a migração. A página de links usa caminhos `/karoline/` do projeto da clínica e deve continuar servida pelo subdomínio.
- Depois da troca, verificar indexação e sitemap no Google Search Console e atualizar os links públicos do perfil da médica. Textos, dados da médica, endereço e marcação estruturada devem continuar consistentes.

O contêiner GTM-NPT5Q6W3 está instalado nas duas páginas. As tags de GA4, Clarity e Meta dependem da configuração e publicação no painel do GTM.
