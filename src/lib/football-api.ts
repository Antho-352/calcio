import { getCached, TTL } from './cache';

// Types
export interface Team {
  id: number;
  name: string;
  code: string;
  logo: string;
  stadium?: string;
  founded?: number;
  city?: string;
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
    halftime?: {
      home: number;
      away: number;
    };
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
}

export interface PlayerStats {
  player: Player;
  team: Team;
  league: string;
  season: number;
  games: {
    appearences: number;
    lineups: number;
    minutes: number;
  };
  goals: {
    total: number;
    assists: number;
  };
  cards: {
    yellow: number;
    red: number;
  };
}

export interface Referee {
  id: number;
  name: string;
  nationality: string;
  photo?: string;
}

export interface RefereeStats {
  referee: Referee;
  season: number;
  matches: number;
  yellowCards: number;
  redCards: number;
  penalties: number;
}

// API Configuration
const API_CONFIG = {
  apiFootball: {
    baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
    key: import.meta.env.FOOTBALL_API_KEY || '',
  },
  footballData: {
    baseUrl: 'https://api.football-data.org/v4',
    key: import.meta.env.FOOTBALL_DATA_API_KEY || '',
  },
  theSportsDB: {
    baseUrl: 'https://www.thesportsdb.com/api/v1/json',
    key: import.meta.env.THESPORTSDB_API_KEY || '1', // Free tier key is "1"
  },
};

// Serie A League IDs
const SERIE_A_IDS = {
  apiFootball: 135, // Serie A league ID in API-Football
  footballData: 'SA', // Serie A code in Football-data.org
  theSportsDB: '4332', // Serie A league ID in TheSportsDB
};

// Mock data for development (until APIs are configured)
const MOCK_TEAMS: Team[] = [
  { id: 1, name: 'Inter Milan', code: 'INT', logo: '/teams/inter.png', stadium: 'San Siro', city: 'Milan' },
  { id: 2, name: 'AC Milan', code: 'MIL', logo: '/teams/milan.png', stadium: 'San Siro', city: 'Milan' },
  { id: 3, name: 'Juventus', code: 'JUV', logo: '/teams/juventus.png', stadium: 'Allianz Stadium', city: 'Turin' },
  { id: 4, name: 'Napoli', code: 'NAP', logo: '/teams/napoli.png', stadium: 'Diego Armando Maradona', city: 'Naples' },
  { id: 5, name: 'AS Roma', code: 'ROM', logo: '/teams/roma.png', stadium: 'Olimpico', city: 'Rome' },
  { id: 6, name: 'Lazio', code: 'LAZ', logo: '/teams/lazio.png', stadium: 'Olimpico', city: 'Rome' },
  { id: 7, name: 'Atalanta', code: 'ATA', logo: '/teams/atalanta.png', stadium: 'Gewiss Stadium', city: 'Bergamo' },
  { id: 8, name: 'Fiorentina', code: 'FIO', logo: '/teams/fiorentina.png', stadium: 'Artemio Franchi', city: 'Florence' },
];

/**
 * Get Serie A standings
 */
export async function getStandings(): Promise<Standing[]> {
  return getCached('standings-serie-a', TTL.DAY, async () => {
    // TODO: Replace with real API calls when configured
    if (API_CONFIG.footballData.key) {
      // Use Football-data.org API
      return await fetchFootballDataStandings();
    }

    // Return mock data for development
    return MOCK_TEAMS.map((team, index) => ({
      position: index + 1,
      team,
      points: 80 - index * 3,
      played: 30,
      won: 20 - index,
      draw: 7,
      lost: 3 + index,
      goalsFor: 60 - index * 2,
      goalsAgainst: 20 + index * 2,
      goalDifference: 40 - index * 4,
      form: 'WWDWL',
    }));
  });
}

/**
 * Get matches (results and fixtures)
 */
export async function getMatches(round?: number, status?: 'scheduled' | 'finished'): Promise<Match[]> {
  const cacheKey = `matches-serie-a-${round || 'all'}-${status || 'all'}`;

  return getCached(cacheKey, TTL.HOUR * 6, async () => {
    // TODO: Replace with real API calls
    if (API_CONFIG.apiFootball.key) {
      return await fetchApiFootballMatches(round, status);
    }

    // Return mock data
    const mockMatches: Match[] = [];
    const today = new Date();

    for (let i = 0; i < 10; i++) {
      const matchDate = new Date(today);
      matchDate.setDate(today.getDate() - 5 + i);

      const isFinished = i < 5;

      mockMatches.push({
        id: 1000 + i,
        date: matchDate.toISOString(),
        status: isFinished ? 'finished' : 'scheduled',
        round: 30,
        homeTeam: MOCK_TEAMS[i % MOCK_TEAMS.length],
        awayTeam: MOCK_TEAMS[(i + 1) % MOCK_TEAMS.length],
        venue: MOCK_TEAMS[i % MOCK_TEAMS.length].stadium,
        ...(isFinished && {
          score: {
            home: Math.floor(Math.random() * 4),
            away: Math.floor(Math.random() * 4),
          },
        }),
      });
    }

    return mockMatches.filter((match) => {
      if (status === 'finished') return match.status === 'finished';
      if (status === 'scheduled') return match.status === 'scheduled';
      return true;
    });
  });
}

/**
 * Get team by ID or slug
 */
export async function getTeam(idOrSlug: string | number): Promise<Team | null> {
  return getCached(`team-${idOrSlug}`, TTL.WEEK, async () => {
    // TODO: Replace with real API call
    if (API_CONFIG.theSportsDB.key) {
      return await fetchTheSportsDBTeam(idOrSlug);
    }

    // Return mock data
    const team = MOCK_TEAMS.find(
      (t) => t.id === Number(idOrSlug) || t.name.toLowerCase().replace(/\s+/g, '-') === String(idOrSlug).toLowerCase()
    );

    return team || null;
  });
}

/**
 * Get all teams
 */
export async function getTeams(): Promise<Team[]> {
  return getCached('teams-serie-a', TTL.WEEK, async () => {
    // TODO: Replace with real API call
    if (API_CONFIG.theSportsDB.key) {
      return await fetchTheSportsDBTeams();
    }

    return MOCK_TEAMS;
  });
}

/**
 * Get player stats
 */
export async function getPlayerStats(playerId: number, season: number = 2024): Promise<PlayerStats | null> {
  return getCached(`player-stats-${playerId}-${season}`, TTL.WEEK, async () => {
    // TODO: Replace with real API call
    if (API_CONFIG.apiFootball.key) {
      return await fetchApiFootballPlayerStats(playerId, season);
    }

    // Return mock data
    return {
      player: {
        id: playerId,
        name: 'Lautaro Martínez',
        firstname: 'Lautaro',
        lastname: 'Martínez',
        age: 26,
        nationality: 'Argentina',
        photo: '/players/lautaro.png',
        position: 'Attaquant',
        number: 10,
      },
      team: MOCK_TEAMS[0],
      league: 'Serie A',
      season,
      games: {
        appearences: 30,
        lineups: 28,
        minutes: 2500,
      },
      goals: {
        total: 18,
        assists: 5,
      },
      cards: {
        yellow: 3,
        red: 0,
      },
    };
  });
}

/**
 * Get referee stats
 */
export async function getRefereeStats(refereeId: number, season: number = 2024): Promise<RefereeStats | null> {
  return getCached(`referee-stats-${refereeId}-${season}`, TTL.WEEK, async () => {
    // TODO: Replace with real API call
    if (API_CONFIG.apiFootball.key) {
      return await fetchApiFootballRefereeStats(refereeId, season);
    }

    // Return mock data
    return {
      referee: {
        id: refereeId,
        name: 'Daniele Orsato',
        nationality: 'Italy',
        photo: '/referees/orsato.png',
      },
      season,
      matches: 25,
      yellowCards: 85,
      redCards: 3,
      penalties: 8,
    };
  });
}

// Real API fetch functions (to be implemented when APIs are configured)

async function fetchFootballDataStandings(): Promise<Standing[]> {
  const response = await fetch(`${API_CONFIG.footballData.baseUrl}/competitions/${SERIE_A_IDS.footballData}/standings`, {
    headers: {
      'X-Auth-Token': API_CONFIG.footballData.key,
    },
  });

  if (!response.ok) {
    throw new Error(`Football-data.org API error: ${response.status}`);
  }

  const data = await response.json();
  // Transform to our format
  return data.standings[0].table.map((item: any) => ({
    position: item.position,
    team: {
      id: item.team.id,
      name: item.team.name,
      code: item.team.tla,
      logo: item.team.crest,
    },
    points: item.points,
    played: item.playedGames,
    won: item.won,
    draw: item.draw,
    lost: item.lost,
    goalsFor: item.goalsFor,
    goalsAgainst: item.goalsAgainst,
    goalDifference: item.goalDifference,
  }));
}

async function fetchApiFootballMatches(round?: number, status?: string): Promise<Match[]> {
  // Implementation when API key is configured
  throw new Error('API-Football not configured');
}

async function fetchTheSportsDBTeam(idOrSlug: string | number): Promise<Team | null> {
  // Implementation when needed
  throw new Error('TheSportsDB not configured');
}

async function fetchTheSportsDBTeams(): Promise<Team[]> {
  // Implementation when needed
  throw new Error('TheSportsDB not configured');
}

async function fetchApiFootballPlayerStats(playerId: number, season: number): Promise<PlayerStats | null> {
  // Implementation when API key is configured
  throw new Error('API-Football not configured');
}

async function fetchApiFootballRefereeStats(refereeId: number, season: number): Promise<RefereeStats | null> {
  // Implementation when API key is configured
  throw new Error('API-Football not configured');
}
