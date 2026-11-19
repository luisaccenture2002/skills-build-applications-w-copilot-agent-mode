import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function isObjectIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isObjectId);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity payload must be an object', 400);

  const { userId, teamId, type, minutes } = input;
  if (
    !isObjectId(userId) ||
    !isObjectId(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw httpError('Activity requires valid userId, teamId, type, and positive minutes', 400);
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw httpError('User not found', 404);
  const teamExists = await Team.exists({ _id: teamId });
  if (!teamExists) throw httpError('Team not found', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team payload must be an object', 400);

  const { name, mascot } = input;
  const members: unknown = input.members ?? [];
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0 ||
    !isObjectIdList(members)
  ) {
    throw httpError('Team requires a name, mascot, and valid member IDs', 400);
  }

  const memberIds = [...new Set(members)];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) throw httpError('One or more team members were not found', 404);
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError('User not found', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const activityFocus = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
      case 'cycle':
        return 'endurance';
      default:
        return type.toLowerCase();
    }
  };
  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : undefined;

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchingActivity = activities.find((activity) => activityFocus(activity.type) === focus);
      const matchesGoal = focus === goal;
      const reason = matchingActivity && matchesGoal
        ? `Matches your ${goal} goal and recent ${matchingActivity.type} activity.`
        : matchingActivity
          ? `Recommended based on your ${matchingActivity.type} activity.`
          : matchesGoal
            ? `Matches your ${goal} fitness goal.`
            : 'Suggested to support your fitness routine.';
      return {
        workout,
        score: (matchesGoal ? 2 : 0) + (matchingActivity ? 1 : 0),
        reason,
      };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title))
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
