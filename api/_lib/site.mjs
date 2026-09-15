// Dados institucionais usados no layout, na caixa de autor e nos dados estruturados.
// Mantenha em sincronia com index.html e as páginas dos médicos.

import { SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_NUMBER } from '../../blog-config.mjs';

export const SITE_URL = 'https://www.clinicarizzatti.com.br';
export const CLINIC_ID = `${SITE_URL}/#clinic`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const BLOG_URL = `${SITE_URL}/blog`;

export const supabaseConfig = {
    url: process.env.SUPABASE_URL || SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
};

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const CLINIC = {
    name: 'Rizzatti Dermatologia e Saúde',
    shortName: 'Clínica Rizzatti',
    telephone: '+5548991485818',
    logo: `${SITE_URL}/LOGO.png`,
    instagram: 'https://instagram.com/clinica.rizzatti',
    address: {
        streetAddress: 'Rua Rubens de Arruda Ramos, Passeio Pedra Branca',
        addressLocality: 'Palhoça',
        addressRegion: 'SC',
        addressCountry: 'BR',
    },
};

// Chave = valor do campo "author" em blog_posts.
export const AUTHORS = {
    'Dra. Karoline Rizzatti': {
        type: 'Person',
        name: 'Dra. Karoline Rizzatti',
        jobTitle: 'Médica dermatologista',
        credentials: 'CRM/SC 17360 · RQE 13318',
        identifiers: [
            { propertyID: 'CRM/SC', value: '17360' },
            { propertyID: 'RQE', value: '13318' },
        ],
        bio: 'Especialista pela Sociedade Brasileira de Dermatologia (SBD) em dermatologia clínica, estética e tricologia, em Palhoça-SC.',
        image: '/KAROLMED.jpg',
        url: '/medico-karoline.html',
        sameAs: ['https://instagram.com/karolrizzatti.dermato'],
        knowsAbout: ['Dermatologia clínica', 'Dermatologia estética', 'Tricologia'],
    },
    'Dr. Timotio Dorn': {
        type: 'Person',
        name: 'Dr. Timotio Dorn',
        jobTitle: 'Médico dermatologista',
        credentials: 'CRM/SC 22594 · RQE 13225',
        identifiers: [
            { propertyID: 'CRM/SC', value: '22594' },
            { propertyID: 'RQE', value: '13225' },
        ],
        bio: 'Especialista em oncologia cutânea, cirurgia dermatológica e cirurgia micrográfica de Mohs, em Palhoça-SC.',
        image: '/TIMOTIO.jpg',
        url: '/medico-timotio.html',
        sameAs: ['https://instagram.com/drtimotiodorn'],
        knowsAbout: ['Oncologia cutânea', 'Cirurgia dermatológica', 'Cirurgia micrográfica de Mohs'],
    },
    'Equipe Rizzatti': {
        type: 'Organization',
        name: 'Equipe Rizzatti',
        jobTitle: '',
        credentials: '',
        identifiers: [],
        bio: 'Conteúdo produzido pela equipe da Clínica Rizzatti, na Pedra Branca, Palhoça-SC.',
        image: '',
        url: '/corpo-clinico.html',
        sameAs: [],
        knowsAbout: [],
    },
};

export function getAuthor(name) {
    return AUTHORS[name] || AUTHORS['Equipe Rizzatti'];
}

export function clinicNode() {
    return {
        '@type': 'MedicalClinic',
        '@id': CLINIC_ID,
        name: CLINIC.name,
        url: `${SITE_URL}/`,
        logo: CLINIC.logo,
        image: CLINIC.logo,
        telephone: CLINIC.telephone,
        address: { '@type': 'PostalAddress', ...CLINIC.address },
        medicalSpecialty: 'https://schema.org/Dermatology',
        sameAs: [CLINIC.instagram],
    };
}

export function authorNode(name) {
    const a = getAuthor(name);
    if (a.type === 'Organization') {
        return { '@type': 'Organization', name: a.name, url: `${SITE_URL}${a.url}`, parentOrganization: { '@id': CLINIC_ID } };
    }
    return {
        '@type': 'Person',
        name: a.name,
        url: `${SITE_URL}${a.url}`,
        image: `${SITE_URL}${a.image}`,
        jobTitle: a.jobTitle,
        description: a.bio,
        identifier: a.identifiers.map((i) => ({ '@type': 'PropertyValue', ...i })),
        knowsAbout: a.knowsAbout,
        sameAs: a.sameAs,
        worksFor: { '@id': CLINIC_ID },
    };
}
