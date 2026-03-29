import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, BarChart3, User, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { auth, signOut } from '../firebase';
import { motion } from 'motion/react';

export const Layout = ({ user, profile }: { user: any, profile: any }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/signals', label: 'Sinyal', icon: TrendingUp },
    { path: '/analysis', label: 'Analisis', icon: Sparkles },
    { path: '/performance', label: 'Performa', icon: BarChart3 },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0A0A0A] border-r border-white/10 hidden md:flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tighter italic text-orange-500">XAU/BTC <span className="text-white">PRO</span></h1>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Sinyal Trading</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-white/60 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-white/10 md:hidden z-50 px-4 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? 'text-orange-500' : 'text-white/40'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pb-24 md:pb-0 min-h-screen">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="md:hidden text-orange-500 font-bold italic">XAU/BTC</div>
            <div className="hidden md:block text-sm text-white/40">Selamat datang kembali, <span className="text-white font-medium">{user.displayName}</span></div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              profile?.membership === 'premium' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white/10 text-white/60'
            }`}>
              {profile?.membership === 'premium' ? 'Premium' : 'Gratis'}
            </div>
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};
