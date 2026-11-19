import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason?: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

const loadSuggestions = async () => (
  await getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
).suggestions;

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions yet."
      loadItems={loadSuggestions}
      renderItem={(suggestion) => suggestion.reason ? `${suggestion.title} · ${suggestion.reason}` : suggestion.title}
    />
  );
}
