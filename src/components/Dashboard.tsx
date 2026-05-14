import React, { useState, useEffect } from 'react';
import { collection, db, auth, onSnapshot, query, orderBy, limit, where, handleFirestoreError, OperationType } from '../firebase';
import { TrendingUp, TrendingDown, Clock, BarChart3, Target, ShieldCheck, ChevronRight, Award, Zap, Briefcase, Calendar, Star, Crown, Activity, AlertCircle, Flame, Trophy, History, Gauge, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const Dashboard = ({ profile }: { profile: any }) => {
  const [activeSignals, setActiveSignals] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    winRate: 0,
    totalProfit: 0,
    totalTrades: 0,
    monthlyProfit: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch official active signals
    const qActive = query(
      collection(db, 'signals')
    );

    const unsubscribeActive = onSnapshot(qActive, (snapshot) => {
      const active = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .filter((s: any) => (s.type === 'OFFICIAL' || !s.type) && s.status === 'active')
        .slice(0, 3);
      setActiveSignals(active);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'signals');
    });

    // Fetch signals for stats (if logged in, user stats. if guest, global stats)
    const qStats = query(
      collection(db, 'signals')
    );

    const unsubscribeStats = onSnapshot(qStats, (snapshot) => {
      let userSignals = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      if (auth.currentUser) {
        userSignals = userSignals.filter((s: any) => s.uid === auth.currentUser?.uid).slice(0, 50);
      } else {
        userSignals = userSignals.filter((s: any) => s.type === 'OFFICIAL' || !s.type).slice(0, 50);
      }

      const closedSignals = userSignals.filter((s: any) => s.status === 'closed');
      const totalTrades = closedSignals.length;
      const wins = closedSignals.filter((s: any) => s.result > 0).length;
      const totalProfit = closedSignals.reduce((acc: number, s: any) => acc + (s.result || 0), 0);
      
      setStats({
        winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0,
        totalProfit,
        totalTrades,
        monthlyProfit: totalProfit
      });
      setLastUpdated(new Date());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'signals');
    });

    return () => {
      unsubscribeActive();
      unsubscribeStats();
    };
  }, [lastUpdated.getTime()]);

  // Level & Badges calculation
  const getTraderLevel = (winRate: number, totalTrades: number) => {
    if (totalTrades < 10) return { name: 'Pemula (Novice)', color: 'text-zinc-400', bg: 'bg-zinc-400/10', icon: Star, progress: (totalTrades / 10) * 100, nextLevel: 'Bronze' };
    if (totalTrades < 30) return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/10', icon: Star, progress: ((totalTrades - 10) / 20) * 100, nextLevel: 'Silver' };
    if (totalTrades < 100 && winRate > 50) return { name: 'Silver', color: 'text-zinc-300', bg: 'bg-zinc-300/10', icon: Award, progress: ((totalTrades - 30) / 70) * 100, nextLevel: 'Gold' };
    if (totalTrades < 250 && winRate > 60) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Crown, progress: ((totalTrades - 100) / 150) * 100, nextLevel: 'Platinum' };
    return { name: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: Crown, progress: 100, nextLevel: 'Max Level' };
  };

  const traderLevel = getTraderLevel(stats.winRate, stats.totalTrades);

  const chartData = [
    { name: 'Mon', profit: 400 },
    { name: 'Tue', profit: 300 },
    { name: 'Wed', profit: 600 },
    { name: 'Thu', profit: 800 },
    { name: 'Fri', profit: 700 },
    { name: 'Sat', profit: 900 },
    { name: 'Sun', profit: 1100 },
  ];

  return (
    <div className="space-y-8">
      {/* Macro News Ticker */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden flex items-center relative">
        <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2 z-10 whitespace-nowrap shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
          <Zap size={14} className="text-white animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white">LIVE MACRO</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <motion.div 
            className="flex whitespace-nowrap"
            animate={{ x: ["0%", "-100%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
          >
            <div className="flex items-center gap-8 pl-4">
              {[
                "NFP REPORT RESULT: BEYOND EXPECTATION (BULLISH USD)", 
                "FED RATE DECISION: PAUSE", 
                "US CPI M/M: ACTUAL 0.3% VS FORECAST 0.2%", 
                "BTC ETF NET FLOW: +$400M"
              ].map((news, i) => (
                <span key={i} className="text-xs sm:text-sm font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse px-1"></span>
                  {news}
                </span>
              ))}
              {[
                "NFP REPORT RESULT: BEYOND EXPECTATION (BULLISH USD)", 
                "FED RATE DECISION: PAUSE", 
                "US CPI M/M: ACTUAL 0.3% VS FORECAST 0.2%", 
                "BTC ETF NET FLOW: +$400M"
              ].map((news, i) => (
                <span key={`dup-${i}`} className="text-xs sm:text-sm font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse px-1"></span>
                  {news}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {(profile?.membership === 'pending' || profile?.membership === 'expired') && (
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
             <h3 className="text-red-500 font-bold mb-1 tracking-tight">Status Keanggotaan Anda: {profile?.membership === 'pending' ? 'Tunda (Pending)' : 'Kadaluarsa (Expired)'}</h3>
             <p className="text-xs text-white/60">Selesaikan pembayaran atau perbarui langganan Anda untuk kembali mengakses layanan penuh kami.</p>
          </div>
          <Link to="/profile" className="px-6 py-3 bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors shrink-0 whitespace-nowrap shadow-lg shadow-red-500/20">
             Perbarui Sekarang
          </Link>
        </div>
      )}

      {/* Hero Stats */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Statistik Performa</h2>
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
          <Clock size={10} className="animate-pulse text-violet-500" />
          Auto-refresh: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tingkat Kemenangan', value: `${stats.winRate}%`, icon: Award, color: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]', bgColor: 'bg-amber-400/10' },
          { label: 'Total Profit', value: `${stats.totalProfit} pips`, icon: Zap, color: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]', bgColor: 'bg-emerald-400/10' },
          { label: 'Total Trade', value: stats.totalTrades, icon: Briefcase, color: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]', bgColor: 'bg-blue-400/10' },
          { label: 'Batas Harian', value: profile?.membership === 'premium' ? 'Tanpa Batas' : `${profile?.dailyAccessCount}/9`, icon: ShieldCheck, color: 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]', bgColor: 'bg-violet-400/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden"
          >
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="relative z-10">
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
              <div className="text-xl font-black tracking-tight text-white/90">{stat.value}</div>
            </div>
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${stat.bgColor}`}></div>
          </motion.div>
        ))}
      </div>
      
      {/* Gamification Profile Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden relative p-4 sm:p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mt-20 -mr-20 pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 blur-[80px] -mb-20 -ml-20 pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${traderLevel.bg} border border-white/10 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <traderLevel.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${traderLevel.color} drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl sm:text-2xl font-black tracking-tighter text-white">{traderLevel.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white/50 border border-white/5">Level Trader</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed max-w-sm">
                Tingkatkan Win Rate dan volume trading Anda untuk mencapai rank <strong className="text-white/70">{traderLevel.nextLevel}</strong> dan membuka fitur VIP eksklusif.
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 bg-[#111111] p-4 rounded-xl border border-white/5 relative">
             <div className="flex justify-between items-end mb-2">
               <div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Progress to {traderLevel.nextLevel}</span>
                  <span className="text-sm font-black mt-0.5 block">{Math.round(traderLevel.progress)}%</span>
               </div>
               <span className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Trade {stats.totalTrades}x</span>
             </div>
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min(100, Math.max(0, traderLevel.progress))}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className={`h-full ${traderLevel.bg.replace('/10', '')} bg-opacity-100`}
               />
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Ikhtisar Performa</h2>
              <p className="text-xs text-white/40 mt-1">Pertumbuhan profit kumulatif dari waktu ke waktu</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full bg-violet-500 text-[10px] font-bold uppercase tracking-widest">Mingguan</button>
              <button className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">Bulanan</button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Signals Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Sinyal Aktif</h2>
            <Link to="/signals" className="text-[10px] uppercase tracking-widest text-violet-500 font-bold flex items-center gap-1">
              Lihat Semua <ChevronRight size={12} />
            </Link>
          </div>

          <div className="space-y-4">
            {activeSignals.length > 0 ? (
              activeSignals.map((signal, i) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl group hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        signal.action === 'BUY' ? 'bg-indigo-400/10 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-purple-500/10 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                      }`}>
                        {signal.action === 'BUY' ? 'BELI' : 'JUAL'}
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight">{signal.pair}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Entry: {signal.entryPrice}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Status</div>
                      <div className="text-[10px] text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] font-bold uppercase tracking-widest animate-pulse">Aktif</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-xl">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Target Keuntungan (TP)</div>
                      <div className="text-sm font-bold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">{signal.tp}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Batasi Kerugian (SL)</div>
                      <div className="text-sm font-bold text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">{signal.sl}</div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-2xl text-center">
                <Clock className="mx-auto text-white/20 mb-4" size={32} />
                <p className="text-sm text-white/40">Tidak ada sinyal aktif saat ini.</p>
              </div>
            )}
          </div>

          {/* Market Analysis Mini Card */}
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-lg leading-tight mb-2">Analitik Pasar Real-time</h3>
              <p className="text-xs text-white/80 mb-4">Dapatkan wawasan mendalam tentang tren pasar XAU & BTC.</p>
              <Link to="/analysis" className="inline-block bg-white text-violet-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/90 transition-all">
                Jelajahi Analisis
              </Link>
            </div>
            <BarChart3 className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>
          

        </div>
      </div>

      {/* New Widgets Section: Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Market Sentiment Widget */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] -mt-10 -mr-10 transition-all duration-500 group-hover:bg-orange-500/10"></div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Gauge size={16} className="text-white/40" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Market Sentiment</h3>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg border border-orange-500/20">Greed</span>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-16 overflow-hidden mb-4">
              {/* Semicircle Gauge Background */}
              <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[12px] border-white/5 border-b-transparent border-r-transparent rotate-45 transform origin-center"></div>
              {/* Gauge Value */}
              <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[12px] border-orange-500 border-b-transparent border-r-transparent rotate-[105deg] transform origin-center transition-transform duration-1000 ease-out"></div>
            </div>
            
            <div className="text-center absolute bottom-12">
              <span className="text-3xl font-black text-white tracking-tighter">72</span>
            </div>
            
            <div className="flex justify-between w-full text-[8px] font-bold text-white/30 uppercase tracking-widest mt-2">
              <span>Extreme Fear</span>
              <span>Extreme Greed</span>
            </div>
          </div>
          <p className="text-[10px] text-white/40 text-center mt-2">Sebagian besar trader retail mengambil posisi agresif.</p>
        </div>

        {/* Top Traders Leaderboard */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-white/40" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Top Traders (This Week)</h3>
            </div>
            <Flame size={14} className="text-orange-500 animate-pulse" />
          </div>
          
          <div className="space-y-4">
            {[
              { id: 1, name: 'Alex M.', rank: 'Grandmaster', pnl: '+$4,250', winRate: '82%', avatar: '🦁' },
              { id: 2, name: 'Sarah J.', rank: 'Platinum', pnl: '+$3,810', winRate: '78%', avatar: '🦊' },
              { id: 3, name: 'Ken C.', rank: 'Platinum', pnl: '+$2,100', winRate: '75%', avatar: '🐯' },
            ].map((trader, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-white/30 w-4 text-center">#{trader.id}</div>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm border border-indigo-500/20">
                    {trader.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{trader.name}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">{trader.rank}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-400">{trader.pnl}</div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">WR: {trader.winRate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Validated Setups */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 lg:col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <History size={16} className="text-white/40" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Recent Setups</h3>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">Validated</span>
          </div>
          
          <div className="space-y-4">
            {[
              { pair: 'XAU/USD', type: 'LONG', price: '2345.50', time: '10 mins ago', result: 'Hit TP1 (+30 Pips)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { pair: 'BTC/USD', type: 'SHORT', price: '64200.00', time: '1 hour ago', result: 'Running (+1.5 R)', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { pair: 'XAU/USD', type: 'SHORT', price: '2352.10', time: '3 hours ago', result: 'Hit SL (-15 Pips)', color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map((trade, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded ${trade.bg} ${trade.color} text-[9px] font-black uppercase tracking-widest border border-white/5`}>
                    {trade.type}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{trade.pair}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-widest">{trade.time} • @ {trade.price}</div>
                  </div>
                </div>
                <div className={`text-[10px] font-bold ${trade.color} uppercase tracking-widest`}>
                  {trade.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
