import React, { useState, useEffect, useMemo } from 'react';
import { collection, db, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { TrendingUp, TrendingDown, Clock, Lock, Eye, ChevronRight, AlertCircle, CheckCircle2, Copy, Trash2, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SignalFeedback = ({ signalId, profile }: { signalId: string, profile: any }) => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [myFeedback, setMyFeedback] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'signals', signalId, 'feedbacks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setFeedbacks(data);
      const mine = data.find(f => f.id === profile?.uid);
      if (mine) {
        setMyFeedback(mine);
        setComment(mine.comment || '');
      }
    }, (error) => {
      // Supress error if user doesn't have access or it fails silently for logged out users
    });
    return () => unsubscribe();
  }, [signalId, profile?.uid]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!profile?.uid) return toast.error('Harap login untuk memberikan feedback');
    try {
      const feedbackRef = doc(db, 'signals', signalId, 'feedbacks', profile.uid);
      await setDoc(feedbackRef, {
        type,
        updatedAt: Timestamp.now()
      }, { merge: true });
      toast.success('Feedback disimpan!');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `signals/${signalId}/feedbacks`);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return toast.error('Harap login untuk memberikan komentar');
    if (!comment.trim()) return;
    try {
      const feedbackRef = doc(db, 'signals', signalId, 'feedbacks', profile.uid);
      await setDoc(feedbackRef, {
        comment,
        updatedAt: Timestamp.now()
      }, { merge: true });
      toast.success('Komentar disimpan!');
      setShowCommentInput(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `signals/${signalId}/feedbacks`);
    }
  };

  const upVotes = feedbacks.filter(f => f.type === 'up').length;
  const downVotes = feedbacks.filter(f => f.type === 'down').length;
  const commentsCount = feedbacks.filter(f => f.comment && f.comment.trim().length > 0).length;

  return (
    <div className="pt-4 mt-2 border-t border-white/5 relative z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleVote('up')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              myFeedback?.type === 'up' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ThumbsUp size={14} /> <span>{upVotes > 0 ? upVotes : ''}</span>
          </button>
          <button 
            onClick={() => handleVote('down')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              myFeedback?.type === 'down' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ThumbsDown size={14} /> <span>{downVotes > 0 ? downVotes : ''}</span>
          </button>
        </div>
        
        <button 
          onClick={() => setShowCommentInput(!showCommentInput)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
             showCommentInput || commentsCount > 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
          }`}
        >
          <MessageSquare size={14} /> <span>{commentsCount > 0 ? commentsCount : 'Komentar'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showCommentInput && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Berikan feedback untuk sinyal ini..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 resize-none min-h-[60px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommentInput(false)}
                  className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!comment.trim() || !profile?.uid}
                  className="px-4 py-1.5 rounded-lg bg-violet-500 text-[10px] uppercase tracking-widest font-bold text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
                >
                  Kirim
                </button>
              </div>
            </form>

            {commentsCount > 0 && (
              <div className="mt-4 space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {feedbacks.filter(f => f.comment && f.comment.trim() !== '').map((f, idx) => (
                  <div key={idx} className="bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <p className="text-xs text-white/70 italic">"{f.comment}"</p>
                    {f.type && (
                       <div className="mt-1 flex items-center gap-1">
                         {f.type === 'up' ? <ThumbsUp size={10} className="text-emerald-400" /> : <ThumbsDown size={10} className="text-red-400" />}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Signals = ({ profile, setProfile }: { profile: any, setProfile: any }) => {
  const [signals, setSignals] = useState<any[]>([]);
  const [viewedSignals, setViewedSignals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairFilter, setPairFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'closed'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      const matchPair = pairFilter === 'ALL' || signal.pair === pairFilter;
      const matchStatus = statusFilter === 'ALL' || signal.status === statusFilter;
      const matchType = typeFilter === 'ALL' || 
                        (typeFilter === 'REGULAR' && (!signal.tradeType || signal.tradeType === 'REGULAR')) || 
                        signal.tradeType === typeFilter;
      return matchPair && matchStatus && matchType;
    });
  }, [signals, pairFilter, statusFilter, typeFilter]);

  useEffect(() => {
    const q = query(
      collection(db, 'signals')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const signalsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .filter((signal: any) => signal.type === 'OFFICIAL' || !signal.type); // Filter in memory, allow undefined type for backward compatibility
      setSignals(signalsData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'signals');
    });

    // Load viewed signals from localStorage for this session/day
    const saved = localStorage.getItem(`viewed_signals_${profile?.uid || 'guest'}_${new Date().toISOString().split('T')[0]}`);
    if (saved) {
      setViewedSignals(JSON.parse(saved));
    }

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleCopy = (label: string, text: string | number) => {
    navigator.clipboard.writeText(text.toString());
    toast.success(`${label} disalin!`, {
      style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
    });
  };

  const handleDeleteSignal = async (signalId: string) => {
    try {
      await deleteDoc(doc(db, 'signals', signalId));
      toast.success('Sinyal berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting signal:', error);
      toast.error('Gagal menghapus sinyal.');
      handleFirestoreError(error, OperationType.DELETE, 'signals');
    }
  };

  const handleViewSignal = async (signalId: string) => {
    if (viewedSignals.includes(signalId)) return;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.lastAccessDate !== today;
    const currentCount = isNewDay ? 0 : (profile.dailyAccessCount || 0);

    if (profile.membership === 'free' && currentCount >= 1) {
      toast.error('Batas harian Free Member tercapai (1/1). Tingkatkan ke Premium untuk akses tanpa batas!', {
        icon: '🔒',
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
      return;
    }

    try {
      const newCount = currentCount + 1;
      const updatedProfile = {
        ...profile,
        dailyAccessCount: newCount,
        lastAccessDate: today
      };

      if (profile.uid) {
        await updateDoc(doc(db, 'users', profile.uid), {
          dailyAccessCount: newCount,
          lastAccessDate: today
        });
      }

      const newViewed = [...viewedSignals, signalId];
      setViewedSignals(newViewed);
      localStorage.setItem(`viewed_signals_${profile.uid || 'guest'}_${today}`, JSON.stringify(newViewed));
      setProfile(updatedProfile);
      
      toast.success('Sinyal Terbuka!', {
        icon: '🔓',
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
    } catch (error) {
      console.error('Error updating access count:', error);
      toast.error('Gagal membuka sinyal.');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Baru saja';
    try {
      let dateObj;
      if (typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else {
        dateObj = new Date(date);
      }
      
      if (isNaN(dateObj.getTime())) return 'Baru saja';
      return format(dateObj, 'MMM dd, HH:mm');
    } catch (e) {
      return 'Baru saja';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-[0.2em]">SIGNAL</h1>
          <p className="text-sm text-white/40 mt-1">Official Market Signals & Trade History</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Filters Bar */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl h-fit">
            <select
              value={pairFilter}
              onChange={(e) => setPairFilter(e.target.value)}
              className="bg-transparent text-white/70 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer hover:text-white focus:ring-0 [&>option]:bg-[#0A0A0A] [&>option]:text-white"
            >
              <option value="ALL">SEMUA PAIR</option>
              <option value="XAU/USD">XAU/USD</option>
              <option value="BTC/USD">BTC/USD</option>
            </select>
          </div>

          <div className="flex flex-wrap bg-white/5 border border-white/10 p-1 rounded-2xl h-fit max-w-full">
            {['ALL', 'REGULAR', 'SCALPING', 'SWING', 'FM'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  typeFilter === type
                    ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {type === 'ALL' ? 'SEMUA TIPE' : type}
              </button>
            ))}
          </div>

          <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl h-fit">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                statusFilter === 'ALL' 
                  ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              SEMUA STATUS
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                statusFilter === 'active' 
                  ? 'bg-indigo-400 text-white shadow-lg shadow-indigo-400/20' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              AKTIF
            </button>
            <button 
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                statusFilter === 'closed' 
                  ? 'bg-white/5 text-white/60 shadow-lg shadow-white/5' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              SELESAI
            </button>
          </div>

          <div className="flex items-center gap-4 bg-[#0A0A0A] border border-white/5 p-3 rounded-xl">
            <div className="text-right">
              <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Akses Harian</div>
              <div className="text-xs font-bold whitespace-nowrap">
                {profile?.membership === 'premium' ? (
                  <span className="text-violet-500">Premium Unlimited</span>
                ) : profile?.membership === 'free' ? (
                  <span className={profile?.dailyAccessCount >= 1 ? 'text-white/40' : 'text-white'}>
                    Free Member ({profile?.dailyAccessCount || 0}/1)
                  </span>
                ) : (
                  <span className={profile?.dailyAccessCount >= 9 ? 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-white'}>
                    {profile?.dailyAccessCount || 0}/9
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
              <TrendingUp size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSignals.map((signal, i) => {
          const isViewed = profile?.membership === 'premium' || viewedSignals.includes(signal.id) || signal.status === 'closed';
          const signalTime = signal.createdAt?.toMillis() || Date.now();
          const signalAgeMinutes = (currentTime - signalTime) / 1000 / 60;
          const isDelayed = profile?.membership === 'free' && signalAgeMinutes < 5;
          const delayRemaining = Math.max(0, Math.ceil(5 - signalAgeMinutes));
          
          return (
            <motion.div
              layout
              key={`${signal.id}-${signal.status}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: Math.min(i * 0.05, 0.5), 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
              className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden group hover:border-violet-500/30 transition-all"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    signal.pair.includes('BTC') || signal.pair.includes('ETH') || signal.pair.includes('SOL') || signal.pair.includes('BNB') ? 'bg-orange-500/10 text-orange-500' :
                    signal.pair.includes('XAU') || signal.pair.includes('XAG') || signal.pair.includes('WTI') || signal.pair.includes('BRENT') ? 'bg-amber-400/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm tracking-tight">{signal.pair}</div>
                      {signal.tradeType && signal.tradeType !== 'REGULAR' && (
                        <div className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                          signal.tradeType === 'SCALPING' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          signal.tradeType === 'SWING' ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
                          signal.tradeType === 'FM' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : ''
                        }`}>
                          {signal.tradeType}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      {formatDate(signal.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profile?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignal(signal.id);
                      }}
                      className="p-1 px-2 bg-red-500/10 text-red-500 rounded text-[10px] uppercase font-bold tracking-widest hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      Hapus
                    </button>
                  )}
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    signal.status === 'active' ? 'bg-indigo-400/10 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse' : 'bg-white/10 text-white/40'
                  }`}>
                    {signal.status === 'active' ? 'Aktif' : 'Selesai'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 relative">
                {!isViewed && (
                  <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="text-violet-500 mb-3" size={32} />
                    <h3 className="font-bold text-sm mb-1">Sinyal Terkunci</h3>
                    {profile?.membership === 'free' ? (
                      isDelayed ? (
                        <>
                          <p className="text-[10px] text-white/60 mb-4 tracking-widest leading-relaxed">DELAY 5 MENIT UNTUK PENGGUNA FREE.<br/><span className="text-violet-500">UPGRADE PREMIUM UNTUK AKSES REALTIME.</span></p>
                          <button
                            disabled
                            className="bg-white/10 text-white/40 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed border border-white/5"
                          >
                            Terkunci ({delayRemaining} Menit)
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] text-white/60 mb-4 tracking-widest leading-relaxed">Sinyal tesedia. Anda memiliki akses 1 sinyal per hari. Gunakan kuota untuk membuka.</p>
                          <button
                            onClick={() => handleViewSignal(signal.id)}
                            className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg shadow-white/20"
                          >
                            Buka Sinyal
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        <p className="text-[10px] text-white/60 mb-4">Klik di bawah untuk membuka sinyal ini menggunakan kuota harian Anda.</p>
                        <button
                          onClick={() => handleViewSignal(signal.id)}
                          className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg shadow-white/20"
                        >
                          Buka Sinyal
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className={`text-lg font-black italic tracking-tighter ${
                    signal.action === 'BUY' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                  }`}>
                    ORDER {signal.action === 'BUY' ? 'BELI' : 'JUAL'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold text-white/60">
                      Entry: <span className="text-white">{signal.entryPrice}</span>
                    </div>
                    <button 
                      onClick={() => handleCopy('Entry', signal.entryPrice)}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors"
                      title="Copy Entry"
                    >
                      <Copy size={14} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative group">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 w-fit">Target Keuntungan (TP)</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">{signal.tp}</div>
                        <button 
                          onClick={() => handleCopy('TP', signal.tp)}
                          className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg transition-all"
                          title="Copy TP"
                        >
                          <Copy size={14} className="text-indigo-400" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative group">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 w-fit">Batasi Kerugian (SL)</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">{signal.sl}</div>
                        <button 
                          onClick={() => handleCopy('SL', signal.sl)}
                          className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg transition-all"
                          title="Copy SL"
                        >
                          <Copy size={14} className="text-purple-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                {signal.analysis && (
                  <div className="pt-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Analisis Pasar</div>
                    <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2 italic">
                      "{signal.analysis}"
                    </p>
                  </div>
                )}

                {signal.status === 'closed' && (
                  <div className={`mt-4 p-3 rounded-xl flex items-center justify-between ${
                    signal.result > 0 ? 'bg-indigo-400/10 border border-indigo-400/20 shadow-[0_0_15px_rgba(129,140,248,0.4)]' : 'bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  }`}>
                    <div className="flex items-center gap-2">
                      {signal.result > 0 ? <CheckCircle2 size={14} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" /> : <AlertCircle size={14} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">Hasil</span>
                    </div>
                    <div className={`font-bold text-sm ${signal.result > 0 ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'}`}>
                      {signal.result > 0 ? '+' : ''}{signal.result} Pips
                    </div>
                  </div>
                )}
                
                <SignalFeedback signalId={signal.id} profile={profile} />
              </div>
            </motion.div>
          );
        })}
        {filteredSignals.length === 0 && (
          <div className="col-span-full py-20 text-center bg-[#0A0A0A] border border-dashed border-white/10 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Clock className="text-white/20" size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Sinyal</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Tidak ditemukan sinyal dengan kriteria filter saat ini.
            </p>
            <button 
              onClick={() => { setPairFilter('ALL'); setStatusFilter('ALL'); }}
              className="mt-6 text-xs font-bold text-violet-500 uppercase tracking-widest hover:text-violet-400 underline underline-offset-4"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
