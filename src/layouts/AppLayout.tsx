import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { MobileHeader } from '../components/MobileHeader';

export const AppLayout: React.FC = () => (
  <div className="flex h-screen overflow-hidden bg-[#09090D] text-white">
    <Sidebar />
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
      <MobileHeader />
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
        <Outlet />
      </div>
    </main>
    <MobileNav />
  </div>
);
