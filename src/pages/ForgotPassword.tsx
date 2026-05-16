import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setMessage('Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Gagal mengirim email reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] rounded-2xl border border-white/5 shadow-lg active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali ke Login
            </Link>
          </div>
          
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              <Mail className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
              Lupa <span className="text-emerald-500">Password</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              Masukkan email Anda untuk menerima link reset password
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Email Anda</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full bg-zinc-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-zinc-950 font-black rounded-2xl hover:bg-emerald-500 transition-all active:scale-[0.98] shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Kirim Link Reset
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
