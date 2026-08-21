import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { BoomLogo } from './BoomLogo';
import { GAURAV_ID } from '../data/mockData';

interface MobileHeaderProps {
  title?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title }) => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const isGaurav = currentUser?.uid === GAURAV_ID;

  return (
    <header
      className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b"
      style={{
        background: 'rgba(8, 12, 18, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
        <BoomLogo size={28} />
        <span
          className="font-black text-sm tracking-[0.2em] text-white uppercase"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title || 'BOOM'}
        </span>
      </div>

      {currentUser && (
        <button
          className="btn-ghost p-1"
          onClick={() => navigate('/profile')}
          aria-label="Profile"
        >
          <Avatar name={currentUser.name} src={currentUser.avatar} size="xs" isGaurav={isGaurav} />
        </button>
      )}
    </header>
  );
};
