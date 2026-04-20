// ESPN public API — no key required
// Couvre la Serie A 2025-26 avec logos, effectifs et calendrier

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1';

// Static mapping: our slug → ESPN team ID (Serie A 2025-26)
export const ESPN_TEAM_IDS: Record<string, string> = {
  'ac-milan':      '103',
  'as-roma':       '104',
  'atalanta':      '105',
  'bologna':       '107',
  'cagliari':      '2925',
  'como':          '2572',
  'cremonese':     '4050',
  'fiorentina':    '109',
  'genoa':         '3263',
  'hellas-verona': '119',
  'inter-milan':   '110',
  'juventus':      '111',
  'lazio':         '112',
  'lecce':         '113',
  'napoli':        '114',
  'parma':         '115',
  'pisa':          '3956',
  'sassuolo':      '3997',
  'torino':        '239',
  'udinese':       '118',
};

// Reverse: ESPN ID → our slug
const ESPN_ID_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(ESPN_TEAM_IDS).map(([k, v]) => [v, k])
);

export function getSlugFromESPNId(espnId: string): string | undefined {
  return ESPN_ID_TO_SLUG[espnId];
}

export function getESPNLogoUrl(espnId: string, size = 500): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/${size}/${espnId}.png`;
}

export interface ESPNTeam {
  espnId: string;
  slug: string;
  name: string;
  shortName: string;
  color: string;         // hex sans #
  altColor: string;
  logo: string;
}

export interface ESPNPlayer {
  espnId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  jersey?: string;
  position: string;
  age: number;
  dateOfBirth: string;
  height?: string;
  weight?: string;
  nationality?: string;
}

export interface ESPNStanding {
  espnId: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface ESPNMatch {
  espnId: string;
  date: string;           // ISO
  status: 'scheduled' | 'live' | 'finished';
  homeTeamId: string;     // ESPN ID
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
}

async function fetchESPN<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

/**
 * Get all Serie A 2025-26 teams with logos and colors
 */
export async function getESPNTeams(): Promise<ESPNTeam[]> {
  const data = await fetchESPN<any>('/teams');
  const raw = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];

  return raw
    .map((t: any) => {
      const tm = t.team;
      const espnId = String(tm.id);
      const slug = ESPN_ID_TO_SLUG[espnId] ?? tm.displayName.toLowerCase().replace(/\s+/g, '-');
      return {
        espnId,
        slug,
        name: tm.displayName,
        shortName: tm.abbreviation ?? '',
        color: tm.color ?? '000000',
        altColor: tm.alternateColor ?? 'ffffff',
        logo: getESPNLogoUrl(espnId),
      };
    })
    .filter((t: ESPNTeam) => ESPN_ID_TO_SLUG[t.espnId]);
}

/**
 * Get roster for a team
 */
export async function getESPNRoster(espnId: string): Promise<ESPNPlayer[]> {
  const data = await fetchESPN<any>(`/teams/${espnId}/roster`);
  const athletes: any[] = data?.athletes ?? [];

  return athletes.map((a: any) => ({
    espnId: String(a.id),
    fullName: a.fullName,
    firstName: a.firstName,
    lastName: a.lastName,
    jersey: a.jersey,
    position: a.position?.displayName ?? 'Joueur',
    age: a.age ?? 0,
    dateOfBirth: a.dateOfBirth ? a.dateOfBirth.slice(0, 10) : '',
    height: a.displayHeight,
    weight: a.displayWeight,
    nationality: a.citizenshipCountry?.displayName,
  }));
}

/**
 * Get Serie A standings
 */
export async function getESPNStandings(): Promise<ESPNStanding[]> {
  const data = await fetchESPN<any>('/standings');
  const groups: any[] = data?.standings?.entries ?? data?.children?.[0]?.standings?.entries ?? [];

  // Try alternate structure
  const entries: any[] = groups.length > 0 ? groups
    : (data?.standings?.[0]?.entries ?? []);

  return entries.map((entry: any, idx: number) => {
    const stats: Record<string, number> = {};
    (entry.stats ?? []).forEach((s: any) => {
      stats[s.name] = parseFloat(s.value ?? 0);
    });
    return {
      espnId: String(entry.team?.id ?? ''),
      position: idx + 1,
      points: stats['points'] ?? stats['pts'] ?? 0,
      played: stats['gamesPlayed'] ?? stats['played'] ?? 0,
      won: stats['wins'] ?? stats['won'] ?? 0,
      drawn: stats['ties'] ?? stats['drawn'] ?? 0,
      lost: stats['losses'] ?? stats['lost'] ?? 0,
      goalsFor: stats['pointsFor'] ?? stats['goalsFor'] ?? 0,
      goalsAgainst: stats['pointsAgainst'] ?? stats['goalsAgainst'] ?? 0,
      goalDifference: stats['pointDifferential'] ?? stats['goalDifference'] ?? 0,
    };
  }).filter((s) => s.espnId && ESPN_ID_TO_SLUG[s.espnId]);
}

/**
 * Get full Serie A schedule for 2025-26 season
 */
export async function getESPNSchedule(): Promise<ESPNMatch[]> {
  const data = await fetchESPN<any>(
    '/scoreboard?limit=500&dates=20250801-20260701'
  );
  const events: any[] = data?.events ?? [];

  return events
    .map((e: any) => {
      const comp = e.competitions?.[0];
      if (!comp) return null;

      const competitors: any[] = comp.competitors ?? [];
      const home = competitors.find((c: any) => c.homeAway === 'home');
      const away = competitors.find((c: any) => c.homeAway === 'away');
      if (!home || !away) return null;

      const statusType = comp.status?.type?.name ?? '';
      const status: 'scheduled' | 'live' | 'finished' =
        statusType === 'STATUS_FINAL' ? 'finished'
        : statusType === 'STATUS_IN_PROGRESS' ? 'live'
        : 'scheduled';

      const homeId = String(home.team?.id ?? '');
      const awayId = String(away.team?.id ?? '');

      return {
        espnId: String(e.id),
        date: e.date,
        status,
        homeTeamId: homeId,
        awayTeamId: awayId,
        homeTeamName: home.team?.displayName ?? '',
        awayTeamName: away.team?.displayName ?? '',
        homeTeamLogo: getESPNLogoUrl(homeId),
        awayTeamLogo: getESPNLogoUrl(awayId),
        homeScore: status !== 'scheduled' ? parseInt(home.score ?? '0') : undefined,
        awayScore: status !== 'scheduled' ? parseInt(away.score ?? '0') : undefined,
        venue: comp.venue?.fullName,
      } as ESPNMatch;
    })
    .filter(Boolean) as ESPNMatch[];
}
