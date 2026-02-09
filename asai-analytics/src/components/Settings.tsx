"use client";

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Settings() {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [config, setConfig] = useState({
        geminiApiKey: '',
        googleClientId: '',
        googleClientSecret: '',
        googleRefreshToken: '',
        msClientId: '',
        msClientSecret: '',
        msTenantId: 'common'
    });

    useEffect(() => {
        const fetchConfig = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'userConfigs', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setConfig(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error fetching config:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setSuccess(false);

        try {
            await setDoc(doc(db, 'userConfigs', user.uid), {
                ...config,
                updatedAt: new Date().toISOString()
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving config:", error);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-bg-secondary">
                <div className="text-accent-cyan animate-pulse font-bold tracking-widest text-xs uppercase">Loading Configuration...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-bg-secondary p-8 pb-20">
            <div className="max-w-4xl mx-auto flex flex-col gap-10">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">System Settings</h2>
                    <p className="text-slate-400 text-sm font-medium">Configure your enterprise API credentials to enable AI processing and cloud sync.</p>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-8">
                    {/* Gemini AI Settings */}
                    <section className="glass-card p-6 flex flex-col gap-6 bg-slate-900/40 border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center text-accent-orange shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                ✨
                            </div>
                            <h3 className="text-white font-bold uppercase tracking-widest text-xs">Gemini AI Configuration</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gemini API Key</label>
                            <input
                                type="password"
                                value={config.geminiApiKey}
                                onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                                placeholder="AIzaSy..."
                                className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-accent-orange/50 outline-none transition-fast font-mono"
                            />
                            <p className="text-[10px] text-slate-500 italic">Used for document intelligence and conversational RAG.</p>
                        </div>
                    </section>

                    {/* Google Cloud Settings */}
                    <section className="glass-card p-6 flex flex-col gap-6 bg-slate-900/40 border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                ☁️
                            </div>
                            <h3 className="text-white font-bold uppercase tracking-widest text-xs">Google Drive API (Cloud Sync)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client ID</label>
                                <input
                                    type="text"
                                    value={config.googleClientId}
                                    onChange={(e) => setConfig({ ...config, googleClientId: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-accent-cyan/50 outline-none transition-fast font-mono"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client Secret</label>
                                <input
                                    type="password"
                                    value={config.googleClientSecret}
                                    onChange={(e) => setConfig({ ...config, googleClientSecret: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-accent-cyan/50 outline-none transition-fast font-mono"
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Refresh Token</label>
                                <input
                                    type="password"
                                    value={config.googleRefreshToken}
                                    onChange={(e) => setConfig({ ...config, googleRefreshToken: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-accent-cyan/50 outline-none transition-fast font-mono"
                                />
                                <p className="text-[10px] text-slate-500 italic">Required for continuous monitoring of project files.</p>
                            </div>
                        </div>
                    </section>

                    {/* Microsoft Settings */}
                    <section className="glass-card p-6 flex flex-col gap-6 bg-slate-900/40 border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                🏢
                            </div>
                            <h3 className="text-white font-bold uppercase tracking-widest text-xs">Microsoft OneDrive API</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MS Client ID</label>
                                <input
                                    type="text"
                                    value={config.msClientId}
                                    onChange={(e) => setConfig({ ...config, msClientId: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-blue-500/50 outline-none transition-fast font-mono"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MS Client Secret</label>
                                <input
                                    type="password"
                                    value={config.msClientSecret}
                                    onChange={(e) => setConfig({ ...config, msClientSecret: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-blue-500/50 outline-none transition-fast font-mono"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MS Tenant ID</label>
                                <input
                                    type="text"
                                    value={config.msTenantId}
                                    onChange={(e) => setConfig({ ...config, msTenantId: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-blue-500/50 outline-none transition-fast font-mono"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-8">
                        {success && <span className="text-green-500 text-xs font-bold animate-fade-in">✓ Settings Saved Successfully!</span>}
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-gradient-to-r from-accent-cyan to-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-fast shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Deploy Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
