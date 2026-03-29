import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy, limit } from './firebase';
import toast, { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Signals } from './components/Signals';
import { Performance } from './components/Performance';
import { Profile } from './components/Profile';
import { Admin } from './components/Admin';
import { Analysis } from './components/Analysis';
import { Auth } from './components/Auth';
import { User } from 'firebase/auth';
import { Bell } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          // Create new user profile
          const newProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: currentUser.email === 'telegramnino18@gmail.com' ? 'admin' : 'user',
            membership: 'free',
            dailyAccessCount: 0,
            lastAccessDate: new Date().toISOString().split('T')[0],
            notificationSettings: { email: true, push: true }
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time signal notifications
  useEffect(() => {
    if (!user) return;

    const signalsQuery = query(
      collection(db, 'signals'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(signalsQuery, (snapshot) => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const signal = change.doc.data();
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-[#0A0A0A] border border-white/10 shadow-2xl rounded-[24px] pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Bell size={20} />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-white">
                      Sinyal Baru Tersedia!
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {signal.pair} - {signal.type === 'buy' ? 'BELI' : 'JUAL'} @ {signal.entry}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-white/5">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-bold text-orange-500 hover:text-orange-400 focus:outline-none"
                >
                  Tutup
                </button>
              </div>
            </div>
          ), { duration: 5000 });
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {!user ? (
          <Route path="*" element={<Auth />} />
        ) : (
          <Route element={<Layout user={user} profile={userProfile} />}>
            <Route path="/" element={<Dashboard profile={userProfile} />} />
            <Route path="/signals" element={<Signals profile={userProfile} setProfile={setUserProfile} />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/profile" element={<Profile profile={userProfile} setProfile={setUserProfile} />} />
            {userProfile?.role === 'admin' && <Route path="/admin" element={<Admin />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}
