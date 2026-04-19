import { useState, useEffect } from 'preact/hooks';
import type { Standing } from '@/lib/football-api';

interface LiveStandingsProps {
  initialStandings?: Standing[];
  compact?: boolean;
}

interface StandingsResponse {
  standings: Standing[];
  timestamp: number;
}

/**
 * Live standings component
 * - Fetches from /api/standings
 * - Updates on initial load (client-side hydration)
 * - Can be refreshed manually
 */
export default function LiveStandings({
  initialStandings = [],
  compact = false,
}: LiveStandingsProps) {
  const [standings, setStandings] = useState<Standing[]>(initialStandings);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch standings from API
  const fetchStandings = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/standings');
      if (!response.ok) throw new Error('Failed to fetch standings');

      const data: StandingsResponse = await response.json();
      setStandings(data.standings);
      setLastUpdate(data.timestamp);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (initialStandings.length === 0) {
      fetchStandings();
    }
  }, []);

  if (standings.length === 0) {
    return (
      <div className="bg-white border border-separator rounded-lg p-4 text-center">
        <p className="text-sm text-text/70">Chargement du classement...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-separator rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-accent text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-condensed font-semibold uppercase">
          Classement Serie A
        </h3>
        <button
          onClick={fetchStandings}
          disabled={isRefreshing}
          className="text-xs hover:underline disabled:opacity-50"
          aria-label="Actualiser le classement"
        >
          {isRefreshing ? '...' : '↻'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-text/60 border-b border-separator">
            <tr>
              <th className="text-left px-4 py-2 w-8">#</th>
              <th className="text-left px-2 py-2">Équipe</th>
              {!compact && <th className="text-center px-2 py-2 w-12">J</th>}
              <th className="text-center px-2 py-2 w-12">Pts</th>
              {!compact && (
                <>
                  <th className="text-center px-2 py-2 w-12">+/-</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {standings.map((standing) => {
              // Zone colors
              let zoneColor = '';
              if (standing.position <= 4) {
                zoneColor = 'border-l-4 border-l-blue-600'; // Champions League
              } else if (standing.position === 5) {
                zoneColor = 'border-l-4 border-l-orange-500'; // Europa League
              } else if (standing.position === 6) {
                zoneColor = 'border-l-4 border-l-green-600'; // Conference League
              } else if (standing.position >= 18) {
                zoneColor = 'border-l-4 border-l-red-600'; // Relegation
              }

              return (
                <tr
                  key={standing.team.id}
                  className={`hover:bg-accent-light transition-colors ${zoneColor}`}
                >
                  {/* Position */}
                  <td className="px-4 py-2 font-semibold text-text/80">
                    {standing.position}
                  </td>

                  {/* Team */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {standing.team.logo && (
                        <img
                          src={standing.team.logo}
                          alt={standing.team.name}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="font-medium truncate">
                        {compact ? standing.team.code : standing.team.name}
                      </span>
                    </div>
                  </td>

                  {/* Games played */}
                  {!compact && (
                    <td className="px-2 py-2 text-center text-text/60">
                      {standing.played}
                    </td>
                  )}

                  {/* Points */}
                  <td className="px-2 py-2 text-center font-bold">
                    {standing.points}
                  </td>

                  {/* Goal difference */}
                  {!compact && (
                    <td
                      className={`px-2 py-2 text-center font-medium ${
                        standing.goalDifference > 0
                          ? 'text-green-600'
                          : standing.goalDifference < 0
                            ? 'text-red-600'
                            : 'text-text/60'
                      }`}
                    >
                      {standing.goalDifference > 0 && '+'}
                      {standing.goalDifference}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 border-t border-separator">
        <div className="flex items-center justify-between text-xs text-text/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-600 rounded-sm" />
              <span>C1</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-500 rounded-sm" />
              <span>EL</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-600 rounded-sm" />
              <span>ECL</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-600 rounded-sm" />
              <span>Relég.</span>
            </div>
          </div>
          <div>
            MAJ:{' '}
            {new Date(lastUpdate).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
