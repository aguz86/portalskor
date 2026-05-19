import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { Match, Prediction, UserProfile, Withdrawal } from '../types';
import { Trophy, Calendar, Send, Wallet, History, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { emailService } from '../services/emailService';
import { motion, AnimatePresence } from 'motion/react';

interface HomeProps {
  user: UserProfile;
  webName: string;
}

export default function Home({ user, webName }: HomeProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'history' | 'withdraw'>('matches');
  const [predictingMatch, setPredictingMatch] = useState<Match | null>(null);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [withdrawAmountStr, setWithdrawAmountStr] = useState<string>('');
  const [withdrawWallet, setWithdrawWallet] = useState<string>('');
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchMatches = async () => {
    const data = await supabaseService.getOpenMatches();
    setMatches(data);
  };

  const fetchPredictions = async () => {
    const data = await supabaseService.getPredictions(user.uid);
    setPredictions(data);
  };

  const fetchWithdrawals = async () => {
    const data = await supabaseService.getWithdrawals(user.uid);
    setWithdrawals(data);
  };

  useEffect(() => {
    fetchMatches();
    fetchPredictions();
    fetchWithdrawals();

    // Real-time subscriptions with Supabase
    const matchesSub = supabase
      .channel('matches_home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe();

    const predictionsSub = supabase
      .channel('predictions_home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions', filter: `userId=eq.${user.uid}` }, fetchPredictions)
      .subscribe();

    const withdrawalsSub = supabase
      .channel('withdrawals_home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `userId=eq.${user.uid}` }, fetchWithdrawals)
      .subscribe();

    return () => {
      matchesSub.unsubscribe();
      predictionsSub.unsubscribe();
      withdrawalsSub.unsubscribe();
    };
  }, [user.uid]);

  const handlePredict = async () => {
    if (!predictingMatch) return;
    setIsSubmitting(true);
    try {
      const success = await supabaseService.createPrediction({
        userId: user.uid,
        matchId: predictingMatch.id,
        scoreA,
        scoreB,
        status: 'pending',
      });
      if (success) {
        setMessage({ type: 'success', text: 'Prediksi berhasil dikirim!' });
        setPredictingMatch(null);
      } else {
        throw new Error();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengirim prediksi.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleWithdrawRequest = async () => {
    const withdrawAmount = parseInt(withdrawAmountStr.replace(/\./g, '')) || 0;
    if (withdrawAmount <= 0 || withdrawAmount > user.balance) {
      setMessage({ type: 'error', text: 'Saldo tidak mencukupi atau jumlah tidak valid.' });
      return;
    }
    if (!/^J\d{5}$/.test(withdrawWallet.trim())) {
      setMessage({ type: 'error', text: 'Format wallet harus berupa J diikuti 5 angka (misal: J12345).' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Generate 6-digit OTP
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const saved = await supabaseService.createOtp(user.email, newCode);
      if (!saved) throw new Error("Gagal membuat OTP");
      
      await emailService.sendEmail(
        user.email,
        'Kode OTP Penarikan Anda',
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; padding: 20px; border-radius: 12px; border: 1px solid #27272a;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Permintaan Penarikan</h2>
          <p>Anda sedang melakukan permintaan penarikan saldo sebesar <strong>Rp ${withdrawAmount.toLocaleString()}</strong>.</p>
          <p>Kode OTP Anda adalah: <strong style="font-size: 24px; color: #10b981; display: inline-block; padding: 10px; background: #27272a; border-radius: 8px;">${newCode}</strong></p>
          <p style="color: #a1a1aa; font-size: 14px;">Kode ini berlaku selama 10 menit. Jangan bagikan kepada siapa pun.</p>
        </div>
        `
      );
      
      setShowOtp(true);
      setMessage({ type: 'success', text: 'Kode OTP 6-digit telah dikirim ke email Anda.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Gagal mengirim OTP.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (otpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Kode OTP harus 6 digit.' });
      return;
    }
    setOtpSubmitting(true);
    try {
      const valid = await supabaseService.verifyOtp(user.email, otpCode);
      if (!valid) {
        setMessage({ type: 'error', text: 'Kode OTP tidak valid atau sudah kedaluwarsa.' });
        return;
      }
      
      const withdrawAmount = parseInt(withdrawAmountStr.replace(/\./g, '')) || 0;
      const success = await supabaseService.createWithdrawal({
        userId: user.uid,
        amount: withdrawAmount,
        wallet: withdrawWallet.trim(),
        status: 'pending',
      });
      if (success) {
        setMessage({ type: 'success', text: 'Permintaan penarikan berhasil dikirim!' });
        setWithdrawAmountStr('');
        setWithdrawWallet('');
        setShowOtp(false);
        setOtpCode('');
        
        // Refresh balance (optimistic)
        user.balance -= withdrawAmount;
      } else {
        throw new Error();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengirim permintaan penarikan.' });
    } finally {
      setOtpSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Dashboard <span className="text-emerald-500">User</span></h2>
          <p className="text-zinc-500 font-medium">Selamat datang kembali, {user.username}!</p>
        </div>
        <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-white/5">
          {(['matches', 'history', 'withdraw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab 
                ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Section */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.length > 0 ? matches.map((match) => (
              <div key={match.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6 hover:border-emerald-500/30 transition-colors group">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                    Open Match
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold">Today</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center space-y-2">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center ring-1 ring-white/5 group-hover:ring-emerald-500/20 transition-all overflow-hidden">
                      {match.logoA ? (
                        <img src={match.logoA} alt={match.teamA} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl font-black text-zinc-400">{match.teamA[0]}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white truncate">{match.teamA}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-zinc-700 italic">VS</span>
                  </div>
                  <div className="flex-1 text-center space-y-2">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center ring-1 ring-white/5 group-hover:ring-emerald-500/20 transition-all overflow-hidden">
                      {match.logoB ? (
                        <img src={match.logoB} alt={match.teamB} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl font-black text-zinc-400">{match.teamB[0]}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white truncate">{match.teamB}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Deadline</span>
                    <span className={new Date() > new Date(match.deadline) ? 'text-red-500' : 'text-emerald-500'}>
                      {new Date(match.deadline).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setPredictingMatch(match)}
                    disabled={new Date() > new Date(match.deadline)}
                    className="w-full py-3 bg-zinc-800 hover:bg-emerald-500 text-white hover:text-zinc-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trophy className="w-4 h-4" />
                    {new Date() > new Date(match.deadline) ? 'Deadline Lewat' : 'Tebak Skor'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-dashed border-white/5">
                <div className="p-4 bg-zinc-800/50 rounded-full w-fit mx-auto">
                  <Clock className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 font-bold">Belum ada pertandingan terbuka.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {predictions.length > 0 ? predictions.map((pred) => {
              const match = matches.find(m => m.id === pred.matchId);
              return (
                <div key={pred.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      pred.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 
                      pred.status === 'lost' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Match ID: {pred.matchId.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500 font-medium">Prediksi: {pred.scoreA} - {pred.scoreB}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      pred.status === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      pred.status === 'lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'
                    }`}>
                      {pred.status}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-dashed border-white/5">
                <History className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 font-bold">Belum ada riwayat prediksi.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-emerald-500 rounded-3xl p-6 text-zinc-950 space-y-4 shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
                <Wallet className="w-12 h-12 opacity-20 absolute -right-2 -bottom-2 transform -rotate-12 group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">Total Saldo</p>
                  <h3 className="text-3xl font-black">Rp {user.balance.toLocaleString()}</h3>
                </div>
                <div className="pt-4 border-t border-zinc-950/10">
                  <p className="text-[10px] font-bold opacity-60">Penarikan minimum Rp 10.000</p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-white">Form Penarikan</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Jumlah (IDR)</label>
                    <input
                      type="text"
                      value={withdrawAmountStr}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (!val) {
                          setWithdrawAmountStr('');
                          return;
                        }
                        val = val.replace(/^0+/, '');
                        if (!val) val = '';
                        const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setWithdrawAmountStr(formatted);
                      }}
                      className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Wallet Tujuan</label>
                    <input
                      type="text"
                      value={withdrawWallet}
                      onChange={(e) => {
                        let val = e.target.value.toUpperCase();
                        if (val && !val.startsWith('J')) {
                          val = 'J' + val.replace(/\D/g, '');
                        } else if (val) {
                          val = 'J' + val.slice(1).replace(/\D/g, '');
                        }
                        setWithdrawWallet(val.slice(0, 6)); // J + 5 digits
                      }}
                      className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all tracking-[0.2em]"
                      placeholder="J12345"
                      maxLength={6}
                    />
                    <p className="text-[10px] text-zinc-500 font-medium">Format: J diikuti 5 angka (misal: J12345)</p>
                  </div>
                </div>
                {!showOtp ? (
                  <button
                    onClick={handleWithdrawRequest}
                    disabled={isSubmitting || !withdrawAmountStr || withdrawWallet.length !== 6}
                    className="w-full py-4 bg-white text-zinc-950 font-black rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    <Send className="w-4 h-4" />
                    Minta Kode OTP
                  </button>
                ) : (
                  <div className="mt-4 p-4 border border-emerald-500/30 rounded-xl bg-emerald-500/5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Kode OTP (6 Digit)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-center tracking-[0.5em] text-xl"
                        placeholder="000000"
                      />
                    </div>
                    <div className="flex gap-2">
                       <button
                         onClick={() => setShowOtp(false)}
                         disabled={otpSubmitting}
                         className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50"
                       >
                         Batal
                       </button>
                       <button
                         onClick={handleWithdrawConfirm}
                         disabled={otpSubmitting || otpCode.length !== 6}
                         className="flex-1 py-3 bg-emerald-500 text-zinc-950 font-black rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         <Send className="w-4 h-4" />
                         Konfirmasi
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h4 className="text-sm font-bold text-white px-2">Riwayat Penarikan</h4>
              {withdrawals.length > 0 ? withdrawals.map((w) => (
                <div key={w.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Rp {w.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(w.created_at).toLocaleDateString()} &middot; {w.wallet}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    w.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'
                  }`}>
                    {w.status}
                  </span>
                </div>
              )) : (
                <div className="py-20 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-dashed border-white/5">
                  <p className="text-zinc-500 font-bold">Belum ada riwayat penarikan.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Prediction Modal */}
      <AnimatePresence>
        {predictingMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPredictingMatch(null)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-lg relative z-10 shadow-2xl"
            >
              <div className="text-center space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Tebak Skor</h3>
                  <p className="text-zinc-500 text-sm font-bold">{predictingMatch.teamA} vs {predictingMatch.teamB}</p>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <div className="space-y-4 flex-1">
                    <div className="w-20 h-20 bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center ring-1 ring-white/5 overflow-hidden">
                      {predictingMatch.logoA ? (
                        <img src={predictingMatch.logoA} alt={predictingMatch.teamA} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-3xl font-black text-zinc-500">{predictingMatch.teamA[0]}</span>
                      )}
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{predictingMatch.teamA}</p>
                    <input
                      type="number"
                      value={scoreA}
                      onChange={(e) => setScoreA(Number(e.target.value))}
                      className="w-full bg-zinc-800 border-2 border-white/5 rounded-3xl py-6 text-center text-4xl font-black text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="text-4xl font-black text-zinc-700 pt-20">:</div>
                  <div className="space-y-4 flex-1">
                    <div className="w-20 h-20 bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center ring-1 ring-white/5 overflow-hidden">
                      {predictingMatch.logoB ? (
                        <img src={predictingMatch.logoB} alt={predictingMatch.teamB} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-3xl font-black text-zinc-500">{predictingMatch.teamB[0]}</span>
                      )}
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{predictingMatch.teamB}</p>
                    <input
                      type="number"
                      value={scoreB}
                      onChange={(e) => setScoreB(Number(e.target.value))}
                      className="w-full bg-zinc-800 border-2 border-white/5 rounded-3xl py-6 text-center text-4xl font-black text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setPredictingMatch(null)}
                    className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePredict}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-emerald-500 text-zinc-950 font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Kirim Prediksi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
