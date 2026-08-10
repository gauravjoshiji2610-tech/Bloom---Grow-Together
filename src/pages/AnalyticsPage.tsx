import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Flame, Trophy, Target, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { analyticsService } from '../services/analyticsService';
import { habitService } from '../services/habitService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import type { DayProgress, CategoryStats } from '../types';
import { format, parseISO } from 'date-fns';

import { containerVariants, itemVariants } from '../utils/variants';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs border border-purple-500/20 shadow-xl">
      <p style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="font-bold text-base text-purple-400">{payload[0].value}%</p>
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<DayProgress[]>([]);
  const [monthlyData, setMonthlyData] = useState<DayProgress[]>([]);
  const [heatmapData, setHeatmapData] = useState<DayProgress[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [overallStreak, setOverallStreak] = useState({ current: 0, longest: 0 });
  const [overallCompletion, setOverallCompletion] = useState(0);
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!currentUser) return;
    loadAnalytics();
  }, [currentUser?.uid]);

  const loadAnalytics = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [weekly, monthly, heatmap, categories, streaks] = await Promise.all([
        analyticsService.getWeeklyStats(currentUser.uid),
        analyticsService.getMonthlyStats(currentUser.uid),
        analyticsService.get90DayHeatmap(currentUser.uid),
        analyticsService.getCategoryStats(currentUser.uid),
        analyticsService.getOverallStreak(currentUser.uid),
      ]);

      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setHeatmapData(heatmap);
      setCategoryStats(categories);
      setOverallStreak(streaks);

      const activeDays = monthly.filter(d => d.total > 0);
      const avg = activeDays.length > 0
        ? Math.round(monthly.reduce((sum, d) => sum + d.percentage, 0) / activeDays.length)
        : 0;
      setOverallCompletion(avg);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = activeTab === '7d' ? weeklyData : activeTab === '30d' ? monthlyData : heatmapData;
  const formattedChartData = chartData.map(d => ({
    ...d,
    label: (() => {
      try {
        if (activeTab === '7d') return format(parseISO(d.date), 'EEE');
        return format(parseISO(d.date), 'MMM d');
      } catch { return d.date; }
    })(),
  }));

  const todayData = monthlyData[monthlyData.length - 1];

  const getHeatColor = (percentage: number) => {
    if (percentage === 0) return 'rgba(255,255,255,0.03)';
    if (percentage < 30) return 'rgba(139,92,246,0.2)';
    if (percentage < 60) return 'rgba(139,92,246,0.4)';
    if (percentage < 80) return 'rgba(139,92,246,0.65)';
    return 'rgba(139,92,246,0.9)';
  };

  if (isLoading) return <LoadingSpinner fullscreen label="Computing analytics..." />;

  const hasAnyData = monthlyData.some(d => d.total > 0) || categoryStats.length > 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="page-title mb-1">Analytics & Consistency</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Realtime performance tracking</p>
        </motion.div>

        {/* Key Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Current Streak',
              value: overallStreak.current,
              unit: 'days',
              icon: Flame,
              color: '#F59E0B',
              glow: 'rgba(245,158,11,0.12)',
            },
            {
              label: 'Longest Streak',
              value: overallStreak.longest,
              unit: 'days',
              icon: Trophy,
              color: '#10B981',
              glow: 'rgba(16,185,129,0.12)',
            },
            {
              label: 'Avg Completion',
              value: overallCompletion,
              unit: '%',
              icon: Target,
              color: '#8B5CF6',
              glow: 'rgba(139,92,246,0.12)',
            },
            {
              label: 'Today',
              value: todayData?.percentage ?? 0,
              unit: '%',
              icon: TrendingUp,
              color: '#EC4899',
              glow: 'rgba(236,72,153,0.12)',
            },
          ].map(stat => (
            <div key={stat.label}
              className="card p-4 flex flex-col gap-3 border"
              style={{ borderColor: `${stat.color}25`, background: stat.glow }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {stat.label}
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                  <stat.icon size={15} style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{stat.value}</span>
                <span className="text-xs ml-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{stat.unit}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Completion Area Chart */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Completion Trend</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Historical completion percentage</p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl glass border border-white/5">
              {(['7d', '30d', '90d'] as const).map(tab => (
                <button key={tab}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={activeTab === tab ? {
                    background: '#8B5CF6', color: 'white', boxShadow: '0 2px 10px rgba(139,92,246,0.3)'
                  } : {
                    color: 'var(--color-text-muted)'
                  }}
                  onClick={() => setActiveTab(tab)}
                >{tab}</button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="percentage" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 90-Day Heatmap Grid */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="mb-4">
            <h2 className="section-title">90-Day Consistency Heatmap</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Daily habit completion density</p>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {heatmapData.map((d) => (
              <div
                key={d.date}
                className="w-3.5 h-3.5 rounded-sm transition-all duration-200 hover:scale-125"
                style={{
                  background: getHeatColor(d.percentage),
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
                title={`${d.date}: ${d.completed}/${d.total} completed (${d.percentage}%)`}
              />
            ))}
          </div>
        </motion.div>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <motion.div variants={itemVariants} className="card p-6">
            <div className="mb-4">
              <h2 className="section-title">Category Performance</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Habit completion by category</p>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {!hasAnyData && (
          <EmptyState
            icon="📊"
            title="No completion data yet"
            description="As you track and complete daily habits, your completion trends, heatmaps, and category statistics will automatically populate here."
          />
        )}

      </motion.div>
    </div>
  );
};
