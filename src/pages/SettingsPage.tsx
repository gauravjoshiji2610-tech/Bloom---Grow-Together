import React from 'react';
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
    toast('Signed out from cockpit session.');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        <motion.div variants={itemVariants}>
          <h1 className="page-title mb-1">System Settings</h1>
          <p
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            Preferences & Telemetry Configuration
          </p>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={itemVariants} className="card p-5 border border-white/10 glass-strong">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#00aaff]/30"
              style={{ background: 'rgba(0, 102, 177, 0.2)' }}
            >
              <Moon size={15} style={{ color: '#00aaff' }} />
            </div>
            <h2 className="section-title">Visual Atmosphere</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-white">Cockpit Theme</p>
              <p className="text-xs mt-0.5 text-gray-400">BMW M Performance Dark Aesthetic</p>
            </div>
            <span className="badge badge-purple uppercase">Performance Dark</span>
          </div>
        </motion.div>

        {/* Partner Connection */}
        <motion.div variants={itemVariants} className="card p-5 border border-white/10 glass-strong">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#00aaff]/30"
              style={{ background: 'rgba(0, 102, 177, 0.2)' }}
            >
              <Users size={15} style={{ color: '#00aaff' }} />
            </div>
            <h2 className="section-title">Co-Pilot Telemetry Link</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-white">Accountability Partner</p>
              <p className="text-xs mt-0.5 text-gray-400">
                {isGaurav ? 'Radhika' : 'Gaurav'}
              </p>
            </div>
            <span className="badge badge-success uppercase">Synchronized</span>
          </div>
          <button
            className="w-full mt-3 btn-secondary justify-center text-xs"
            onClick={() => navigate('/partner')}
          >
            Open Partner Cockpit
          </button>
        </motion.div>

        {/* Danger zone / Sign out */}
        <motion.div variants={itemVariants} className="card p-5 border border-white/10 glass-strong">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/30"
              style={{ background: 'rgba(225, 6, 0, 0.15)' }}
            >
              <Shield size={15} style={{ color: '#e10600' }} />
            </div>
            <h2 className="section-title">Session Management</h2>
          </div>
          <button className="btn-danger w-full justify-center text-xs" onClick={handleLogout}>
            Terminate Session & Sign Out
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
};
