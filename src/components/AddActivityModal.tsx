import { useState, useEffect } from 'react';
import { ScheduleItem } from '../data/schedule';
import { X, Save, Plus } from 'lucide-react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: ScheduleItem) => void;
}

export function AddActivityModal({ isOpen, onClose, onSave }: AddActivityModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ScheduleItem>({
    id: `custom-${Date.now()}`,
    start: '12:00',
    end: '13:00',
    duration: 60,
    activity: '',
    notes: '',
    isBreak: false
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: `custom-${Date.now()}`,
        start: '12:00',
        end: '13:00',
        duration: 60,
        activity: '',
        notes: '',
        isBreak: false
      });
      setIsSaving(false);
    }
  }, [isOpen]);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration < 0) duration += 24 * 60; // if it spans midnight
    return duration;
  };

  const handleSave = async () => {
    if (!formData.activity.trim()) return alert("Nama aktivitas wajib diisi.");
    setIsSaving(true);
    try {
        await onSave(formData);
        onClose();
    } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan saat menyimpan");
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-900">Tambah Aktivitas Baru</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Waktu Mulai</label>
              <input type="time" value={formData.start} onChange={e => {
                const newStart = e.target.value;
                setFormData({ ...formData, start: newStart, duration: calculateDuration(newStart, formData.end) });
              }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Waktu Selesai</label>
              <input type="time" value={formData.end} onChange={e => {
                const newEnd = e.target.value;
                setFormData({ ...formData, end: newEnd, duration: calculateDuration(formData.start, newEnd) });
              }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Durasi (menit)</label>
            <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Aktivitas</label>
            <input type="text" value={formData.activity} onChange={e => setFormData({ ...formData, activity: e.target.value })} placeholder="Cth: Belajar React" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Catatan</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Opsional..." rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 w-max p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={formData.isBreak} onChange={e => setFormData({ ...formData, isBreak: e.target.checked })} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm font-medium text-gray-700">Ini adalah waktu istirahat (Break)</span>
          </label>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="w-full sm:w-auto justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm disabled:opacity-50">
            <Plus className="w-4 h-4" />
            {isSaving ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}
