import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function ResetInstall() {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('settings')
        .delete()
        .eq('id', 'config');

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal reset');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="p-4 bg-red-500/10 rounded-2xl w-fit mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Reset Instalasi</h1>
          <p className="text-zinc-500 text-sm font-medium">Hapus konfigurasi saat ini untuk melakukan instalasi ulang.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Reset berhasil! Mengalihkan ke halaman instalasi...
          </div>
        ) : (
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isResetting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                Reset Instalasi Sekarang
              </>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
}
