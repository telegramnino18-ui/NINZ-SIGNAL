import React, { useState } from 'react';
import { doc, db, updateDoc } from '../firebase';
import { User, Mail, ShieldCheck, Bell, CreditCard, CheckCircle2, AlertCircle, ChevronRight, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { auth, signOut } from '../firebase';
import { useNavigate } from 'react-router-dom';

export const Profile = ({ profile, setProfile }: { profile: any, setProfile: any }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [metaTrader, setMetaTrader] = useState({
    token: profile?.metaTrader?.token || '',
    accountId: profile?.metaTrader?.accountId || ''
  });

  const handleUpdateMetaTrader = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        metaTrader: {
          ...metaTrader,
          status: 'disconnected'
        }
      });
      setProfile({ 
        ...profile, 
        metaTrader: { ...metaTrader, status: 'disconnected' } 
      });
      toast.success('Kredensial MetaTrader disimpan!', {
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
    } catch (error) {
      toast.error('Gagal menyimpan kredensial.');
    }
    setLoading(false);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/broker/test', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Terhubung! Saldo: ${data.accountInfo.balance} ${data.accountInfo.currency}`, {
          style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
        });
        setProfile({ ...profile, metaTrader: { ...metaTrader, status: 'connected' } });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(`Koneksi Gagal: ${error.message}`);
      setProfile({ ...profile, metaTrader: { ...metaTrader, status: 'error' } });
    }
    setLoading(false);
  };

  const handleUpdateNotifications = async (type: 'email' | 'push') => {
    try {
      const newSettings = {
        ...profile.notificationSettings,
        [type]: !profile.notificationSettings[type]
      };
      await updateDoc(doc(db, 'users', profile.uid), {
        notificationSettings: newSettings
      });
      setProfile({ ...profile, notificationSettings: newSettings });
      toast.success('Pengaturan diperbarui!', {
        style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
      });
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan.');
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    // Simulate payment process
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          membership: 'premium'
        });
        setProfile({ ...profile, membership: 'premium' });
        toast.success('Selamat datang di Premium!', {
          icon: '💎',
          style: { borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid #ffffff10' }
        });
      } catch (error) {
        toast.error('Gagal meningkatkan akun.');
      }
      setLoading(false);
    }, 1500);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-6 p-8 bg-[#0A0A0A] border border-white/5 rounded-3xl">
        <img src={auth.currentUser?.photoURL || ''} alt="Avatar" className="w-24 h-24 rounded-3xl border-2 border-orange-500/20" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{profile?.displayName}</h1>
          <p className="text-sm text-white/40 mt-1 flex items-center gap-2">
            <Mail size={14} /> {profile?.email}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              profile?.membership === 'premium' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white/10 text-white/60'
            }`}>
              Member {profile?.membership === 'premium' ? 'Premium' : 'Gratis'}
            </span>
            {profile?.role === 'admin' && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-500 border border-blue-500/30">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Membership Card */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <CreditCard size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Paket Membership</h2>
          </div>

          <div className="flex-1 space-y-6">
            {profile?.membership === 'free' ? (
              <>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-2xl font-bold mb-2">Paket Gratis</div>
                  <p className="text-xs text-white/40 leading-relaxed">Akses dasar ke sinyal dengan batas harian.</p>
                  <ul className="mt-4 space-y-3">
                    {[
                      '9 Sinyal per hari',
                      'Analisis pasar tertunda',
                      'Statistik performa dasar',
                      'Notifikasi standar'
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[11px] text-white/60">
                        <CheckCircle2 size={14} className="text-orange-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? 'Memproses...' : 'Tingkatkan ke Premium'} <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <div className="p-6 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-center">
                <ShieldCheck size={48} className="text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-orange-500">Premium Aktif</h3>
                <p className="text-xs text-white/60 leading-relaxed">Anda memiliki akses tanpa batas ke semua sinyal dan analitik real-time.</p>
                <div className="mt-6 pt-6 border-t border-orange-500/10 text-[10px] text-orange-500 font-bold uppercase tracking-widest">
                  Akses Seumur Hidup
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Card */}
        <div className="space-y-8">
          {/* MetaTrader Integration */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">MetaTrader API</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  profile?.metaTrader?.status === 'connected' ? 'bg-green-500 animate-pulse' : 
                  profile?.metaTrader?.status === 'error' ? 'bg-red-500' : 'bg-white/20'
                }`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {profile?.metaTrader?.status || 'disconnected'}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
              <p className="text-[10px] text-orange-500/80 uppercase tracking-widest font-bold leading-relaxed">
                Dapatkan token dan account ID Anda di <a href="https://metaapi.cloud" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-400">metaapi.cloud</a>. Pastikan akun MetaTrader Anda sudah dideploy.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">MetaApi Token</label>
                <input 
                  type="password"
                  value={metaTrader.token}
                  onChange={(e) => setMetaTrader({ ...metaTrader, token: e.target.value })}
                  placeholder="Masukkan Token MetaApi"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-orange-500/50 transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Account ID</label>
                <input 
                  type="text"
                  value={metaTrader.accountId}
                  onChange={(e) => setMetaTrader({ ...metaTrader, accountId: e.target.value })}
                  placeholder="Masukkan Account ID"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-orange-500/50 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleUpdateMetaTrader}
                  disabled={loading}
                  className="bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all border border-white/10"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={loading || !profile?.metaTrader?.token}
                  className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all border border-orange-500/20"
                >
                  {loading ? 'Menghubungkan...' : 'Tes Koneksi'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Bell size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Notifikasi</h2>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Peringatan Email', desc: 'Terima sinyal baru via email', icon: Mail },
                  { id: 'push', label: 'Notifikasi Push', desc: 'Peringatan browser real-time', icon: Bell },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 text-white/40">
                        <item.icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{item.label}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{item.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateNotifications(item.id as 'email' | 'push')}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        profile?.notificationSettings?.[item.id] ? 'bg-orange-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        profile?.notificationSettings?.[item.id] ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 text-red-400 hover:bg-red-400/5 rounded-2xl transition-all border border-red-400/20"
            >
              <LogOut size={20} />
              <span className="font-bold uppercase tracking-widest text-xs">Keluar Sesi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
