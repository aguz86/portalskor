import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in via reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sesi reset password tidak valid atau telah kedaluwarsa. Silakan minta link baru.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password tidak cocok!');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setMessage('Password berhasil diperbarui! Mengalihkan ke login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password update error:', err);
      setError(err.message || 'Gagal memperbarui password');
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
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10">
              <ShieldCheck className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
              Reset <span className="text-blue-500">Password</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              Masukkan password baru Anda di bawah ini
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Password Baru</label>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                    required
                  />
                </div>
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
              disabled={loading || !!error}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Simpan Password Baru
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
