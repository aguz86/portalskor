/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Circle, BellDot, BellOff, Clock, Activity, BarChart3, Timer, Volume2, VolumeX, CalendarDays, Edit2, X, CalendarPlus, Settings, PieChart as PieChartIcon, ListTodo, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useSchedule, playAlarmSound, speakText } from './hooks/useSchedule';
import { cn } from './lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useEffect, useRef, useState } from 'react';
import { addDays, format, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import { getScheduleForDate, ScheduleItem } from './data/schedule';
import { AuthMenu } from './components/AuthMenu';
import { EditTaskModal } from './components/EditTaskModal';
import { AddActivityModal } from './components/AddActivityModal';
import { MotivationalNote } from './components/MotivationalNote';
import { downloadICS } from './utils/icsExport';
import { useGoogleLogin } from '@react-oauth/google';
import { exportToGoogleTasks } from './utils/googleTasks';

const formatRemainingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const sStr = s.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    
    if (h > 0) return `${h}:${mStr}:${sStr}`;
    return `${mStr}:${sStr}`;
};

export default function App() {
  const {
    currentDateStr,
    todaySchedule,
    progress,
    activeItemId,
    remainingSeconds,
    toggleTask,
    isAudioEnabled,
    setIsAudioEnabled,
    volume,
    setVolume,
    ttsSettings,
    updateTtsSettings,
    weeklyStats,
    getCurrentWeekAnalytics,
    getResolvedSchedule,
    updateScheduleItem,
    deleteScheduleItem,
    addScheduleItem,
    user
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'analytics'>('today');
  const [selectedUpcomingDate, setSelectedUpcomingDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [editingTask, setEditingTask] = useState<{ item: ScheduleItem, index: number, dateStr: string } | null>(null);
  const [isAddingTaskForDate, setIsAddingTaskForDate] = useState<string | null>(null);
  const [showActivePopup, setShowActivePopup] = useState(true);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [firebaseProxy, setFirebaseProxy] = useState(localStorage.getItem('firebase_auth_proxy') || '');
  const [notification, setNotification] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const googleTasksLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsExporting(true);
      showNotification('Mengekspor jadwal ke Google Tasks...');
      try {
        const scheduleToExport = activeTab === 'today' ? todaySchedule : getResolvedSchedule(selectedUpcomingDate);
        const dateToExport = activeTab === 'today' ? currentDateStr : selectedUpcomingDate;
        
        const { successCount, errorCount } = await exportToGoogleTasks(tokenResponse.access_token, scheduleToExport, dateToExport);
        if (errorCount > 0) {
          showNotification(`Berhasil mengekspor ${successCount} tugas. ${errorCount} gagal.`);
        } else {
          showNotification(`Berhasil mengekspor ${successCount} tugas ke Google Tasks!`);
        }
      } catch (err) {
        showNotification('Gagal mengekspor jadwal.');
      } finally {
        setIsExporting(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/tasks',
  });

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const activeItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenPermissionGuide');
    if (!hasSeenGuide) {
      setTimeout(() => setShowPermissionGuide(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (activeItemRef.current && activeTab === 'today') {
        activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeItemId, activeTab]);

  useEffect(() => {
    if (activeItemId) {
      setShowActivePopup(true);
    }
  }, [activeItemId]);

  const activeItemIndex = todaySchedule.findIndex(i => i.id === activeItemId);
  const activeItem = activeItemIndex >= 0 ? todaySchedule[activeItemIndex] : null;

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestWakeLock();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => { wakeLock = null; });
      }
    };
  }, []);

  const handleDownloadApp = async () => {
      if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          const { outcome } = await window.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
              window.deferredPrompt = null;
          }
      } else {
          alert("Untuk menginstall app ini, silakan gunakan fitur 'Add to Home Screen' atau 'Install App' di menu browser Anda (biasanya terletak di titik tiga pojok kanan atas atau icon share di iOS). Pada beberapa browser tertentu, Anda mungkin juga perlu memastikan telah menerima cookie.");
      }
  };

  const weekPieData = getCurrentWeekAnalytics();
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100 selection:text-red-900 flex flex-col overflow-x-hidden">
      <header className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 text-white py-4 px-6 sticky top-0 z-50 shadow-lg border-b border-black/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <Activity className="w-6 h-6 animate-pulse" />
             <h1 className="text-xl font-extrabold tracking-tight drop-shadow-sm">GROW UP | Habit Changer</h1>
          </div>
          
          <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <button 
              onClick={() => {
                  if (!isAudioEnabled) {
                      playAlarmSound(volume); // initial test chime
                      setTimeout(() => {
                         speakText("Sistem alarm pengingat stasiun telah diaktifkan.", volume);
                      }, 3500);
                  }
                  setIsAudioEnabled(!isAudioEnabled);
              }}
              className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm",
                  isAudioEnabled 
                      ? "bg-white text-emerald-700 hover:bg-gray-100" 
                      : "bg-red-500 text-white hover:bg-red-400"
              )}
            >
              {isAudioEnabled ? <BellDot className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {isAudioEnabled ? "Alarm On" : "Alarm Off"}
            </button>
            
            <div className="flex items-center gap-2 px-3 text-white">
                {volume === 0 ? <VolumeX className="w-4 h-4 opacity-75" /> : <Volume2 className="w-4 h-4 opacity-75" />}
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={volume}
                  onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                  }}
                  className="hidden sm:block w-20 accent-emerald-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                />
            </div>
            
            <button
               onClick={() => setShowSettingsModal(true)}
               className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white ml-2 flex-shrink-0"
               title="Pengaturan Alarm & Notifikasi"
            >
               <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <AuthMenu />
        </div>
        
        <MotivationalNote />

        {/* Navigation / Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 border-b border-white/20 pb-px mt-4">
            <button
              onClick={() => setActiveTab('today')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors font-medium text-xs sm:text-sm rounded-t-lg",
                activeTab === 'today' 
                  ? "bg-white border-white text-emerald-700" 
                  : "border-transparent text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20"
              )}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              Hari Ini
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors font-medium text-xs sm:text-sm rounded-t-lg",
                activeTab === 'upcoming' 
                  ? "bg-white border-white text-emerald-700" 
                  : "border-transparent text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              6 Hari Kedepan
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors font-medium text-xs sm:text-sm rounded-t-lg",
                activeTab === 'analytics' 
                  ? "bg-white border-white text-emerald-700" 
                  : "border-transparent text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20"
              )}
            >
              <PieChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">Analisis Waktu</span>
              <span className="xs:hidden">Analisis</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Timeline */}
            <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex flex-col gap-1">
                     <h2 className="text-lg font-semibold flex items-center gap-2">
                         <Clock className="w-5 h-5 text-[#c0392b]" />
                         Jadwal Hari Ini <span className="text-gray-400 text-sm font-normal">({currentDateStr})</span>
                     </h2>
                     <div className="flex flex-col gap-2">
                         <div className="flex flex-wrap gap-2">
                             <button
                                onClick={() => downloadICS(todaySchedule, currentDateStr)}
                                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-full transition-colors w-fit border border-emerald-200"
                             >
                               <CalendarPlus className="w-3.5 h-3.5" />
                               Sinkronkan Alarm
                             </button>
                             <button
                                onClick={() => googleTasksLogin()}
                                disabled={isExporting}
                                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-full transition-colors w-fit border border-blue-200 disabled:opacity-50"
                             >
                               <ListTodo className="w-3.5 h-3.5" />
                               {isExporting ? 'Mengekspor...' : 'Ekspor ke Google Tasks'}
                             </button>
                             <button
                                onClick={() => setIsAddingTaskForDate(currentDateStr)}
                                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-1.5 px-3 rounded-full transition-colors w-fit shadow-sm"
                             >
                               <CalendarPlus className="w-3.5 h-3.5" />
                               Tambah Aktivitas
                             </button>
                         </div>
                     </div>
                   </div>
                   <div className="text-sm px-3 py-1 bg-gray-100 rounded-full font-medium text-gray-600 shrink-0">
                       {Object.keys(progress).filter(k => progress[k]).length} / {todaySchedule.length} Selesai
                   </div>
                </div>

                <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {todaySchedule.map((item) => {
                      const isActive = item.id === activeItemId;
                      const isCompleted = !!progress[item.id];

                      return (
                        <div 
                          key={item.id} 
                          ref={isActive ? activeItemRef : null}
                          className={cn(
                            "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300",
                            isActive ? "opacity-100 scale-[1.02]" : "opacity-80 hover:opacity-100"
                          )}
                        >
                            {/* Marker */}
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2",
                              isActive ? "bg-emerald-500 border-emerald-100 z-10 animate-pulse" : 
                              isCompleted ? "bg-emerald-500 border-white z-10" : "bg-white border-gray-200 z-10"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-white" : "bg-transparent")} />}
                            </div>

                            {/* Card */}
                            <div className={cn(
                                "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border transition-all cursor-pointer shadow-sm",
                                isActive ? "bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500" : isCompleted ? "bg-white border-emerald-500" : "bg-white border-gray-100/50 hover:border-gray-300"
                            )}
                                  onClick={() => toggleTask(item.id)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                  <span className={cn(
                                    "font-mono text-xs font-semibold px-2 py-1 rounded",
                                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                  )}>{item.start} - {item.end}</span>
                                  <div className="flex items-center gap-2">
                                      {user && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingTask({ item, index: todaySchedule.indexOf(item), dateStr: currentDateStr }); }}
                                            className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                                          >
                                              <Edit2 className="w-3 h-3" />
                                          </button>
                                      )}
                                      <span className="text-xs font-medium text-gray-400">{item.duration}m</span>
                                  </div>
                                </div>
                                <h3 className={cn(
                                    "font-semibold text-sm sm:text-base mt-2",
                                    item.isBreak ? "text-[#c0392b]" : "text-gray-900",
                                    isActive && "text-emerald-800",
                                    isCompleted && "line-through text-gray-400"
                                )}>{item.activity}</h3>
                                <p className="text-sm font-bold text-gray-500 mt-1 line-clamp-2">{item.notes}</p>
                            </div>
                        </div>
                      )
                  })}
                </div>
            </div>
        </div>

        {/* Right Column: Status & Charts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Active Status Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Status Saat Ini</h2>
                
                {activeItem ? (
                    <div className={cn(
                        "p-5 rounded-xl border-l-4 transition-colors",
                        activeItem.isBreak 
                          ? "bg-red-50 border-[#c0392b]"
                          : "bg-green-50 border-green-500"
                    )}>
                        <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                             Sedang Berlangsung {activeItem.isBreak ? "(Jeda)" : ""}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{activeItem.activity}</h3>
                        <p className="font-bold text-gray-600 text-sm mb-4">{activeItem.notes}</p>
                        
                        {remainingSeconds !== null && (
                            <div className={cn(
                                "my-4 p-5 rounded-2xl border-2 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group transition-colors",
                                activeItem.isBreak 
                                  ? "bg-gradient-to-br from-red-50 to-[#c0392b]/10 border-[#c0392b]/20"
                                  : "bg-gradient-to-br from-green-50 to-green-500/10 border-green-500/20"
                            )}>
                                <div className={cn(
                                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                  activeItem.isBreak 
                                      ? "bg-[#c0392b]/5"
                                      : "bg-green-500/5"
                                )}></div>
                                <div className={cn(
                                    "flex items-center gap-2 text-xs font-bold tracking-widest mb-2 uppercase transition-colors",
                                    activeItem.isBreak 
                                      ? "text-[#c0392b]/80"
                                      : "text-green-600/80"
                                )}>
                                    <Timer className="w-4 h-4 animate-pulse" />
                                    <span>Waktu Tersisa</span>
                                </div>
                                <div className={cn(
                                    "text-5xl md:text-6xl font-mono font-extrabold tracking-tighter drop-shadow-sm transition-colors",
                                    activeItem.isBreak 
                                      ? "text-[#c0392b]"
                                      : "text-green-600"
                                )}>
                                    {formatRemainingTime(remainingSeconds)}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-black/5 mt-2">
                             <Clock className="w-4 h-4 text-gray-400" />
                             <span className="font-mono text-sm font-medium">{activeItem.start} - {activeItem.end} ({activeItem.duration}m)</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 text-center">
                        <p className="text-gray-500 text-sm">Tidak ada jadwal yang aktif saat ini.</p>
                    </div>
                )}

                <div className="mt-8">
                     <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-gray-500" />
                        Pencapaian Mingguan
                     </h2>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip 
                                  cursor={{fill: '#f9fafb'}}
                                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                                  {weeklyStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.date === currentDateStr ? '#10b981' : '#6366f1'} />
                                  ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
          </div>
        </div>
        )}
        
        {activeTab === 'upcoming' && (
          <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                        <CalendarPlus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Tetap Dapat Notifikasi Meskipun Web Ditutup!</h3>
                        <p className="text-sm text-gray-600 mt-1">Pilih tanggal di bawah ini, lalu klik kartu jadwal pada hari tersebut untuk men-download file Kalender (.ics). Sinkronkan dengan <b>Google Calendar / Kalender iPhone</b> Anda agar alarm berbunyi 100% tanpa jaringan internet dan saat app ditutup.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
                {Array.from({ length: 6 }).map((_, i) => {
                    const targetDate = addDays(new Date(), i + 1);
                    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
                    const dayName = format(targetDate, 'EEEE', { locale: id });
                    const isSelected = selectedUpcomingDate === targetDateStr;
                    
                    return (
                        <button
                            key={targetDateStr}
                            onClick={() => setSelectedUpcomingDate(targetDateStr)}
                            className={cn(
                                "w-full flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl border transition-all",
                                isSelected 
                                    ? "bg-indigo-500 text-white border-indigo-600 shadow-md transform sm:scale-105" 
                                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-1"
                            )}
                        >
                            <span className="text-xs sm:text-sm font-semibold">{dayName}</span>
                            <span className="text-xl sm:text-2xl font-bold mt-1">{format(targetDate, 'dd')}</span>
                            <span className={cn("text-[10px] sm:text-xs mt-1 text-center", isSelected ? "text-indigo-100" : "text-gray-500")}>{format(targetDate, 'MMM yyyy', { locale: id })}</span>
                        </button>
                    )
                })}
            </div>

            {(() => {
                const targetDate = new Date(selectedUpcomingDate);
                const dayName = format(targetDate, 'EEEE', { locale: id });
                const schedule = getResolvedSchedule(targetDate);
                return (
                    <div className="bg-indigo-50/50 rounded-2xl p-6 shadow-md border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-indigo-100 pb-4">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-indigo-900">{dayName}, <span className="font-medium text-indigo-500">{selectedUpcomingDate}</span></h2>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                <button
                                    onClick={() => downloadICS(schedule, selectedUpcomingDate)}
                                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-white bg-indigo-100 hover:bg-indigo-600 py-2 px-4 rounded-full transition-all w-full sm:w-auto shadow-sm"
                                >
                                    <CalendarPlus className="w-4 h-4" />
                                    Sinkronkan
                                </button>
                                <button
                                    onClick={() => googleTasksLogin()}
                                    disabled={isExporting}
                                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-white bg-blue-100 hover:bg-blue-600 py-2 px-4 rounded-full transition-all w-full sm:w-auto shadow-sm disabled:opacity-50"
                                >
                                    <ListTodo className="w-4 h-4" />
                                    {isExporting ? 'Mengekspor...' : 'Ekspor ke Google Tasks'}
                                </button>
                                <button
                                    onClick={() => setIsAddingTaskForDate(selectedUpcomingDate)}
                                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-full transition-all w-full sm:w-auto shadow-sm"
                                >
                                    <CalendarPlus className="w-4 h-4" />
                                    Tambah Aktivitas
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schedule.map((item, index) => (
                                <div key={index} className={cn(
                                    "p-4 rounded-xl border transition-colors hover:shadow-sm group",
                                    item.isBreak ? "bg-white/50 border-red-100 hover:border-red-200" : "bg-white border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/80"
                                )}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={cn(
                                            "font-mono text-xs font-bold px-2 py-1 rounded shadow-sm",
                                            item.isBreak ? "bg-red-100 text-[#c0392b]" : "bg-white border text-gray-700"
                                        )}>{item.start} - {item.end}</span>
                                        <div className="flex items-center gap-2">
                                            {user && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingTask({ item, index, dateStr: selectedUpcomingDate }); }}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-1 rounded-full",
                                                item.isBreak ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-600"
                                            )}>{item.duration}m</span>
                                        </div>
                                    </div>
                                    <h3 className={cn(
                                        "font-bold text-sm",
                                        item.isBreak ? "text-[#c0392b]" : "text-gray-900 group-hover:text-emerald-800 transition-colors"
                                    )}>{item.activity}</h3>
                                    <p className={cn(
                                        "text-sm font-bold mt-2 line-clamp-2 leading-relaxed transition-colors",
                                        item.isBreak ? "text-red-700/70" : "text-gray-500 group-hover:text-gray-700"
                                    )}>{item.notes}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
          </div>
        )}

        {activeTab === 'analytics' && (() => {
          const totalMinutes = weekPieData.reduce((acc, curr) => acc + curr.value, 0);
          const totalHours = Math.floor(totalMinutes / 60);
          const remainingMins = totalMinutes % 60;
          const totalDurationStr = totalHours > 0 
            ? `${totalHours}j${remainingMins > 0 ? ` ${remainingMins}m` : ''}` 
            : `${remainingMins}m`;

          return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="flex flex-col items-center gap-2 mb-6 text-center focus:outline-none">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <BarChart3 className="w-6 h-6 text-emerald-600 animate-pulse" />
                  Alokasi Waktu (Minggu Ini)
                </h2>
                <p className="text-sm text-gray-500">Mulai Senin hingga Hari Ini.</p>
                {weekPieData.length > 0 && (
                  <div className="mt-4 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm">
                    <span className="text-emerald-800 font-semibold text-sm">Total Waktu: <span className="font-bold">{totalDurationStr}</span></span>
                  </div>
                )}
                {weekPieData.length === 0 && <p className="text-sm text-red-500 mt-2 font-medium">Belum ada data jadwal.</p>}
              </div>

              {weekPieData.length > 0 && (
                <>
                  {/* Category Details & Progression List (No-click detailed view matching the reference design) */}
                  <div className="w-full max-w-xl mt-6 bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-gray-800" />
                        <span className="font-bold text-gray-800 text-sm sm:text-base">{weekPieData.length} Kategori</span>
                      </div>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full">
                        Terbanyak
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {weekPieData.map((item, index) => {
                        const percentage = ((item.value / totalMinutes) * 100).toFixed(1);
                        const hours = Math.floor(item.value / 60);
                        const mins = item.value % 60;
                        const formattedDuration = hours > 0 ? `${hours}j ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                        return (
                          <div key={index} className="flex flex-col gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Alokasi Maks</span>
                                  <span className="font-bold bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1.5 rounded-md border border-emerald-100/50 shadow-sm min-w-[4.5rem] text-center">
                                    {formattedDuration}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-800 text-sm sm:text-base tracking-tight mb-0.5">
                                    {item.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] sm:text-xs text-gray-500 font-medium">{percentage}% dari total waktu</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              </div>
                            </div>
                            {/* Underline colored progress bar matching the slice color */}
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: item.color
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </main>

      {editingTask && (
        <EditTaskModal 
          isOpen={true}
          item={editingTask.item}
          onClose={() => setEditingTask(null)}
          onSave={async (updated, applyMode) => {
            await updateScheduleItem(editingTask.dateStr, editingTask.index, updated, applyMode);
            setEditingTask(null);
            showNotification("Tugas berhasil disimpan!");
          }}
          onDelete={async (applyMode) => {
            await deleteScheduleItem(editingTask.dateStr, editingTask.index, applyMode);
            setEditingTask(null);
            showNotification("Tugas berhasil dihapus!");
          }}
        />
      )}

      {isAddingTaskForDate && (
        <AddActivityModal
          isOpen={true}
          onClose={() => setIsAddingTaskForDate(null)}
          onSave={async (newItem) => {
            const currentWeekAnalytics = getCurrentWeekAnalytics();
            const totalScheduledMinutes = currentWeekAnalytics.reduce((sum, curr) => 
                curr.name !== 'Waktu Kosong (Tak Terjadwal)' ? sum + curr.value : sum, 0);
            
            const maxWeeklyMinutes = 168 * 60; // 10080
            
            if (totalScheduledMinutes + newItem.duration > maxWeeklyMinutes) {
                alert(`Gagal menambah aktivitas: Total jadwal Anda dalam seminggu melebihi 168 jam (Anda sudah memiliki ${Math.floor(totalScheduledMinutes / 60)} jam ${totalScheduledMinutes % 60} menit). Silakan kurangi durasi aktivitas lain terlebih dahulu.`);
                return;
            }

            await addScheduleItem(isAddingTaskForDate, newItem);
            setIsAddingTaskForDate(null);
            showNotification("Tugas berhasil ditambahkan!");
          }}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            {notification}
          </div>
        </div>
      )}

      {/* Floating Active Item Popup */}
      {activeItem && showActivePopup && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[28rem] lg:w-[40rem] xl:w-[50rem] bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
            <button 
                onClick={() => setShowActivePopup(false)} 
                className="absolute top-4 right-4 md:top-4 md:right-4 text-gray-500 hover:text-white bg-white hover:bg-red-500 shadow-md border border-gray-200 hover:border-red-500 rounded-full p-4 md:p-3 z-10 transition-all active:scale-95 group"
                aria-label="Tutup popup"
            >
                <X className="w-8 h-8 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className={cn(
                "p-8 sm:p-10 md:p-8 lg:p-12 border-l-8 md:border-l-8",
                activeItem.isBreak 
                    ? "border-[#c0392b] bg-red-50/50"
                    : "border-emerald-500 bg-emerald-50/50"
            )}>
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-4 pr-20 md:pr-0">
                    <Activity className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-10 lg:h-10 animate-pulse shrink-0",
                        activeItem.isBreak 
                            ? "text-[#c0392b]"
                            : "text-emerald-600"
                    )} />
                    <span className="text-2xl sm:text-3xl md:text-xl lg:text-3xl font-bold uppercase tracking-wider text-gray-500 leading-tight">
                        Sedang Berlangsung {activeItem.isBreak ? "(Jeda)" : ""}
                    </span>
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-3 pr-2 md:pr-6 text-4xl sm:text-5xl md:text-4xl lg:text-6xl leading-tight md:leading-tight lg:leading-tight mb-4 md:mb-0">{activeItem.activity}</h3>
                
                {remainingSeconds !== null && (
                    <div className="mt-6 md:mt-8 lg:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-2xl sm:text-3xl md:text-xl lg:text-3xl text-gray-500 font-medium flex items-center gap-2 md:gap-2">
                            <Timer className="w-8 h-8 sm:w-10 sm:h-10 md:w-6 md:h-6 lg:w-8 lg:h-8" /> Sisa Waktu:
                        </div>
                        <div className={cn(
                            "font-mono font-bold text-[5rem] sm:text-[6rem] md:text-6xl lg:text-8xl xl:text-[8rem] tracking-tighter drop-shadow-sm leading-none",
                            activeItem.isBreak 
                                ? "text-[#c0392b]"
                                : "text-emerald-700"
                        )}>
                            {formatRemainingTime(remainingSeconds)}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Permission Guide Popup */}
      {showPermissionGuide && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <button 
                  onClick={() => setShowPermissionGuide(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shrink-0">
                    <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 shrink-0">Panduan Penggunaan</h2>
                <div className="text-sm text-gray-600 space-y-4 mb-6 overflow-y-auto pr-2 flex-grow">
                    <p>Agar alarm peringatan (suara & pop-up) dapat berjalan otomatis, pilih salah satu dari 2 metode berikut:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li>
                            <strong>Metode 1: Biarkan Tab Terbuka (Suara Kustom & Suara Bicara)</strong><br/>
                            Aplikasi web tidak dapat membunyikan suara khusus jika Anda menutup tab. Pastikan <b>tab tetap terbuka di latar belakang</b>, tombol <b>Audio ON</b> aktif, dan Izinkan Notifikasi jika Anda ingin mendengar peringatan dengan suara wanita yang berbicara.
                        </li>
                        <li>
                            <strong>Metode 2: Alarm Meskipun Web Ditutup (Rekomendasi)</strong><br/>
                            Klik tombol <b><span className="text-emerald-600 bg-emerald-50 px-1 rounded inline-flex items-center gap-1 border border-emerald-200"><CalendarPlus className="w-3 h-3"/> Sinkronkan Alarm ke Kalender HP</span></b>. Alarm akan otomatis masuk ke Aplikasi Kalender HP Anda, dijamin berbunyi 100% meskipun web ditutup. <i>Catatan: Suara alarm ini akan menggunakan suara notifikasi standar bawaan HP Anda.</i>
                        </li>
                    </ul>
                    <p className="text-xs bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-200 leading-relaxed font-medium">
                        *Catatan: Sistem Android / iOS otomatis "membunuh" aplikasi web di latar belakang demi menghemat baterai. Metode Export Kalender (Metode 2) sangat direkomendasikan agar jadwal tetap aman!
                    </p>
                </div>
                <button 
                  onClick={() => setShowPermissionGuide(false)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95 shrink-0"
                >
                    Mengerti & Lanjutkan
                </button>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Settings className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Pengaturan</h2>
                </div>
                
                <div className="overflow-y-auto flex-grow pr-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Teks Notifikasi Saat Sesi Dimulai</h3>
                        <p className="text-xs text-gray-500 mb-2">Gunakan <code>{`{{activity}}`}</code> untuk nama aktivitas, dan <code>{`{{duration}}`}</code> untuk durasi (menit).</p>
                        <textarea 
                            className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors"
                            rows={3}
                            value={ttsSettings.start}
                            onChange={(e) => updateTtsSettings('start', e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Teks Notifikasi Pertengahan Sesi</h3>
                        <p className="text-xs text-gray-500 mb-2">Gunakan <code>{`{{activity}}`}</code> untuk nama aktivitas.</p>
                        <textarea 
                            className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors"
                            rows={3}
                            value={ttsSettings.half}
                            onChange={(e) => updateTtsSettings('half', e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Teks Notifikasi Sesi Akan Berakhir</h3>
                        <p className="text-xs text-gray-500 mb-2">Gunakan <code>{`{{activity}}`}</code> untuk nama aktivitas, dan <code>{`{{nextActivity}}`}</code> untuk nama aktivitas selanjutnya.</p>
                        <textarea 
                            className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors"
                            rows={3}
                            value={ttsSettings.end}
                            onChange={(e) => updateTtsSettings('end', e.target.value)}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Firebase Auth Proxy Domain</h3>
                        <p className="text-xs text-gray-500 mb-2">Jika Anda mengalami error <code>auth/unauthorized-domain</code>, masukkan full URL proxy Cloudflare Worker Anda di sini (misal: <code>auth-proxy.username.workers.dev</code> tanpa protokol https). Halaman perlu direfresh setelah diubah.</p>
                        <input
                            type="text"
                            placeholder="auth-proxy.username.workers.dev"
                            className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors"
                            value={firebaseProxy}
                            onChange={(e) => setFirebaseProxy(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="pt-4 mt-2 border-t border-gray-100 shrink-0 flex gap-3">
                    <button 
                      onClick={() => {
                        const currentVal = localStorage.getItem('firebase_auth_proxy') || "";
                        if (currentVal !== firebaseProxy) {
                            if (firebaseProxy.trim() === "") {
                                localStorage.removeItem('firebase_auth_proxy');
                            } else {
                                // Clean up URL (remove https://, etc)
                                let cleaned = firebaseProxy.trim();
                                cleaned = cleaned.replace(/^https?:\/\//, '');
                                cleaned = cleaned.replace(/\/$/, '');
                                localStorage.setItem('firebase_auth_proxy', cleaned);
                            }
                            window.location.reload();
                        } else {
                            setShowSettingsModal(false);
                        }
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95"
                    >
                        Tutup & Simpan
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Scroll Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button 
          onClick={scrollToTop}
          className="p-3 bg-white hover:bg-gray-50 text-emerald-600 border border-emerald-100 rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          aria-label="Scroll to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button 
          onClick={scrollToBottom}
          className="p-3 bg-white hover:bg-gray-50 text-emerald-600 border border-emerald-100 rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          aria-label="Scroll to Bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-8 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <p>&copy; {new Date().getFullYear()} GROW UP | Habit Changer. All rights reserved.</p>
          <div className="flex gap-4 text-sm mt-2">
            <a href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
          </div>
          <button 
            onClick={handleDownloadApp}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium transition-colors shadow-sm text-sm"
          >
            Download Web App
          </button>
        </div>
      </footer>
    </div>
  );
}
