import { useState, useEffect } from 'react';
import { getRunsStats } from '@/components/services/runs';

interface RunsStatsData {
  completedToday: number;
  efficiency: number;
  totalRunsThisWeek: number;
  averageTimePerRun: number;
  loading: boolean;
  error: string | null;
}

export const useRunsStats = () => {
  const [data, setData] = useState<RunsStatsData>({
    completedToday: 0,
    efficiency: 0,
    totalRunsThisWeek: 0,
    averageTimePerRun: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadRunsStats = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const stats = await getRunsStats();
        
        setData({
          completedToday: stats.completed_today,
          efficiency: stats.efficiency,
          totalRunsThisWeek: stats.total_runs_this_week,
          averageTimePerRun: stats.average_time_per_run,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Failed to load runs stats:', err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load runs statistics'
        }));
      }
    };

    loadRunsStats();
  }, []);

  return data;
};
