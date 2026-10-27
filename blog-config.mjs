// Configuração do Blog da Clínica Rizzatti
// Fonte única: usada pelo painel (admin.html, no navegador) e pelas funções da Vercel (api/).
// Os valores do Supabase vêm de: Supabase Dashboard > Project Settings > API.
// A publishable key é pública por design — a segurança dos dados fica nas políticas RLS.

export const SUPABASE_URL = "https://oynfynrnmjzgzgwpyiin.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_yWsqFaO4Sfmf5Bzdf44aQw_88qB7uBV";

// Usuário do painel. O login pede só a senha; este e-mail é enviado junto ao Supabase.
// Crie-o em Authentication > Users > Add user, com "Auto Confirm User" marcado.
export const ADMIN_EMAIL = "blog@clinicarizzatti.com.br";

// Perfis que entram no funil de pacientes (crm.html). O login lá pede só a
// senha, como aqui: o painel tenta estes e-mails na ordem até um autenticar.
// Por isso cada conta precisa de uma senha diferente — senhas iguais entrariam
// sempre no primeiro da lista. Crie cada usuário em Authentication > Users.
export const EMAIL_AGENCIA = "agenciafemo@gmail.com";
export const PERFIS_FUNIL = [ADMIN_EMAIL, EMAIL_AGENCIA];

export const WHATSAPP_NUMBER = "5548991735899";
