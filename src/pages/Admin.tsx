import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { Match, Prediction, Withdrawal, UserProfile } from '../types';
import { Plus, Check, X, Shield, Users, Trophy, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin({ webName }: { webName: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'withdrawals' | 'users' | 'supabase'>('matches');
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  // Form states
  const [newTeamA, setNewTeamA] = useState('');
  const [newLogoA, setNewLogoA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [newLogoB, setNewLogoB] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newTotalPrize, setNewTotalPrize] = useState(50000);
  const [newWinnerCount, setNewWinnerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [matchesRes, predictionsRes, withdrawalsRes, usersRes] = await Promise.all([
        supabaseService.getAllMatches(),
        supabaseService.getAllPredictions(),
        supabaseService.getAllWithdrawals(),
        supabaseService.getAllUsers()
      ]);

      setMatches(matchesRes);
      setPredictions(predictionsRes);
      setWithdrawals(withdrawalsRes);
      setUsers(usersRes);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // Check Supabase status
    const checkSupabase = async () => {
      try {
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
          setSupabaseStatus('connected');
        } else {
          setSupabaseStatus('error');
        }
      } catch (e) {
        setSupabaseStatus('error');
      }
    };
    checkSupabase();

    // Real-time subscriptions with Supabase
    const matchesSub = supabase
      .channel('admin_matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .subscribe();

    const predictionsSub = supabase
      .channel('admin_predictions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchData)
      .subscribe();

    const withdrawalsSub = supabase
      .channel('admin_withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, fetchData)
      .subscribe();

    const usersSub = supabase
      .channel('admin_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchData)
      .subscribe();

    return () => {
      matchesSub.unsubscribe();
      predictionsSub.unsubscribe();
      withdrawalsSub.unsubscribe();
      usersSub.unsubscribe();
    };
  }, []);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamA || !newTeamB || !newDeadline) return;
    setIsSubmitting(true);
    try {
      const success = await supabaseService.createMatch({
        teamA: newTeamA,
        logoA: newLogoA || `https://picsum.photos/seed/${newTeamA}/100/100`,
        teamB: newTeamB,
        logoB: newLogoB || `https://picsum.photos/seed/${newTeamB}/100/100`,
        status: 'open',
        deadline: new Date(newDeadline).toISOString(),
        totalPrize: newTotalPrize,
        winnerCount: newWinnerCount,
      });
      if (success) {
        setNewTeamA('');
        setNewLogoA('');
        setNewTeamB('');
        setNewLogoB('');
        setNewDeadline('');
        setMessage({ type: 'success', text: 'Match created successfully!' });
      } else {
        throw new Error();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create match.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSettleMatch = async (match: Match, resA: number, resB: number) => {
    setIsSubmitting(true);
    try {
      // Update match status and result
      await supabaseService.updateMatch(match.id, { status: 'closed', resultA: resA, resultB: resB });

      // Find all predictions for this match
      const allPredictions = await supabaseService.getMatchPredictions(match.id);
      
      // Sort by accuracy
      const sortedPredictions = allPredictions.sort((a, b) => {
        const accA = Math.abs(a.scoreA - resA) + Math.abs(a.scoreB - resB);
        const accB = Math.abs(b.scoreA - resA) + Math.abs(b.scoreB - resB);
        return accA - accB;
      });

      const winners = sortedPredictions.slice(0, match.winnerCount);
      const prizePerWinner = Math.floor(match.totalPrize / winners.length);

      // Update predictions and users
      await Promise.all([
        ...allPredictions.map(pred => 
          supabaseService.updatePrediction(pred.id, { status: winners.some(w => w.id === pred.id) ? 'won' : 'lost' })
        ),
        ...winners.map(async (winner) => {
          const userProfile = await supabaseService.getUserProfile(winner.userId);
          const currentBalance = userProfile?.balance || 0;
          return supabaseService.updateUserBalance(winner.userId, currentBalance + prizePerWinner);
        })
      ]);

      setMessage({ type: 'success', text: `Match settled! ${winners.length} winners rewarded.` });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to settle match.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleWithdrawalAction = async (withdrawal: Withdrawal, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      await supabaseService.updateWithdrawal(withdrawal.id, { status });

      if (status === 'approved') {
        const userProfile = await supabaseService.getUserProfile(withdrawal.userId);
        const currentBalance = userProfile?.balance || 0;
        await supabaseService.updateUserBalance(withdrawal.userId, Math.max(0, currentBalance - withdrawal.amount));
      }

      setMessage({ type: 'success', text: `Withdrawal ${status}!` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update withdrawal.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Admin <span className="text-blue-500">Panel</span></h2>
          <p className="text-zinc-500 font-medium">Manajemen pertandingan dan penarikan hadiah.</p>
        </div>
        <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-white/5">
          {(['matches', 'withdrawals', 'users', 'supabase'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 text-blue-500">
                  <Plus className="w-5 h-5" />
                  <h3 className="font-black text-lg text-white">Buat Match</h3>
                </div>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Team A</label>
                      <input
                        type="text"
                        value={newTeamA}
                        onChange={(e) => setNewTeamA(e.target.value)}
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Real Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Logo A (URL)</label>
                      <input
                        type="text"
                        value={newLogoA}
                        onChange={(e) => setNewLogoA(e.target.value)}
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Team B</label>
                      <input
                        type="text"
                        value={newTeamB}
                        onChange={(e) => setNewTeamB(e.target.value)}
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Barcelona"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Logo B (URL)</label>
                      <input
                        type="text"
                        value={newLogoB}
                        onChange={(e) => setNewLogoB(e.target.value)}
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Deadline</label>
                    <input
                      type="datetime-local"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Prize</label>
                      <input
                        type="number"
                        value={newTotalPrize}
                        onChange={(e) => setNewTotalPrize(Number(e.target.value))}
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Winner Count</label>
                      <input
                        type="number"
                        value={newWinnerCount}
                        onChange={(e) => setNewWinnerCount(Number(e.target.value))}
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-blue-500 text-white font-black rounded-xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    Tambah Pertandingan
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white px-2">Daftar Pertandingan</h3>
              <div className="grid grid-cols-1 gap-4">
                {matches.map((match) => (
                  <div key={match.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                        match.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
                      }`}>
                        {match.status}
                      </span>
                      <p className="text-xs text-zinc-500 font-bold">ID: {match.id.slice(0, 8)}</p>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center flex-1 space-y-2">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl mx-auto flex items-center justify-center ring-1 ring-white/5 overflow-hidden">
                          {match.logoA ? (
                            <img src={match.logoA} alt={match.teamA} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xl font-black text-zinc-500">{match.teamA[0]}</span>
                          )}
                        </div>
                        <p className="text-sm font-black text-white truncate">{match.teamA}</p>
                      </div>
                      <div className="text-2xl font-black text-zinc-700 italic">VS</div>
                      <div className="text-center flex-1 space-y-2">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl mx-auto flex items-center justify-center ring-1 ring-white/5 overflow-hidden">
                          {match.logoB ? (
                            <img src={match.logoB} alt={match.teamB} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xl font-black text-zinc-500">{match.teamB[0]}</span>
                          )}
                        </div>
                        <p className="text-sm font-black text-white truncate">{match.teamB}</p>
                      </div>
                    </div>

                    {match.status === 'open' ? (
                      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div className="flex-1 space-y-2">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Hasil Akhir</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              id={`resA-${match.id}`}
                              className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 text-center text-white font-bold outline-none focus:border-blue-500"
                              placeholder="0"
                            />
                            <span className="text-zinc-600">:</span>
                            <input
                              type="number"
                              id={`resB-${match.id}`}
                              className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 text-center text-white font-bold outline-none focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const resA = Number((document.getElementById(`resA-${match.id}`) as HTMLInputElement).value);
                            const resB = Number((document.getElementById(`resB-${match.id}`) as HTMLInputElement).value);
                            handleSettleMatch(match, resA, resB);
                          }}
                          className="px-6 py-3 bg-white text-zinc-950 font-black rounded-xl hover:bg-zinc-200 transition-all mt-6"
                        >
                          Settle
                        </button>
                      </div>
                    ) : (
                      <div className="text-center pt-4 border-t border-white/5">
                        <p className="text-sm font-bold text-zinc-500">Hasil Akhir: <span className="text-white">{match.resultA} - {match.resultB}</span></p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white px-2">Permintaan Penarikan</h3>
            {withdrawals.filter(w => w.status === 'pending').length > 0 ? withdrawals.filter(w => w.status === 'pending').map((w) => {
              const user = users.find(u => u.uid === w.userId);
              return (
                <div key={w.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-zinc-800 rounded-2xl text-blue-500">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">Rp {w.amount.toLocaleString()}</p>
                      <p className="text-sm font-bold text-zinc-500">{user?.username} ({user?.email})</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleWithdrawalAction(w, 'rejected')}
                      className="px-6 py-3 bg-zinc-800 text-red-500 font-black rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" /> Tolak
                    </button>
                    <button
                      onClick={() => handleWithdrawalAction(w, 'approved')}
                      className="px-6 py-3 bg-emerald-500 text-zinc-950 font-black rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" /> Setujui
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-dashed border-white/5">
                <p className="text-zinc-500 font-bold">Tidak ada permintaan penarikan pending.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Saldo</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-zinc-500">
                          {u.username[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.username}</p>
                          <p className="text-xs text-zinc-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        u.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-emerald-500">Rp {u.balance.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <Users className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'supabase' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Supabase <span className="text-emerald-500">Integration</span></h3>
                  <p className="text-zinc-500 text-sm font-medium">Status koneksi dan konfigurasi database Supabase.</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  supabaseStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  supabaseStatus === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-zinc-800 text-zinc-500 border-white/5'
                }`}>
                  {supabaseStatus === 'connected' ? 'Connected' : supabaseStatus === 'error' ? 'Not Configured' : 'Checking...'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-800/50 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white">Environment Variables</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Supabase URL</p>
                      <p className="text-xs font-mono text-zinc-300 truncate">{import.meta.env.VITE_SUPABASE_URL || 'Not Set'}</p>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Supabase Anon Key</p>
                      <p className="text-xs font-mono text-zinc-300 truncate">{import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' : 'Not Set'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white">Quick Start</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Untuk menggunakan Supabase, pastikan Anda telah membuat tabel berikut di dashboard Supabase Anda:
                    <code className="block mt-2 p-3 bg-zinc-900 rounded-lg text-emerald-400 font-mono text-[10px]">
                      users, matches, predictions, withdrawals
                    </code>
                  </p>
                  <button 
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                    className="w-full py-3 bg-emerald-500 text-zinc-950 font-black rounded-xl hover:bg-emerald-400 transition-all text-sm"
                  >
                    Buka Dashboard Supabase
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">SQL Schema (Copy to SQL Editor)</h4>
                <pre className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-[10px] text-zinc-400 font-mono overflow-x-auto">
{`-- 1. Create Tables
create table users (
  uid text primary key,
  username text not null,
  email text not null,
  role text check (role in ('admin', 'user')) default 'user',
  balance bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table matches (
  id uuid default gen_random_uuid() primary key,
  teama text not null,
  logoa text,
  teamb text not null,
  logob text,
  status text check (status in ('open', 'closed')) default 'open',
  resulta int,
  resultb int,
  deadline timestamp with time zone not null,
  totalprize bigint default 50000,
  winnercount int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table predictions (
  id uuid default gen_random_uuid() primary key,
  userid text references users(uid),
  matchid uuid references matches(id),
  scorea int not null,
  scoreb int not null,
  status text check (status in ('pending', 'won', 'lost')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table withdrawals (
  id uuid default gen_random_uuid() primary key,
  userid text references users(uid),
  amount bigint not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table settings (
  id text primary key default 'config',
  webname text not null,
  adminemail text not null,
  adminpassword text,
  isinstalled boolean default true,
  installedat timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable RLS
alter table users enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table withdrawals enable row level security;
alter table settings enable row level security;

-- 3. Create Policies
create policy "Public profiles are viewable by everyone." on users for select using (true);
create policy "Users can update own profile." on users for update using (auth.uid()::text = uid);
create policy "Users can insert own profile." on users for insert with check (auth.uid()::text = uid);

create policy "Matches are viewable by everyone." on matches for select using (true);
create policy "Admins can manage matches." on matches for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

create policy "Users can view own predictions." on predictions for select using (auth.uid()::text = userId);
create policy "Users can insert own predictions." on predictions for insert with check (auth.uid()::text = userId);
create policy "Admins can view all predictions." on predictions for select using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);
create policy "Admins can update predictions." on predictions for update using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

create policy "Users can view own withdrawals." on withdrawals for select using (auth.uid()::text = userId);
create policy "Users can insert own withdrawals." on withdrawals for insert with check (auth.uid()::text = userId);
create policy "Admins can manage withdrawals." on withdrawals for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

create policy "Settings are viewable by everyone." on settings for select using (true);
create policy "Admins can manage settings." on settings for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
