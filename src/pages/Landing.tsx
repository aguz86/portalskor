import React, { useState, useEffect } from 'react';
import { Match, UserProfile, Prediction } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Trophy, Clock, Search, LogIn, UserPlus, Crown, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

interface LandingProps {
  webName: string;
  logoUrl?: string;
  appConfig?: any;
  user?: UserProfile | null;
}

export default function Landing({ webName, logoUrl, appConfig, user }: LandingProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [winnersMap, setWinnersMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allMatches, allPredictions, allUsers] = await Promise.all([
          supabaseService.getAllMatches(),
          supabaseService.getAllPredictions(),
          supabaseService.getAllUsers()
        ]);
        
        let sorted = [...allMatches].sort((a, b) => {
          const aSelesai = a.status === 'closed' && a.resultA !== null && a.resultA !== undefined;
          const aBerjalan = a.status === 'closed' && (a.resultA === null || a.resultA === undefined);
          const aOpen = a.status === 'open';

          const bSelesai = b.status === 'closed' && b.resultA !== null && b.resultA !== undefined;
          const bBerjalan = b.status === 'closed' && (b.resultA === null || b.resultA === undefined);
          const bOpen = b.status === 'open';

          if (aBerjalan && !bBerjalan) return -1;
          if (!aBerjalan && bBerjalan) return 1;

          if (aSelesai && !bSelesai) return -1;
          if (!aSelesai && bSelesai) return 1;

          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        });

        const top10 = sorted.slice(0, 10);
        setMatches(top10);

        const wMap: Record<string, string[]> = {};
        for (const m of top10) {
          const isSelesai = m.status === 'closed' && m.resultA !== null && m.resultA !== undefined;
          if (isSelesai) {
             const wonPreds = allPredictions.filter(p => p.matchId === m.id && p.status === 'won');
             const winnerNames = wonPreds.map(p => {
               const u = allUsers.find(user => user.uid === p.userId);
               return u ? u.username : 'Unknown';
             });
             wMap[m.id] = winnerNames;
          }
        }
        setWinnersMap(wMap);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Public Navbar (only if not logged in, otherwise App handles it) */}
      {!user && (
        <nav className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
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
              
              <div className="flex items-center gap-4">
                <Link
                  to="/user/login"
                  className="px-5 py-2 text-sm text-zinc-300 font-bold hover:text-white transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Masuk
                </Link>
                <Link
                  to="/user/register"
                  className="px-5 py-2 text-sm bg-emerald-500 text-zinc-950 font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Daftar
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6"
          >
            Tebak Skor <span className="text-emerald-500">Akurat!</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Ikuti tebak skor pertandingan seru, kumpulkan poin, dan raih hadiah menarik. Bergabunglah dengan ratusan pemain lainnya di {webName}.
          </motion.p>
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/login?register=true"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 font-black rounded-2xl hover:bg-zinc-200 transition-all text-lg shadow-xl"
              >
                Mulai Bermain Sekarang
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Latest Matches */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
            <Trophy className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Pertandingan Terkini</h2>
            <p className="text-sm text-zinc-500 font-medium">10 Pertandingan terakhir</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-zinc-900/50 rounded-[2rem] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-[2rem] border border-white/5">
            <Trophy className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Belum ada pertandingan tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-sm border border-white/5 rounded-[2rem] p-6 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all group overflow-hidden relative shadow-2xl"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                   <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                    match.status === 'open' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : (match.status === 'closed' && match.resultA !== null && match.resultA !== undefined)
                    ? 'bg-zinc-800 text-zinc-400 border-white/5'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {match.status === 'open' ? 'Terbuka' : (match.status === 'closed' && match.resultA !== null && match.resultA !== undefined) ? 'Selesai' : 'Berjalan'}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-8 mt-4">
                  <div className="text-center space-y-3 flex-1 relative">
                    <div className="w-20 h-20 mx-auto bg-zinc-950 rounded-2xl flex items-center justify-center p-3 border border-white/5 group-hover:scale-110 transition-transform shadow-xl">
                      {match.logoA ? (
                        <img src={match.logoA} alt={match.teamA} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl font-black text-zinc-700">{match.teamA.charAt(0)}</span>
                      )}
                    </div>
                    <p className="font-black text-white px-2 leading-tight">{match.teamA}</p>
                  </div>
                  
                  <div className="px-4 text-center shrink-0">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">VS</span>
                  </div>

                  <div className="text-center space-y-3 flex-1 relative">
                    <div className="w-20 h-20 mx-auto bg-zinc-950 rounded-2xl flex items-center justify-center p-3 border border-white/5 group-hover:scale-110 transition-transform shadow-xl">
                      {match.logoB ? (
                        <img src={match.logoB} alt={match.teamB} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl font-black text-zinc-700">{match.teamB.charAt(0)}</span>
                      )}
                    </div>
                    <p className="font-black text-white px-2 leading-tight">{match.teamB}</p>
                  </div>
                </div>

                {match.status === 'closed' && match.resultA !== null && match.resultA !== undefined && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950/90 py-2 px-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md text-center">
                    <p className="text-3xl font-black tracking-widest text-emerald-400">
                      {match.resultA} - {match.resultB}
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                      <Trophy className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Hadiah</p>
                      <p className="text-sm font-bold text-white">Rp {match.totalPrize.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Waktu Kick-off</p>
                      <p className="text-sm font-bold text-white truncate">{new Date(match.deadline).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {match.status === 'closed' && match.resultA !== null && match.resultA !== undefined && winnersMap[match.id] && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                       <Crown className="w-4 h-4 text-amber-500" />
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pemenang Diumumkan</span>
                    </div>
                    {winnersMap[match.id].length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {winnersMap[match.id].map((winner, idx) => (
                           <span key={idx} className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-md text-xs font-bold border border-amber-500/20">{winner}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 font-medium italic">Tidak ada pemenang</p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-4">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-zinc-500 font-medium">Masih bingung? Temukan jawabannya di sini.</p>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "Bagaimana cara ikut menebak skor?",
              a: "Anda harus mendaftar dan masuk ke akun Anda. Setelah itu, pilih pertandingan yang statusnya 'Terbuka' dan masukkan tebakan skor Anda sebelum waktu kick-off.",
            },
            {
              q: "Apakah berbayar untuk ikut bermain?",
              a: "Tidak, pendaftaran dan partisipasi dalam tebak skor di Portal Skor sepenuhnya gratis.",
            },
            {
              q: "Bagaimana cara mencairkan hadiah?",
              a: "Jika tebakan Anda akurat, Anda akan mendapatkan saldo hadiah. Anda dapat menarik saldo tersebut ke dompet digital (wallet) Anda melalui menu dasbor dengan memasukkan kode OTP yang dikirim ke email.",
            },
            {
              q: "Siapa yang menang jika tebakan benar ada banyak?",
              a: "Hadiah akan dibagi rata kepada seluruh penebak yang benar. Jika tidak ada yang benar-benar akurat, maka tidak ada pemenang yang diundi (atau sesuai kebijakan admin).",
            }
          ].map((faq, idx) => (
            <details key={idx} className="group bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden px-6 py-4 cursor-pointer hover:border-emerald-500/30 transition-colors">
              <summary className="flex justify-between items-center font-bold text-white outline-none">
                {faq.q}
                <ChevronDown className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-zinc-400 font-medium leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      {appConfig?.bannerImageUrl && appConfig?.bannerLinkUrl && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
          <a href={appConfig.bannerLinkUrl} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors group">
            <img src={appConfig.bannerImageUrl} alt="Promosi" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
          </a>
        </section>
      )}
    </div>
  );
}
