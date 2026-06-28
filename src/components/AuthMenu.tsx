import { useState, useEffect } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { LogOut, LogIn, User as UserIcon } from "lucide-react";

export function AuthMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub;
  }, []);

  const login = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Login fail", e);
      if (e.code === 'auth/unauthorized-domain' || (e.message && e.message.includes('auth/unauthorized-domain'))) {
        setAuthError(`Akses Ditolak. Tambahkan domain berikut di Firebase Console (Authentication > Settings > Authorized domains): ${window.location.hostname}`);
      } else {
        alert(`Gagal login: ${e.message}`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
        <UserIcon className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">{user.displayName || user.email}</span>
        <button onClick={logout} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors" title="Log Out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={login} className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm">
        <LogIn className="w-4 h-4" />
        <span>Login</span>
      </button>
      {authError && (
        <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl shadow-lg z-50">
          <p className="font-semibold mb-1">Error Login</p>
          <p>{authError}</p>
        </div>
      )}
    </div>
  );
}
