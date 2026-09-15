// Configuração do Blog da Clínica Rizzatti
// Fonte única: usada pelo painel (admin.html, no navegador) e pelas funções da Vercel (api/).
// Os valores do Supabase vêm de: Supabase Dashboard > Project Settings > API.
// A publishable key é pública por design — a segurança dos dados fica nas políticas RLS.

export const SUPABASE_URL = "https://oynfynrnmjzgzgwpyiin.supabase.co";
export const SUPABASE_ANON_KEY = "COLE_AQUI_A_PUBLISHABLE_KEY";

// Usuário do painel. O login pede só a senha; este e-mail é enviado junto ao Supabase.
// Crie-o em Authentication > Users > Add user, com "Auto Confirm User" marcado.
export const ADMIN_EMAIL = "blog@clinicarizzatti.com.br";

export const WHATSAPP_NUMBER = "5548991485818";
