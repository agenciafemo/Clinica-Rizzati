-- =====================================================================
-- SETUP COMPLETO DO BANCO NOVO — cole tudo no Supabase > SQL Editor > New query > Run
-- (é o conteúdo de blog_schema.sql + seed_posts.sql, nessa ordem)
-- =====================================================================

-- =====================================================================
-- Blog da Clínica Rizzati — schema Supabase
-- Execute este script inteiro em: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

create table if not exists public.blog_posts (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    excerpt text,
    meta_description text,
    body_html text not null,
    category text,
    author text,
    cover_image_url text,
    read_time_minutes integer default 5,
    status text not null default 'draft' check (status in ('draft', 'published')),
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Campos de SEO e de respostas para IA. "add column if not exists" torna o script
-- seguro tanto em projeto novo quanto em projeto que já tinha a tabela.
alter table public.blog_posts add column if not exists seo_title text;
alter table public.blog_posts add column if not exists focus_keyword text;
alter table public.blog_posts add column if not exists keywords text;
alter table public.blog_posts add column if not exists summary text;
alter table public.blog_posts add column if not exists faq jsonb not null default '[]'::jsonb;
alter table public.blog_posts add column if not exists reviewed_by text;
alter table public.blog_posts add column if not exists cover_image_alt text;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'blog_posts_faq_is_array') then
        alter table public.blog_posts
            add constraint blog_posts_faq_is_array check (jsonb_typeof(faq) = 'array');
    end if;
end;
$$;

create index if not exists blog_posts_status_published_at_idx
    on public.blog_posts (status, published_at desc);

create index if not exists blog_posts_slug_idx
    on public.blog_posts (slug);

-- Mantém updated_at sempre atualizado
create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
    before update on public.blog_posts
    for each row
    execute function public.set_blog_posts_updated_at();

-- =====================================================================
-- RLS: qualquer visitante (anon) só pode LER posts publicados.
-- Somente um usuário autenticado (o admin da clínica) pode criar,
-- editar, apagar ou ver rascunhos.
-- =====================================================================
alter table public.blog_posts enable row level security;

drop policy if exists "Público pode ler posts publicados" on public.blog_posts;
create policy "Público pode ler posts publicados"
    on public.blog_posts
    for select
    to anon, authenticated
    using (status = 'published');

drop policy if exists "Admin pode ler todos os posts" on public.blog_posts;
create policy "Admin pode ler todos os posts"
    on public.blog_posts
    for select
    to authenticated
    using (true);

drop policy if exists "Admin pode criar posts" on public.blog_posts;
create policy "Admin pode criar posts"
    on public.blog_posts
    for insert
    to authenticated
    with check (true);

drop policy if exists "Admin pode editar posts" on public.blog_posts;
create policy "Admin pode editar posts"
    on public.blog_posts
    for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists "Admin pode apagar posts" on public.blog_posts;
create policy "Admin pode apagar posts"
    on public.blog_posts
    for delete
    to authenticated
    using (true);

-- =====================================================================
-- IMPORTANTE: depois de rodar este script, crie o usuário admin em
-- Authentication > Users > Add user:
--   e-mail: blog@clinicarizzatti.com.br  (o mesmo de ADMIN_EMAIL em blog-config.mjs)
--   senha: forte, com 16+ caracteres — o painel pede só a senha
--   marque "Auto Confirm User"
-- NÃO deixe o cadastro público (Sign Up) habilitado — em
-- Authentication > Providers > Email, desmarque "Allow new users to
-- sign up" para que só esse usuário consiga entrar em admin.html.
--
-- Depois: projeto NOVO -> rode sql/seed_posts.sql
--         projeto RESTAURADO (já tinha posts) -> rode sql/blog_seo_backfill.sql
-- =====================================================================


-- Seed inicial: 3 posts publicados para o blog da Clínica Rizzatti
-- Use em projeto NOVO, depois de rodar sql/blog_schema.sql.
-- "on conflict do nothing": se o slug já existir, o post NÃO é sobrescrito.
-- Para completar campos de SEO em posts que já existem, use sql/blog_seo_backfill.sql.
-- Resumos e FAQs derivam do texto dos artigos; revise com a equipe médica antes de publicar novos.

insert into public.blog_posts
    (slug, title, excerpt, meta_description, body_html, category, author, cover_image_url, read_time_minutes, status, published_at,
     seo_title, focus_keyword, keywords, summary, faq, cover_image_alt)
values
    ('cancer-de-pele-fotoprotecao-palhoca-florianopolis', 'Câncer de Pele: Como a Fotoproteção Diária Pode Salvar Sua Pele em Palhoça e Florianópolis', 'O câncer de pele é o tumor mais frequente entre os brasileiros, e a exposição solar da nossa região é um fator decisivo. Veja como identificar sinais de alerta e proteger sua pele todos os dias.', 'Câncer de pele é o mais comum no Brasil. Entenda os sinais de alerta e a importância do protetor solar. Agende sua avaliação dermatológica.', $body$<p>Viver na Grande Florianópolis é um privilégio: praias, sol praticamente o ano todo e um estilo de vida ao ar livre. Mas essa mesma exposição solar constante é também o principal fator de risco para o câncer de pele, o tipo de câncer mais diagnosticado no Brasil, segundo o Instituto Nacional de Câncer (INCA). Em Palhoça e região, onde a rotina de praia, trabalho e lazer ao ar livre é parte do dia a dia, conhecer os sinais de alerta e adotar hábitos de fotoproteção não é vaidade — é cuidado com a saúde.</p>
<h2>Por que a exposição solar da nossa região exige atenção redobrada</h2>
<p>A radiação ultravioleta (UV) é cumulativa: cada exposição sem proteção adequada, ao longo dos anos, aumenta o risco de dano celular na pele. Em cidades litorâneas como Palhoça, a combinação de sol direto, reflexo da areia e da água, e hábitos de lazer ao ar livre eleva a exposição total muitas vezes sem que a pessoa perceba, especialmente em dias nublados, quando a sensação de calor é menor mas a radiação UV continua presente.</p>
<h2>Os principais tipos de câncer de pele</h2>
<p>De forma geral, os tumores de pele são divididos em dois grandes grupos:</p>
<ul>
<li><strong>Carcinomas basocelular e espinocelular</strong>: os mais frequentes, geralmente de crescimento mais lento e bom prognóstico quando diagnosticados precocemente.</li>
<li><strong>Melanoma</strong>: menos comum, porém mais agressivo, com maior potencial de disseminação para outros órgãos se não tratado a tempo.</li>
</ul>
<p>Em todos os casos, o diagnóstico precoce é o fator que mais influencia o sucesso do tratamento.</p>
<h2>Sinais de alerta: a regra do ABCDE</h2>
<p>Uma ferramenta simples, usada por dermatologistas em todo o mundo, ajuda a identificar pintas e manchas que merecem avaliação:</p>
<ul>
<li><strong>A</strong> de Assimetria — metades diferentes entre si;</li>
<li><strong>B</strong> de Bordas irregulares ou mal definidas;</li>
<li><strong>C</strong> de Cor variada dentro da mesma lesão;</li>
<li><strong>D</strong> de Diâmetro maior que 6 mm;</li>
<li><strong>E</strong> de Evolução — qualquer mudança de tamanho, cor ou formato ao longo do tempo.</li>
</ul>
<p>Se você notar qualquer um desses sinais em uma pinta já existente, ou o surgimento de uma lesão nova que não cicatriza, o ideal é procurar avaliação com um dermatologista o quanto antes. Vale lembrar que apenas um exame clínico presencial, com dermatoscopia, pode confirmar se há necessidade de biópsia.</p>
<h2>Fotoproteção: o hábito diário que faz a diferença</h2>
<p>A boa notícia é que a prevenção é simples e acessível. Algumas recomendações que costumamos reforçar na Clínica Rizzatti:</p>
<ul>
<li>Use protetor solar todos os dias, mesmo em dias nublados ou dentro de casa perto de janelas, reaplicando a cada 2–3 horas em exposição direta;</li>
<li>Escolha um fator de proteção adequado ao seu tipo de pele e rotina, com proteção para UVA e UVB;</li>
<li>Utilize acessórios físicos como chapéus, óculos com proteção UV e roupas com tecido de proteção solar;</li>
<li>Evite exposição solar direta entre 10h e 16h, horário de maior intensidade de radiação;</li>
<li>Faça o autoexame da pele periodicamente, observando pintas e manchas com atenção;</li>
<li>Mantenha consultas dermatológicas de rotina, mesmo sem sintomas aparentes, especialmente se você tem histórico familiar, pele clara ou muitas pintas.</li>
</ul>
<h2>O papel do acompanhamento dermatológico</h2>
<p>Cada pele tem uma história e um padrão de risco diferente. Na consulta, avaliamos seu fototipo, histórico familiar e de exposição solar, e traçamos junto com você uma rotina de fotoproteção e um calendário de acompanhamento personalizado. Em casos de lesões suspeitas, contamos com dermatoscopia e, quando necessário, encaminhamento para biópsia e tratamento cirúrgico dentro da própria clínica.</p>
<p>Cuidar da pele é cuidar da sua saúde a longo prazo. Se faz tempo que você não faz uma avaliação dermatológica completa, ou notou alguma mudança em uma pinta ou mancha, agende uma consulta com nossa equipe pelo WhatsApp. Estamos prontos para te acolher e cuidar da sua pele com toda a atenção que ela merece.</p>$body$, 'Dermatologia Clínica', 'Dra. Karoline Rizzatti', 'CLINICA.jpg', 6, 'published', now(),
    'Câncer de Pele: Sinais de Alerta e Fotoproteção | Rizzatti',
    'câncer de pele',
    'fotoproteção, protetor solar, regra ABCDE, melanoma, dermatologista em Palhoça',
    'O câncer de pele é o tipo de câncer mais diagnosticado no Brasil, e a exposição solar acumulada é o principal fator de risco. A prevenção combina protetor solar diário com proteção UVA e UVB, acessórios e autoexame usando a regra ABCDE. Pintas que mudam ou lesões que não cicatrizam devem ser avaliadas por um dermatologista.',
    $faq$[
        {"question": "Quais são os sinais de alerta de uma pinta suspeita?", "answer": "A regra ABCDE ajuda a identificar: assimetria, bordas irregulares, cores variadas na mesma lesão, diâmetro maior que 6 mm e evolução, ou seja, mudanças de tamanho, cor ou formato. Lesões novas que não cicatrizam também merecem avaliação dermatológica."},
        {"question": "Preciso usar protetor solar em dias nublados?", "answer": "Sim. A radiação ultravioleta continua presente mesmo com o céu nublado, quando a sensação de calor é menor. O ideal é usar protetor com proteção UVA e UVB todos os dias e reaplicar a cada 2 a 3 horas durante exposição direta."},
        {"question": "Com que frequência devo fazer uma avaliação dermatológica?", "answer": "Depende do risco de cada pessoa. Quem tem histórico familiar de câncer de pele, pele clara ou muitas pintas costuma precisar de acompanhamento mais próximo. O dermatologista define a periodicidade após avaliar seu fototipo e histórico."},
        {"question": "Como é feito o diagnóstico de uma lesão suspeita?", "answer": "O dermatologista faz o exame clínico com dermatoscopia e, se necessário, indica a biópsia para confirmar o diagnóstico. Apenas a avaliação presencial pode definir se a lesão precisa de tratamento."}
    ]$faq$::jsonb,
    'Dermatologista examinando uma pinta no pescoço de uma paciente com dermatoscópio')
on conflict (slug) do nothing;

insert into public.blog_posts
    (slug, title, excerpt, meta_description, body_html, category, author, cover_image_url, read_time_minutes, status, published_at,
     seo_title, focus_keyword, keywords, summary, faq, cover_image_alt)
values
    ('ultrassom-microfocado-liftera-lifting-facial-sem-cirurgia', 'Ultrassom Microfocado Liftera: Como Funciona o Lifting Facial Sem Cirurgia', 'O ultrassom microfocado é uma das tecnologias mais buscadas para estimular colágeno e firmar a pele do rosto sem cortes ou tempo de recuperação. Entenda como o Liftera atua e para quem é indicado.', 'Conheça o ultrassom microfocado Liftera, tecnologia para firmeza facial sem cirurgia. Saiba como funciona e agende sua avaliação na Clínica Rizzatti.', $body$<p>Com o passar dos anos, a pele do rosto perde gradualmente firmeza e sustentação, resultado da diminuição natural da produção de colágeno e elastina. Para quem busca um resultado de rejuvenescimento facial mais sofisticado, mas sem cirurgia, o ultrassom microfocado é hoje uma das tecnologias mais respeitadas na dermatologia estética — e é exatamente essa a proposta do Liftera, uma das plataformas que utilizamos na Clínica Rizzatti.</p>
<h2>O que é o ultrassom microfocado</h2>
<p>Diferente de tratamentos que atuam apenas na superfície da pele, o ultrassom microfocado entrega energia em pontos específicos e em profundidades calculadas, alcançando camadas mais profundas da pele e, em alguns protocolos, a camada muscular superficial — a mesma estrutura trabalhada em um lifting cirúrgico tradicional. Essa energia gera pequenos pontos de coagulação térmica controlada, que funcionam como um estímulo para que o próprio organismo produza novo colágeno ao longo das semanas seguintes.</p>
<h2>Como funciona o tratamento com o Liftera</h2>
<p>Na sessão, o equipamento é guiado por imagem em tempo real, o que permite visualizar as camadas da pele durante a aplicação e direcionar a energia com precisão para as áreas que realmente precisam de estímulo — como região de papada, contorno da mandíbula, bochechas e, em alguns protocolos, pescoço e colo. O procedimento é realizado em consultório, sem necessidade de cortes ou anestesia geral, e o retorno às atividades cotidianas costuma ser praticamente imediato.</p>
<h2>O que esperar dos resultados</h2>
<p>É importante ter expectativas realistas: o ultrassom microfocado não substitui um lifting cirúrgico em casos de flacidez muito acentuada, mas pode ajudar a melhorar a firmeza e o contorno facial de forma progressiva e natural. Como o colágeno leva tempo para se reorganizar, os resultados costumam ser percebidos de forma gradual, geralmente entre 2 e 3 meses após a sessão, podendo continuar evoluindo por até 6 meses.</p>
<p>Cada caso é único, e o número de sessões, a intensidade e as áreas tratadas dependem de uma avaliação individual do grau de flacidez, do tipo de pele e dos objetivos de cada paciente.</p>
<h2>Para quem o tratamento costuma ser indicado</h2>
<ul>
<li>Pessoas com sinais iniciais a moderados de flacidez facial ou de pescoço;</li>
<li>Quem busca prevenir ou retardar sinais de envelhecimento antes de considerar procedimentos mais invasivos;</li>
<li>Pacientes que desejam um procedimento sem tempo de afastamento das atividades diárias;</li>
<li>Complemento a outros tratamentos estéticos, como bioestimuladores de colágeno ou skinboosters, dentro de um plano combinado avaliado pelo médico.</li>
</ul>
<h2>Segurança e avaliação individual</h2>
<p>Como todo procedimento estético, o ultrassom microfocado deve ser sempre indicado e realizado por profissional médico habilitado, após avaliação clínica detalhada. Na consulta, analisamos seu tipo de pele, grau de flacidez, histórico de saúde e expectativas, para então definir se esse é o tratamento mais indicado para o seu caso ou se outra tecnologia da nossa clínica — como a radiofrequência microagulhada MegaDERM ou a plataforma de luz Etherea MX — seria mais adequada, isoladamente ou em combinação.</p>
<h2>Um cuidado personalizado, do início ao fim</h2>
<p>Na Clínica Rizzatti, acreditamos que tecnologia avançada só faz sentido quando aliada a uma avaliação médica cuidadosa e individualizada. Não existe protocolo padrão: existe o protocolo certo para a sua pele, seu momento de vida e seus objetivos.</p>
<p>Se você tem curiosidade sobre o ultrassom microfocado Liftera ou quer entender qual tecnologia estética combina com a sua pele, fale com a nossa equipe pelo WhatsApp e agende uma avaliação. Vamos te ouvir com atenção antes de qualquer indicação.</p>$body$, 'Estética', 'Dra. Karoline Rizzatti', 'CIRURGICA.jpg', 7, 'published', now(),
    'Ultrassom Microfocado Liftera: Lifting Sem Cirurgia',
    'ultrassom microfocado',
    'Liftera, lifting facial sem cirurgia, flacidez facial, colágeno, dermatologia estética',
    'O ultrassom microfocado é uma tecnologia que entrega energia em camadas profundas da pele para estimular a produção de colágeno, melhorando firmeza e contorno facial sem cortes. No Liftera, a aplicação é guiada por imagem. Os resultados são graduais, percebidos entre 2 e 3 meses, e a indicação depende de avaliação médica individual.',
    $faq$[
        {"question": "O ultrassom microfocado substitui o lifting cirúrgico?", "answer": "Não. Ele pode melhorar a firmeza e o contorno facial de forma progressiva, mas não substitui a cirurgia em casos de flacidez muito acentuada. A avaliação médica indica se o tratamento é adequado para o seu grau de flacidez."},
        {"question": "Quando aparecem os resultados do Liftera?", "answer": "Como o colágeno leva tempo para se reorganizar, os resultados costumam ser percebidos entre 2 e 3 meses após a sessão e podem continuar evoluindo por até 6 meses."},
        {"question": "Precisa de afastamento depois da sessão?", "answer": "O procedimento é feito em consultório, sem cortes nem anestesia geral, e o retorno às atividades costuma ser praticamente imediato. As orientações de cuidado são passadas pelo médico após a sessão."},
        {"question": "Para quem o ultrassom microfocado é indicado?", "answer": "Costuma ser indicado para pessoas com flacidez facial ou de pescoço inicial a moderada, para quem quer prevenir sinais de envelhecimento e como complemento a outros tratamentos, como bioestimuladores de colágeno, sempre após avaliação individual."}
    ]$faq$::jsonb,
    'Procedimento facial com equipamento de tecnologia estética em consultório dermatológico')
on conflict (slug) do nothing;

insert into public.blog_posts
    (slug, title, excerpt, meta_description, body_html, category, author, cover_image_url, read_time_minutes, status, published_at,
     seo_title, focus_keyword, keywords, summary, faq, cover_image_alt)
values
    ('queda-de-cabelo-quando-procurar-tricologista-tratamentos', 'Queda de Cabelo: Quando Procurar um Tricologista e Quais Tratamentos Existem', 'Nem toda queda de cabelo é igual, e identificar a causa correta é o primeiro passo para um tratamento eficaz. Veja quando buscar ajuda especializada e quais recursos a tricologia oferece hoje.', 'Queda de cabelo tem causa e tratamento. Entenda quando se preocupar e como PRP e exossomos podem ajudar. Agende avaliação tricológica na Rizzatti.', $body$<p>É normal perder alguns fios de cabelo todos os dias — em média, entre 50 e 100 fios, como parte do ciclo natural capilar. O problema começa quando essa queda se torna perceptível, seja pelo volume de fios no travesseiro e no ralo do chuveiro, seja pelo rareamento visível do couro cabeludo. Nesses casos, entender a causa é o passo mais importante antes de iniciar qualquer tratamento, e é justamente esse o papel da avaliação tricológica.</p>
<h2>Por que identificar a causa é essencial</h2>
<p>A queda de cabelo pode ter origens muito diferentes entre si, e cada uma exige uma abordagem específica:</p>
<ul>
<li><strong>Alopecia androgenética</strong>: a forma mais comum, de causa genética e hormonal, que provoca afinamento progressivo dos fios;</li>
<li><strong>Eflúvio telógeno</strong>: queda difusa e temporária, associada a estresse, alterações hormonais, pós-parto, dietas restritivas ou doenças recentes;</li>
<li><strong>Alopecia areata</strong>: de origem autoimune, caracterizada por falhas localizadas e arredondadas;</li>
<li><strong>Causas nutricionais e de saúde geral</strong>: deficiência de ferro, vitamina D, disfunções da tireoide, entre outras.</li>
</ul>
<p>Tratar todo tipo de queda da mesma forma é um erro comum. Por isso, a avaliação com dermatologista especializado em tricologia, muitas vezes com apoio de exames complementares e da tricoscopia digital, é o que permite um diagnóstico preciso.</p>
<h2>Quando procurar um especialista</h2>
<p>Alguns sinais indicam que vale a pena agendar uma avaliação tricológica:</p>
<ul>
<li>Queda de cabelo visivelmente acima do habitual por mais de 2 a 3 meses;</li>
<li>Rarefação perceptível na parte superior da cabeça ou nas entradas;</li>
<li>Falhas arredondadas ou em placas no couro cabeludo;</li>
<li>Coceira, descamação, oleosidade excessiva ou vermelhidão associadas à queda;</li>
<li>Histórico familiar de calvície associado à preocupação com prevenção precoce.</li>
</ul>
<p>Quanto mais cedo o acompanhamento se inicia, maior a chance de preservar os fios existentes e obter uma resposta mais consistente ao tratamento.</p>
<h2>Tratamentos disponíveis na tricologia atual</h2>
<p>Hoje a dermatologia conta com um leque de recursos que podem ser combinados conforme o diagnóstico e o objetivo de cada paciente:</p>
<ul>
<li><strong>Medicações tópicas e orais</strong>, indicadas conforme o tipo e a causa da queda, sempre sob prescrição e acompanhamento médico;</li>
<li><strong>PRP (plasma rico em plaquetas)</strong>: técnica que utiliza fatores de crescimento do próprio sangue do paciente, injetados no couro cabeludo, podendo contribuir para o fortalecimento do folículo capilar;</li>
<li><strong>Exossomos</strong>: tecnologia mais recente, com potencial de estimular o ambiente do folículo piloso, utilizada como complemento em protocolos personalizados;</li>
<li><strong>Correção de causas de base</strong>, como ajustes nutricionais ou tratamento de disfunções hormonais e da tireoide, em conjunto com outras especialidades quando necessário.</li>
</ul>
<p>É importante reforçar: nenhum tratamento capilar promete reverter completamente um quadro avançado de calvície ou garante resultado igual para todas as pessoas. O que a ciência permite hoje é, em muitos casos, desacelerar a progressão da queda e fortalecer os fios existentes, sempre com avaliação individual e acompanhamento contínuo.</p>
<h2>O primeiro passo é o diagnóstico</h2>
<p>Na Clínica Rizzatti, a avaliação tricológica combina exame clínico detalhado, tricoscopia digital e, quando indicado, solicitação de exames laboratoriais, para chegar a um diagnóstico preciso antes de qualquer indicação terapêutica. Cada plano de tratamento é construído de forma individual, considerando o tipo de queda, o histórico de saúde e as expectativas realistas de cada paciente.</p>
<p>Se você percebeu queda de cabelo acima do normal ou rarefação nos últimos meses, não espere o quadro avançar. Fale com a nossa equipe pelo WhatsApp e agende sua avaliação tricológica com atenção e cuidado individualizado.</p>$body$, 'Tricologia', 'Dr. Timotio Dorn', 'TRICOLOGIA.jpg', 7, 'published', now(),
    'Queda de Cabelo: Quando Procurar um Tricologista',
    'queda de cabelo',
    'tricologista, alopecia androgenética, eflúvio telógeno, PRP capilar, tricologia em Palhoça',
    'Perder entre 50 e 100 fios por dia é normal. A queda merece avaliação quando dura mais de 2 a 3 meses, causa rarefação visível ou falhas no couro cabeludo. Como as causas variam, o tratamento começa pelo diagnóstico com um dermatologista especializado em tricologia, que pode incluir tricoscopia e exames.',
    $faq$[
        {"question": "Quantos fios de cabelo é normal perder por dia?", "answer": "Em média, entre 50 e 100 fios por dia, como parte do ciclo natural do cabelo. A queda passa a merecer atenção quando fica perceptível, com muitos fios no travesseiro ou no ralo, ou quando o couro cabeludo começa a aparecer."},
        {"question": "Quando devo procurar um tricologista?", "answer": "Vale agendar avaliação se a queda estiver acima do normal por mais de 2 a 3 meses, se houver rarefação no topo da cabeça ou nas entradas, falhas arredondadas, ou coceira, descamação e vermelhidão associadas."},
        {"question": "PRP capilar funciona para queda de cabelo?", "answer": "O PRP usa fatores de crescimento do próprio sangue do paciente e pode contribuir para o fortalecimento do folículo capilar. Ele é indicado conforme o diagnóstico e costuma fazer parte de um plano combinado, sem garantia de resultado igual para todos."},
        {"question": "A queda de cabelo tem cura?", "answer": "Depende da causa. Algumas quedas, como o eflúvio telógeno, costumam ser temporárias. Em quadros como a alopecia androgenética, o tratamento busca desacelerar a progressão e fortalecer os fios existentes, com acompanhamento contínuo."}
    ]$faq$::jsonb,
    'Tratamento do couro cabeludo com equipamento em consultório de tricologia')
on conflict (slug) do nothing;
