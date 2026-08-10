import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Users, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { GAURAV_ID } from '../data/mockData';
import toast from 'react-hot-toast';

import { containerVariants, itemVariants } from '../utils/variants';

export const SettingsPage: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const isGaurav = currentUser?.uid === GAURAV_ID;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast('Signed out. See you soon! 👋');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        <motion.div variants={itemVariants}>
          <h1 className="page-title mb-1">Settings</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage your preferences</p>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
              <Moon size={15} style={{ color: '#7C3AED' }} />
            </div>
            <h2 className="section-title">Appearance</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-white">Theme</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Dark mode is active</p>
            </div>
            <span className="badge badge-purple">Dark</span>
          </div>
        </motion.div>

        {/* Partner */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }}>
              <Users size={15} style={{ color: '#EC4899' }} />
            </div>
            <h2 className="section-title">Partner Connection</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-white">Accountability Partner</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {isGaurav ? 'Radhika' : 'Gaurav'}
              </p>
            </div>
            <span className="badge badge-success">Connected</span>
          </div>
          <button
            className="w-full mt-3 btn-secondary justify-center"
            onClick={() => navigate('/partner')}
          >
            View Partner Overview
          </button>
        </motion.div>

        {/* Danger zone / Sign out */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Shield size={15} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="section-title">Account Session</h2>
          </div>
          <button className="btn-danger w-full justify-center" onClick={handleLogout}>
            Sign Out
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
};
