import { next, rewrite } from '@vercel/functions';

export default function proxy(request) {
  const url = new URL(request.url);

  if (url.hostname === 'karoline.clinicarizzatti.com.br') {
    return rewrite(new URL('/karoline/links.html', url));
  }

  return next();
}
