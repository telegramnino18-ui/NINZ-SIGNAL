import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, db, doc, setDoc, getDoc, Timestamp } from '../firebase';
import { motion } from 'motion/react';
import { TrendingUp, ShieldCheck, BarChart3, Target, ChevronRight, Lock, Key, User, MessageCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendDiscordNotification } from '../services/discordService';
import { Logo } from './Logo';

const AbstractBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#0A0A0A] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)]"></div>
      
      <motion.div 
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#4f46e5,transparent)]"
      />
      
      <div className="absolute right-0 top-1/4 w-[300px] h-[300px] bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen" />
      <div className="absolute left-0 bottom-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
    </div>
  );
};

export const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'packages' | 'login' | 'register'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  
  // Username/Password Auth States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isOver18, setIsOver18] = useState(false);

  const packages = [
    { 
      id: 'basic', 
      name: 'BASIC', 
      price: '80.000', 
      duration: '7 Hari', 
      desc: 'ESSENTIAL KIT', 
      originalPrice: '120.000',
      save: '40.000',
      features: ['Full akses Bebas Analisa Unlimited', 'Akses SMC & Candlestick Pattern', 'Validasi Entry EMA 50/200', 'Cocok untuk Pemula Belajar'] 
    },
    { 
      id: 'vip', 
      name: 'VIP', 
      price: '130.000', 
      duration: '14 Hari', 
      desc: 'ADVANCED TOOLS', 
      originalPrice: '220.000',
      save: '90.000',
      features: ['Full akses Bebas Analisa Unlimited', 'Prioritas Server (Analisa Lebih Cepat)', 'Akses Fitur Swing Trade & Day Trade', 'Support Setup Scalping High Winrate'] 
    },
    { 
      id: 'monthly', 
      name: 'MONTHLY', 
      price: '210.000', 
      duration: '30 Hari', 
      desc: 'PREMIUM ACCESS', 
      originalPrice: '400.000',
      save: '190.000',
      bestValue: true,
      features: ['Full akses Bebas Analisa Unlimited', 'Bisa Baca Manipulasi Bandar Besar', 'Kombinasi Data Multi-Timeframe', 'Harga Termurah'] 
    },
  ];

  const handleGuestLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      // Let App.tsx handle creation of guest profile
    } catch (error: any) {
      console.error('Guest login error:', error);
      if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
        toast.error('Login Guest (Anonymous) belum diaktifkan di Firebase Console.', { duration: 6000 });
      } else {
        toast.error('Gagal mengakses akun Free.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!username || !password) {
      toast.error('Masukkan username dan password.');
      return;
    }
    setIsLoading(true);

    try {
      // Fetch global settings to get Discord Webhook early
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      const discordWebhookUrl = settingsDoc.exists() ? settingsDoc.data().discordWebhook : null;

      if (discordWebhookUrl) {
        await sendDiscordNotification(discordWebhookUrl, {
          content: `⚠️ **ALERT: LOGIN ATTEMPT DETECTED**\n\n> Someone is trying to login with username: \`${username}\``,
          embeds: [{
            title: "🔐 Login Activity Monitor",
            description: `A user has initiated a login sequence.\n\n**Details:**\n• **Username:** \`${username}\`\n• **Time:** ${new Date().toLocaleString()}`,
            color: 0xF59E0B, // Amber
            timestamp: new Date().toISOString()
          }]
        });
      }

      const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const loginEmail = username.includes('@') ? username : `${sanitizedUsername || 'user'}@ninzsignal.com`;
      await signInWithEmailAndPassword(auth, loginEmail, password);
      toast.success('Selamat datang kembali!', {
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
      
      if (discordWebhookUrl) {
        await sendDiscordNotification(discordWebhookUrl, {
          content: `✅ **LOGIN SUCCESS**\n\n> User \`${username}\` successfully logged in.`,
          embeds: [{
            title: "🟢 Successful Login",
            color: 0x22C55E, // Green
            timestamp: new Date().toISOString()
          }]
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Login via Username/Password belum diaktifkan di Firebase Console. Gunakan Google Login.', { duration: 6000 });
      } else {
        toast.error('Username atau password salah.');
      }
      
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      const discordWebhookUrl = settingsDoc.exists() ? settingsDoc.data().discordWebhook : null;
      if (discordWebhookUrl) {
        await sendDiscordNotification(discordWebhookUrl, {
          content: `🚫 **LOGIN FAILED**\n\n> User \`${username}\` failed to login. Invalid password.`,
          embeds: [{
            title: "🔴 Failed Login Attempt",
            color: 0xEF4444, // Red
            timestamp: new Date().toISOString()
          }]
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setUsername('');
    setPassword('');
    setView('register');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!username || !password) {
      toast.error('Masukkan username dan password yang diinginkan.');
      return;
    }
    if (!isOver18) {
      toast.error('Anda harus berusia di atas 18 tahun untuk mendaftar.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }
    setIsLoading(true);
    try {
      const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const loginEmail = username.includes('@') ? username : `${sanitizedUsername || 'user'}@ninzsignal.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, password);
      
      // Create user document in Firestore with retry mechanism
      let retries = 3;
      while (retries > 0) {
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: loginEmail,
            displayName: username,
            role: loginEmail === 'telegramnino18@gmail.com' ? 'owner' : (loginEmail === 'traderpro11@ninzsignal.com' || username === 'traderpro11' ? 'admin' : 'user'),
            membership: (loginEmail === 'telegramnino18@gmail.com' || loginEmail === 'traderpro11@ninzsignal.com' || username === 'traderpro11') ? 'premium' : 'pending',
            selectedPackage: selectedPackage.name,
            dailyAccessCount: 0,
            lastAccessDate: new Date().toISOString().split('T')[0],
            notificationSettings: { email: true, push: true },
            createdAt: Timestamp.now()
          });
          break; // Success
        } catch (err: any) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }

      // Redirect to WhatsApp
      const message = `Halo Admin, saya ingin berlangganan NINZ SIGNAL paket ${selectedPackage.name} (${selectedPackage.duration}). Username saya: ${username}`;
      const waUrl = `https://wa.me/6282326933843?text=${encodeURIComponent(message)}`;
      
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      const discordWebhookUrl = settingsDoc.exists() ? settingsDoc.data().discordWebhook : null;
      if (discordWebhookUrl) {
        await sendDiscordNotification(discordWebhookUrl, {
          content: `🎉 **NEW USER REGISTRATION**\n\n> A new user has just registered!`,
          embeds: [{
            title: "👤 New User Details",
            description: `**Username:** \`${username}\`\n**Package Selected:** \`${selectedPackage.name}\` (${selectedPackage.duration})\n**Role:** \`${loginEmail === 'telegramnino18@gmail.com' ? 'owner' : (loginEmail === 'traderpro11@ninzsignal.com' || username === 'traderpro11' ? 'admin' : 'user')}\`\n**Time:** ${new Date().toLocaleString()}`,
            color: 0x3B82F6, // Blue
            timestamp: new Date().toISOString()
          }]
        });
      }

      toast.success('Akun berhasil dibuat! Silakan selesaikan pembayaran via WhatsApp.', {
        duration: 5000,
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
      
      // Navigate directly to WhatsApp instead of opening a new tab
      window.location.href = waUrl;
      
      // Optional: Log them out immediately so they don't access the app until approved,
      // or let them in but they will see "pending" status. We'll let them in.
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Username sudah digunakan. Silakan pilih yang lain.');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Registrasi via Username belum diaktifkan. Silakan gunakan Login dengan Google.', { duration: 6000 });
      } else {
        toast.error('Gagal membuat akun.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white grid lg:grid-cols-2 relative w-full overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000 pointer-events-none" />

      {/* LEFT SHOWCASE COLUMN */}
      <div className="hidden lg:flex flex-col justify-center p-12 xl:p-20 relative z-10 border-r border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
        <AbstractBackground />
        <div className="mb-12 relative z-10">
          <Logo className="scale-125 origin-left" />
        </div>
        
        <h1 className="text-4xl xl:text-5xl font-black uppercase tracking-tighter mb-6 leading-tight text-white drop-shadow-lg">
          Master the Market with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">AI Intelligence</span>
        </h1>
        
        <p className="text-sm xl:text-base text-white/50 leading-relaxed mb-10 max-w-lg">
          Sistem analitik canggih yang siap membantu Anda menemukan setup dengan probabilitas tinggi di market XAU/USD dan BTC/USD.
        </p>

        <div className="space-y-6">
          {[
            { icon: TrendingUp, title: "Algoritma Pro", desc: "Sinyal real-time dengan multi-timeframe confirmation.", color: "text-indigo-400" },
            { icon: ShieldCheck, title: "Manajemen Risiko", desc: "Kalkulasi otomatis batas Stop Loss dan Lot Size aman.", color: "text-emerald-400" },
            { icon: BarChart3, title: "Market Sentiment", desc: "Data pergerakan Big Player & kalender ekonomi.", color: "text-violet-400" }
          ].map((feature, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className={`mt-1 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${feature.color}`}>
                <feature.icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">{feature.title}</h3>
                <p className="text-xs text-white/40 mt-1">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -mt-10 -mr-10"></div>
           <div className="flex items-center gap-4 mb-4 relative z-10">
             <div className="flex -space-x-2">
               <div className="w-8 h-8 rounded-full border border-black bg-indigo-500 flex items-center justify-center text-[10px] font-bold">JD</div>
               <div className="w-8 h-8 rounded-full border border-black bg-violet-500 flex items-center justify-center text-[10px] font-bold">AM</div>
               <div className="w-8 h-8 rounded-full border border-black bg-emerald-500 flex items-center justify-center text-[10px] font-bold">RK</div>
             </div>
             <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Dipercaya 2000+ Trader</div>
           </div>
           <p className="text-xs text-white/70 italic relative z-10">"Sistem AI NINZ mengubah cara saya trading. Entry menjadi jauh lebih presisi dan secara konsisten floating profit dalam hitungan menit."</p>
        </div>
      </div>

      {/* RIGHT AUTH COLUMN */}
      <div className="flex flex-col items-center p-4 md:p-8 relative z-10 h-[100dvh] overflow-y-auto w-full">
        <div className="flex-1 min-h-[2rem]"></div>
        <div className="w-full max-w-md shrink-0">
          <div className="text-center mb-10 lg:hidden">
            <Logo className="scale-125 mx-auto" />
          </div>

        {view === 'packages' ? (
          <motion.div
            key="packages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-widest uppercase text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)] mb-2">Paket Berlangganan</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Pilih Akses Premium Anda</p>
            </div>

            <div className="space-y-6">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className={`w-full bg-transparent border-2 border-dashed border-white/20 text-white py-4 rounded-[32px] font-bold uppercase tracking-widest text-xs transition-all flex flex-col items-center justify-center gap-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white/50"></div>
                  ) : (
                    <Lock size={16} className="text-white/50" />
                  )}
                  Coba Akses Free
                </div>
                <span className="text-[9px] text-white/40 normal-case tracking-normal">Akses terbatas hanya untuk melihat daftar fitur</span>
              </button>

              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-indigo-500/30 rounded-[32px] p-6 relative overflow-hidden shadow-2xl shadow-indigo-500/5">
                  {pkg.bestValue && (
                    <div className="absolute top-6 right-6 bg-white text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Best Value
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                      <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] font-bold">∞</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-widest uppercase">{pkg.name}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{pkg.desc}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm text-white/40 line-through">Rp {pkg.originalPrice}</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Hemat {pkg.save}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">Rp</span>
                      <span className="text-4xl font-bold">{pkg.price}</span>
                      <span className="text-xs text-white/40">/ {pkg.duration}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-white/80 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-white/20 flex items-center justify-center gap-2"
                  >
                    Beli Sekarang <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-6 text-center">
              <p className="text-xs text-white/40 mb-4">Sudah punya akun?</p>
              <button
                onClick={() => setView('login')}
                className="bg-white/5 border border-white/10 text-white py-3 px-8 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                Masuk ke Akun
              </button>
            </div>
          </motion.div>
        ) : view === 'register' ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-indigo-500/30 rounded-[32px] p-8 relative shadow-2xl shadow-indigo-500/5"
          >
            <button 
              onClick={() => setView('packages')}
              className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="text-center mb-8 mt-4">
              <h2 className="text-xl font-bold tracking-widest uppercase mb-2">Buat Akun</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                Buat username & password untuk mengakses paket <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">{selectedPackage?.name}</span>
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 ml-2">Username Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="Username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 ml-2">Password Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                      <Key size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="Min. 6 karakter"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOver18(!isOver18)}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
                    isOver18 ? 'bg-indigo-500 border-indigo-500' : 'bg-white/5 border-white/20'
                  }`}
                >
                  {isOver18 && <CheckCircle2 size={14} className="text-black" />}
                </button>
                <label className="text-[10px] text-white/60 leading-relaxed cursor-pointer" onClick={() => setIsOver18(!isOver18)}>
                  Saya mengonfirmasi bahwa saya berusia <span className="text-white font-bold">18 tahun ke atas</span> dan memahami risiko trading.
                </label>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/60">Total Pembayaran</span>
                  <span className="text-sm font-bold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">Rp {selectedPackage?.price}</span>
                </div>
                <p className="text-[9px] text-white/40 leading-relaxed">
                  Setelah klik tombol di bawah, Anda akan diarahkan ke WhatsApp untuk menyelesaikan pembayaran. Akun Anda akan aktif setelah pembayaran dikonfirmasi.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-indigo-500 text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 mt-4 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-400'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                ) : (
                  <MessageCircle size={16} />
                )}
                {isLoading ? 'Memproses...' : 'Konfirmasi via WhatsApp'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 relative shadow-2xl shadow-black/50"
          >
            <button 
              onClick={() => setView('packages')}
              className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="text-center mb-8 mt-4">
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-4 rotate-12">
                <Lock size={32} className="text-black" />
              </div>
              <h2 className="text-xl font-bold tracking-widest uppercase mb-2">Masuk Akun</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Akses Dashboard Sinyal Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 text-left">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 ml-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 ml-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                    <Key size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="Masukkan password"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  {isLoading ? 'Memproses...' : 'Masuk Dashboard'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Risk Disclaimer */}
        <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 text-violet-500 mb-3">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Peringatan Risiko</span>
          </div>
          <p className="text-[9px] text-white/30 leading-relaxed uppercase tracking-widest">
            Trading instrumen finansial memiliki risiko tinggi. Layanan ini hanya untuk tujuan edukasi dan informasi. 
            <span className="text-white/60 block mt-2">Dilarang bagi pengguna di bawah usia 18 tahun.</span>
          </p>
        </div>
        <div className="flex-1 min-h-[2rem]"></div>
      </div>
      </div>
    </div>
  );
};
