import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, Users, BarChart3, Activity } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Cockpit' },
  { to: '/habits', icon: Target, label: 'Missions' },
  { to: '/partner', icon: Users, label: 'Co-Driver' },
  { to: '/activity', icon: Activity, label: 'Drive Log' },
  { to: '/analytics', icon: BarChart3, label: 'Performance' },
];

export const MobileNav: React.FC = () => (
  <nav
    className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t safe-area-pb"
    style={{
      background: 'rgba(8, 12, 18, 0.94)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.6)',
    }}
  >
    {navItems.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-0"
        style={({ isActive }) => ({
          color: isActive ? '#00aaff' : '#71717A',
        })}
      >
        {({ isActive }) => (
          <>
            <div
              className="p-1.5 rounded-lg transition-all duration-200"
              style={
                isActive
                  ? {
                      background: 'rgba(0, 102, 177, 0.28)',
                      border: '1px solid rgba(0, 170, 255, 0.45)',
                      boxShadow: '0 0 12px rgba(0, 170, 255, 0.3)',
                    }
                  : {}
              }
            >
              <Icon size={17} />
            </div>
            <span
              className="text-[9px] font-bold tracking-wider uppercase truncate"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {label}
            </span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);
