/**
 * SEO Metadata Helper
 * Injects structured data and meta tags for coaches, programs, milestones
 */

export const coachSchema = (coach) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: coach.coach_name,
  description: coach.bio || `${coach.specialty} Coach`,
  url: `https://vellera.app/coach/${coach.id}`,
  email: coach.coach_email,
  jobTitle: `${coach.specialty} Coach`,
  image: coach.image_url || 'https://vellera.app/logo.png',
  knowsAbout: [coach.specialty],
});

export const programSchema = (program) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: program.title,
  description: program.description,
  creator: {
    '@type': 'Person',
    name: program.coach_name,
  },
  learningResourceType: 'Interactive Training Program',
  teaches: program.skills || [],
});

export const organizationSchema = (org) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: org.name,
  url: 'https://vellera.app',
  logo: 'https://vellera.app/logo.png',
  sameAs: [
    'https://twitter.com/vellera',
    'https://instagram.com/vellera',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'hello@vellera.io',
  },
});

export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `https://vellera.app${item.url}`,
  })),
});

// Inject meta tags
export const setMetaTags = (title, description, image = 'https://vellera.app/og.png') => {
  document.title = title;
  
  const tags = [
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];

  tags.forEach(tag => {
    const el = document.createElement('meta');
    Object.keys(tag).forEach(key => el.setAttribute(key, tag[key]));
    document.head.appendChild(el);
  });
};

// Sitemap generator
export const generateSitemap = (routes) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `
  <url>
    <loc>https://vellera.app${route.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>${route.priority || 0.7}</priority>
  </url>
`).join('')}
</urlset>`;

// Key landing pages for SEO
export const SEO_ROUTES = [
  { path: '/', priority: 1.0 },
  { path: '/hybrid-athlete', priority: 0.95, keywords: 'hybrid training, strength conditioning, functional fitness' },
  { path: '/bjj-strength-conditioning', priority: 0.9, keywords: 'BJJ strength training, grappling S&C, martial arts conditioning' },
  { path: '/executive-fitness-defense', priority: 0.9, keywords: 'executive fitness, tactical training, situational awareness' },
  { path: '/coaching/martial-arts', priority: 0.9 },
  { path: '/coaching/strength', priority: 0.9 },
  { path: '/coaching/conditioning', priority: 0.8 },
  { path: '/coaching/tactical', priority: 0.8 },
  { path: '/org-dashboard', priority: 0.8 },
  { path: '/submit-video', priority: 0.7 },
  { path: '/referral-portal', priority: 0.8 },
];