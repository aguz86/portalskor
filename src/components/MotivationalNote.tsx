import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export function MotivationalNote() {
    const [note, setNote] = useState("Tulis motivasi harianmu di sini...");
    const [isEditing, setIsEditing] = useState(false);
    const [tempNote, setTempNote] = useState(note);
    const [user, setUser] = useState(auth.currentUser);

    useEffect(() => {
        return auth.onAuthStateChanged(setUser);
    }, []);

    useEffect(() => {
        const localNote = localStorage.getItem('motivational_note');
        if (localNote) setNote(localNote);

        if (user) {
            getDoc(doc(db, 'users', user.uid, 'settings', 'motivation')).then(snap => {
                if (snap.exists() && snap.data().note) {
                    setNote(snap.data().note);
                    localStorage.setItem('motivational_note', snap.data().note);
                }
            });
        }
    }, [user]);

    const saveNote = async () => {
        setNote(tempNote);
        setIsEditing(false);
        localStorage.setItem('motivational_note', tempNote);
        
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid, 'settings', 'motivation'), { note: tempNote }, { merge: true });
            } catch (e) {
                console.error("Error saving note", e);
            }
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
                <input 
                    type="text" 
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 w-full"
                    placeholder="Apa motivasimu hari ini?"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                />
                <button 
                    onClick={saveNote}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors whitespace-nowrap"
                >
                    <Check className="w-4 h-4" />
                    Simpan
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 mt-4 px-4 sm:px-6 max-w-7xl mx-auto group animate-in fade-in duration-200">
            <p className="text-emerald-50 text-sm font-medium italic">"{note}"</p>
            <button 
                onClick={() => {
                    setTempNote(note);
                    setIsEditing(true);
                }}
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Edit Motivasi"
            >
                <Edit2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
