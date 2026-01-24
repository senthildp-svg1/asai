"use client";

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

    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    };

    const signInWithMicrosoft = () => {
        const provider = new OAuthProvider('microsoft.com');
        signInWithPopup(auth, provider);
    };

    const logout = () => {
        signOut(auth);
    };

    if (loading) {
        return <div className="text-secondary">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error.message}</div>;
    }

    if (user) {
        return (
            <div className="glass-card p-6 flex flex-col items-center gap-4">
                <p className="text-secondary text-sm">Signed in as</p>
                <p className="font-bold">{user.email}</p>
                <button onClick={logout} className="btn-secondary w-full">
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-8 flex flex-col gap-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-4">Welcome to Asai Analytics</h2>

            <button
                onClick={signInWithGoogle}
                className="btn-primary flex items-center justify-center gap-3 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google" />
                Sign in with Google
            </button>

            <button
                onClick={signInWithMicrosoft}
                className="btn-primary flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700"
            >
                <img src="https://authjs.dev/img/providers/microsoft.svg" width="18" height="18" alt="Microsoft" />
                Sign in with Microsoft
            </button>

            <div className="flex items-center gap-4 text-secondary">
                <hr className="flex-1 border-slate-700" />
                <span className="text-xs uppercase font-bold text-slate-500">or email</span>
                <hr className="flex-1 border-slate-700" />
            </div>

            <input
                type="email"
                placeholder="Email address"
                className="bg-slate-900 border border-slate-700 p-3 rounded-md text-white focus:border-cyan-500 outline-none"
            />
            <input
                type="password"
                placeholder="Password"
                className="bg-slate-900 border border-slate-700 p-3 rounded-md text-white focus:border-cyan-500 outline-none"
            />

            <button className="btn-primary">
                Sign In
            </button>

            <p className="text-xs text-secondary text-center">
                By continuing, you agree to the Asai Analytics Terms of Service.
            </p>
        </div>
    );
}
