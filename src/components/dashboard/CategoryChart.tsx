import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTaskStore } from '../../store/useTaskStore';
import { getTrailingDates } from '../../lib/dateUtils';

type RangeOption = '7' | '30' | '90' | 'all';

export const CategoryChart: React.FC = () => {
  const [range, setRange] = useState<RangeOption>('30');
  const categories = useTaskStore((state) => state.categories);
  const dayEntries = useTaskStore((state) => state.dayEntries);

  const activeCategories = categories.filter((c) => !c.archived);

  // Compute counts per category over selected range
  const chartData = activeCategories.map((cat) => {
    let count = 0;
    const dates = range === 'all' ? Object.keys(dayEntries) : getTrailingDates(Number(range));

    dates.forEach((d) => {
      const entry = dayEntries[d];
      if (entry?.tasks[cat.id]?.done) {
        count += entry.tasks[cat.id].count ?? 1;
      }
    });

    return {
      name: cat.name,
      count,
      color: cat.color,
    };
  });

  return (
    <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display font-bold text-base text-text-primary-dark">
            Completions by Category
          </h3>
          <p className="text-xs font-mono text-text-muted-dark">
            Total units completed per category over range
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center rounded-lg border border-surface-border-dark bg-surface-hover-dark/60 p-1 font-mono text-xs">
          {(['7', '30', '90', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                range === r ? 'bg-streak text-white font-bold' : 'text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              {r === 'all' ? 'All Time' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#8B949E"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#8B949E"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={130}
              tickFormatter={(val: string) => (val.length > 17 ? `${val.slice(0, 16)}…` : val)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                borderColor: '#30363D',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
              }}
              formatter={(val: number) => [`${val} units`, 'Completed']}
              labelFormatter={(label) => String(label)}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
