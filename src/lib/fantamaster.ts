// Fantamaster CDN — public endpoint, no key required
// Stats joueurs Serie A saison en cours
// https://apicdn.fantamaster.it/playersstats/

const ENDPOINT = 'https://apicdn.fantamaster.it/playersstats/';

export type FMRole = 'P' | 'D' | 'C' | 'A';

export interface FMPlayerLast5 {
  caps: number;
  goals: number;
  assists: number;
  ycards: number;
  rcards: number;
  gotgoals: number;
  markavg: number;
  fmarkavg: number;
  penalties: number;
  spenalties: number;
  mpenalties: number;
  owngoals: number;
}

export interface FMPlayer {
  id: number;
  name: string;        // "Martinez L", "De Bruyne K" (last + first initial)
  team: string;        // "Inter", "Milan", "Roma"...
  role: FMRole;        // P=GK D=DEF C=MID A=FWD
  caps: number;        // matches played
  goals: number;
  assists: number;
  ycards: number;
  rcards: number;
  gotgoals: number;    // goals conceded (GK)
  owngoals: number;
  penalties: number;   // penalties scored
  spenalties: number;  // penalties saved (GK)
  mpenalties: number;  // penalties missed
  markavg: number;     // average fantacalcio rating
  fmarkavg: number;    // fantasy average rating
  value: number;       // fantacalcio value (millions)
  playmaker: boolean;
  last5: FMPlayerLast5;
}

// Fantamaster team names → our slugs (Serie A 2025-26)
const FM_TEAM_TO_SLUG: Record<string, string> = {
  'Atalanta':   'atalanta',
  'Bologna':    'bologna',
  'Cagliari':   'cagliari',
  'Como':       'como',
  'Cremonese':  'cremonese',
  'Fiorentina': 'fiorentina',
  'Genoa':      'genoa',
  'Inter':      'inter-milan',
  'Juventus':   'juventus',
  'Lazio':      'lazio',
  'Lecce':      'lecce',
  'Milan':      'ac-milan',
  'Napoli':     'napoli',
  'Parma':      'parma',
  'Pisa':       'pisa',
  'Roma':       'as-roma',
  'Sassuolo':   'sassuolo',
  'Torino':     'torino',
  'Udinese':    'udinese',
  'Verona':     'hellas-verona',
};

// Reverse: our slug → fantamaster team name
const SLUG_TO_FM_TEAM: Record<string, string> = Object.fromEntries(
  Object.entries(FM_TEAM_TO_SLUG).map(([k, v]) => [v, k])
);

// Role labels in French
export const FM_ROLE_FR: Record<FMRole, string> = {
  P: 'Gardien',
  D: 'Défenseur',
  C: 'Milieu',
  A: 'Attaquant',
};

let _cache: FMPlayer[] | null = null;

export async function getAllPlayerStats(): Promise<FMPlayer[]> {
  if (_cache) return _cache;

  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) throw new Error(`Fantamaster: ${res.status}`);
    const data = await res.json();
    _cache = (data?.players ?? []) as FMPlayer[];
    return _cache;
  } catch (e) {
    console.warn('Fantamaster API failed:', e);
    return [];
  }
}

export async function getPlayerStatsByTeamSlug(teamSlug: string): Promise<FMPlayer[]> {
  const fmTeam = SLUG_TO_FM_TEAM[teamSlug];
  if (!fmTeam) return [];
  const all = await getAllPlayerStats();
  return all.filter((p) => p.team === fmTeam);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function getPlayerStatsByName(
  name: string,
  teamSlug?: string
): Promise<FMPlayer | null> {
  const all = await getAllPlayerStats();
  const norm = normalize(name);
  const fmTeam = teamSlug ? SLUG_TO_FM_TEAM[teamSlug] : undefined;
  const pool = fmTeam ? all.filter((p) => p.team === fmTeam) : all;

  // FM format is "Lastname Firstinitial" e.g. "Martinez L"
  return (
    pool.find((p) => normalize(p.name) === norm) ??
    pool.find((p) => norm.includes(normalize(p.name.split(' ')[0]))) ??
    null
  );
}

export function getTeamSlugFromFM(fmTeam: string): string | undefined {
  return FM_TEAM_TO_SLUG[fmTeam];
}
