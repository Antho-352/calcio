import { getCached, TTL } from './cache';
import { getSportsDBTeam, getSportsDBTeamPlayers, getSportsDBPlayer, getTeamIdBySlug } from './thesportsdb';
import { getWikipediaExtract } from './wikipedia';
import { getPlayerStatsByTeamSlug, getPlayerStatsByName, FM_ROLE_FR } from './fantamaster';
import {
  getESPNTeams,
  getESPNRoster,
  getESPNSchedule,
  getESPNStandings,
  getESPNLogoUrl,
  ESPN_TEAM_IDS,
  type ESPNMatch,
} from './espn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Team {
  id: number;
  name: string;
  code: string;
  logo: string;           // ESPN CDN logo URL
  stadium?: string;
  founded?: number;
  city?: string;
  description?: string;   // Wikipedia FR extract
  colors?: string[];       // hex colors from TheSportsDB
  stadiumCapacity?: number;
  website?: string;
  espnId?: string;
  thesportsdbSlug?: string;
}

export interface Standing {
  position: number;
  team: Team;
  points: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface Match {
  id: number;
  date: string;
  status: 'scheduled' | 'live' | 'finished';
  round: number;
  homeTeam: Team;
  awayTeam: Team;
  score?: {
    home: number;
    away: number;
  };
  venue?: string;
}

export interface Player {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  photo: string;
  position: string;
  number?: number;
  birthdate?: string;
  height?: string;
  weight?: string;
  description?: string;
  thesportsdbId?: string;
}

export interface PlayerStats {
  player: Player;
  team: Team;
  league: string;
  season: number;
  games: { appearences: number; lineups: number; minutes: number };
  goals: { total: number; assists: number };
  cards: { yellow: number; red: number };
}

export interface SeasonStats {
  caps: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  penalties: number;
  savedPenalties: number;
  averageRating: number;
  value: number;
  role: string;
  last5: { caps: number; goals: number; assists: number; averageRating: number };
}

export interface Referee {
  id: number;
  name: string;
  nationality: string;
  photo?: string;
  description?: string;
}

export interface RefereeStats {
  referee: Referee;
  season: number;
  matches: number;
  yellowCards: number;
  redCards: number;
  penalties: number;
  fouls: number;
  goals: number;
  matchesByTeam: { teamId: number; teamName: string; count: number }[];
}

// ─── Serie A 2025-26 static base ─────────────────────────────────────────────
// Logos, couleurs et stade viennent des API (ESPN + TheSportsDB)
// Ce tableau fournit uniquement les données non-API (id interne, slug, ville)

export const BASE_TEAMS: Team[] = [
  { id: 1,  name: 'Inter Milan',   code: 'INT', logo: getESPNLogoUrl('110'),  city: 'Milan',    espnId: '110',  thesportsdbSlug: 'inter-milan'   },
  { id: 2,  name: 'AC Milan',      code: 'MIL', logo: getESPNLogoUrl('103'),  city: 'Milan',    espnId: '103',  thesportsdbSlug: 'ac-milan'      },
  { id: 3,  name: 'Juventus',      code: 'JUV', logo: getESPNLogoUrl('111'),  city: 'Turin',    espnId: '111',  thesportsdbSlug: 'juventus'      },
  { id: 4,  name: 'Napoli',        code: 'NAP', logo: getESPNLogoUrl('114'),  city: 'Naples',   espnId: '114',  thesportsdbSlug: 'napoli'        },
  { id: 5,  name: 'AS Roma',       code: 'ROM', logo: getESPNLogoUrl('104'),  city: 'Rome',     espnId: '104',  thesportsdbSlug: 'as-roma'       },
  { id: 6,  name: 'Lazio',         code: 'LAZ', logo: getESPNLogoUrl('112'),  city: 'Rome',     espnId: '112',  thesportsdbSlug: 'lazio'         },
  { id: 7,  name: 'Atalanta',      code: 'ATA', logo: getESPNLogoUrl('105'),  city: 'Bergame',  espnId: '105',  thesportsdbSlug: 'atalanta'      },
  { id: 8,  name: 'Fiorentina',    code: 'FIO', logo: getESPNLogoUrl('109'),  city: 'Florence', espnId: '109',  thesportsdbSlug: 'fiorentina'    },
  { id: 9,  name: 'Torino',        code: 'TOR', logo: getESPNLogoUrl('239'),  city: 'Turin',    espnId: '239',  thesportsdbSlug: 'torino'        },
  { id: 10, name: 'Bologna',       code: 'BOL', logo: getESPNLogoUrl('107'),  city: 'Bologne',  espnId: '107',  thesportsdbSlug: 'bologna'       },
  { id: 11, name: 'Udinese',       code: 'UDI', logo: getESPNLogoUrl('118'),  city: 'Udine',    espnId: '118',  thesportsdbSlug: 'udinese'       },
  { id: 12, name: 'Genoa',         code: 'GEN', logo: getESPNLogoUrl('3263'), city: 'Gênes',    espnId: '3263', thesportsdbSlug: 'genoa'         },
  { id: 13, name: 'Lecce',         code: 'LEC', logo: getESPNLogoUrl('113'),  city: 'Lecce',    espnId: '113',  thesportsdbSlug: 'lecce'         },
  { id: 14, name: 'Hellas Verona', code: 'VER', logo: getESPNLogoUrl('119'),  city: 'Vérone',   espnId: '119',  thesportsdbSlug: 'hellas-verona' },
  { id: 15, name: 'Cagliari',      code: 'CAG', logo: getESPNLogoUrl('2925'), city: 'Cagliari', espnId: '2925', thesportsdbSlug: 'cagliari'      },
  { id: 16, name: 'Como',          code: 'COM', logo: getESPNLogoUrl('2572'), city: 'Côme',     espnId: '2572', thesportsdbSlug: 'como'          },
  { id: 17, name: 'Parma',         code: 'PAR', logo: getESPNLogoUrl('115'),  city: 'Parme',    espnId: '115',  thesportsdbSlug: 'parma'         },
  { id: 18, name: 'Cremonese',     code: 'CRE', logo: getESPNLogoUrl('4050'), city: 'Crémone',  espnId: '4050', thesportsdbSlug: 'cremonese'     },
  { id: 19, name: 'Pisa',          code: 'PIS', logo: getESPNLogoUrl('3956'), city: 'Pise',     espnId: '3956', thesportsdbSlug: 'pisa'          },
  { id: 20, name: 'Sassuolo',      code: 'SAS', logo: getESPNLogoUrl('3997'), city: 'Reggio Emilia', espnId: '3997', thesportsdbSlug: 'sassuolo' },
];

// ─── Mock referees (données statiques) ───────────────────────────────────────

const MOCK_REFEREES: Referee[] = [
  { id: 1,  name: 'Daniele Orsato',       nationality: 'Italy' },
  { id: 2,  name: 'Marco Guida',          nationality: 'Italy' },
  { id: 3,  name: 'Davide Massa',         nationality: 'Italy' },
  { id: 4,  name: 'Michael Fabbri',       nationality: 'Italy' },
  { id: 5,  name: 'Fabio Maresca',        nationality: 'Italy' },
  { id: 6,  name: 'Luca Pairetto',        nationality: 'Italy' },
  { id: 7,  name: 'Daniele Doveri',       nationality: 'Italy' },
  { id: 8,  name: 'Simone Sozza',         nationality: 'Italy' },
  { id: 9,  name: 'Federico La Penna',    nationality: 'Italy' },
  { id: 10, name: 'Antonio Rapuano',      nationality: 'Italy' },
  { id: 11, name: 'Gianluca Manganiello', nationality: 'Italy' },
  { id: 12, name: 'Luca Massimi',         nationality: 'Italy' },
  { id: 13, name: 'Rosario Abisso',       nationality: 'Italy' },
  { id: 14, name: 'Giovanni Ayroldi',     nationality: 'Italy' },
  { id: 15, name: 'Francesco Fourneau',   nationality: 'Italy' },
];

function mockRefereeStats(referee: Referee, season: number): RefereeStats {
  const matchCount = 20 + ((referee.id * 7) % 15);
  return {
    referee,
    season,
    matches: matchCount,
    yellowCards: Math.round(matchCount * (3 + (referee.id % 3) * 0.5)),
    redCards: Math.round(matchCount * (0.1 + (referee.id % 2) * 0.1)),
    penalties: Math.round(matchCount * (0.2 + (referee.id % 3) * 0.1)),
    fouls: Math.round(matchCount * (20 + (referee.id % 5) * 2)),
    goals: Math.round(matchCount * (2.5 + (referee.id % 4) * 0.3)),
    matchesByTeam: BASE_TEAMS.slice(0, 12).map((team) => ({
      teamId: team.id,
      teamName: team.name,
      count: 1 + ((referee.id + team.id) % 3),
    })),
  };
}

// ─── Enrichment helpers ───────────────────────────────────────────────────────

async function enrichTeamWithSportsDB(team: Team): Promise<Team> {
  if (!team.thesportsdbSlug) return team;
  const raw = await getSportsDBTeam(team.thesportsdbSlug);
  if (!raw) return team;
  return {
    ...team,
    stadium: raw.strStadium || team.stadium,
    founded: raw.intFormedYear ? parseInt(raw.intFormedYear) : team.founded,
    stadiumCapacity: raw.intStadiumCapacity ? parseInt(raw.intStadiumCapacity) : undefined,
    website: raw.strWebsite || undefined,
    colors: [raw.strColour1, raw.strColour2].filter(Boolean) as string[],
  };
}

async function enrichTeamWithWikipedia(team: Team, slug: string): Promise<Team> {
  const wiki = await getWikipediaExtract(slug, 'fr', 4);
  if (!wiki) return team;
  return { ...team, description: wiki.extract };
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  return BASE_TEAMS;
}

export async function getTeam(idOrSlug: string | number): Promise<Team | null> {
  const cacheKey = `team-enriched-v2-${idOrSlug}`;
  return getCached(cacheKey, TTL.WEEK, async () => {
    let team = typeof idOrSlug === 'number'
      ? BASE_TEAMS.find((t) => t.id === idOrSlug)
      : BASE_TEAMS.find((t) =>
          t.name.toLowerCase().replace(/\s+/g, '-') === String(idOrSlug).toLowerCase()
          || t.thesportsdbSlug === String(idOrSlug)
        );
    if (!team) return null;

    const slug = team.thesportsdbSlug ?? team.name.toLowerCase().replace(/\s+/g, '-');

    try { team = await enrichTeamWithSportsDB(team); } catch { /* fallback */ }
    try { team = await enrichTeamWithWikipedia(team, slug); } catch { /* fallback */ }

    return team;
  });
}

/**
 * Get squad for a team — ESPN roster (2025-26), TheSportsDB photos as fallback
 */
export async function getTeamSquad(espnIdOrSlug: string | number): Promise<Player[]> {
  // Resolve ESPN ID
  let espnId: string | undefined;
  if (typeof espnIdOrSlug === 'string' && /^\d+$/.test(espnIdOrSlug)) {
    espnId = espnIdOrSlug;
  } else {
    const slug = typeof espnIdOrSlug === 'string' ? espnIdOrSlug : undefined;
    const bySlug = slug ? BASE_TEAMS.find((t) => t.thesportsdbSlug === slug) : undefined;
    espnId = bySlug?.espnId;
  }
  if (!espnId) return [];

  return getCached(`squad-espn-${espnId}`, TTL.WEEK, async () => {
    const espnPlayers = await getESPNRoster(espnId!);
    if (!espnPlayers.length) return [];

    // Try to get TheSportsDB photos for each player
    const slug = BASE_TEAMS.find((t) => t.espnId === espnId)?.thesportsdbSlug;
    let sportsdbPlayers: any[] = [];
    if (slug) {
      const sportsdbId = getTeamIdBySlug(slug);
      if (sportsdbId) {
        sportsdbPlayers = await getSportsDBTeamPlayers(sportsdbId).catch(() => []);
      }
    }

    // Build a name→photo map from TheSportsDB
    const photoMap: Record<string, string> = {};
    sportsdbPlayers.forEach((p) => {
      const key = p.strLastName?.toLowerCase() ?? '';
      if (key) photoMap[key] = p.strCutout || p.strThumb || '';
    });

    return espnPlayers.map((p, idx) => {
      const lastNameKey = (p.lastName ?? '').toLowerCase();
      const photo = photoMap[lastNameKey] ?? '';
      return {
        id: parseInt(p.espnId) || idx + 1,
        name: p.fullName,
        firstname: p.firstName,
        lastname: p.lastName,
        age: p.age,
        nationality: p.nationality ?? '',
        photo,
        position: p.position,
        number: p.jersey ? parseInt(p.jersey) : undefined,
        birthdate: p.dateOfBirth || undefined,
        height: p.height,
        weight: p.weight,
      };
    });
  });
}

/**
 * Get player by TheSportsDB ID (detailed profile with Wikipedia bio)
 */
export async function getPlayer(thesportsdbPlayerId: string): Promise<Player | null> {
  return getCached(`player-${thesportsdbPlayerId}`, TTL.WEEK, async () => {
    const raw = await getSportsDBPlayer(thesportsdbPlayerId);
    if (!raw) return null;

    const birthYear = raw.dateBorn ? new Date(raw.dateBorn).getFullYear() : undefined;
    const age = birthYear ? new Date().getFullYear() - birthYear : 0;

    const player: Player = {
      id: parseInt(raw.idPlayer),
      name: raw.strPlayer,
      firstname: raw.strPlayer.split(' ')[0],
      lastname: raw.strLastName || raw.strPlayer.split(' ').slice(1).join(' '),
      age,
      nationality: raw.strNationality ?? '',
      photo: raw.strCutout || raw.strThumb || '',
      position: raw.strPosition ?? 'Joueur',
      birthdate: raw.dateBorn || undefined,
      height: raw.strHeight || undefined,
      weight: raw.strWeight || undefined,
      thesportsdbId: raw.idPlayer,
    };

    try {
      const wiki = await getWikipediaExtract(raw.strPlayer, 'fr', 3);
      if (wiki) player.description = wiki.extract;
    } catch { /* ignore */ }

    return player;
  });
}

/**
 * Get matches from ESPN (2025-26 season)
 */
export async function getMatches(round?: number, status?: 'scheduled' | 'finished'): Promise<Match[]> {
  return getCached(`matches-espn-${status ?? 'all'}`, TTL.DAY, async () => {
    const espnMatches = await getESPNSchedule();
    const today = new Date();

    // Build a simple round number based on match order
    const sorted = [...espnMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Assign round numbers by date groupings (~10 matches per round)
    const rounds: Record<string, number> = {};
    let currentRound = 1;
    let matchesInRound = 0;
    let lastDate = '';
    sorted.forEach((m) => {
      const dateKey = m.date.slice(0, 10);
      if (dateKey !== lastDate && matchesInRound >= 10) {
        currentRound++;
        matchesInRound = 0;
      }
      rounds[m.espnId] = currentRound;
      matchesInRound++;
      lastDate = dateKey;
    });

    const converted = espnMatches.map((m): Match => {
      const homeTeam = BASE_TEAMS.find((t) => t.espnId === m.homeTeamId) ?? {
        id: 0, name: m.homeTeamName, code: '', logo: m.homeTeamLogo,
      };
      const awayTeam = BASE_TEAMS.find((t) => t.espnId === m.awayTeamId) ?? {
        id: 0, name: m.awayTeamName, code: '', logo: m.awayTeamLogo,
      };
      // Date-based fallback: if ESPN says scheduled but date is past, mark as finished
      const matchDate = new Date(m.date);
      const resolvedStatus: 'scheduled' | 'live' | 'finished' =
        m.status === 'finished' ? 'finished'
        : m.status === 'live' ? 'live'
        : matchDate < today ? 'finished'
        : 'scheduled';

      return {
        id: parseInt(m.espnId) || 0,
        date: m.date,
        status: resolvedStatus,
        round: rounds[m.espnId] ?? 0,
        homeTeam,
        awayTeam,
        venue: m.venue,
        score: m.homeScore !== undefined && m.awayScore !== undefined
          ? { home: m.homeScore, away: m.awayScore }
          : undefined,
      };
    });

    if (status) return converted.filter((m) => m.status === status);
    return converted;
  });
}

/**
 * Get Serie A standings from ESPN (2025-26)
 */
export async function getStandings(): Promise<Standing[]> {
  return getCached('standings-espn-v1', TTL.DAY, async () => {
    const espnStandings = await getESPNStandings();

    if (espnStandings.length > 0) {
      return espnStandings
        .map((s, idx): Standing | null => {
          const team = BASE_TEAMS.find((t) => t.espnId === s.espnId);
          if (!team) return null;
          return {
            position: s.position || idx + 1,
            team,
            points: s.points,
            played: s.played,
            won: s.won,
            draw: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            goalDifference: s.goalDifference,
          };
        })
        .filter(Boolean) as Standing[];
    }

    // Fallback: mock standings sorted by a deterministic formula
    const forms = ['WWWWW', 'WWWWD', 'WWDWL', 'WDWDL', 'WDLDL', 'DLLDL', 'DLLLL', 'LLLLD'];
    const played = 31;
    return BASE_TEAMS.map((team, index) => {
      const position = index + 1;
      let points: number, won: number, draw: number;
      if (position <= 4)       { points = 74 - index * 2; won = 22 - index; draw = 8 - index; }
      else if (position <= 6)  { points = 62 - (index - 4) * 4; won = 18 - (index - 4); draw = 8 - (index - 4); }
      else if (position <= 14) { points = Math.round(52 - (index - 6) * 1.5); won = Math.floor(points / 3); draw = points % 3; }
      else                     { points = Math.round(38 - (index - 14) * 2.5); won = Math.floor(points / 3) - 1; draw = 7 - (index - 14); }
      points = Math.round(points); won = Math.round(won); draw = Math.round(draw);
      const lost = Math.max(0, played - won - draw);
      const goalsFor = Math.round(played * (1.4 + (20 - position) * 0.07));
      const goalsAgainst = Math.round(played * (0.9 + (position - 1) * 0.05));
      return {
        position, team, points, played, won, draw, lost, goalsFor, goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        form: forms[Math.min(Math.floor(position / 3), forms.length - 1)],
      };
    });
  });
}

/**
 * Get team top scorers via Fantamaster
 */
export async function getTeamTopScorers(
  teamId: number,
  limit = 5
): Promise<{ player: Player; goals: number; assists: number; caps: number; rating: number }[]> {
  return getCached(`team-scorers-fm-${teamId}`, TTL.DAY, async () => {
    const team = BASE_TEAMS.find((t) => t.id === teamId);
    if (!team?.thesportsdbSlug) return [];

    const fmPlayers = await getPlayerStatsByTeamSlug(team.thesportsdbSlug);
    return fmPlayers
      .filter((p) => p.goals > 0 || p.assists > 0)
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, limit)
      .map((p) => ({
        player: {
          id: p.id, name: p.name,
          firstname: p.name.split(' ')[0],
          lastname: p.name.split(' ').slice(1).join(' '),
          age: 0, nationality: '', photo: '',
          position: FM_ROLE_FR[p.role] ?? p.role,
        },
        goals: p.goals, assists: p.assists, caps: p.caps, rating: p.markavg,
      }));
  });
}

/**
 * Get season stats for a player by name (Fantamaster)
 */
export async function getPlayerSeasonStats(playerName: string, teamSlug?: string): Promise<SeasonStats | null> {
  const cacheKey = `fm-stats-${teamSlug ?? 'any'}-${playerName.toLowerCase()}`;
  return getCached(cacheKey, TTL.DAY, async () => {
    const p = await getPlayerStatsByName(playerName, teamSlug);
    if (!p) return null;
    return {
      caps: p.caps, goals: p.goals, assists: p.assists,
      yellowCards: p.ycards, redCards: p.rcards, ownGoals: p.owngoals,
      penalties: p.penalties, savedPenalties: p.spenalties,
      averageRating: p.markavg, value: p.value,
      role: FM_ROLE_FR[p.role] ?? p.role,
      last5: { caps: p.last5.caps, goals: p.last5.goals, assists: p.last5.assists, averageRating: p.last5.markavg },
    };
  });
}

/**
 * Get player stats (legacy — use getPlayerSeasonStats instead)
 */
export async function getPlayerStats(_playerId: number, _season: number = 2024): Promise<PlayerStats | null> {
  return null;
}

/**
 * Referees
 */
export async function getReferees(): Promise<Referee[]> {
  return MOCK_REFEREES;
}

export async function getReferee(idOrSlug: string | number): Promise<Referee | null> {
  return MOCK_REFEREES.find(
    (r) => r.id === Number(idOrSlug)
      || r.name.toLowerCase().replace(/\s+/g, '-') === String(idOrSlug).toLowerCase()
  ) ?? null;
}

export async function getRefereeStats(refereeId: number, season: number = 2025): Promise<RefereeStats | null> {
  return getCached(`referee-stats-${refereeId}-${season}`, TTL.WEEK, async () => {
    const referee = MOCK_REFEREES.find((r) => r.id === refereeId);
    return referee ? mockRefereeStats(referee, season) : null;
  });
}
