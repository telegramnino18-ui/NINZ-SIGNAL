import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Calendar, Users, Link2, LogOut, Bug, Sparkles, Edit2, Save, X, Image as ImageIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, signOut, db, collection, onSnapshot, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export const Profile = ({ profile, setProfile }: { profile: any, setProfile: any }) => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.displayName || '');
  const [editAvatar, setEditAvatar] = useState(profile?.photoURL || '');
  const [emailNotif, setEmailNotif] = useState(profile?.notifications?.email ?? true);
  const [pushNotif, setPushNotif] = useState(profile?.notifications?.push ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Sync state if profile changes outside
    if (!isEditing) {
      setEditName(profile?.displayName || '');
      setEditAvatar(profile?.photoURL || '');
      setEmailNotif(profile?.notifications?.email ?? true);
      setPushNotif(profile?.notifications?.push ?? true);
    }
  }, [profile, isEditing]);

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'owner') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        setTotalUsers(snapshot.size);
      });
      return () => unsubscribe();
    }
  }, [profile?.role]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const getRoleDisplay = () => {
    if (profile?.role === 'admin') return 'OWNER';
    if (profile?.membership === 'premium') return 'PREMIUM';
    return 'MEMBER';
  };

  const getExpiredDisplay = () => {
    if (profile?.role === 'admin' || profile?.role === 'owner') return 'LIFETIME';
    if (profile?.membership === 'expired') return 'EXPIRED';
    if (profile?.expiresAt) {
      return profile.expiresAt.toDate().toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).split('/').reverse().join('-');
    }
    return '2028-09-14';
  };

  const PREDEFINED_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  ];

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updates = {
        displayName: editName,
        photoURL: editAvatar,
        notifications: {
          email: emailNotif,
          push: pushNotif
        }
      };
      await updateDoc(userRef, updates);
      
      // Assume parent component uses onSnapshot on user, or update local if needed
      if (setProfile) {
        setProfile({ ...profile, ...updates });
      }

      toast.success('Profil berhasil diperbarui!', {
        style: { background: '#0A0A0A', color: '#fff', border: '1px solid #10B981' }
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      toast.error('Gagal memperbarui profil.', {
        style: { background: '#0A0A0A', color: '#fff', border: '1px solid #EF4444' }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 px-4 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f13] border border-red-500/20 rounded-3xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.05)] relative overflow-hidden"
      >
        {/* Header Pill */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-3 bg-[#e43b44] text-white px-5 py-3 rounded-xl shadow-xl shadow-red-500/20">
            <User size={18} strokeWidth={2.5} />
            <span className="font-bold tracking-wide text-sm uppercase">Account Info</span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-10 h-10 rounded-xl bg-[#17171a] border border-white/5 active:bg-white/10 hover:bg-white/5 text-white/70 flex items-center justify-center transition-all"
          >
            {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          </button>
        </div>

        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#17171a] border border-white/5 rounded-2xl p-5 mb-6 space-y-5"
          >
            {/* Display Name */}
            <div>
              <label className="text-[10px] text-white/50 tracking-wider uppercase font-bold mb-2 block">Username / Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>

            {/* Avatar URL or Upload or Preset */}
            <div>
              <label className="text-[10px] text-white/50 tracking-wider uppercase font-bold mb-2 block flex items-center gap-2">
                <ImageIcon size={14} /> Avatar (URL atau Upload)
              </label>
              
              <div className="flex bg-[#0a0a0c] border border-white/10 rounded-xl mb-3 overflow-hidden focus-within:border-red-500/50 transition-colors relative">
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.png atau pilih file/preset"
                  className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
                />
                <label className="bg-[#e43b44] hover:bg-red-500 text-white px-4 py-3 cursor-pointer text-sm font-bold tracking-wider transition-colors shrink-0 flex items-center h-[46px] mt-0">
                  UPLOAD
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        } catch (err) {
                           toast.error('Gagal membaca file gambar');
                        }
                      }
                    }}
                  />
                </label>
              </div>

              <div className="text-[10px] text-white/40 mb-2">Atau pilih avatar otomatis:</div>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_AVATARS.map((url, i) => (
                  <button 
                    key={i}
                    onClick={() => setEditAvatar(url)}
                    className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all hover:scale-110 active:scale-95 ${editAvatar === url ? 'border-red-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="border-t border-white/5 pt-4">
              <label className="text-[10px] text-white/50 tracking-wider uppercase font-bold mb-3 block flex items-center gap-2">
                <Bell size={14} /> Preferensi Notifikasi
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#0a0a0c] p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-white/80 font-medium">Email Notifikasi</span>
                  <button
                    onClick={() => setEmailNotif(!emailNotif)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${emailNotif ? 'bg-red-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${emailNotif ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#0a0a0c] p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-white/80 font-medium">Push Notifikasi</span>
                  <button
                    onClick={() => setPushNotif(!pushNotif)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${pushNotif ? 'bg-red-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${pushNotif ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-[#e43b44] hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
            >
              {isSaving ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" /> : <><Save size={16} /> Simpan Perubahan</>}
            </button>
          </motion.div>
        ) : (
          <div className="w-full h-56 mb-6 rounded-2xl overflow-hidden border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.15)] flex items-center justify-center bg-[#0a0a0c] relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent z-10 pointer-events-none" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 z-0">
              <Sparkles size={24} className="animate-pulse mb-2" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Memuat Animasi...</span>
            </div>

            <img 
              src="https://media1.tenor.com/m/uO3h_L4z7w4AAAAd/naruto-baryon.gif" 
              alt="Naruto Epic Animation" 
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out z-10"
              onError={(e) => {
                e.currentTarget.src = 'https://media1.tenor.com/m/1G6K2VnZJqkAAAAC/naruto-shippuden.gif';
              }}
            />
          </div>
        )}

        {/* Content List */}
        <div className="space-y-2">
          {/* Username */}
          <div className="bg-[#17171a] border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)] object-cover shrink-0 z-10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-[#e43b44] flex items-center justify-center shrink-0 z-10">
                <User size={18} strokeWidth={2} />
              </div>
            )}
            <div className="z-10">
              <div className="text-[10px] text-white/50 tracking-wider mb-1">Username</div>
              <div className="text-white font-medium text-sm tracking-wide">{profile?.displayName || 'zanz'}</div>
            </div>
            {/* Ambient background matching avatar option */}
            {profile?.photoURL && (
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}
          </div>

          {/* Role */}
          <div className="bg-[#17171a] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-[#e43b44] flex items-center justify-center shrink-0">
              <ShieldCheck size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] text-white/50 tracking-wider mb-1">Role</div>
              <div className="text-[#e43b44] font-bold text-sm tracking-wide uppercase">{getRoleDisplay()}</div>
            </div>
          </div>

          {/* Expired */}
          <div className="bg-[#17171a] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-[#e43b44] flex items-center justify-center shrink-0">
              <Calendar size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] text-white/50 tracking-wider mb-1">Expired</div>
              <div className="text-white font-medium text-sm tracking-wide font-mono">{getExpiredDisplay()}</div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#17171a] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 text-[#e43b44] flex items-center justify-center shrink-0">
                <Users size={16} strokeWidth={2} />
              </div>
              <div>
                <div className="text-[10px] text-white/50 tracking-wider mb-1">Online</div>
                <div className="text-white font-medium text-sm font-mono">1</div>
              </div>
            </div>
            
            <div className="bg-[#17171a] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 text-[#e43b44] flex items-center justify-center shrink-0">
                <Link2 size={16} strokeWidth={2} />
              </div>
              <div>
                <div className="text-[10px] text-white/50 tracking-wider mb-1">Connections</div>
                <div className="text-white font-medium text-sm font-mono">{profile?.role === 'admin' || profile?.role === 'owner' ? totalUsers : 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {(profile?.role === 'admin' || profile?.role === 'owner') && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-full bg-[#17171a] border border-white/5 active:bg-white/10 hover:bg-white/5 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-medium tracking-wider text-sm transition-all"
            >
              <ShieldCheck size={18} className="text-[#e43b44]" /> ADMIN DASHBOARD
            </button>
          )}

          <button 
            onClick={() => navigate('/analysis')}
            className="w-full bg-[#e43b44] active:bg-red-600 hover:bg-red-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-medium tracking-wider text-sm transition-all shadow-lg shadow-red-500/20"
          >
            <Sparkles size={18} /> ANALISIS AI
          </button>

          <button 
            onClick={handleLogout}
            className="w-full bg-[#17171a] border border-white/5 active:bg-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-medium tracking-wider text-sm transition-all"
          >
            <LogOut size={18} className="text-white/60" /> LOG OUT / KELUAR
          </button>
        </div>
      </motion.div>
    </div>
  );
};


