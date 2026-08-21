import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { BoomLogo } from '../components/BoomLogo';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your pilot name');
      return;
    }
    if (!password) {
      toast.error('Please enter your security key');
      return;
    }

    try {
      await login(name.trim(), password);
      toast.success('Welcome to BOOM Cockpit!');
      navigate('/');
    } catch {
      toast.error('Invalid pilot name or password.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#05070a] text-white">
      {/* Layer 1: Cockpit Car Background (Image 1) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/assets/bg_cockpit.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 52%',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.80) saturate(0.88) contrast(1.10)',
        }}
      />

      {/* Layer 2: Balanced Dark Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: `
            linear-gradient(90deg, rgba(5,7,10,0.55) 0%, rgba(5,7,10,0.20) 40%, transparent 70%),
            linear-gradient(180deg, rgba(5,7,10,0.38) 0%, rgba(5,7,10,0.08) 30%, rgba(5,7,10,0.70) 100%),
            radial-gradient(ellipse at 68% 40%, rgba(0,102,177,0.14) 0%, transparent 52%)
          `,
        }}
      />

      {/* Layer 3: Subtle Scanline Texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '100% 28px',
          opacity: 0.50,
        }}
      />

      {/* Form Content Shell */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md my-8"
      >
        {/* Brand Header with BOOM Emblem */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 15 }}
            className="inline-flex items-center justify-center mb-4 mx-auto"
          >
            <BoomLogo size={68} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black tracking-[0.28em] text-white uppercase mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            BOOM
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-semibold tracking-[0.18em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}
          >
            Performance Habit System
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-7 glass-strong shadow-2xl border border-white/10"
          style={{
            background: 'rgba(12, 17, 26, 0.92)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 102, 177, 0.25)',
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="label text-[11px]">Pilot Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Enter pilot name (e.g. Gaurav or Radhika)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="label text-[11px]">Security Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                Invalid credentials. Please verify your pilot name and password.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-lg mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Enter Cockpit <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer info */}
        <p
          className="text-center text-[11px] font-semibold tracking-wider uppercase mt-6"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
        >
          Two-Person Mission Control · Authorized Access Only
        </p>
      </motion.div>
    </div>
  );
};
