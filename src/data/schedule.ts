export type ScheduleItem = {
  id: string;
  start: string; // HH:mm format
  end: string;   // HH:mm format
  duration: number; // in minutes
  activity: string;
  notes: string;
  isBreak: boolean;
  excludedDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  isDeleted?: boolean; // Flag to indicate if the task is deleted across global schedule
};

const commonMorningSleep: Omit<ScheduleItem, 'id'>[] = [
  { start: '00:00', end: '05:00', duration: 300, activity: 'Waktunya Tidur', notes: 'Istirahat Malam.', isBreak: false },
];

const commonEveningSchedule: Omit<ScheduleItem, 'id'>[] = [
  { start: '16:40', end: '17:00', duration: 20, activity: 'Arrive Home', notes: 'Tiba di rumah.', isBreak: false },
  { start: '17:00', end: '17:25', duration: 25, activity: 'Masak & Mandi', notes: 'Kebersihan dan persiapan energi.', isBreak: false },
  { start: '17:25', end: '17:50', duration: 25, activity: 'Rekap Finansial', notes: 'Catat pengeluaran & cek portofolio harian.', isBreak: false },
  { start: '17:50', end: '18:10', duration: 20, activity: 'Ibadah Maghrib', notes: 'Durasi 20 Menit.', isBreak: false },
  { start: '18:10', end: '18:35', duration: 25, activity: 'Airdrop Session', notes: 'Sesi rutin harian (check-in/daily tasks).', isBreak: false },
  { start: '18:35', end: '18:50', duration: 15, activity: 'Jeda Makan Malam', notes: 'Waktu untuk makan malam (15 Menit).', isBreak: true },
  { start: '18:50', end: '19:00', duration: 10, activity: 'Ibadah Isya', notes: 'Fokus ibadah (10 menit).', isBreak: false },
  { start: '19:00', end: '19:50', duration: 50, activity: 'Kursus Marketing', notes: 'Fokus Belajar Intensif (50 Menit).', isBreak: false },
  { start: '19:50', end: '20:00', duration: 10, activity: 'Jeda Istirahat', notes: 'Minum air putih & jalan.', isBreak: true },
  { start: '20:00', end: '20:30', duration: 30, activity: 'Programming Basic', notes: 'Penguatan logika/fondasi koding (30 Menit).', isBreak: false },
  { start: '20:30', end: '20:40', duration: 10, activity: 'Jeda Istirahat', notes: 'Penyegaran mental.', isBreak: true },
  { start: '20:40', end: '21:10', duration: 30, activity: 'Vibecoding', notes: 'Koding santai/flow state (30 Menit).', isBreak: false },
  { start: '21:10', end: '21:20', duration: 10, activity: 'Jeda Istirahat', notes: 'Relaksasi sejenak sebelum eksperimen.', isBreak: true },
  { start: '21:20', end: '21:50', duration: 30, activity: 'Eksperimen', notes: 'Sesi eksplorasi bebas (30 Menit).', isBreak: false },
  { start: '21:50', end: '22:20', duration: 30, activity: 'Kursus Desain', notes: 'Fokus Desain (30 Menit).', isBreak: false },
  { start: '22:20', end: '22:30', duration: 10, activity: 'Jeda Istirahat', notes: 'Relaksasi mata.', isBreak: true },
  { start: '22:30', end: '22:50', duration: 20, activity: 'YouTube Short Production', notes: 'Editing video (20 Menit).', isBreak: false },
  { start: '22:50', end: '23:10', duration: 20, activity: 'Jeda Istirahat + Masak', notes: 'Persiapan bekal.', isBreak: true },
  { start: '23:10', end: '23:30', duration: 20, activity: 'Job Reward Recehan', notes: 'Fokus tugas mikro (20 Menit).', isBreak: false },
  { start: '23:30', end: '23:50', duration: 20, activity: 'Wind Down', notes: 'Persiapan tidur malam.', isBreak: false },
  { start: '23:50', end: '00:00', duration: 10, activity: 'Waktunya Tidur', notes: 'Mulai Istirahat Malam.', isBreak: false },
];

export const weekdaySchedule: ScheduleItem[] = [
  ...commonMorningSleep,
  ...[
    { start: '05:00', end: '05:20', duration: 20, activity: 'Ibadah Subuh', notes: 'Fokus Ibadah.', isBreak: false },
    { start: '05:20', end: '06:15', duration: 55, activity: 'Tidur Lanjut', notes: 'Istirahat Tahap 2.', isBreak: false },
    { start: '06:15', end: '07:00', duration: 45, activity: 'Sarapan & Mandi', notes: 'Makan pagi dan mandi.', isBreak: false },
    { start: '07:00', end: '07:50', duration: 50, activity: 'Perjalanan Kerja', notes: 'Berangkat kerja.', isBreak: false },
    { start: '07:50', end: '16:30', duration: 520, activity: 'Kerja Formal', notes: 'Fokus kerja.', isBreak: false },
    { start: '16:30', end: '16:40', duration: 10, activity: 'Jeda Pulang', notes: 'Persiapan pulang.', isBreak: true },
  ],
  ...commonEveningSchedule
].map((item, index) => ({ ...item, id: `wd-${index}` }));

export const saturdaySchedule: ScheduleItem[] = [
  ...commonMorningSleep,
  ...[
    { start: '05:00', end: '05:20', duration: 20, activity: 'Ibadah Subuh', notes: 'Fokus Ibadah.', isBreak: false },
    { start: '05:20', end: '06:15', duration: 55, activity: 'Tidur Lanjut', notes: 'Istirahat Tahap 2.', isBreak: false },
    { start: '06:15', end: '07:00', duration: 45, activity: 'Sarapan & Mandi', notes: 'Makan pagi dan mandi.', isBreak: false },
    { start: '07:00', end: '07:50', duration: 50, activity: 'Perjalanan Kerja', notes: 'Berangkat kerja.', isBreak: false },
    { start: '07:50', end: '13:30', duration: 340, activity: 'Kerja Formal', notes: 'Fokus kerja (setengah hari).', isBreak: false },
    { start: '13:30', end: '13:40', duration: 10, activity: 'Jeda', notes: 'Istirahat sejenak.', isBreak: true },
    { start: '13:40', end: '14:40', duration: 60, activity: 'Cuci Baju & Mandi', notes: 'Tugas harian.', isBreak: false },
    { start: '14:40', end: '15:30', duration: 50, activity: 'Santai + Ashar', notes: 'Relaksasi.', isBreak: false },
    { start: '15:30', end: '16:00', duration: 30, activity: 'Shutterstock', notes: 'Review / upload asset.', isBreak: false },
    { start: '16:00', end: '16:10', duration: 10, activity: 'Jeda', notes: 'Istirahat.', isBreak: true },
    { start: '16:10', end: '16:30', duration: 20, activity: 'Job Receh/Promosi', notes: 'Tugas online.', isBreak: false },
    { start: '16:30', end: '16:40', duration: 10, activity: 'Jeda', notes: 'Persiapan akhir pekan.', isBreak: true },
  ],
  // Wait, if Sunday starts at 00:00 with "Jam Santai", then Saturday night should prep for that!
  ...[
    { start: '16:40', end: '17:00', duration: 20, activity: 'Arrive Home', notes: 'Tiba di rumah.', isBreak: false },
    { start: '17:00', end: '17:25', duration: 25, activity: 'Masak & Mandi', notes: 'Kebersihan dan persiapan energi.', isBreak: false },
    { start: '17:25', end: '17:50', duration: 25, activity: 'Rekap Finansial', notes: 'Catat pengeluaran & cek portofolio harian.', isBreak: false },
    { start: '17:50', end: '18:10', duration: 20, activity: 'Ibadah Maghrib', notes: 'Durasi 20 Menit.', isBreak: false },
    { start: '18:10', end: '18:35', duration: 25, activity: 'Airdrop Session', notes: 'Sesi rutin harian (check-in/daily tasks).', isBreak: false },
    { start: '18:35', end: '18:50', duration: 15, activity: 'Jeda Makan Malam', notes: 'Waktu untuk makan malam (15 Menit).', isBreak: true },
    { start: '18:50', end: '19:00', duration: 10, activity: 'Ibadah Isya', notes: 'Fokus ibadah (10 menit).', isBreak: false },
    { start: '19:00', end: '19:50', duration: 50, activity: 'Kursus Marketing', notes: 'Fokus Belajar Intensif (50 Menit).', isBreak: false },
    { start: '19:50', end: '20:00', duration: 10, activity: 'Jeda Istirahat', notes: 'Minum air putih & jalan.', isBreak: true },
    { start: '20:00', end: '20:30', duration: 30, activity: 'Programming Basic', notes: 'Penguatan logika/fondasi koding (30 Menit).', isBreak: false },
    { start: '20:30', end: '20:40', duration: 10, activity: 'Jeda Istirahat', notes: 'Penyegaran mental.', isBreak: true },
    { start: '20:40', end: '21:10', duration: 30, activity: 'Vibecoding', notes: 'Koding santai/flow state (30 Menit).', isBreak: false },
    { start: '21:10', end: '21:20', duration: 10, activity: 'Jeda Istirahat', notes: 'Relaksasi sejenak.', isBreak: true },
    { start: '21:20', end: '21:50', duration: 30, activity: 'Eksperimen', notes: 'Sesi eksplorasi bebas (30 Menit).', isBreak: false },
    { start: '21:50', end: '22:20', duration: 30, activity: 'Kursus Desain', notes: 'Fokus Desain (30 Menit).', isBreak: false },
    { start: '22:20', end: '22:30', duration: 10, activity: 'Jeda Istirahat', notes: 'Relaksasi mata.', isBreak: true },
    { start: '22:30', end: '22:50', duration: 20, activity: 'YouTube Short Production', notes: 'Editing video (20 Menit).', isBreak: false },
    { start: '22:50', end: '23:10', duration: 20, activity: 'Jeda Istirahat + Masak', notes: 'Persiapan bekal.', isBreak: true },
    { start: '23:10', end: '23:30', duration: 20, activity: 'Job Reward Recehan', notes: 'Fokus tugas mikro (20 Menit).', isBreak: false },
    { start: '23:30', end: '23:50', duration: 20, activity: 'Wind Down', notes: 'Persiapan tidur malam.', isBreak: false },
    { start: '23:50', end: '00:00', duration: 10, activity: 'Jam Santai', notes: 'Malam minggu santai.', isBreak: false }
  ]
].map((item, index) => ({ ...item, id: `sat-${index}` }));

export const sundaySchedule: ScheduleItem[] = [
  ...[
    { start: '00:00', end: '01:00', duration: 60, activity: 'Jam Santai', notes: 'Waktu luang.', isBreak: false },
    { start: '01:00', end: '01:15', duration: 15, activity: 'Stop & Persiapan Tidur', notes: 'Wind down.', isBreak: false },
    { start: '01:15', end: '05:00', duration: 225, activity: 'Tidur Dini Hari', notes: 'Istirahat malam.', isBreak: false },
    { start: '05:00', end: '05:20', duration: 20, activity: 'Ibadah Subuh', notes: 'Fokus Ibadah.', isBreak: false },
    { start: '05:20', end: '08:30', duration: 190, activity: 'Lanjut Tidur', notes: 'Istirahat akhir pekan.', isBreak: false },
    { start: '08:30', end: '09:10', duration: 40, activity: 'Jam Santai Pagi', notes: 'Santai pagi.', isBreak: false },
    { start: '09:10', end: '09:50', duration: 40, activity: 'Mandi & Service Motor', notes: 'Perawatan.', isBreak: false },
    { start: '09:50', end: '10:00', duration: 10, activity: 'Jeda', notes: 'Istirahat.', isBreak: true },
    { start: '10:00', end: '10:50', duration: 50, activity: 'Vibecoding Jargonpayment', notes: 'Fokus coding.', isBreak: false },
    { start: '10:50', end: '11:00', duration: 10, activity: 'Jeda', notes: 'Istirahat.', isBreak: true },
    { start: '11:00', end: '11:20', duration: 20, activity: 'Posting Etalase/Jargonpay', notes: 'Update.', isBreak: false },
    { start: '11:20', end: '12:30', duration: 70, activity: 'Istirahat & Dzuhur', notes: 'Makan dan santai.', isBreak: true },
    { start: '12:30', end: '13:10', duration: 40, activity: 'Programming Session', notes: 'Latihan coding.', isBreak: false },
    { start: '13:10', end: '13:30', duration: 20, activity: 'SGB / Virtual Assistant', notes: 'Tugas VA.', isBreak: false },
    { start: '13:30', end: '13:40', duration: 10, activity: 'Jeda', notes: 'Istirahat.', isBreak: true },
    { start: '13:40', end: '14:40', duration: 60, activity: 'DevOps Session', notes: 'Belajar dan setup.', isBreak: false },
    { start: '14:40', end: '15:30', duration: 50, activity: 'Istirahat & Ashar', notes: 'Istirahat sore.', isBreak: true },
    { start: '15:30', end: '16:00', duration: 30, activity: 'YouTube / FBRPO', notes: 'Manajemen konten.', isBreak: false },
    { start: '16:00', end: '16:10', duration: 10, activity: 'Jeda', notes: 'Istirahat.', isBreak: true },
    { start: '16:10', end: '16:30', duration: 20, activity: 'Airdrop Minggu', notes: 'Cek tugas akhir pekan.', isBreak: false },
    { start: '16:30', end: '16:40', duration: 10, activity: 'Jeda', notes: 'Persiapan akhir pekan.', isBreak: true },
  ],
  ...commonEveningSchedule
].map((item, index) => ({ ...item, id: `sun-${index}` }));

export const getScheduleForDate = (date: Date): ScheduleItem[] => {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  if (day === 0) return sundaySchedule;
  if (day === 6) return saturdaySchedule;
  return weekdaySchedule;
};

// Deprecated fallback for compatibility if someone still uses it, but prefer getScheduleForDate
export const scheduleData: ScheduleItem[] = weekdaySchedule;


