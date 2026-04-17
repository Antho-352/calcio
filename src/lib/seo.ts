interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Generate JSON-LD for Article
 */
export function generateArticleSchema(params: {
  title: string;
  description: string;
  image: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  url: string;
}) {
  const { title, description, image, author, publishedTime, modifiedTime, url } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: [image],
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vai Calcio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vai-calcio.fr/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * Generate JSON-LD for BreadcrumbList
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string) {
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: baseUrl,
    },
    ...items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: item.label,
      item: `${baseUrl}${item.href}`,
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Generate JSON-LD for WebSite with SearchAction
 */
export function generateWebSiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vai Calcio',
    description:
      "Toute l'actualité du football italien : Serie A, Coppa Italia, Squadra Azzurra. News, résultats, classements et analyses.",
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/recherche?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate JSON-LD for SportsEvent (Match)
 */
export function generateSportsEventSchema(params: {
  name: string;
  startDate: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  url: string;
}) {
  const { name, startDate, location, homeTeam, awayTeam, homeScore, awayScore, url } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    startDate,
    location: {
      '@type': 'Place',
      name: location,
    },
    homeTeam: {
      '@type': 'SportsTeam',
      name: homeTeam,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: awayTeam,
    },
    ...(homeScore !== undefined &&
      awayScore !== undefined && {
        eventStatus: 'https://schema.org/EventScheduled',
        competitor: [
          {
            '@type': 'SportsTeam',
            name: homeTeam,
            score: homeScore,
          },
          {
            '@type': 'SportsTeam',
            name: awayTeam,
            score: awayScore,
          },
        ],
      }),
    url,
  };
}

/**
 * Generate JSON-LD for SportsOrganization (Team)
 */
export function generateSportsOrganizationSchema(params: {
  name: string;
  logo: string;
  description: string;
  url: string;
  foundingDate?: string;
  location?: string;
}) {
  const { name, logo, description, url, foundingDate, location } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name,
    logo,
    description,
    url,
    ...(foundingDate && { foundingDate }),
    ...(location && {
      location: {
        '@type': 'Place',
        name: location,
      },
    }),
  };
}

/**
 * Render JSON-LD script tag
 */
export function renderJsonLd(schema: any): string {
  return JSON.stringify(schema);
}
