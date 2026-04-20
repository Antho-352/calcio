// Wikipedia REST API — free, no key required
// Used for club/player descriptions in French

// Static mapping: our slug → French Wikipedia article title
// Serie A 2025-26
const TEAM_WIKI_FR: Record<string, string> = {
  'inter-milan':   'Inter Milan',
  'ac-milan':      'AC Milan',
  'juventus':      'Juventus Football Club',
  'napoli':        'Naples SC',
  'as-roma':       'AS Roma',
  'lazio':         'Lazio Rome',
  'atalanta':      'Atalanta Bergamasca Calcio',
  'fiorentina':    'ACF Fiorentina',
  'torino':        'Torino Football Club',
  'bologna':       'Bologna Football Club 1909',
  'udinese':       'Udinese Calcio',
  'cagliari':      'Cagliari Calcio',
  'genoa':         'Genoa CFC',
  'lecce':         'US Lecce',
  'hellas-verona': 'Hellas Vérone',
  'como':          'Côme (football)',
  'parma':         'Parme Calcio 1913',
  'cremonese':     'US Cremonese',
  'pisa':          'Pise Calcio',
  'sassuolo':      'Sassuolo Calcio',
};

export interface WikipediaExtract {
  title: string;
  extract: string;
  pageUrl: string;
}

export async function getWikipediaExtract(
  slugOrTitle: string,
  lang: 'fr' | 'en' = 'fr',
  sentences: number = 4
): Promise<WikipediaExtract | null> {
  const title = TEAM_WIKI_FR[slugOrTitle] ?? slugOrTitle;
  const encoded = encodeURIComponent(title);
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&exsentences=${sentences}&explaintext=1&titles=${encoded}&format=json&redirects=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as any;

    if (!page || page.missing !== undefined || !page.extract) return null;

    return {
      title: page.title,
      extract: page.extract,
      pageUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    };
  } catch {
    return null;
  }
}

export async function getWikipediaPlayerExtract(
  playerName: string,
  lang: 'fr' | 'en' = 'fr',
  sentences: number = 3
): Promise<WikipediaExtract | null> {
  return getWikipediaExtract(playerName, lang, sentences);
}
