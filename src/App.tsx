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
import { LogOut, Shield, Trophy, Facebook, Instagram, Youtube, Music4 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import ResetInstall from './pages/ResetInstall';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [webName, setWebName] = useState('Portal Skor');
  const [adminEmail, setAdminEmail] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);

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
            setAppConfig(config);
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
          setWebName(data.webname || 'Portal Skor');
          setAdminEmail(data.adminemail || '');
          setAppConfig({
            ...appConfig,
            webName: data.webname,
            adminEmail: data.adminemail,
            logoUrl: data.logo_url,
            facebookUrl: data.facebook_url,
            youtubeUrl: data.youtube_url,
            instagramUrl: data.instagram_url,
            tiktokUrl: data.tiktok_url
          });
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

  useEffect(() => {
    let timer: any;
    if (loading || isInstalled === null) {
      timer = setTimeout(() => {
        const btnContainer = document.getElementById('loader-container');
        if (btnContainer && !document.getElementById('reset-btn')) {
          const btn = document.createElement('a');
          btn.id = 'reset-btn';
          btn.href = '/reset-install';
          btn.innerText = 'Reset Instalasi';
          btn.className = 'mt-4 px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-bold border border-white/10 hover:bg-zinc-700';
          btnContainer.appendChild(btn);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [loading, isInstalled]);

  if (window.location.pathname === '/reset-install') {
    return <ResetInstall />;
  }

  if (loading || isInstalled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <div id="loader-container"></div>
        </div>
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
                  <a href="/" className="flex items-center gap-2 group">
                    {appConfig?.logoUrl ? (
                      <img src={appConfig.logoUrl} alt={webName} className="h-8 max-w-[120px] object-contain" />
                    ) : (
                      <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <Trophy className="w-6 h-6 text-emerald-500" />
                      </div>
                    )}
                    {!appConfig?.logoUrl && <span className="font-bold text-xl tracking-tight">{webName}</span>}
                  </a>
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
            <Route path="/login" element={!user ? <Login webName={webName} logoUrl={appConfig?.logoUrl} /> : <Navigate to="/" />} />
            <Route path="/admin/login" element={!user ? <AdminLogin webName={webName} logoUrl={appConfig?.logoUrl} /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/" />)} />
            <Route path="/forgot-password" element={<ForgotPassword webName={webName} logoUrl={appConfig?.logoUrl} />} />
            <Route path="/reset-password" element={<ResetPassword webName={webName} logoUrl={appConfig?.logoUrl} />} />
            <Route path="/" element={user ? <Home user={user} webName={webName} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin webName={webName} /> : <Navigate to="/admin/login" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {user && (!user.role || user.role === 'user') && (
          <footer className="border-t border-white/5 py-8 mt-12 bg-zinc-900/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-6">
                {appConfig?.facebookUrl && (
                  <a href={appConfig.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-500 transition-colors p-2 hover:bg-emerald-500/10 rounded-full">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {appConfig?.instagramUrl && (
                  <a href={appConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-500 transition-colors p-2 hover:bg-emerald-500/10 rounded-full">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {appConfig?.tiktokUrl && (
                  <a href={appConfig.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-500 transition-colors p-2 hover:bg-emerald-500/10 rounded-full">
                    <Music4 className="w-5 h-5" />
                  </a>
                )}
                {appConfig?.youtubeUrl && (
                  <a href={appConfig.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-500 transition-colors p-2 hover:bg-emerald-500/10 rounded-full">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-500">&copy; {new Date().getFullYear()} {webName}. All rights reserved.</p>
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
}
