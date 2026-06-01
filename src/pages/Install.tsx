import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Shield, Layout, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';

export default function Install({ onComplete }: { onComplete: () => void }) {
  const [webName, setWebName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('agustwn999@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webName || !adminName || !adminEmail || !adminPassword) {
      setError('Semua field harus diisi!');
      return;
    }

    if (!/^[a-zA-Z0-9]{1,8}$/.test(adminName)) {
      setError('Username Admin maksimal 8 karakter tanpa spasi, hanya huruf dan angka.');
      return;
    }

    if (adminEmail !== 'agustwn999@gmail.com') {
      setError('Hanya agustwn999@gmail.com yang diizinkan untuk menginstal script ini.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase URL atau Anon Key belum dikonfigurasi di environment variables.');
      }

      // 1. Create settings in Supabase
      const success = await supabaseService.saveConfig({
        webName,
        adminEmail,
        adminPassword,
        isInstalled: true,
        installedAt: new Date().toISOString(),
      });
      if (!success) throw new Error('Gagal menyimpan konfigurasi ke Supabase. Pastikan tabel "settings" sudah dibuat.');

      // 2. Create Admin Auth User
      // We use signUp. If the user already exists, it might return an error depending on Supabase settings.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: { username: adminName }
        }
      });

      if (authError) {
        // If user already exists, we might get an error. We can ignore it if we just want to ensure the profile exists.
        if (authError.message.includes('already registered')) {
          console.log('Admin user already exists in Auth');
        } else if (authError.message.toLowerCase().includes('confirmation email')) {
          console.warn('Gagal mengirim email konfirmasi dari Supabase Auth, tetapi instalasi tetap dilanjutkan.');
        } else {
          throw authError;
        }
      }

      // 3. Create/Update User Profile in 'users' table
      // If signUp was successful or user already existed, we try to ensure they have the admin role.
      // Note: If signUp succeeded, authData.user will be present.
      // If it failed because user exists, we might not have the ID here unless we sign in.
      // But usually, the first install is a clean slate.
      
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            uid: authData.user.id,
            username: adminName,
            email: adminEmail,
            role: 'admin',
            balance: 0
          }]);
        
        if (profileError) {
          console.error('Error creating admin profile:', profileError);
        }
      }

      // 4. Show success on UI instead of sending email if not configured
      setIsSuccess(true);
      
      setTimeout(() => {
        onComplete();
      }, 10000); // 10 seconds to read details
    } catch (err: any) {
      console.error('Installation error:', err);
      setError(err.message || 'Gagal melakukan instalasi. Pastikan konfigurasi backend sudah benar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-8 text-center"
        >
          <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Instalasi Berhasil!</h1>
          <p className="text-zinc-400 text-sm font-medium">Ini adalah detail akun Super Admin Anda. Harap simpan dengan baik.</p>
          
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nama Website</p>
              <p className="text-white font-medium">{webName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Username Admin</p>
              <p className="text-white font-medium">{adminName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</p>
              <p className="text-white font-medium">{adminEmail}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</p>
              <p className="text-white font-medium">{adminPassword}</p>
            </div>
          </div>

          <button
            onClick={() => onComplete()}
            className="w-full py-4 bg-emerald-500 text-zinc-950 font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            Lanjut ke Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mx-auto mb-4">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Instalasi Script</h1>
          <p className="text-zinc-500 text-sm font-medium">Tentukan konfigurasi awal aplikasi Anda.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleInstall} className="space-y-6">
          <div className="space-y-4">

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-3 h-3" /> Nama Website
              </label>
              <input
                type="text"
                value={webName}
                onChange={(e) => setWebName(e.target.value)}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Portal Skor"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> Username Admin
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                maxLength={8}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="admin123"
              />
              <p className="text-xs text-zinc-500">Maks. 8 karakter, huruf & angka (tanpa spasi).</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Admin (Google)
              </label>
              <input
                type="email"
                value={adminEmail}
                readOnly
                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-400 font-bold outline-none cursor-not-allowed"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Password Admin
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Selesaikan Instalasi
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          Pastikan data yang dimasukkan benar.
        </p>
      </motion.div>
    </div>
  );
}
