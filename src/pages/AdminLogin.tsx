import React, { useState } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminLogin({ webName }: { webName: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Email atau password salah. Jika Anda baru saja menginstal, pastikan Anda sudah mendaftar (Sign Up) di halaman login utama menggunakan email admin ini.');
        }
        if (authError.message?.toLowerCase().includes('confirm')) {
          throw new Error('Email admin belum dikonfirmasi. Silakan cek email Anda atau nonaktifkan "Confirm Email" di dashboard Supabase (Authentication -> Providers -> Email).');
        }
        throw authError;
      }
      
      if (data.user) {
        // Fetch config to check admin email
        const config = await supabaseService.getConfig();
        const adminEmail = config?.adminEmail || '';

        // Check if user is admin in Database
        let userProfile = await supabaseService.getUserProfile(data.user.id);

        // If profile doesn't exist but email matches adminEmail, create it
        if (!userProfile && data.user.email === adminEmail) {
          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              uid: data.user.id,
              username: data.user.user_metadata?.username || 'Admin',
              email: data.user.email,
              role: 'admin',
              balance: 0
            }]);
          
          if (!profileError) {
            userProfile = await supabaseService.getUserProfile(data.user.id);
          }
        }

        if (userProfile && userProfile.role === 'admin') {
          // Refresh page to trigger App.tsx auth check
          window.location.reload();
        } else {
          await supabase.auth.signOut();
          throw new Error('Akses ditolak. Anda bukan administrator.');
        }
      }
    } catch (err: any) {
      console.error('Admin Auth error:', err);
      setError(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] rounded-2xl border border-white/5 shadow-lg active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali ke User Login
            </Link>
          </div>
          
          <div className="flex justify-center">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10">
              <Shield className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
              Admin <span className="text-blue-500">Portal</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              Masuk ke panel kontrol {webName}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/forgot-password" 
              className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
            >
              Lupa Password Admin?
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
          Restricted Area • Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
}
