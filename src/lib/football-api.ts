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
  fouls: number;
  goals: number;
  matchesByTeam: { teamId: number; teamName: string; count: number }[];
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
// All 20 Serie A teams 2024-2025
const MOCK_TEAMS: Team[] = [
  { id: 1, name: 'Inter Milan', code: 'INT', logo: '/teams/inter.png', stadium: 'San Siro', founded: 1908, city: 'Milan' },
  { id: 2, name: 'AC Milan', code: 'MIL', logo: '/teams/milan.png', stadium: 'San Siro', founded: 1899, city: 'Milan' },
  { id: 3, name: 'Juventus', code: 'JUV', logo: '/teams/juventus.png', stadium: 'Allianz Stadium', founded: 1897, city: 'Turin' },
  { id: 4, name: 'Napoli', code: 'NAP', logo: '/teams/napoli.png', stadium: 'Diego Armando Maradona', founded: 1926, city: 'Naples' },
  { id: 5, name: 'AS Roma', code: 'ROM', logo: '/teams/roma.png', stadium: 'Olimpico', founded: 1927, city: 'Rome' },
  { id: 6, name: 'Lazio', code: 'LAZ', logo: '/teams/lazio.png', stadium: 'Olimpico', founded: 1900, city: 'Rome' },
  { id: 7, name: 'Atalanta', code: 'ATA', logo: '/teams/atalanta.png', stadium: 'Gewiss Stadium', founded: 1907, city: 'Bergamo' },
  { id: 8, name: 'Fiorentina', code: 'FIO', logo: '/teams/fiorentina.png', stadium: 'Artemio Franchi', founded: 1926, city: 'Florence' },
  { id: 9, name: 'Torino', code: 'TOR', logo: '/teams/torino.png', stadium: 'Olimpico Grande Torino', founded: 1906, city: 'Turin' },
  { id: 10, name: 'Bologna', code: 'BOL', logo: '/teams/bologna.png', stadium: 'Renato Dall\'Ara', founded: 1909, city: 'Bologna' },
  { id: 11, name: 'Udinese', code: 'UDI', logo: '/teams/udinese.png', stadium: 'Dacia Arena', founded: 1896, city: 'Udine' },
  { id: 12, name: 'Sassuolo', code: 'SAS', logo: '/teams/sassuolo.png', stadium: 'Mapei Stadium', founded: 1920, city: 'Reggio Emilia' },
  { id: 13, name: 'Hellas Verona', code: 'VER', logo: '/teams/verona.png', stadium: 'Marcantonio Bentegodi', founded: 1903, city: 'Verona' },
  { id: 14, name: 'Monza', code: 'MON', logo: '/teams/monza.png', stadium: 'U-Power Stadium', founded: 1912, city: 'Monza' },
  { id: 15, name: 'Genoa', code: 'GEN', logo: '/teams/genoa.png', stadium: 'Luigi Ferraris', founded: 1893, city: 'Genoa' },
  { id: 16, name: 'Lecce', code: 'LEC', logo: '/teams/lecce.png', stadium: 'Via del Mare', founded: 1908, city: 'Lecce' },
  { id: 17, name: 'Empoli', code: 'EMP', logo: '/teams/empoli.png', stadium: 'Carlo Castellani', founded: 1920, city: 'Empoli' },
  { id: 18, name: 'Cagliari', code: 'CAG', logo: '/teams/cagliari.png', stadium: 'Unipol Domus', founded: 1920, city: 'Cagliari' },
  { id: 19, name: 'Salernitana', code: 'SAL', logo: '/teams/salernitana.png', stadium: 'Arechi', founded: 1919, city: 'Salerno' },
  { id: 20, name: 'Frosinone', code: 'FRO', logo: '/teams/frosinone.png', stadium: 'Benito Stirpe', founded: 1928, city: 'Frosinone' },
];

// Mock referee data (Serie A arbitres saison 2024-2025)
const MOCK_REFEREES: Referee[] = [
  { id: 1, name: 'Daniele Orsato', nationality: 'Italy', photo: '/referees/orsato.png' },
  { id: 2, name: 'Marco Guida', nationality: 'Italy', photo: '/referees/guida.png' },
  { id: 3, name: 'Davide Massa', nationality: 'Italy', photo: '/referees/massa.png' },
  { id: 4, name: 'Michael Fabbri', nationality: 'Italy', photo: '/referees/fabbri.png' },
  { id: 5, name: 'Fabio Maresca', nationality: 'Italy', photo: '/referees/maresca.png' },
  { id: 6, name: 'Luca Pairetto', nationality: 'Italy', photo: '/referees/pairetto.png' },
  { id: 7, name: 'Daniele Doveri', nationality: 'Italy', photo: '/referees/doveri.png' },
  { id: 8, name: 'Simone Sozza', nationality: 'Italy', photo: '/referees/sozza.png' },
  { id: 9, name: 'Federico La Penna', nationality: 'Italy', photo: '/referees/lapenna.png' },
  { id: 10, name: 'Antonio Rapuano', nationality: 'Italy', photo: '/referees/rapuano.png' },
  { id: 11, name: 'Gianluca Manganiello', nationality: 'Italy', photo: '/referees/manganiello.png' },
  { id: 12, name: 'Luca Massimi', nationality: 'Italy', photo: '/referees/massimi.png' },
  { id: 13, name: 'Rosario Abisso', nationality: 'Italy', photo: '/referees/abisso.png' },
  { id: 14, name: 'Giovanni Ayroldi', nationality: 'Italy', photo: '/referees/ayroldi.png' },
  { id: 15, name: 'Francesco Fourneau', nationality: 'Italy', photo: '/referees/fourneau.png' },
];

function generateMockRefereeStats(referee: Referee, season: number): RefereeStats {
  const matchCount = 20 + Math.floor(Math.random() * 15); // 20-35 matches
  const yellowPerMatch = 3 + Math.random() * 2; // 3-5 yellows per match
  const redPerMatch = 0.1 + Math.random() * 0.15; // 0.1-0.25 reds per match
  const penaltiesPerMatch = 0.2 + Math.random() * 0.2; // 0.2-0.4 penalties per match
  const foulsPerMatch = 20 + Math.random() * 10; // 20-30 fouls per match
  const goalsPerMatch = 2.5 + Math.random() * 1.5; // 2.5-4 goals per match

  // Generate matches by team (random distribution)
  const matchesByTeam = MOCK_TEAMS.slice(0, 12).map((team) => ({
    teamId: team.id,
    teamName: team.name,
    count: 1 + Math.floor(Math.random() * 3), // 1-3 matches per team
  }));

  return {
    referee,
    season,
    matches: matchCount,
    yellowCards: Math.round(matchCount * yellowPerMatch),
    redCards: Math.round(matchCount * redPerMatch),
    penalties: Math.round(matchCount * penaltiesPerMatch),
    fouls: Math.round(matchCount * foulsPerMatch),
    goals: Math.round(matchCount * goalsPerMatch),
    matchesByTeam,
  };
}

/**
 * Get Serie A standings
 */
export async function getStandings(): Promise<Standing[]> {
  return getCached('standings-serie-a', TTL.DAY, async () => {
    // TODO: Replace with real API calls when configured
    if (API_CONFIG.footballData.key && API_CONFIG.footballData.key !== '') {
      try {
        // Use Football-data.org API
        return await fetchFootballDataStandings();
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        // Fall through to mock data
      }
    }

    // Return mock data for development (realistic Serie A standings)
    const forms = ['WWWWW', 'WWWWD', 'WWDWL', 'WDWDL', 'WDLDL', 'DLLDL', 'DLLLL', 'LLLLD'];

    return MOCK_TEAMS.map((team, index) => {
      const position = index + 1;
      const played = 33;

      // Realistic points distribution
      let points, won, draw, lost;
      if (position <= 4) {
        // Champions League zone (70-80 points)
        points = 80 - index * 2;
        won = 24 - index;
        draw = 8 - index;
        lost = played - won - draw;
      } else if (position <= 6) {
        // Europa zone (60-68 points)
        points = 68 - (index - 4) * 4;
        won = 19 - (index - 4);
        draw = 11 - (index - 4);
        lost = played - won - draw;
      } else if (position <= 14) {
        // Mid-table (45-58 points)
        points = 58 - (index - 6) * 1.5;
        won = Math.floor(points / 3);
        draw = points % 3;
        lost = played - won - draw;
      } else {
        // Relegation zone (30-44 points)
        points = 44 - (index - 14) * 2.5;
        won = Math.floor(points / 3) - 1;
        draw = 8 - (index - 14);
        lost = played - won - draw;
      }

      points = Math.round(points);
      won = Math.round(won);
      draw = Math.round(draw);
      lost = Math.max(0, played - won - draw);

      // Realistic goal stats
      const avgGoalsFor = 1.5 + (20 - position) * 0.08;
      const avgGoalsAgainst = 1.0 + (position - 1) * 0.05;
      const goalsFor = Math.round(played * avgGoalsFor);
      const goalsAgainst = Math.round(played * avgGoalsAgainst);
      const goalDifference = goalsFor - goalsAgainst;

      // Varied form
      const formIndex = Math.min(Math.floor(position / 3), forms.length - 1);
      const form = forms[formIndex];

      return {
        position,
        team,
        points,
        played,
        won,
        draw,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        form,
      };
    });
  });
}

/**
 * Get matches (results and fixtures)
 */
export async function getMatches(round?: number, status?: 'scheduled' | 'finished'): Promise<Match[]> {
  const cacheKey = `matches-serie-a-${round || 'all'}-${status || 'all'}`;

  return getCached(cacheKey, TTL.HOUR * 6, async () => {
    // TODO: Replace with real API calls
    if (API_CONFIG.apiFootball.key && API_CONFIG.apiFootball.key !== '') {
      try {
        return await fetchApiFootballMatches(round, status);
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        // Fall through to mock data
      }
    }

    // Return mock data - Une journée Serie A = 10 matchs (20 équipes / 2)
    const mockMatches: Match[] = [];
    const today = new Date();

    // Génère 10 matchs finished (dernière journée complète) + 10 matchs scheduled (prochaine journée)
    for (let i = 0; i < 20; i++) {
      const matchDate = new Date(today);
      if (i < 10) {
        // Dernière journée (matchs finished) - il y a 3 jours
        matchDate.setDate(today.getDate() - 3);
      } else {
        // Prochaine journée (matchs scheduled) - dans 4 jours
        matchDate.setDate(today.getDate() + 4);
      }

      const isFinished = i < 10;
      const teamIndex = i % 10; // 10 matchs par journée

      mockMatches.push({
        id: 1000 + i,
        date: matchDate.toISOString(),
        status: isFinished ? 'finished' : 'scheduled',
        round: isFinished ? 33 : 34,
        homeTeam: MOCK_TEAMS[teamIndex * 2],
        awayTeam: MOCK_TEAMS[teamIndex * 2 + 1],
        venue: MOCK_TEAMS[teamIndex * 2].stadium,
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
      try {
        return await fetchTheSportsDBTeam(idOrSlug);
      } catch (error) {
        console.warn('TheSportsDB API call failed, using mock data:', error);
        // Fall through to mock data
      }
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
      try {
        return await fetchTheSportsDBTeams();
      } catch (error) {
        console.warn('TheSportsDB API call failed, using mock data:', error);
        // Fall through to mock data
      }
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
/**
 * Get team top scorers
 */
export async function getTeamTopScorers(teamId: number): Promise<{ player: Player; goals: number; assists: number }[]> {
  return getCached(`team-scorers-${teamId}`, TTL.WEEK, async () => {
    // TODO: Replace with real API call

    // Mock top scorers per team (top 5)
    const mockNames = ['Lautaro Martinez', 'Marcus Thuram', 'Hakan Calhanoglu', 'Nicolò Barella', 'Denzel Dumfries'];

    return mockNames.map((name, index) => ({
      player: {
        id: teamId * 100 + index,
        name,
        firstname: name.split(' ')[0],
        lastname: name.split(' ').slice(1).join(' '),
        age: 25 + index,
        nationality: 'Italy',
        photo: `/players/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
        position: index === 0 ? 'Attacker' : index < 3 ? 'Midfielder' : 'Defender',
        number: 10 + index,
      },
      goals: 15 - index * 3,
      assists: 8 - index,
    }));
  });
}

/**
 * Get all Serie A referees
 */
export async function getReferees(): Promise<Referee[]> {
  return getCached('referees-serie-a', TTL.WEEK, async () => {
    // TODO: Replace with real API call
    if (API_CONFIG.apiFootball.key) {
      try {
        return await fetchApiFootballReferees();
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
      }
    }

    return MOCK_REFEREES;
  });
}

/**
 * Get referee stats
 */
export async function getRefereeStats(refereeId: number, season: number = 2024): Promise<RefereeStats | null> {
  return getCached(`referee-stats-${refereeId}-${season}`, TTL.WEEK, async () => {
    // TODO: Replace with real API call
    if (API_CONFIG.apiFootball.key) {
      try {
        return await fetchApiFootballRefereeStats(refereeId, season);
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
      }
    }

    // Return mock data
    const referee = MOCK_REFEREES.find((r) => r.id === refereeId);
    if (!referee) return null;

    return generateMockRefereeStats(referee, season);
  });
}

/**
 * Get referee by ID or slug
 */
export async function getReferee(idOrSlug: string | number): Promise<Referee | null> {
  return getCached(`referee-${idOrSlug}`, TTL.WEEK, async () => {
    // TODO: Replace with real API call
    const referees = await getReferees();

    const referee = referees.find(
      (r) => r.id === Number(idOrSlug) || r.name.toLowerCase().replace(/\s+/g, '-') === String(idOrSlug).toLowerCase()
    );

    return referee || null;
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

async function fetchApiFootballReferees(): Promise<Referee[]> {
  // Implementation when API key is configured
  throw new Error('API-Football not configured');
}
