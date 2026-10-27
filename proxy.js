import { next, rewrite } from '@vercel/functions';

export default function proxy(request) {
  const url = new URL(request.url);

  if (url.hostname === 'links.clinicarizzatti.com.br') {
    return rewrite('https://www.clinicarizzatti.com.br/karoline/links.html');
  }

  return next();
}
