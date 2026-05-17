import React, { useState } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { Trophy, Globe, ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ webName, logoUrl }: { webName: string, logoUrl?: string }) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username.trim()) throw new Error('Username wajib diisi');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });

        // Supabase often throws error if Email Confirmation is enabled but SMTP is not configured or rate limited.
        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('confirmation email')) {
             throw new Error('Gagal mengirim email konfirmasi. Silakan buka Dashboard Supabase Anda -> Authentication -> Providers -> Email, kemudian MATIKAN opsi "Confirm email".');
          }
          throw signUpError;
        }

        if (!signUpData.user) throw new Error('Gagal membuat akun');

        // Fetch config for role
        const config = await supabaseService.getConfig();
        const adminEmail = config?.adminEmail || '';

        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            uid: signUpData.user.id,
            username,
            email,
            role: email === adminEmail ? 'admin' : 'user',
            balance: 0
          }]);
        if (profileError) throw profileError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
      
      window.location.reload();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === '23505') setError('Email sudah terdaftar');
      else if (err.status === 400) {
        if (err.message?.toLowerCase().includes('confirm')) {
          setError('Email belum dikonfirmasi. Silakan cek kotak masuk email Anda atau hubungi admin untuk menonaktifkan konfirmasi email di Supabase.');
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

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
                      className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                    />
                  </div>
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
    </div>
  );
}
