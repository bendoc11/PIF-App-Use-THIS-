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
  pickup: '🤸',
  game: '🏆',
  rest: '😴',
};

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  skill_workout: 'bg-primary text-primary-foreground',
  shooting: 'bg-pif-orange text-white',
  lifting: 'bg-blue-600 text-white',
  mobility: 'bg-pif-green text-white',
  pickup: 'bg-pif-purple text-white',
  game: 'bg-pif-gold text-black',
  rest: 'bg-muted text-muted-foreground',
};

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LABELS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DAY_LABELS_FULL = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const ALL_SESSION_TYPES: SessionType[] = ['skill_workout', 'shooting', 'lifting', 'mobility', 'pickup', 'game', 'rest'];

export interface ScheduleRow {
  day_of_week: number;
  session_type: SessionType;
  order_index: number;
}

// Multi-session goal schedules
const GOAL_SCHEDULES: Record<string, ScheduleRow[]> = {
  'Play Professionally': [
    { day_of_week: 0, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 0, session_type: 'shooting', order_index: 1 },
    { day_of_week: 0, session_type: 'lifting', order_index: 2 },
    { day_of_week: 1, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 1, session_type: 'pickup', order_index: 1 },
    { day_of_week: 1, session_type: 'mobility', order_index: 2 },
    { day_of_week: 2, session_type: 'shooting', order_index: 0 },
    { day_of_week: 2, session_type: 'mobility', order_index: 1 },
    { day_of_week: 3, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 3, session_type: 'pickup', order_index: 1 },
    { day_of_week: 3, session_type: 'mobility', order_index: 2 },
    { day_of_week: 4, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 4, session_type: 'shooting', order_index: 1 },
    { day_of_week: 4, session_type: 'lifting', order_index: 2 },
    { day_of_week: 5, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 5, session_type: 'mobility', order_index: 1 },
    { day_of_week: 6, session_type: 'rest', order_index: 0 },
    { day_of_week: 6, session_type: 'mobility', order_index: 1 },
  ],
  'Play at the Next Level (D1/D2/D3/JUCO)': [
    { day_of_week: 0, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 0, session_type: 'shooting', order_index: 1 },
    { day_of_week: 0, session_type: 'lifting', order_index: 2 },
    { day_of_week: 1, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 1, session_type: 'pickup', order_index: 1 },
    { day_of_week: 1, session_type: 'mobility', order_index: 2 },
    { day_of_week: 2, session_type: 'shooting', order_index: 0 },
    { day_of_week: 2, session_type: 'mobility', order_index: 1 },
    { day_of_week: 3, session_type: 'rest', order_index: 0 },
    { day_of_week: 3, session_type: 'mobility', order_index: 1 },
    { day_of_week: 4, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 4, session_type: 'shooting', order_index: 1 },
    { day_of_week: 4, session_type: 'lifting', order_index: 2 },
    { day_of_week: 5, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 5, session_type: 'pickup', order_index: 1 },
    { day_of_week: 6, session_type: 'rest', order_index: 0 },
  ],
  'Earn a Starting Spot': [
    { day_of_week: 0, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 0, session_type: 'lifting', order_index: 1 },
    { day_of_week: 1, session_type: 'shooting', order_index: 0 },
    { day_of_week: 1, session_type: 'mobility', order_index: 1 },
    { day_of_week: 2, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 2, session_type: 'shooting', order_index: 1 },
    { day_of_week: 2, session_type: 'lifting', order_index: 2 },
    { day_of_week: 3, session_type: 'shooting', order_index: 0 },
    { day_of_week: 4, session_type: 'shooting', order_index: 0 },
    { day_of_week: 4, session_type: 'lifting', order_index: 1 },
    { day_of_week: 5, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 5, session_type: 'pickup', order_index: 1 },
    { day_of_week: 6, session_type: 'rest', order_index: 0 },
  ],
  'Make the Team': [
    { day_of_week: 0, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 1, session_type: 'shooting', order_index: 0 },
    { day_of_week: 1, session_type: 'mobility', order_index: 1 },
    { day_of_week: 2, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 2, session_type: 'shooting', order_index: 1 },
    { day_of_week: 3, session_type: 'mobility', order_index: 0 },
    { day_of_week: 4, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 5, session_type: 'shooting', order_index: 0 },
    { day_of_week: 5, session_type: 'mobility', order_index: 1 },
    { day_of_week: 6, session_type: 'rest', order_index: 0 },
  ],
  'Improve My Overall Game': [
    { day_of_week: 0, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 1, session_type: 'shooting', order_index: 0 },
    { day_of_week: 2, session_type: 'rest', order_index: 0 },
    { day_of_week: 3, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 4, session_type: 'shooting', order_index: 0 },
    { day_of_week: 5, session_type: 'skill_workout', order_index: 0 },
    { day_of_week: 6, session_type: 'rest', order_index: 0 },
  ],
};

export function generateMultiSessionSchedule(primaryGoal: string | null): ScheduleRow[] {
  const goal = primaryGoal || 'Improve My Overall Game';

  // Exact match first
  if (GOAL_SCHEDULES[goal]) return [...GOAL_SCHEDULES[goal]];

  // Fuzzy match
  const goalLower = goal.toLowerCase();
  for (const [key, sched] of Object.entries(GOAL_SCHEDULES)) {
    if (goalLower.includes(key.toLowerCase()) || key.toLowerCase().includes(goalLower)) {
      return [...sched];
    }
  }

  // Check partial keywords
  if (goalLower.includes('professional')) return [...GOAL_SCHEDULES['Play Professionally']];
  if (goalLower.includes('next level') || goalLower.includes('d1') || goalLower.includes('d2') || goalLower.includes('d3') || goalLower.includes('juco')) return [...GOAL_SCHEDULES['Play at the Next Level (D1/D2/D3/JUCO)']];
  if (goalLower.includes('starting')) return [...GOAL_SCHEDULES['Earn a Starting Spot']];
  if (goalLower.includes('make the team')) return [...GOAL_SCHEDULES['Make the Team']];

  return [...GOAL_SCHEDULES['Improve My Overall Game']];
}

export function getSessionsForDay(schedule: ScheduleRow[], dow: number): ScheduleRow[] {
  return schedule.filter(s => s.day_of_week === dow).sort((a, b) => a.order_index - b.order_index);
}

export function getNonRestSessionsForDay(schedule: ScheduleRow[], dow: number): ScheduleRow[] {
  return getSessionsForDay(schedule, dow).filter(s => s.session_type !== 'rest');
}
