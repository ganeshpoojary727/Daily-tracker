import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Code, GraduationCap, Dumbbell, CheckSquare, Sparkles } from 'lucide-react';
import { usePracticeStore } from '../../store/usePracticeStore';
import { useCourseStore } from '../../store/useCourseStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useTaskStore } from '../../store/useTaskStore';
import { getTodayStr, getTrailingDates } from '../../lib/dateUtils';

type TimeRange = 'today' | '7' | '30' | 'all';

interface DomainMetric {
  id: string;
  name: string;
  shortName: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DomainFocusDonut: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('7');

  // Stores
  const statesBySheet = usePracticeStore((state) => state.statesBySheet);
  const courses = useCourseStore((state) => state.courses);
  const workoutLogs = useWorkoutStore((state) => state.logs);
  const dayEntries = useTaskStore((state) => state.dayEntries);
  const categories = useTaskStore((state) => state.categories);

  // Compute active date set
  const todayStr = getTodayStr();
  const dateSet = React.useMemo(() => {
    if (range === 'today') return new Set([todayStr]);
    if (range === '7') return new Set(getTrailingDates(7));
    if (range === '30') return new Set(getTrailingDates(30));

    // 'all' -> union of all dates recorded
    const allDates = new Set<string>(Object.keys(dayEntries));
    Object.keys(workoutLogs).forEach((d) => allDates.add(d));
    Object.values(statesBySheet).forEach((sheetState) => {
      Object.values(sheetState.solves || {}).forEach((s) => allDates.add(s.solvedAt));
    });
    return allDates;
  }, [range, todayStr, dayEntries, workoutLogs, statesBySheet]);

  // 1. Coding & DSA Solves
  let dsaSolves = 0;
  Object.values(statesBySheet).forEach((sheetState) => {
    Object.values(sheetState.solves || {}).forEach((s) => {
      if (dateSet.has(s.solvedAt)) dsaSolves++;
    });
  });

  // Include LeetCode tasks from daily checklist if logged there
  const leetCategory = categories.find((c) => c.name.toLowerCase().includes('leetcode'));
  if (leetCategory) {
    dateSet.forEach((d) => {
      const entry = dayEntries[d]?.tasks?.[leetCategory.id];
      if (entry?.done) {
        // If practice store had no explicit solves for that day, credit the checklist count
        if (dsaSolves === 0) {
          dsaSolves += entry.count ?? 1;
        }
      }
    });
  }

  // 2. Learning & Course Chapters
  let courseChapters = 0;
  Object.values(courses).forEach((c) => {
    (c.chapters || []).forEach((ch) => {
      if (ch.completed && ch.completedAt && dateSet.has(ch.completedAt)) {
        courseChapters++;
      }
    });
  });

  // Include Java/Tech course checklist tasks
  const techCategories = categories.filter((c) =>
    ['java', 'react', 'javascript', 'course', 'study'].some((k) =>
      c.name.toLowerCase().includes(k)
    )
  );
  techCategories.forEach((cat) => {
    dateSet.forEach((d) => {
      const entry = dayEntries[d]?.tasks?.[cat.id];
      if (entry?.done) {
        courseChapters += entry.count ?? 1;
      }
    });
  });

  // 3. Fitness & Workout Sets
  let workoutSets = 0;
  dateSet.forEach((d) => {
    const log = workoutLogs[d];
    if (log?.exercises) {
      Object.values(log.exercises).forEach((ex) => {
        if (ex.sets) {
          Object.values(ex.sets).forEach((s) => {
            if (s.completed) workoutSets++;
          });
        }
      });
    }
  });

  // Include Exercise checklist item if no detailed workout sets logged
  const exerciseCategory = categories.find((c) =>
    ['exercise', 'workout', 'gym', 'fitness'].some((k) => c.name.toLowerCase().includes(k))
  );
  if (exerciseCategory) {
    dateSet.forEach((d) => {
      const entry = dayEntries[d]?.tasks?.[exerciseCategory.id];
      if (entry?.done && workoutSets === 0) {
        workoutSets += entry.count ?? 1;
      }
    });
  }

  // 4. Daily Habits & Other Goals
  let habitsCompleted = 0;
  const otherCategories = categories.filter(
    (c) =>
      !c.archived &&
      c.id !== leetCategory?.id &&
      !techCategories.some((tc) => tc.id === c.id) &&
      c.id !== exerciseCategory?.id
  );

  dateSet.forEach((d) => {
    const entry = dayEntries[d];
    if (entry?.tasks) {
      otherCategories.forEach((cat) => {
        if (entry.tasks[cat.id]?.done) {
          habitsCompleted += entry.tasks[cat.id].count ?? 1;
        }
      });
    }
  });

  const domains: DomainMetric[] = [
    {
      id: 'dsa',
      name: 'Coding & DSA',
      shortName: 'DSA',
      value: dsaSolves,
      unit: 'solves',
      color: '#3B82F6',
      icon: Code,
    },
    {
      id: 'course',
      name: 'Courses & Theory',
      shortName: 'Study',
      value: courseChapters,
      unit: 'chapters',
      color: '#A855F7',
      icon: GraduationCap,
    },
    {
      id: 'workout',
      name: 'Fitness & Workout',
      shortName: 'Fitness',
      value: workoutSets,
      unit: 'sets',
      color: '#F97316',
      icon: Dumbbell,
    },
    {
      id: 'habits',
      name: 'Daily Habits & Tasks',
      shortName: 'Habits',
      value: habitsCompleted,
      unit: 'units',
      color: '#10B981',
      icon: CheckSquare,
    },
  ];

  const totalActions = domains.reduce((sum, d) => sum + d.value, 0);

  // Chart data: fallback to placeholder slices if totalActions === 0
  const chartData =
    totalActions > 0
      ? domains.map((d) => ({
          name: d.name,
          value: d.value,
          color: d.color,
          unit: d.unit,
        }))
      : [{ name: 'No Activity Logged', value: 1, color: '#30363D', unit: '' }];

  // Find dominant domain
  const dominant = totalActions > 0 ? [...domains].sort((a, b) => b.value - a.value)[0] : null;

  return (
    <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-base text-text-primary-dark">
              Domain Focus Balance
            </h3>
            <span className="flex items-center gap-1 rounded bg-streak/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-streak">
              <Sparkles className="h-3 w-3" />
              Unified
            </span>
          </div>
          <p className="text-xs font-mono text-text-muted-dark">
            Distribution of coding, study, fitness & daily execution
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center rounded-lg border border-surface-border-dark bg-surface-hover-dark/60 p-1 font-mono text-xs">
          {(['today', '7', '30', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                range === r
                  ? 'bg-streak text-white font-bold'
                  : 'text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              {r === 'today' ? 'Today' : r === 'all' ? 'All Time' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid: Donut + Domain Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
        {/* Left: Donut Chart with Center KPI */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative h-48 w-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={76}
                  paddingAngle={totalActions > 0 ? 4 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`donut-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {totalActions > 0 && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      borderColor: '#30363D',
                      borderRadius: '8px',
                      color: '#E6EDF3',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono',
                    }}
                    formatter={(val: number, name: string) => {
                      const dom = domains.find((d) => d.name === name);
                      return [`${val} ${dom?.unit || 'actions'}`, name];
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="font-mono text-2xl font-bold tracking-tight text-text-primary-dark">
                {totalActions}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted-dark">
                {totalActions === 1 ? 'Action' : 'Actions'}
              </span>
            </div>
          </div>

          {/* Quick Subtitle */}
          <div className="mt-1 text-center font-mono text-xs text-text-muted-dark">
            {dominant && dominant.value > 0 ? (
              <span>
                Lead Focus:{' '}
                <strong className="text-text-primary-dark font-semibold">
                  {dominant.shortName}
                </strong>{' '}
                ({Math.round((dominant.value / totalActions) * 100)}%)
              </span>
            ) : (
              <span>No activity recorded for this range</span>
            )}
          </div>
        </div>

        {/* Right: Domain Stat Cards & Progress Bars */}
        <div className="md:col-span-7 space-y-3">
          {domains.map((dom) => {
            const Icon = dom.icon;
            const pct = totalActions > 0 ? Math.round((dom.value / totalActions) * 100) : 0;

            return (
              <div
                key={dom.id}
                className="rounded-lg border border-surface-border-dark/60 bg-surface-hover-dark/40 p-2.5 transition-all hover:border-surface-border-dark"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${dom.color}20`, color: dom.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-primary-dark">
                        {dom.name}
                      </div>
                      <div className="font-mono text-[10px] text-text-muted-dark">
                        {dom.value} {dom.unit}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-text-primary-dark">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-border-dark/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: dom.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Technical Verdict */}
      <div className="flex items-center justify-between rounded-lg border border-surface-border-dark bg-surface-hover-dark/30 px-3.5 py-2 font-mono text-xs">
        <span className="text-text-muted-dark">Rhythm Analysis</span>
        <span className="font-semibold text-text-primary-dark">
          {totalActions === 0
            ? '🌱 Ready to log'
            : dominant && dominant.value / totalActions >= 0.6
            ? `⚡ High ${dominant.shortName} Intensity`
            : '🎯 Balanced Mind & Body Execution'}
        </span>
      </div>
    </div>
  );
};
