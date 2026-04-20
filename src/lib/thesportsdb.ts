// TheSportsDB API v1 — free tier key "3"
// Docs: https://www.thesportsdb.com/api.php

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// Static mapping: our slug → TheSportsDB team ID (Serie A 2024-25)
export const SPORTSDB_TEAM_IDS: Record<string, string> = {
  'inter-milan': '133681',
  'ac-milan': '133667',
  'juventus': '133676',
  'napoli': '133670',
  'as-roma': '133682',
  'lazio': '133668',
  'atalanta': '134782',
  'fiorentina': '133674',
  'torino': '133687',
  'bologna': '134781',
  'udinese': '133679',
  'empoli': '133695',
  'cagliari': '134783',
  'genoa': '133675',
  'lecce': '133678',
  'hellas-verona': '134784',
  'monza': '134270',
  'como': '134243',
  'venezia': '134234',
  'parma': '135728',
};

export interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  intFormedYear: string;
  strStadium: string;
  strStadiumLocation: string;
  intStadiumCapacity: string;
  strWebsite: string;
  strDescriptionFR: string | null;
  strDescriptionEN: string | null;
  strColour1: string | null;
  strColour2: string | null;
  strBadge: string | null;
  strLogo: string | null;
  strFanart1: string | null;
  strBanner: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strInstagram: string | null;
}

export interface SportsDBPlayer {
  idPlayer: string;
  idTeam: string;
  strPlayer: string;
  strLastName: string;
  strNationality: string;
  strPosition: string;
  strNumber: string;
  dateBorn: string;
  strHeight: string | null;
  strWeight: string | null;
  strDescriptionFR: string | null;
  strDescriptionEN: string | null;
  strThumb: string | null;
  strCutout: string | null;
  strBirthLocation: string | null;
  strAgent: string | null;
  strInstagram: string | null;
}

async function fetchSportsDB<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// Static mapping: our slug → TheSportsDB search name
// lookupteam.php is broken on free tier (always returns Arsenal)
const SPORTSDB_SEARCH_NAMES: Record<string, string> = {
  'ac-milan':      'AC Milan',
  'as-roma':       'Roma',
  'atalanta':      'Atalanta',
  'bologna':       'Bologna',
  'cagliari':      'Cagliari',
  'como':          'Como',
  'cremonese':     'Cremonese',
  'fiorentina':    'Fiorentina',
  'genoa':         'Genoa',
  'hellas-verona': 'Hellas Verona',
  'inter-milan':   'Inter Milan',
  'juventus':      'Juventus',
  'lazio':         'Lazio',
  'lecce':         'Lecce',
  'napoli':        'Napoli',
  'parma':         'Parma',
  'pisa':          'Pisa',
  'sassuolo':      'Sassuolo',
  'torino':        'Torino',
  'udinese':       'Udinese',
};

export async function getSportsDBTeam(slugOrName: string): Promise<SportsDBTeam | null> {
  const searchName = SPORTSDB_SEARCH_NAMES[slugOrName] ?? slugOrName;
  const encoded = encodeURIComponent(searchName);
  const data = await fetchSportsDB<{ teams: SportsDBTeam[] | null }>(`/searchteams.php?t=${encoded}`);
  const teams = data?.teams ?? [];
  // Filter to Italian teams only to avoid wrong matches
  return teams.find((t) => t.strCountry === 'Italy') ?? teams[0] ?? null;
}

export async function getSportsDBTeamPlayers(teamId: string): Promise<SportsDBPlayer[]> {
  const data = await fetchSportsDB<{ player: SportsDBPlayer[] }>(`/lookup_all_players.php?id=${teamId}`);
  return data?.player ?? [];
}

export async function getSportsDBPlayer(playerId: string): Promise<SportsDBPlayer | null> {
  const data = await fetchSportsDB<{ players: SportsDBPlayer[] }>(`/lookupplayer.php?id=${playerId}`);
  return data?.players?.[0] ?? null;
}

export async function searchSportsDBTeam(name: string): Promise<SportsDBTeam | null> {
  const encoded = encodeURIComponent(name);
  const data = await fetchSportsDB<{ teams: SportsDBTeam[] }>(`/searchteams.php?t=${encoded}`);
  return data?.teams?.[0] ?? null;
}

export function getTeamIdBySlug(slug: string): string | undefined {
  return SPORTSDB_TEAM_IDS[slug.toLowerCase()];
}
