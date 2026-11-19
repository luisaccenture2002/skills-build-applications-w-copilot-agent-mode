import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };
type TeamResponse = { teams: Team[] };

const loadTeams = async () => (await getJson<TeamResponse>('/api/teams')).teams;

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      loadItems={loadTeams}
      renderItem={(team) => <>{team.name} · Members: {team.members.join(', ')}</>}
    />
  );
}
