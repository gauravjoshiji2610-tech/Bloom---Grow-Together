import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
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
        background: 'rgba(9,9,13,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
        >
          <Flower2 size={16} className="text-white" />
        </div>
        <span className="font-black text-base tracking-tight text-white">
          {title || 'BLOOM'}
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
