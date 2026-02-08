"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    signOut
} from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

export default function AuthComponent() {
    const [user, loading, error] = useAuthState(auth);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const signInWithGoogle = async () => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        setLocalError(null);

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Auth error:", err);
            // Ignore common cancellation errors that don't need to be shown to the user
            if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
                setLocalError(err.message || "An error occurred during sign in.");
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const signInWithMicrosoft = async () => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        setLocalError(null);

        try {
            const provider = new OAuthProvider('microsoft.com');
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Auth error:", err);
            if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
                setLocalError(err.message || "An error occurred during sign in.");
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const logout = () => {
        signOut(auth);
    };

    if (loading) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 w-full max-w-md bg-slate-900/40">
                <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-medium">Verifying Session...</p>
            </div>
        );
    }

    if (user) {
        return (
            <div className="glass-card p-8 flex flex-col items-center gap-6 w-full max-w-md bg-slate-900/40 border-accent-cyan/20">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent-cyan p-1">
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Profile" className="rounded-full bg-slate-800" />
                </div>
                <div className="text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Authenticated As</p>
                    <p className="text-white font-bold text-lg">{user.displayName || user.email}</p>
                </div>
                <button onClick={logout} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-fast border border-slate-700">
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-10 flex flex-col gap-6 w-full max-w-md bg-slate-900/60 border-slate-800/50 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-orange/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-cyan/10 blur-[60px] rounded-full -ml-16 -mb-16"></div>

            <div className="text-center flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-accent-orange flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)]">A</div>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Access Dashboard</h2>
                <p className="text-slate-400 text-xs font-medium">Connect your enterprise account to continue</p>
            </div>

            <div className="flex flex-col gap-3 mt-4 relative z-10">
                <button
                    onClick={signInWithGoogle}
                    disabled={isAuthenticating}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 h-12 rounded-xl font-bold hover:bg-slate-100 transition-fast shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google" />
                    Sign in with Google
                </button>

                <button
                    onClick={signInWithMicrosoft}
                    disabled={isAuthenticating}
                    className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white h-12 rounded-xl font-bold hover:bg-slate-700 transition-fast border border-slate-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <img src="https://authjs.dev/img/providers/microsoft.svg" width="18" height="18" alt="Microsoft" />
                    Sign in with Microsoft
                </button>
            </div>

            {(error || localError) && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold text-center animate-pulse relative z-10">
                    ⚠️ Error: {error?.message || localError}
                </div>
            )}

            <div className="relative flex items-center gap-4 py-2 z-10">
                <div className="flex-1 h-[1px] bg-slate-800/50"></div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Enterprise Only</span>
                <div className="flex-1 h-[1px] bg-slate-800/50"></div>
            </div>

            <div className="text-center relative z-10">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    By accessing Asai Analytics, you agree to our <br />
                    <span className="text-accent-cyan cursor-pointer hover:underline">Terms of Service</span> and <span className="text-accent-cyan cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
            </div>
        </div>
    );
}
