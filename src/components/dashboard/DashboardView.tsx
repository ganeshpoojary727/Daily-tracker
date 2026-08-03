import React from 'react';
import { StatsOverview } from './StatsOverview';
import { CategoryChart } from './CategoryChart';
import { TrendChart } from './TrendChart';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
          Analytics & Performance Dashboard
        </h2>
        <p className="text-xs font-mono text-text-muted-dark">
          High-level statistics, category distributions, and daily completion trends.
        </p>
      </div>

      {/* Headline Overview Cards */}
      <StatsOverview />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart />
        <TrendChart />
      </div>
    </div>
  );
};
