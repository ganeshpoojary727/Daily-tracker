import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useTaskStore } from '../../store/useTaskStore';
import { getTrailingDates, formatDateStr } from '../../lib/dateUtils';

export const TrendChart: React.FC = () => {
  const categories = useTaskStore((state) => state.categories);
  const dayEntries = useTaskStore((state) => state.dayEntries);

  const activeCategories = categories.filter((c) => !c.archived);
  const trailing30 = getTrailingDates(30);

  const chartData = trailing30.map((dateStr) => {
    const entry = dayEntries[dateStr];
    let completed = 0;
    if (entry && entry.tasks) {
      activeCategories.forEach((cat) => {
        if (entry.tasks[cat.id]?.done) completed++;
      });
    }

    const percentage = activeCategories.length > 0 ? Math.round((completed / activeCategories.length) * 100) : 0;

    return {
      date: formatDateStr(dateStr, 'MMM d'),
      fullDate: dateStr,
      percentage,
      completed,
      total: activeCategories.length,
    };
  });

  return (
    <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-text-primary-dark">
          Daily Completion Rate Trend (Trailing 30 Days)
        </h3>
        <p className="text-xs font-mono text-text-muted-dark">
          Percentage of active daily categories completed each day
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8590C" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#E8590C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#8B949E" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8B949E" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                borderColor: '#30363D',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
              }}
              formatter={(val: number) => [`${val}%`, 'Daily Completion Rate']}
              labelFormatter={(lbl, items) => {
                const item = items[0]?.payload;
                return item ? `${item.fullDate} (${item.completed}/${item.total} Done)` : lbl;
              }}
            />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="#E8590C"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#trendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
