-- =====================================================================
-- Complemento de SEO para projeto RESTAURADO (posts já existentes)
-- Rode DEPOIS de sql/blog_schema.sql.
--
-- Só preenche campos que estiverem vazios. Título, resumo, corpo e demais
-- edições feitas pelo painel não são alterados. A capa só é trocada se
-- ainda for a imagem original do seed.
-- =====================================================================

update public.blog_posts set
    seo_title = coalesce(nullif(seo_title, ''), 'Câncer de Pele: Sinais de Alerta e Fotoproteção | Rizzatti'),
    focus_keyword = coalesce(nullif(focus_keyword, ''), 'câncer de pele'),
    keywords = coalesce(nullif(keywords, ''), 'fotoproteção, protetor solar, regra ABCDE, melanoma, dermatologista em Palhoça'),
    summary = coalesce(nullif(summary, ''), 'O câncer de pele é o tipo de câncer mais diagnosticado no Brasil, e a exposição solar acumulada é o principal fator de risco. A prevenção combina protetor solar diário com proteção UVA e UVB, acessórios e autoexame usando a regra ABCDE. Pintas que mudam ou lesões que não cicatrizam devem ser avaliadas por um dermatologista.'),
    faq = case when faq = '[]'::jsonb then $faq$[
        {"question": "Quais são os sinais de alerta de uma pinta suspeita?", "answer": "A regra ABCDE ajuda a identificar: assimetria, bordas irregulares, cores variadas na mesma lesão, diâmetro maior que 6 mm e evolução, ou seja, mudanças de tamanho, cor ou formato. Lesões novas que não cicatrizam também merecem avaliação dermatológica."},
        {"question": "Preciso usar protetor solar em dias nublados?", "answer": "Sim. A radiação ultravioleta continua presente mesmo com o céu nublado, quando a sensação de calor é menor. O ideal é usar protetor com proteção UVA e UVB todos os dias e reaplicar a cada 2 a 3 horas durante exposição direta."},
        {"question": "Com que frequência devo fazer uma avaliação dermatológica?", "answer": "Depende do risco de cada pessoa. Quem tem histórico familiar de câncer de pele, pele clara ou muitas pintas costuma precisar de acompanhamento mais próximo. O dermatologista define a periodicidade após avaliar seu fototipo e histórico."},
        {"question": "Como é feito o diagnóstico de uma lesão suspeita?", "answer": "O dermatologista faz o exame clínico com dermatoscopia e, se necessário, indica a biópsia para confirmar o diagnóstico. Apenas a avaliação presencial pode definir se a lesão precisa de tratamento."}
    ]$faq$::jsonb else faq end,
    cover_image_alt = case
        when coalesce(cover_image_alt, '') <> '' then cover_image_alt
        when cover_image_url in ('ESP_CLINICA.jpg', 'CLINICA.jpg') then 'Dermatologista examinando uma pinta no pescoço de uma paciente com dermatoscópio'
        else cover_image_alt end,
    cover_image_url = case when cover_image_url = 'ESP_CLINICA.jpg' then 'CLINICA.jpg' else cover_image_url end
where slug = 'cancer-de-pele-fotoprotecao-palhoca-florianopolis';

update public.blog_posts set
    seo_title = coalesce(nullif(seo_title, ''), 'Ultrassom Microfocado Liftera: Lifting Sem Cirurgia'),
    focus_keyword = coalesce(nullif(focus_keyword, ''), 'ultrassom microfocado'),
    keywords = coalesce(nullif(keywords, ''), 'Liftera, lifting facial sem cirurgia, flacidez facial, colágeno, dermatologia estética'),
    summary = coalesce(nullif(summary, ''), 'O ultrassom microfocado é uma tecnologia que entrega energia em camadas profundas da pele para estimular a produção de colágeno, melhorando firmeza e contorno facial sem cortes. No Liftera, a aplicação é guiada por imagem. Os resultados são graduais, percebidos entre 2 e 3 meses, e a indicação depende de avaliação médica individual.'),
    faq = case when faq = '[]'::jsonb then $faq$[
        {"question": "O ultrassom microfocado substitui o lifting cirúrgico?", "answer": "Não. Ele pode melhorar a firmeza e o contorno facial de forma progressiva, mas não substitui a cirurgia em casos de flacidez muito acentuada. A avaliação médica indica se o tratamento é adequado para o seu grau de flacidez."},
        {"question": "Quando aparecem os resultados do Liftera?", "answer": "Como o colágeno leva tempo para se reorganizar, os resultados costumam ser percebidos entre 2 e 3 meses após a sessão e podem continuar evoluindo por até 6 meses."},
        {"question": "Precisa de afastamento depois da sessão?", "answer": "O procedimento é feito em consultório, sem cortes nem anestesia geral, e o retorno às atividades costuma ser praticamente imediato. As orientações de cuidado são passadas pelo médico após a sessão."},
        {"question": "Para quem o ultrassom microfocado é indicado?", "answer": "Costuma ser indicado para pessoas com flacidez facial ou de pescoço inicial a moderada, para quem quer prevenir sinais de envelhecimento e como complemento a outros tratamentos, como bioestimuladores de colágeno, sempre após avaliação individual."}
    ]$faq$::jsonb else faq end,
    cover_image_alt = case
        when coalesce(cover_image_alt, '') <> '' then cover_image_alt
        when cover_image_url in ('LIFTERA.png', 'CIRURGICA.jpg') then 'Procedimento facial com equipamento de tecnologia estética em consultório dermatológico'
        else cover_image_alt end,
    cover_image_url = case when cover_image_url = 'LIFTERA.png' then 'CIRURGICA.jpg' else cover_image_url end
where slug = 'ultrassom-microfocado-liftera-lifting-facial-sem-cirurgia';

update public.blog_posts set
    seo_title = coalesce(nullif(seo_title, ''), 'Queda de Cabelo: Quando Procurar um Tricologista'),
    focus_keyword = coalesce(nullif(focus_keyword, ''), 'queda de cabelo'),
    keywords = coalesce(nullif(keywords, ''), 'tricologista, alopecia androgenética, eflúvio telógeno, PRP capilar, tricologia em Palhoça'),
    summary = coalesce(nullif(summary, ''), 'Perder entre 50 e 100 fios por dia é normal. A queda merece avaliação quando dura mais de 2 a 3 meses, causa rarefação visível ou falhas no couro cabeludo. Como as causas variam, o tratamento começa pelo diagnóstico com um dermatologista especializado em tricologia, que pode incluir tricoscopia e exames.'),
    faq = case when faq = '[]'::jsonb then $faq$[
        {"question": "Quantos fios de cabelo é normal perder por dia?", "answer": "Em média, entre 50 e 100 fios por dia, como parte do ciclo natural do cabelo. A queda passa a merecer atenção quando fica perceptível, com muitos fios no travesseiro ou no ralo, ou quando o couro cabeludo começa a aparecer."},
        {"question": "Quando devo procurar um tricologista?", "answer": "Vale agendar avaliação se a queda estiver acima do normal por mais de 2 a 3 meses, se houver rarefação no topo da cabeça ou nas entradas, falhas arredondadas, ou coceira, descamação e vermelhidão associadas."},
        {"question": "PRP capilar funciona para queda de cabelo?", "answer": "O PRP usa fatores de crescimento do próprio sangue do paciente e pode contribuir para o fortalecimento do folículo capilar. Ele é indicado conforme o diagnóstico e costuma fazer parte de um plano combinado, sem garantia de resultado igual para todos."},
        {"question": "A queda de cabelo tem cura?", "answer": "Depende da causa. Algumas quedas, como o eflúvio telógeno, costumam ser temporárias. Em quadros como a alopecia androgenética, o tratamento busca desacelerar a progressão e fortalecer os fios existentes, com acompanhamento contínuo."}
    ]$faq$::jsonb else faq end,
    cover_image_alt = case
        when coalesce(cover_image_alt, '') <> '' then cover_image_alt
        when cover_image_url = 'TRICOLOGIA.jpg' then 'Tratamento do couro cabeludo com equipamento em consultório de tricologia'
        else cover_image_alt end
where slug = 'queda-de-cabelo-quando-procurar-tricologista-tratamentos';
