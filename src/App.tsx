import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { ViewTab } from './types';
import { DailyChecklist } from './components/checklist/DailyChecklist';
import { StreakHeatmap } from './components/calendar/StreakHeatmap';
import { GoalList } from './components/goals/GoalList';
import { PracticeQueueRunner } from './components/practice/PracticeQueueRunner';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { useSettingsStore } from './store/useSettingsStore';

export function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('checklist');
  const [selectedDateForChecklist, setSelectedDateForChecklist] = useState<string | null>(null);

  const theme = useSettingsStore((state) => state.settings.theme);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      // system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }, [theme]);

  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDateForChecklist(dateStr);
    setActiveTab('checklist');
  };

  return (
    <Layout activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'checklist' && <DailyChecklist initialDate={selectedDateForChecklist} />}
      {activeTab === 'calendar' && (
        <StreakHeatmap onSelectDateToLog={handleSelectDateFromCalendar} />
      )}
      {activeTab === 'goals' && <GoalList />}
      {activeTab === 'practice' && <PracticeQueueRunner />}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'settings' && <SettingsPanel />}
    </Layout>
  );
}

export default App;
