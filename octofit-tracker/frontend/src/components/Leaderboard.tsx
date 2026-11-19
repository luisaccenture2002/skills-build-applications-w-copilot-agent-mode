import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

const loadLeaderboard = async () => (await getJson<LeaderboardResponse>('/api/leaderboard')).leaderboard;

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard scores yet."
      loadItems={loadLeaderboard}
      renderItem={(entry) => `#${entry.rank} ${entry.teamName} · ${entry.totalPoints} points`}
    />
  );
}
