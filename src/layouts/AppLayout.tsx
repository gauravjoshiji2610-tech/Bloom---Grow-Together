import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { MobileHeader } from '../components/MobileHeader';

// ─── Per-Route Background Configuration ──────────────────────────────────────
interface BgConfig {
  image: string;
  position: string;
  brightness: number;
}

const BG_MAP: Record<string, BgConfig> = {
  '/': {
    image: '/assets/bg_cockpit.jpg',
    position: 'center 52%',
    brightness: 0.82,
  },
  '/habits': {
    image: '/assets/bg_missions.jpg',
    position: 'center 45%',
    brightness: 0.80,
  },
  '/partner': {
    image: '/assets/bg_codriver.jpg',
    position: 'center 42%',
    brightness: 0.82,
  },
  '/activity': {
    image: '/assets/bg_codriver.jpg',
    position: 'center 42%',
    brightness: 0.82,
  },
  '/analytics': {
    image: '/assets/bg_performance.jpg',
    position: 'center 38%',
    brightness: 0.80,
  },
  '/profile': {
    image: '/assets/bg_driver.png',
    position: 'center 30%',
    brightness: 0.84,
  },
  '/settings': {
    image: '/assets/bg_driver.png',
    position: 'center 30%',
    brightness: 0.84,
  },
};

const DEFAULT_BG: BgConfig = BG_MAP['/'];

// ─── AppLayout ─────────────────────────────────────────────────────────────────
export const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const bg = BG_MAP[pathname] ?? DEFAULT_BG;

  return (
    <div className="relative min-h-screen text-white bg-[#05070a] overflow-x-hidden">

      {/* ── Layer 1: Animated Per-Route Car Background ── */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          // Key on the image path so routes sharing the same image don't re-animate
          key={bg.image}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{
            duration: 0.72,
            ease: [0.16, 1, 0.3, 1],
          }}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${bg.image})`,
            backgroundSize: 'cover',
            backgroundPosition: bg.position,
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            filter: `brightness(${bg.brightness}) saturate(0.88) contrast(1.10)`,
            willChange: 'opacity, transform',
          }}
        />
      </AnimatePresence>

      {/* ── Layer 2: Balanced Dark Overlay (lighter to preserve car visibility) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: `
            linear-gradient(90deg,
              rgba(5, 7, 10, 0.60) 0%,
              rgba(5, 7, 10, 0.22) 30%,
              rgba(5, 7, 10, 0.08) 60%,
              transparent 100%
            ),
            linear-gradient(180deg,
              rgba(5, 7, 10, 0.40) 0%,
              rgba(5, 7, 10, 0.08) 25%,
              rgba(5, 7, 10, 0.08) 70%,
              rgba(5, 7, 10, 0.72) 100%
            ),
            radial-gradient(ellipse at 68% 38%,
              rgba(0, 102, 177, 0.14) 0%,
              transparent 52%
            )
          `,
        }}
      />

      {/* ── Layer 3: Subtle Scanline Texture ── */}
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

      {/* ── Layer 4: Interactive App Shell ── */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MobileHeader />
          <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
};
