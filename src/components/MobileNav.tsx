import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, Users, BarChart3, Activity } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/habits', icon: Target, label: 'Habits' },
  { to: '/partner', icon: Users, label: 'Partner' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/analytics', icon: BarChart3, label: 'Stats' },
];

export const MobileNav: React.FC = () => (
  <nav
    className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t safe-area-pb"
    style={{
      background: 'rgba(18,18,26,0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    }}
  >
    {navItems.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-0"
        style={({ isActive }) => ({
          color: isActive ? '#A78BFA' : '#71717A',
        })}
      >
        {({ isActive }) => (
          <>
            <div
              className="p-1.5 rounded-lg transition-all duration-200"
              style={isActive ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' } : {}}
            >
              <Icon size={18} />
            </div>
            <span className="text-[10px] font-bold tracking-tight truncate">{label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);
