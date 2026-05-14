import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Copy, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export const ResellerDashboard = ({ userProfile }: { userProfile: any }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/?ref=${userProfile?.uid}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <Users className="text-emerald-500" /> Dashboard Reseller
        </h1>
        <p className="text-sm text-white/50 mt-1">Undang trader dan dapatkan komisi dari setiap pendaftaran premium.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-2">
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Users size={14} /> Total Referral
          </div>
          <div className="text-3xl font-black text-white">0</div>
        </div>
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-2">
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Pendaftaran Aktif
          </div>
          <div className="text-3xl font-black text-emerald-400">0</div>
        </div>
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 space-y-2">
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={14} /> Estimasi Komisi
          </div>
          <div className="text-3xl font-black text-amber-500">Rp 0</div>
        </div>
      </div>

      <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 max-w-2xl">
        <h3 className="font-bold mb-4">Link Referral Anda</h3>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/70 outline-none"
          />
          <button 
            onClick={copyLink}
            className="bg-emerald-500/20 text-emerald-500 p-3 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center justify-center min-w-[48px]"
          >
            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p className="text-xs text-white/40 mt-3 leading-relaxed">
          Kirimkan link ini ke calon member. Setiap pendaftaran melalui link ini akan otomatis tercatat sebagai referral Anda (fitur coming soon).
        </p>
      </div>
    </div>
  );
};
