import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Flame, Trophy, Target, TrendingUp, User as UserIcon, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { analyticsService } from '../services/analyticsService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';
import type { DayProgress, CategoryStats, User } from '../types';
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
  const isGaurav = currentUser?.uid === GAURAV_ID;
  const partnerId = isGaurav ? RADHIKA_ID : GAURAV_ID;

  const [partner, setPartner] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<'me' | 'partner'>('me');
  const [isLoading, setIsLoading] = useState(true);

  // My analytics state
  const [myWeeklyData, setMyWeeklyData] = useState<DayProgress[]>([]);
  const [myMonthlyData, setMyMonthlyData] = useState<DayProgress[]>([]);
  const [myHeatmapData, setMyHeatmapData] = useState<DayProgress[]>([]);
  const [myCategoryStats, setMyCategoryStats] = useState<CategoryStats[]>([]);
  const [myOverallStreak, setMyOverallStreak] = useState({ current: 0, longest: 0 });
  const [myOverallCompletion, setMyOverallCompletion] = useState(0);

  // Partner analytics state
  const [partnerWeeklyData, setPartnerWeeklyData] = useState<DayProgress[]>([]);
  const [partnerMonthlyData, setPartnerMonthlyData] = useState<DayProgress[]>([]);
  const [partnerHeatmapData, setPartnerHeatmapData] = useState<DayProgress[]>([]);
  const [partnerCategoryStats, setPartnerCategoryStats] = useState<CategoryStats[]>([]);
  const [partnerOverallStreak, setPartnerOverallStreak] = useState({ current: 0, longest: 0 });
  const [partnerOverallCompletion, setPartnerOverallCompletion] = useState(0);

  const [activeTab, setActiveTab] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!currentUser) return;
    loadAllAnalytics();
  }, [currentUser?.uid]);

  const loadAllAnalytics = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const users = authService.getUsers();
      const partnerUser = isGaurav ? users.radhika : users.gaurav;
      setPartner(partnerUser);

      const [
        myWeekly, myMonthly, myHeatmap, myCategories, myStreaks,
        pWeekly, pMonthly, pHeatmap, pCategories, pStreaks
      ] = await Promise.all([
        analyticsService.getWeeklyStats(currentUser.uid),
        analyticsService.getMonthlyStats(currentUser.uid),
        analyticsService.get90DayHeatmap(currentUser.uid),
        analyticsService.getCategoryStats(currentUser.uid),
        analyticsService.getOverallStreak(currentUser.uid),
        analyticsService.getWeeklyStats(partnerId),
        analyticsService.getMonthlyStats(partnerId),
        analyticsService.get90DayHeatmap(partnerId),
        analyticsService.getCategoryStats(partnerId),
        analyticsService.getOverallStreak(partnerId),
      ]);

      setMyWeeklyData(myWeekly);
      setMyMonthlyData(myMonthly);
      setMyHeatmapData(myHeatmap);
      setMyCategoryStats(myCategories);
      setMyOverallStreak(myStreaks);

      const myActiveDays = myMonthly.filter(d => d.total > 0);
      const myAvg = myActiveDays.length > 0
        ? Math.round(myMonthly.reduce((sum, d) => sum + d.percentage, 0) / myActiveDays.length)
        : 0;
      setMyOverallCompletion(myAvg);

      setPartnerWeeklyData(pWeekly);
      setPartnerMonthlyData(pMonthly);
      setPartnerHeatmapData(pHeatmap);
      setPartnerCategoryStats(pCategories);
      setPartnerOverallStreak(pStreaks);

      const pActiveDays = pMonthly.filter(d => d.total > 0);
      const pAvg = pActiveDays.length > 0
        ? Math.round(pMonthly.reduce((sum, d) => sum + d.percentage, 0) / pActiveDays.length)
        : 0;
      setPartnerOverallCompletion(pAvg);
    } finally {
      setIsLoading(false);
    }
  };

  // Active dataset depending on viewUser
  const isPartnerView = viewUser === 'partner';
  const weeklyData = isPartnerView ? partnerWeeklyData : myWeeklyData;
  const monthlyData = isPartnerView ? partnerMonthlyData : myMonthlyData;
  const heatmapData = isPartnerView ? partnerHeatmapData : myHeatmapData;
  const categoryStats = isPartnerView ? partnerCategoryStats : myCategoryStats;
  const overallStreak = isPartnerView ? partnerOverallStreak : myOverallStreak;
  const overallCompletion = isPartnerView ? partnerOverallCompletion : myOverallCompletion;
  const activeColor = isPartnerView ? (!isGaurav ? '#8B5CF6' : '#EC4899') : '#8B5CF6';

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
    if (percentage < 30) return `${activeColor}33`;
    if (percentage < 60) return `${activeColor}66`;
    if (percentage < 80) return `${activeColor}AA`;
    return activeColor;
  };

  if (isLoading) return <LoadingSpinner fullscreen label="Computing analytics..." />;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header & View Switcher */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title mb-1">Analytics & Consistency</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Realtime performance tracking for {isPartnerView ? partner?.name || 'Partner' : 'You'}
            </p>
          </div>

          {/* Tab Switcher: My Analytics | Partner Analytics */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl glass border border-white/10 self-start sm:self-auto">
            <button
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isPartnerView
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewUser('me')}
            >
              <UserIcon size={14} />
              My Analytics
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isPartnerView
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewUser('partner')}
            >
              <Heart size={14} />
              {partner?.name || 'Partner'}&apos;s Analytics
            </button>
          </div>
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
              color: activeColor,
              glow: `${activeColor}20`,
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
            <div
              key={stat.label}
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
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {isPartnerView ? `${partner?.name}'s historical completion` : 'Historical completion percentage'}
              </p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl glass border border-white/5">
              {(['7d', '30d', '90d'] as const).map(tab => (
                <button
                  key={tab}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={activeTab === tab ? {
                    background: activeColor, color: 'white', boxShadow: `0 2px 10px ${activeColor}4D`
                  } : {
                    color: 'var(--color-text-muted)'
                  }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={activeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="percentage" stroke={activeColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 90-Day Heatmap Grid */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="mb-4">
            <h2 className="section-title">90-Day Consistency Heatmap</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {isPartnerView ? `${partner?.name}'s daily habit completion density` : 'Daily habit completion density'}
            </p>
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
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {isPartnerView ? `${partner?.name}'s habit completion by category` : 'Habit completion by category'}
              </p>
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

      </motion.div>
    </div>
  );
};
