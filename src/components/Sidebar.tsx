import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Target, Users, BarChart3, Activity, User, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { BoomLogo } from './BoomLogo';
import { GAURAV_ID } from '../data/mockData';

const navItems = [
  { to: '/', icon: Home, label: 'Cockpit' },
  { to: '/habits', icon: Target, label: 'Missions' },
  { to: '/partner', icon: Users, label: 'Co-Driver' },
  { to: '/activity', icon: Activity, label: 'Drive Log' },
  { to: '/analytics', icon: BarChart3, label: 'Performance' },
  { to: '/profile', icon: User, label: 'Driver' },
  { to: '/settings', icon: Settings, label: 'Garage' },
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
      className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r flex-shrink-0 z-30"
      style={{
        background: 'rgba(8, 12, 18, 0.90)',
        backdropFilter: 'blur(24px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.65)',
      }}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <BoomLogo size={38} />
          <div>
            <h1
              className="text-xl font-black tracking-[0.24em] text-white uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              BOOM
            </h1>
            <p
              className="text-[9px] font-semibold tracking-[0.16em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
            >
              Habit System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <p
          className="text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-2"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          Navigation
        </p>

        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-200 group ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(90deg, rgba(0, 102, 177, 0.32) 0%, rgba(14, 22, 34, 0.6) 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(0, 170, 255, 0.45)',
                    boxShadow: '0 4px 20px rgba(0, 102, 177, 0.25)',
                    fontFamily: 'var(--font-display)',
                  }
                : {
                    fontFamily: 'var(--font-display)',
                  }
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  style={{
                    color: isActive ? '#00aaff' : 'inherit',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(0,170,255,0.6))' : 'none',
                  }}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-[#00aaff] shadow-[0_0_8px_#00aaff]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Driver Profile Card */}
      {currentUser && (
        <div className="p-3.5 border-t border-white/[0.08]">
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors border border-white/[0.05] hover:border-[#00aaff]/30"
            onClick={() => navigate('/profile')}
          >
            <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" isGaurav={isGaurav} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                {currentUser.name}
              </p>
              <p
                className="text-[10px] truncate"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
              >
                {currentUser.email || `${currentUser.name}'s Cockpit`}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost w-full mt-2 justify-start text-[11px] font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
};
