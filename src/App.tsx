import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { supabaseService } from './services/supabaseService';
import { UserProfile } from './types';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Install from './pages/Install';
import { LogOut, Shield, Trophy } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [webName, setWebName] = useState('Portal Skor');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    // Check installation status
    const fetchConfig = async () => {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        try {
          const config = await supabaseService.getConfig();
          if (config) {
            setIsInstalled(true);
            setWebName(config.webName || 'Portal Skor');
            setAdminEmail(config.adminEmail || '');
            return;
          }
        } catch (error) {
          console.error('Supabase config fetch error:', error);
        }
      }

      setIsInstalled(false);
    };

    fetchConfig();

    const hasConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    let configSubscription: any = null;
    let authSubscription: any = null;

    if (hasConfig) {
      // Subscribe to config changes in Supabase
      configSubscription = supabase
        .channel('settings_changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.config' }, payload => {
          const data = payload.new as any;
          setWebName(data.webName || 'Portal Skor');
          setAdminEmail(data.adminEmail || '');
        })
        .subscribe();

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await supabaseService.getUserProfile(session.user.id);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });
      authSubscription = subscription;
    }

    const checkAuth = async () => {
      try {
        if (hasConfig) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const profile = await supabaseService.getUserProfile(session.user.id);
              if (profile) {
                setUser(profile);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            // No Supabase session
          }
        }

        setUser(null);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      if (configSubscription) configSubscription.unsubscribe();
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || isInstalled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isInstalled) {
    return <Install onComplete={() => setIsInstalled(true)} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
        {user && (
          <nav className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-8">
                  <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                      <Trophy className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">{webName}</span>
                  </Link>
                  <div className="hidden md:flex items-center gap-6">
                    <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Home</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                        <Shield className="w-4 h-4" /> Admin
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Saldo</span>
                    <span className="text-sm font-bold text-emerald-500">Rp {user.balance.toLocaleString()}</span>
                  </div>
                  <div className="h-8 w-px bg-white/5 mx-2 hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold">{user.username}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{user.role}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-red-400"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/login" element={!user ? <Login webName={webName} /> : <Navigate to="/" />} />
            <Route path="/admin/login" element={!user ? <AdminLogin webName={webName} /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/" />)} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={user ? <Home user={user} webName={webName} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin webName={webName} /> : <Navigate to="/admin/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
