import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { Trophy, Globe, ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Login({ webName, logoUrl }: { webName: string, logoUrl?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  const [showVerifiedPopup, setShowVerifiedPopup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setShowVerifiedPopup(true);
      // Force sign out just in case Supabase auto-logged them in
      supabase.auth.signOut().catch(() => {});
      // Clean up URL without triggering reload
      window.history.replaceState({}, '', '/login');
    }
    if (params.get('register') === 'true') {
      setIsRegistering(true);
    }

    // Check hash for Supabase error (like expired token)
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      if (hashParams.get('error')) {
        const errorDesc = hashParams.get('error_description');
        setError(errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : 'Terjadi kesalahan autentikasi.');
        window.history.replaceState({}, '', '/login');
      }
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Prevent registration if system is not installed
        const config = await supabaseService.getConfig();
        if (!config || !config.isInstalled) {
          throw new Error('Pendaftaran pengguna baru sedang ditutup. Script belum diinstall atau dikonfigurasi oleh Administrator.');
        }

        // Prevent admin email from creating a regular user account
        if (config?.adminEmail && email.toLowerCase() === config.adminEmail.toLowerCase()) {
          throw new Error('Email ini tidak dapat didaftarkan sebagai pengguna biasa.');
        }

        if (!username.trim()) throw new Error('Username wajib diisi');
        if (!/^[a-zA-Z0-9]{1,8}$/.test(username.trim())) {
          throw new Error('Username maksimal 8 karakter tanpa spasi, hanya huruf dan angka.');
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: 'https://portalskor.net/login?verified=true'
          }
        });

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('confirmation email')) {
             throw new Error('Gagal mengirim email konfirmasi. Silakan buka Dashboard Supabase Anda -> Authentication -> Providers -> Email, kemudian MATIKAN opsi "Confirm email".');
          }
          throw signUpError;
        }

        if (!signUpData.user) throw new Error('Gagal membuat akun. Pastikan email belum terdaftar sebelumnya.');

        // Fetch config for role
        const currentConfig = await supabaseService.getConfig();
        const adminEmail = currentConfig?.adminEmail || '';

        // Create user profile - ignore error if RLS blocks it (e.g., waiting for email confirmation)
        // App.tsx handles creating missing profiles cleanly upon next login.
        await supabase
          .from('users')
          .insert([{
            uid: signUpData.user.id,
            username,
            email,
            role: email === adminEmail ? 'admin' : 'user',
            balance: 0
          }]);
        
        setShowRegistrationSuccess(true);
        return; // Don't reload, show success screen
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
      
      window.location.href = '/user';
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === '23505') setError('Email sudah terdaftar');
      else if (err.status === 400) {
        if (err.message?.toLowerCase().includes('confirm')) {
          setError('Email belum dikonfirmasi. Silakan cek kotak masuk email Anda atau hubungi admin untuk menonaktifkan konfirmasi email di Supabase.');
        } else if (isRegistering) {
          setError(err.message || 'Gagal membuat akun.');
        } else {
          setError('Email atau password salah');
        }
      }
      else setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center py-4 px-2 mb-8 border-b border-white/10">
        <a href="https://portalskor.net" className="flex items-center gap-3 group">
          {logoUrl ? (
            <img src={logoUrl} alt={webName} className="h-8 max-w-[150px] object-contain" />
          ) : (
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
          )}
          {!logoUrl && <span className="font-bold text-xl tracking-tight text-white">{webName}</span>}
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegistering(false)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${!isRegistering ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setIsRegistering(true)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${isRegistering ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
          >
            Daftar
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

        {showRegistrationSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md w-full bg-zinc-900/50 p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm"
        >
          <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit mx-auto mb-4 border border-emerald-500/20">
            <Trophy className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white">Pendaftaran Berhasil!</h2>
          <p className="text-zinc-400 text-sm font-medium">
            Silakan verifikasi akun Anda jika diperlukan (cek email Anda). Berikut adalah detail login Anda yang telah didaftarkan:
          </p>
          
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Username</p>
              <p className="text-white font-medium">{username}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</p>
              <p className="text-white font-medium">{email}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</p>
              <p className="text-white font-medium">{password}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsRegistering(false);
              setShowRegistrationSuccess(false);
              setUsername('');
              setPassword('');
              // Keep email to make it easier to login
            }}
            className="w-full py-4 bg-emerald-500 text-zinc-950 font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            Kembali ke Login
          </button>
        </motion.div>
      ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        <div className="flex justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={webName} className="h-32 max-w-[240px] object-contain drop-shadow-2xl" />
          ) : (
            <div className="p-5 bg-emerald-500/10 rounded-3xl ring-1 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              <Trophy className="w-16 h-16 text-emerald-500" />
            </div>
          )}
        </div>

        {!logoUrl && (
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-white">
              {webName.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? 'text-emerald-500' : ''}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <p className="text-zinc-400 text-lg font-medium leading-relaxed">
              Platform Portal Skor terpercaya. <br />
              Menangkan hadiah menarik setiap harinya.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-white">Global Match</h3>
            <p className="text-xs text-zinc-500">Pertandingan dari seluruh liga dunia.</p>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-white">Safe Payout</h3>
            <p className="text-xs text-zinc-500">Penarikan saldo cepat dan aman.</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      maxLength={8}
                      className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-zinc-500 ml-1">Maks. 8 karakter, huruf & angka tanpa spasi.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm font-medium ml-1"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-emerald-500 text-zinc-950 font-bold rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Daftar Sekarang' : 'Masuk ke Akun'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-6">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="w-full py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 text-sm font-bold text-zinc-300 hover:text-white rounded-xl transition-all border border-white/5 active:scale-[0.98]"
                >
                  {isRegistering ? 'Sudah punya akun? Masuk Sekarang' : 'Belum punya akun? Daftar Gratis'}
                </button>
                
                <Link 
                  to="/forgot-password" 
                  className="inline-block py-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Lupa Password?
                </Link>
              </div>
            </div>
        </div>

        <p className="text-xs text-zinc-500 font-medium">
          Dengan masuk, Anda menyetujui Syarat & Ketentuan kami.
        </p>
      </motion.div>
      )}
      </div>

      {/* Verified Popup */}
      <AnimatePresence>
        {showVerifiedPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <div className="bg-emerald-500 w-20 h-20 rounded-2xl rotate-12 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 text-zinc-950 -rotate-12" />
                </div>
              </div>
              <div className="mt-12 text-center space-y-4">
                <h3 className="text-xl font-black text-white">Verifikasi Berhasil!</h3>
                <p className="text-zinc-400 text-sm">
                  Selamat, akun Anda telah berhasil diverifikasi. Silakan login menggunakan email dan password yang telah Anda daftarkan.
                </p>
                <button
                  onClick={() => setShowVerifiedPopup(false)}
                  className="w-full py-3 bg-emerald-500 text-zinc-950 font-black rounded-xl hover:bg-emerald-400 transition-all mt-4"
                >
                  Masuk Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
