import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Target, Users, BarChart3, Activity, User, Settings, LogOut, Flower2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { GAURAV_ID } from '../data/mockData';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/habits', icon: Target, label: 'Habits' },
  { to: '/partner', icon: Users, label: 'Partner' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const isGaurav = currentUser?.uid === GAURAV_ID;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r flex-shrink-0"
      style={{ background: '#12121A', borderColor: 'rgba(255, 255, 255, 0.08)' }}
    >
      {/* Brand */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
          >
            <Flower2 size={22} className="text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">BLOOM</h1>
            <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Grow together daily</p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))',
              color: '#A78BFA',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  style={{ color: isActive ? '#A78BFA' : 'inherit' }}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#8B5CF6' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile card */}
      {currentUser && (
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/10"
            onClick={() => navigate('/profile')}
          >
            <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" isGaurav={isGaurav} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                {currentUser.email || `${currentUser.name}'s Account`}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost w-full mt-2 justify-start text-xs font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
};
