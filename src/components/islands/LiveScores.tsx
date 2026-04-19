import { useState, useEffect } from 'preact/hooks';
import type { Match } from '@/lib/football-api';

interface LiveScoresProps {
  initialMatches?: Match[];
}

interface ScoresResponse {
  matches: Match[];
  timestamp: number;
}

/**
 * Live scores component with intelligent polling
 * - Detects match windows (kick-off - 15min → end + 30min)
 * - Polls /api/scores every 30s during matches
 * - Static display otherwise
 */
export default function LiveScores({ initialMatches = [] }: LiveScoresProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Detect if we're in a match window
  const checkMatchWindow = (matchList: Match[]): boolean => {
    const now = new Date();

    return matchList.some((match) => {
      if (match.status !== 'live' && match.status !== 'scheduled') return false;

      const matchDate = new Date(match.date);

      // Match window: kick-off - 15min → end + 30min (assume 120 min max)
      const windowStart = new Date(matchDate.getTime() - 15 * 60 * 1000);
      const windowEnd = new Date(matchDate.getTime() + 150 * 60 * 1000);

      return now >= windowStart && now <= windowEnd;
    });
  };

  // Fetch scores from API
  const fetchScores = async () => {
    try {
      const response = await fetch('/api/scores?live=true');
      if (!response.ok) throw new Error('Failed to fetch scores');

      const data: ScoresResponse = await response.json();
      setMatches(data.matches);
      setLastUpdate(data.timestamp);
      setIsLive(checkMatchWindow(data.matches));
    } catch (error) {
      console.error('Error fetching live scores:', error);
    }
  };

  // Setup polling
  useEffect(() => {
    // Initial check
    if (initialMatches.length > 0) {
      setIsLive(checkMatchWindow(initialMatches));
    }

    // Poll every 30s if live
    let interval: number | undefined;
    if (isLive) {
      interval = window.setInterval(fetchScores, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  if (matches.length === 0) {
    return (
      <div className="bg-accent-light border border-separator rounded-lg p-4 text-center">
        <p className="text-sm text-text/70">Aucun match en cours</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-separator rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-accent text-white px-4 py-2 flex items-center justify-between">
        <h3 className="font-condensed font-semibold text-sm uppercase">
          Scores en direct
        </h3>
        {isLive && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs">LIVE</span>
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="divide-y divide-separator">
        {matches.map((match) => {
          const isMatchLive = match.status === 'live';

          return (
            <div
              key={match.id}
              className="p-3 hover:bg-accent-light transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Teams */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {match.homeTeam.logo && (
                      <img
                        src={match.homeTeam.logo}
                        alt={match.homeTeam.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium truncate">
                      {match.homeTeam.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.awayTeam.logo && (
                      <img
                        src={match.awayTeam.logo}
                        alt={match.awayTeam.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium truncate">
                      {match.awayTeam.name}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  {match.score ? (
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          isMatchLive ? 'text-accent' : ''
                        }`}
                      >
                        {match.score.home}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          isMatchLive ? 'text-accent' : ''
                        }`}
                      >
                        {match.score.away}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-text/60">
                      {new Date(match.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              {isMatchLive && (
                <div className="mt-2 text-xs text-accent font-semibold">
                  En cours
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-text/60 text-center">
        Mis à jour:{' '}
        {new Date(lastUpdate).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
    </div>
  );
}
