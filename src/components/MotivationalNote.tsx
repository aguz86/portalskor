import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Edit2, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Note {
    id: string;
    content: string;
}

interface MotivationalNoteProps {
    onNotification?: (msg: string) => void;
}

export function MotivationalNote({ onNotification }: MotivationalNoteProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempNote, setTempNote] = useState("");
    const [user, setUser] = useState(auth.currentUser);

    useEffect(() => {
        return auth.onAuthStateChanged(setUser);
    }, []);

    useEffect(() => {
        if (!user) {
            setNotes([]);
            return;
        }

        const localNotes = localStorage.getItem(`motivational_notes_${user.uid}`);
        if (localNotes) {
            try {
                setNotes(JSON.parse(localNotes));
            } catch (e) {
                console.error(e);
            }
        }

        const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'motivation'), (snap) => {
            if (snap.exists() && snap.data().notes) {
                setNotes(snap.data().notes);
                localStorage.setItem(`motivational_notes_${user.uid}`, JSON.stringify(snap.data().notes));
            }
        });

        return () => unsub();
    }, [user]);

    const saveNotesToDB = async (newNotes: Note[]) => {
        if (!user) return;
        localStorage.setItem(`motivational_notes_${user.uid}`, JSON.stringify(newNotes));
        try {
            await setDoc(doc(db, 'users', user.uid, 'settings', 'motivation'), { notes: newNotes }, { merge: true });
        } catch (e) {
            console.error("Error saving notes", e);
        }
    }

    const handleSaveNote = async () => {
        if (!editingId || !user) return;
        const newNotes = notes.map(n => n.id === editingId ? { ...n, content: tempNote } : n);
        setNotes(newNotes);
        setEditingId(null);
        await saveNotesToDB(newNotes);
        if (onNotification) onNotification("Note tersimpan");
    };

    const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!user) return;
        const newNotes = notes.filter(n => n.id !== id);
        setNotes(newNotes);
        await saveNotesToDB(newNotes);
        if (onNotification) onNotification("Note dihapus");
    };

    const handleAddNote = async () => {
        if (!user) {
            alert('Harap login terlebih dahulu untuk menambah catatan');
            return;
        }
        if (notes.length >= 4) return;
        const newNote = { id: Date.now().toString(), content: 'Catatan baru...' };
        const newNotes = [...notes, newNote];
        setNotes(newNotes);
        await saveNotesToDB(newNotes);
        setEditingId(newNote.id);
        setTempNote(newNote.content);
    };

    return (
        <div className="mt-6 mb-4 px-4 sm:px-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-emerald-800">Catatan & Motivasi</h3>
                {notes.length < 4 && (
                    <button 
                        onClick={handleAddNote}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1.5 rounded-md transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Note
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {notes.map(note => (
                    <div key={note.id} className="relative group bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-sm transition-all hover:shadow-md flex flex-col min-h-[100px]">
                        {editingId === note.id ? (
                            <div className="flex flex-col h-full gap-2">
                                <textarea 
                                    value={tempNote}
                                    onChange={(e) => setTempNote(e.target.value)}
                                    className="flex-1 bg-yellow-50 text-gray-800 placeholder-gray-400 border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full resize-y min-h-[80px]"
                                    placeholder="Tulis di sini..."
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            handleSaveNote();
                                        }
                                    }}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        onClick={() => setEditingId(null)}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-yellow-200 rounded-md transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleSaveNote}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-900 bg-yellow-400 hover:bg-yellow-500 rounded-md transition-colors"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="flex-1 flex flex-col cursor-pointer"
                                onClick={() => {
                                    setTempNote(note.content);
                                    setEditingId(note.id);
                                }}
                            >
                                <p className="text-gray-800 text-sm font-medium whitespace-pre-wrap leading-relaxed flex-1 pt-1 mb-6">
                                    {note.content}
                                </p>
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-100/80 backdrop-blur-sm p-1 rounded-md">
                                    <button 
                                        onClick={(e) => handleDeleteNote(note.id, e)}
                                        className="p-1.5 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100 transition-colors bg-white/50 shadow-sm"
                                        title="Hapus Note"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTempNote(note.content);
                                            setEditingId(note.id);
                                        }}
                                        className="p-1.5 rounded-full text-yellow-700 hover:text-yellow-900 hover:bg-yellow-200 transition-colors bg-white/50 shadow-sm"
                                        title="Edit Note"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
