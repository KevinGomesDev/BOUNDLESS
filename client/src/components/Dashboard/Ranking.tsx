import React, { useEffect, useState } from "react";
import { socketService } from "../../services/socket.service";

interface RankingEntry {
  rank: number;
  username: string;
  victories: number;
}

interface RankingData {
  arena: RankingEntry[];
  match: RankingEntry[];
}

type RankingTab = "arena" | "match";

export const Ranking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RankingTab>("arena");

  useEffect(() => {
    const handleRankingData = (data: RankingData) => {
      setRanking(data);
      setLoading(false);
    };

    const handleRankingError = () => {
      setLoading(false);
    };

    socketService.on("ranking:data", handleRankingData);
    socketService.on("ranking:error", handleRankingError);

    // Buscar ranking
    socketService.emit("ranking:get", {});

    return () => {
      socketService.off("ranking:data", handleRankingData);
      socketService.off("ranking:error", handleRankingError);
    };
  }, []);

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number): string => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-600/30 to-yellow-800/30 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-600/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-orange-700/20 to-orange-900/20 border-orange-600/50";
      default:
        return "bg-citadel-carved/30 border-metal-iron/30";
    }
  };

  const currentRanking =
    activeTab === "arena" ? ranking?.arena : ranking?.match;

  return (
    <div className="bg-citadel-granite border-2 border-metal-iron rounded-xl shadow-stone-raised overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-citadel-slate to-citadel-granite border-b-2 border-citadel-carved p-4">
        <h2
          className="text-lg font-bold text-parchment-light flex items-center gap-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span className="text-2xl">🏆</span>
          Ranking de Vitórias
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-citadel-carved">
        <button
          onClick={() => setActiveTab("arena")}
          className={`flex-1 py-2 px-4 text-sm font-semibold transition-colors ${
            activeTab === "arena"
              ? "bg-war-crimson/20 text-war-ember border-b-2 border-war-crimson"
              : "text-parchment-dark hover:text-parchment-light hover:bg-citadel-carved/30"
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          🏟️ Arena
        </button>
        <button
          onClick={() => setActiveTab("match")}
          className={`flex-1 py-2 px-4 text-sm font-semibold transition-colors ${
            activeTab === "match"
              ? "bg-nature-forest/20 text-nature-spring border-b-2 border-nature-forest"
              : "text-parchment-dark hover:text-parchment-light hover:bg-citadel-carved/30"
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          ⚔️ Partidas
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-metal-iron border-t-metal-gold rounded-full"></div>
          </div>
        ) : !currentRanking || currentRanking.length === 0 ? (
          <div className="text-center py-8 text-parchment-dark">
            <p className="text-3xl mb-2">📜</p>
            <p>Nenhuma vitória registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentRanking.map((entry) => (
              <div
                key={`${activeTab}-${entry.rank}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${getRankStyle(
                  entry.rank
                )}`}
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  {entry.rank <= 3 ? (
                    <span className="text-2xl">{getRankIcon(entry.rank)}</span>
                  ) : (
                    <span className="text-parchment-dark font-bold text-lg">
                      {getRankIcon(entry.rank)}
                    </span>
                  )}
                </div>

                {/* Username */}
                <div className="flex-1">
                  <span
                    className={`font-semibold ${
                      entry.rank === 1
                        ? "text-yellow-400"
                        : entry.rank === 2
                        ? "text-gray-300"
                        : entry.rank === 3
                        ? "text-orange-400"
                        : "text-parchment-light"
                    }`}
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {entry.username}
                  </span>
                </div>

                {/* Victories */}
                <div className="flex items-center gap-1">
                  <span className="text-xl">⚔️</span>
                  <span
                    className="text-parchment-light font-bold"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {entry.victories}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
