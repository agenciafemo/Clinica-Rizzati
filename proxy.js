import { next, rewrite } from '@vercel/functions';

export default function proxy(request) {
  const url = new URL(request.url);

  // A home passa por aqui antes dos redirects do vercel.json.
  if (url.hostname === 'clinica-rizzati.vercel.app') {
    return Response.redirect('https://www.clinicarizzatti.com.br' + url.pathname + url.search, 301);
  }

  if (url.hostname === 'links.clinicarizzatti.com.br') {
    return rewrite('https://www.clinicarizzatti.com.br/karoline/links.html');
  }

  return next();
}
