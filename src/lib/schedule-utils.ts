// Schedule generation logic based on user's primary goal and training days per week

export type SessionType = 'skill_workout' | 'shooting' | 'lifting' | 'mobility' | 'pickup' | 'game' | 'rest';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  skill_workout: 'Skill Workout',
  shooting: 'Shooting',
  lifting: 'Lifting',
  mobility: 'Mobility',
  pickup: 'Pickup',
  game: 'Game',
  rest: 'Rest',
};

export const SESSION_TYPE_ICONS: Record<SessionType, string> = {
  skill_workout: '🏀',
  shooting: '🎯',
  lifting: '🏋️',
  mobility: '🧘',
  pickup: '🏟️',
  game: '🏆',
  rest: '😴',
};

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LABELS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const GOAL_SCHEDULES: Record<string, SessionType[]> = {
  'Make the Team': ['skill_workout', 'shooting', 'skill_workout', 'rest', 'lifting', 'pickup', 'rest'],
  'Earn Starting Spot': ['skill_workout', 'shooting', 'skill_workout', 'lifting', 'shooting', 'rest', 'rest'],
  'Play D1/D2/D3': ['skill_workout', 'shooting', 'skill_workout', 'lifting', 'skill_workout', 'shooting', 'rest'],
  'Play Professionally': ['skill_workout', 'shooting', 'skill_workout', 'lifting', 'skill_workout', 'shooting', 'lifting'],
  'Improve Overall Game': ['skill_workout', 'rest', 'shooting', 'rest', 'skill_workout', 'pickup', 'rest'],
};

export function generateSchedule(primaryGoal: string | null, trainingDaysPerWeek: number | null): SessionType[] {
  const goal = primaryGoal || 'Improve Overall Game';
  const days = trainingDaysPerWeek ?? 3;

  // Find best matching goal schedule
  let template = GOAL_SCHEDULES['Improve Overall Game'];
  for (const [key, sched] of Object.entries(GOAL_SCHEDULES)) {
    if (goal.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(goal.toLowerCase())) {
      template = sched;
      break;
    }
  }

  // Trim to training days: keep first N non-rest, rest the remainder
  const result: SessionType[] = [...template];
  let nonRestCount = 0;
  for (let i = 0; i < 7; i++) {
    if (result[i] !== 'rest') {
      nonRestCount++;
      if (nonRestCount > days) {
        result[i] = 'rest';
      }
    }
  }

  return result;
}

export const ALL_SESSION_TYPES: SessionType[] = ['skill_workout', 'shooting', 'lifting', 'mobility', 'pickup', 'game', 'rest'];
