import { useState, useEffect, useRef } from 'react';
import { format, parse, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { getScheduleForDate, ScheduleItem } from '../data/schedule';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export type DailyProgress = Record<string, boolean>; // id -> checked state

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Trigger loading voices
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export const playAlarmSound = (volume: number = 0.8) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();

  const playNote = (freq: number, time: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Smooth chime sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + time);
    gain.gain.linearRampToValueAtTime(0.6 * volume, ctx.currentTime + time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01 * volume, ctx.currentTime + time + duration - 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + duration);
  };

  // Nada bel stasiun kereta api Indonesia (Westminster Quarters G, C, D, G)
  // Atau lebih dikenal dengan E5, C5, D5, G4
  playNote(659.25, 0, 0.8); // E5
  playNote(523.25, 0.8, 0.8); // C5
  playNote(587.33, 1.6, 0.8); // D5
  playNote(392.00, 2.4, 1.8); // G4
};

export const sendLocalNotification = (title: string, body: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: '/icon.jpg',
          badge: '/icon.jpg',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        } as any);
      });
    } else {
      // Fallback for desktop/contexts without SW
      new Notification(title, { body, icon: '/icon.jpg', requireInteraction: true } as any);
    }
  }
};

export const speakText = (text: string, volume: number = 0.8) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // stop any current speech
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.pitch = 1.3; // Pitch sedikit ditinggikan untuk kesan suara perempuan / announcer
  utterance.rate = 0.85; // Dibuat sedikit lambat agar seperti pengumuman stasiun
  utterance.volume = volume;
  
  const voices = window.speechSynthesis.getVoices();
  const idVoices = voices.filter(v => v.lang === 'id-ID' || v.lang === 'id_ID');
  
  // Mencari suara perempuan (Damayanti, Gadis, atau Google yang biasanya perempuan)
  let targetVoice = idVoices.find(v => 
    v.name.toLowerCase().includes('female') || 
    v.name.toLowerCase().includes('gadis') || 
    v.name.toLowerCase().includes('damayanti') ||
    v.name.includes('Google')
  );

  if (!targetVoice && idVoices.length > 0) {
      targetVoice = idVoices[0]; // fallback ke suara Indonesia pertama yang ada
  }
  
  if (targetVoice) utterance.voice = targetVoice;
  
  window.speechSynthesis.speak(utterance);
};

export function useSchedule() {
  const [currentDateStr, setCurrentDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [progress, setProgress] = useState<DailyProgress>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [ttsSettings, setTtsSettings] = useState({
      start: localStorage.getItem('tts_start') || 'Sesi {{activity}} telah dimulai. Durasi sesi ini adalah {{duration}} menit. Mari tetap disiplin dan fokus.',
      half: localStorage.getItem('tts_half') || 'Perhatian. Anda sudah berada di pertengahan sesi {{activity}}.',
      end: localStorage.getItem('tts_end') || 'Satu menit lagi sesi ini berakhir. Selanjutnya adalah waktunya {{nextActivity}}.'
  });
  
  const updateTtsSettings = (key: 'start' | 'half' | 'end', value: string) => {
      setTtsSettings(prev => {
          const next = { ...prev, [key]: value };
          localStorage.setItem(`tts_${key}`, value);
          return next;
      });
  };

  const [lastSpeechId, setLastSpeechId] = useState<string | null>(null);
  const previousItemRef = useRef<string | null>(null);

  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged(setUser);
  }, []);

  // Background Audio Hack to keep service alive
  useEffect(() => {
    const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    let backgroundAudio = (window as any)._globalSilentAudio;
    
    if (!backgroundAudio) {
        backgroundAudio = new Audio(silentWav);
        backgroundAudio.loop = true;
        (window as any)._globalSilentAudio = backgroundAudio;
    }

    const unlockAudio = () => {
        if (isAudioEnabled && backgroundAudio.paused) {
            backgroundAudio.play().then(() => {
                // Set Media Session metadata to pretend we are an audio player
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 'V3 Progress Tracker',
                        artist: 'Background Alarm Service',
                        album: 'Jaga aplikasi tetap berjalan',
                        artwork: [
                            { src: '/icon.jpg', sizes: '192x192', type: 'image/jpeg' },
                            { src: '/icon.jpg', sizes: '512x512', type: 'image/jpeg' }
                        ]
                    });
                    
                    // Add dummy media session handlers to ensure OS treats it as active media
                    navigator.mediaSession.setActionHandler('play', () => {
                        backgroundAudio.play();
                    });
                    navigator.mediaSession.setActionHandler('pause', () => {
                        // we don't want to pause, but we need to register it
                    });
                }
            }).catch(() => {});
        }
    };

    if (isAudioEnabled) {
        backgroundAudio.play().then(() => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'V3 Progress Tracker',
                    artist: 'Background Alarm Service',
                    album: 'Jaga aplikasi tetap berjalan',
                    artwork: [
                        { src: '/icon.jpg', sizes: '192x192', type: 'image/jpeg' },
                        { src: '/icon.jpg', sizes: '512x512', type: 'image/jpeg' }
                    ]
                });
                navigator.mediaSession.setActionHandler('play', () => { backgroundAudio.play(); });
                navigator.mediaSession.setActionHandler('pause', () => {});
            }
        }).catch(() => {
            // If autoplay policy blocks it, wait for user interaction:
            document.addEventListener('click', unlockAudio, { once: true });
            document.addEventListener('touchstart', unlockAudio, { once: true });
        });
    } else {
        backgroundAudio.pause();
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    }
    
    return () => {
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    }
  }, [isAudioEnabled]);

  // Load progress on mount or date change
  useEffect(() => {
    const key = user ? `productivity_${user.uid}_${currentDateStr}` : `productivity_${currentDateStr}`;
    const todayProgressStr = localStorage.getItem(key);
    if (todayProgressStr) {
      try {
        setProgress(JSON.parse(todayProgressStr));
      } catch (e) {
        setProgress({});
      }
    } else {
      setProgress({});
    }

    if (user) {
        getDoc(doc(db, 'users', user.uid, 'progress', currentDateStr)).then(snap => {
            if (snap.exists()) {
                setProgress(snap.data().progress || {});
                localStorage.setItem(key, JSON.stringify(snap.data().progress || {}));
            }
        });
    }
  }, [currentDateStr, user]);

  const toggleTask = (id: string) => {
    setProgress(prev => {
      const next = { ...prev, [id]: !prev[id] };
      const key = user ? `productivity_${user.uid}_${currentDateStr}` : `productivity_${currentDateStr}`;
      localStorage.setItem(key, JSON.stringify(next));
      if (user) {
          setDoc(doc(db, 'users', user.uid, 'progress', currentDateStr), { progress: next }, { merge: true });
      }
      return next;
    });
  };

  const performWeeklyReset = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (key.startsWith('productivity_') || key.startsWith('custom_schedule_')) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setProgress({});
    setCustomSchedules({});
  };

  const checkAndRunWeeklyReset = () => {
    const now = new Date();
    const currentWeekStr = format(now, 'I-RRRR'); // e.g. "26-2026"
    const lastResetWeek = localStorage.getItem('last_weekly_reset_week');

    if (!lastResetWeek) {
      localStorage.setItem('last_weekly_reset_week', currentWeekStr);
      return;
    }

    // Reset precisely at Sunday 23:59 or when the week identifier shifts (e.g. they open on Monday)
    const isSunday2359 = now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() === 59;

    if (isSunday2359 || lastResetWeek !== currentWeekStr) {
      performWeeklyReset();
      localStorage.setItem('last_weekly_reset_week', currentWeekStr);
      
      if (isAudioEnabled) {
        playAlarmSound(volume);
        speakText("Perhatian, jadwal pekan ini telah selesai. Mengatur ulang diagram dan riwayat tugas untuk pekan baru.", volume);
      }
      sendLocalNotification("Reset Mingguan Otomatis", "Diagram dan progres mingguan telah berhasil diatur ulang.");
    }
  };

  // Run initial check on mount
  useEffect(() => {
    checkAndRunWeeklyReset();
  }, []);

  const [customSchedules, setCustomSchedules] = useState<Record<string, ScheduleItem[]>>({});
  const [globalOverrides, setGlobalOverrides] = useState<Record<string, ScheduleItem>>({});

  // Fetch local schedules
  useEffect(() => {
    const loadedSchedules: Record<string, ScheduleItem[]> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const prefix = user ? `custom_schedule_${user.uid}_` : 'custom_schedule_';
        if (key && key.startsWith(prefix)) {
            const dateStr = key.replace(prefix, '');
            try {
                loadedSchedules[dateStr] = JSON.parse(localStorage.getItem(key) || '[]');
            } catch(e) {}
        }
    }
    setCustomSchedules(loadedSchedules);
    
    try {
        const localOverrides = JSON.parse(localStorage.getItem(user ? `globalOverrides_${user.uid}` : 'globalOverrides') || '{}');
        setGlobalOverrides(localOverrides);
    } catch(e) {}
  }, [user]);

  // Fetch Firebase schedules when user logs in
  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'globalOverrides'), (docSnap) => {
        if (docSnap.exists()) {
            setGlobalOverrides(docSnap.data().items || {});
            localStorage.setItem(`globalOverrides_${user.uid}`, JSON.stringify(docSnap.data().items || {}));
        }
    });
    
    return () => unsub();
  }, [user]);

  const loadScheduleForDate = async (dateStr: string) => {
    if (user) {
        try {
            const docRef = doc(db, 'users', user.uid, 'schedules', dateStr);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCustomSchedules(prev => ({ ...prev, [dateStr]: docSnap.data().schedule }));
            }
        } catch (e) {
            console.error("Firebase fetch error", e);
        }
    }
  };

  useEffect(() => {
     loadScheduleForDate(currentDateStr);
  }, [currentDateStr, user]);

  const getResolvedSchedule = (date: Date) => {
      if (!user) return [];
      const dStr = format(date, 'yyyy-MM-dd');
      let base = getScheduleForDate(date);
      const dayOfWeek = date.getDay();
      
      if (Object.keys(globalOverrides).length > 0) {
          const baseStartTimes = new Set(base.map(item => item.start));
          
          base = base.map(item => {
              const override = globalOverrides[item.start];
              if (override) {
                  if (override.excludedDays && override.excludedDays.includes(dayOfWeek)) {
                      return item;
                  }
                  if (override.isDeleted) return null;
                  return { ...override, id: item.id };
              }
              return item;
          }).filter(Boolean) as ScheduleItem[];
          
          Object.values(globalOverrides).forEach((override: any) => {
              if (override.isDeleted) return;
              if (!baseStartTimes.has(override.start)) {
                  if (!(override.excludedDays && override.excludedDays.includes(dayOfWeek))) {
                      base.push({ ...override });
                  }
              }
          });
          
          base.sort((a, b) => a.start.localeCompare(b.start));
      }
      
      return customSchedules[dStr] ? customSchedules[dStr].filter(i => !i.isDeleted) : base.filter(i => !i.isDeleted);
  };

  const updateScheduleItem = async (dateStr: string, index: number, updatedItem: ScheduleItem, applyMode: 'today' | 'all' | 'all_except' = 'today') => {
      const current = getResolvedSchedule(parse(dateStr, 'yyyy-MM-dd', new Date()));
      const originalItem = current[index];
      const nextSchedule = [...current];
      nextSchedule[index] = updatedItem;
      nextSchedule.sort((a, b) => a.start.localeCompare(b.start));
      const customPrefix = user ? `custom_schedule_${user.uid}_` : 'custom_schedule_';
      const globalPrefix = user ? `globalOverrides_${user.uid}` : 'globalOverrides';
      
      if (applyMode === 'today') {
          setCustomSchedules(prev => ({ ...prev, [dateStr]: nextSchedule }));
          localStorage.setItem(`${customPrefix}${dateStr}`, JSON.stringify(nextSchedule));

          if (user) {
              setDoc(doc(db, 'users', user.uid, 'schedules', dateStr), { schedule: nextSchedule })
                  .catch(e => console.error("Firebase save error", e));
          }
      } else {
          const baseSchedule = getScheduleForDate(parse(dateStr, 'yyyy-MM-dd', new Date()));
          const baseItem = baseSchedule.find(b => b.id === originalItem.id);
          const baseStartTime = baseItem ? baseItem.start : originalItem.start;

          const newOverrides = { ...globalOverrides, [baseStartTime]: updatedItem };
          setGlobalOverrides(newOverrides);
          localStorage.setItem(globalPrefix, JSON.stringify(newOverrides));
          
          if (user) {
              setDoc(doc(db, 'users', user.uid, 'settings', 'globalOverrides'), { items: newOverrides }, { merge: true })
                  .catch(e => console.error("Firebase save error", e));
          }
          
          const nextCustom = { ...customSchedules };
          if (!nextCustom[dateStr]) {
              nextCustom[dateStr] = nextSchedule;
          }
          
          const updateDay = (dStr: string, scheduleArray: ScheduleItem[]) => {
              const dateObj = parse(dStr, 'yyyy-MM-dd', new Date());
              const dayOfWeek = dateObj.getDay();
              let changed = false;
              let shouldExclude = updatedItem.excludedDays && updatedItem.excludedDays.includes(dayOfWeek);

              const updated = scheduleArray.map(item => {
                  if (item.id === originalItem.id || item.start === baseStartTime) {
                      changed = true;
                      if (shouldExclude) {
                          const baseScheduleForDay = getScheduleForDate(dateObj);
                          const baseItemForDay = baseScheduleForDay.find(b => b.start === baseStartTime);
                          return baseItemForDay ? baseItemForDay : null;
                      }
                      return { ...updatedItem, id: item.id };
                  }
                  return item;
              }).filter(Boolean) as ScheduleItem[];
              
              if (!changed && !shouldExclude) {
                  updated.push({ ...updatedItem, id: originalItem.id });
                  changed = true;
              }
              
              if (changed || dStr === dateStr) {
                  updated.sort((a, b) => a.start.localeCompare(b.start));
              }
              return { updated, changed };
          };

          const updatePromises: Promise<void>[] = [];

          // First update all cached days, INCLUDING dateStr
          Object.keys(nextCustom).forEach(dStr => {
              const scheduleToUpdate = dStr === dateStr ? nextSchedule : nextCustom[dStr];
              const res = updateDay(dStr, scheduleToUpdate);
              
              if (res.changed || dStr === dateStr) {
                  nextCustom[dStr] = res.updated;
                  localStorage.setItem(`${customPrefix}${dStr}`, JSON.stringify(nextCustom[dStr]));
                  if (user) {
                      updatePromises.push(setDoc(doc(db, 'users', user.uid, 'schedules', dStr), { schedule: nextCustom[dStr] }));
                  }
              }
          });
          
          setCustomSchedules(nextCustom);
          
          if (updatePromises.length > 0) {
              Promise.all(updatePromises).catch(e => console.error("Firebase save error", e));
          }
      }
  };

  const deleteScheduleItem = async (dateStr: string, index: number, applyMode: 'today' | 'all' | 'all_except' = 'today') => {
      const current = getResolvedSchedule(parse(dateStr, 'yyyy-MM-dd', new Date()));
      const originalItem = current[index];
      const updatedItem = { ...originalItem, isDeleted: true };
      return updateScheduleItem(dateStr, index, updatedItem, applyMode);
  };

  const deleteAllScheduleItems = async (dateStr: string) => {
      const customPrefix = user ? `custom_schedule_${user.uid}_` : 'custom_schedule_';
      
      setCustomSchedules(prev => ({ ...prev, [dateStr]: [] }));
      localStorage.setItem(`${customPrefix}${dateStr}`, JSON.stringify([]));

      if (user) {
          setDoc(doc(db, 'users', user.uid, 'schedules', dateStr), { schedule: [] })
              .catch(e => console.error("Firebase save error", e));
      }
  };

  const addScheduleItem = async (dateStr: string, newItem: ScheduleItem) => {
      const current = getResolvedSchedule(parse(dateStr, 'yyyy-MM-dd', new Date()));
      
      const nextSchedule = [...current, newItem].sort((a, b) => {
          return a.start.localeCompare(b.start);
      });
      
      const customPrefix = user ? `custom_schedule_${user.uid}_` : 'custom_schedule_';
      
      setCustomSchedules(prev => ({ ...prev, [dateStr]: nextSchedule }));
      localStorage.setItem(`${customPrefix}${dateStr}`, JSON.stringify(nextSchedule));

      if (user) {
          setDoc(doc(db, 'users', user.uid, 'schedules', dateStr), { schedule: nextSchedule })
              .catch(e => console.error("Firebase save error", e));
      }
  };

  // Timer loop for active item & alarms
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // If passing midnight, date string might need an update
      const actualDateStr = format(now, 'yyyy-MM-dd');
      if (actualDateStr !== currentDateStr) {
        setCurrentDateStr(actualDateStr);
      }

      // Check weekly reset at 23:59:00 on Sunday or when week shifts
      checkAndRunWeeklyReset();

      let foundActive: string | null = null;
      let remSec: number | null = null;

      const currentScheduleData = getResolvedSchedule(now);

      for (let i = 0; i < currentScheduleData.length; i++) {
        const item = currentScheduleData[i];
        let startD = parse(item.start, 'HH:mm', now);
        let endD = parse(item.end, 'HH:mm', now);

        if (endD < startD) {
           if (now < startD) {
              startD = addDays(startD, -1);
           } else {
              endD = addDays(endD, 1);
           }
        }

        const isActive = now >= startD && now < endD;

        if (isActive) {
          foundActive = item.id;
          remSec = Math.floor((endD.getTime() - now.getTime()) / 1000);
          
          const elapsedSec = Math.floor((now.getTime() - startD.getTime()) / 1000);
          
          // Alarm start session (at the 5th second)
          if (elapsedSec >= 5 && elapsedSec <= 10) {
              const startAlarmId = `start_${item.id}_${actualDateStr}`;
              if (isAudioEnabled && lastSpeechId !== startAlarmId) {
                  setLastSpeechId(startAlarmId);
                  playAlarmSound(volume);
                  let msg = ttsSettings.start;
                  msg = msg.replace('{{activity}}', item.activity);
                  msg = msg.replace('{{duration}}', item.duration.toString());
                  
                  sendLocalNotification(`Sesi Dimulai: ${item.activity}`, msg);
                  setTimeout(() => {
                      speakText(msg, volume);
                  }, 3500);
              }
          }

          // Alarm 50% of the session
          const halfSec = Math.floor((item.duration * 60) / 2);
          if (!item.isBreak && elapsedSec >= halfSec && elapsedSec <= halfSec + 5) {
              const halfAlarmId = `half_${item.id}_${actualDateStr}`;
              if (isAudioEnabled && lastSpeechId !== halfAlarmId) {
                  setLastSpeechId(halfAlarmId);
                  playAlarmSound(volume);
                  let msg = ttsSettings.half;
                  msg = msg.replace('{{activity}}', item.activity);
                  
                  sendLocalNotification(`Pertengahan Sesi`, msg);
                  setTimeout(() => {
                      speakText(msg, volume);
                  }, 3500);
              }
          }

          // TTs Alarms (~60 seconds before end)
          if (remSec <= 60 && remSec >= 55) {
              const nextItem = currentScheduleData[(i + 1) % currentScheduleData.length];
              const isNextImmediatelyAfter = item.end === nextItem.start;
              const isCurrentBreak10m = item.isBreak && item.duration === 10;
              const isNextBreak10m = isNextImmediatelyAfter && nextItem.isBreak && nextItem.duration === 10;

              const alarmId = `speech_${item.id}_${actualDateStr}_1m`;

              if (isAudioEnabled && lastSpeechId !== alarmId) {
                  setLastSpeechId(alarmId);
                  
                  if (isCurrentBreak10m) {
                      playAlarmSound(volume);
                      const msg = "Perhatian-perhatian. Waktu jeda anda akan segera berakhir. Para penumpang kehidupan, selamat beraktifitas kembali.";
                      sendLocalNotification("Waktu Jeda Hampir Berakhir", "Persiapkan diri Anda.");
                      setTimeout(() => {
                          speakText(msg, volume);
                      }, 3500);
                  } else if (isNextBreak10m) {
                      playAlarmSound(volume);
                      const msg = "Perhatian-perhatian. Satu menit lagi menuju waktu jeda. Dimohon untuk bersiap-siap, waktunya waterbreak.";
                      sendLocalNotification("Persiapan Waktu Jeda", "1 Menit lagi.");
                      setTimeout(() => {
                          speakText(msg, volume);
                      }, 3500);
                  } else if (!item.isBreak && isNextImmediatelyAfter) {
                      playAlarmSound(volume);
                      let msg = ttsSettings.end;
                      msg = msg.replace('{{activity}}', item.activity);
                      msg = msg.replace('{{nextActivity}}', nextItem.activity);
                      
                      sendLocalNotification("Persiapan Sesi Berikutnya", `1 Menit menuju ${nextItem.activity}`);
                      setTimeout(() => {
                          speakText(msg, volume);
                      }, 3500);
                  }
              }
          }
          break; // found the active one
        }
      }

      setActiveItemId(foundActive);
      setRemainingSeconds(remSec);
    };

    let worker: Worker | null = null;
    let fallbackId: any = null;

    if (window.Worker) {
        const code = `
            let intervalId = null;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    if (!intervalId) {
                        intervalId = setInterval(function() {
                            self.postMessage('tick');
                        }, 1000);
                    }
                } else if (e.data === 'stop') {
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                }
            };
        `;
        const blob = new Blob([code], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = () => tick();
        worker.postMessage('start');
    } else {
        fallbackId = setInterval(tick, 1000);
    }

    return () => {
        if (worker) {
            worker.postMessage('stop');
            worker.terminate();
        }
        if (fallbackId) clearInterval(fallbackId);
    };
  }, [currentDateStr, isAudioEnabled, lastSpeechId, volume, customSchedules]);

  const getWeeklyStats = () => {
    const stats = [];
    const today = new Date();
    // get past 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const dStr = format(d, 'yyyy-MM-dd');
      const dayName = format(d, 'EEE');
      
      const key = user ? `productivity_${user.uid}_${dStr}` : `productivity_${dStr}`;
      const stored = localStorage.getItem(key);
      let completedCount = 0;
      if (stored) {
        try {
          const parsed: DailyProgress = JSON.parse(stored);
          completedCount = Object.values(parsed).filter(val => val).length;
        } catch(e){}
      }
      
      stats.push({
        date: dStr,
        day: dayName,
        completed: completedCount,
        total: getResolvedSchedule(d).length
      });
    }
    return stats;
  };

  const getCurrentWeekAnalytics = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const days = eachDayOfInterval({ start, end });

    const activityMap: Record<string, number> = {};
    let totalScheduledMinutes = 0;

    days.forEach(d => {
        const schedule = getResolvedSchedule(d);
        schedule.forEach(item => {
            if (!item.isBreak) {
                if (!activityMap[item.activity]) {
                    activityMap[item.activity] = 0;
                }
                activityMap[item.activity] += item.duration;
            } else {
                if (!activityMap['Waktu Istirahat (Break)']) {
                    activityMap['Waktu Istirahat (Break)'] = 0;
                }
                activityMap['Waktu Istirahat (Break)'] += item.duration;
            }
            totalScheduledMinutes += item.duration;
        });
    });

    const TOTAL_WEEK_MINUTES = 7 * 24 * 60; // 10080
    const unallocatedMinutes = Math.max(0, TOTAL_WEEK_MINUTES - totalScheduledMinutes);
    if (unallocatedMinutes > 0) {
        activityMap['Waktu Kosong (Tak Terjadwal)'] = unallocatedMinutes;
    }

    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
      '#ec4899', '#f43f5e', '#9f1239', '#7c2d12', '#3f6212',
      '#064e3b', '#1e3a8a', '#4c1d95', '#0f766e', '#b45309',
      '#475569', '#334155'
    ];
    
    // Simple hash function to ensure consistent colors for the same activity name
    const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    };

    return Object.keys(activityMap).map((key) => {
        let color = colors[getHash(key) % colors.length];
        if (key === 'Waktu Kosong (Tak Terjadwal)') color = '#e2e8f0'; // slate-200
        else if (key === 'Waktu Istirahat (Break)') color = '#93c5fd'; // blue-300

        return {
            name: key,
            value: activityMap[key],
            color
        };
    }).sort((a, b) => {
        if (a.name === 'Waktu Kosong (Tak Terjadwal)') return 1;
        if (b.name === 'Waktu Kosong (Tak Terjadwal)') return -1;
        if (a.name === 'Waktu Istirahat (Break)') return 1;
        if (b.name === 'Waktu Istirahat (Break)') return -1;
        return b.value - a.value;
    });
  };

  return {
    currentDateStr,
    todaySchedule: getResolvedSchedule(new Date(currentDateStr)),
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
    weeklyStats: getWeeklyStats(),
    getCurrentWeekAnalytics,
    getResolvedSchedule,
    updateScheduleItem,
    deleteScheduleItem,
    deleteAllScheduleItems,
    addScheduleItem,
    loadScheduleForDate,
    user
  };
}
