import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { motion } from 'motion/react';
import { TrendingUp, ShieldCheck, BarChart3, Target, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Auth = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Selamat datang kembali!', {
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
    } catch (error: any) {
      // Ignore cancellation errors as they are usually user-initiated
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed or cancelled');
      } else {
        console.error('Login error:', error);
        toast.error('Gagal masuk dengan Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[40px] p-12 text-center relative z-10 shadow-2xl shadow-black/50"
      >
        <div className="mb-12">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-6 rotate-12">
            <TrendingUp size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter italic mb-2">NINZ <span className="text-orange-500">SIGNAL</span></h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Jaringan Sinyal Trading Elit</p>
        </div>

        <div className="space-y-6 mb-12">
          {[
            { icon: Target, text: 'Sinyal Akurasi Tinggi' },
            { icon: ShieldCheck, text: 'Batas Akses Harian' },
            { icon: BarChart3, text: 'Analitik Performa' },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 text-sm text-white/60"
            >
              <div className="p-2 rounded-xl bg-white/5 text-orange-500">
                <item.icon size={18} />
              </div>
              <span className="font-medium">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full bg-white text-black py-5 rounded-3xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-3 group ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'
          }`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
          ) : (
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          )}
          {isLoading ? 'Masuk...' : 'Masuk dengan Google'} 
          {!isLoading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
        </button>

        <p className="mt-8 text-[10px] text-white/20 uppercase tracking-widest font-bold leading-relaxed">
          Dengan masuk, Anda menyetujui <br />
          <span className="text-white/40 hover:text-orange-500 cursor-pointer">Ketentuan Layanan</span> & <span className="text-white/40 hover:text-orange-500 cursor-pointer">Kebijakan Privasi</span>
        </p>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 hidden lg:block"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-[10px]">BELI</div>
            <div>
              <div className="text-xs font-bold">XAU/USD</div>
              <div className="text-[10px] text-green-500 font-bold">+120 Pips</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 left-20 hidden lg:block"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-[10px]">BTC</div>
            <div>
              <div className="text-xs font-bold">BTC/USD</div>
              <div className="text-[10px] text-orange-500 font-bold">Target Tercapai</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
