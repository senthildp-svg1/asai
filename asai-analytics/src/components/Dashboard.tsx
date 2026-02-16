"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import LiveTriage from '@/components/LiveTriage';
import Settings from '@/components/Settings';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function Dashboard() {
    const [activeItem, setActiveItem] = React.useState('Acme Corp');
    const [docCount, setDocCount] = useState(0);
    const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low');
    const [activeView, setActiveView] = useState<'dashboard' | 'settings'>('dashboard');


    useEffect(() => {
        // Doc count listener
        const unsubscribeDocs = onSnapshot(collection(db, "documents"), (snapshot) => {
            setDocCount(snapshot.size);
        });

        // Risk level listener (based on alerts)
        const q = query(collection(db, "activities"), where("type", "==", "alert"));
        const unsubscribeRisk = onSnapshot(q, (snapshot) => {
            if (snapshot.size > 2) {
                setRiskLevel('High');
            } else if (snapshot.size > 0) {
                setRiskLevel('Medium');
            } else {
                setRiskLevel('Low');
            }
        });

        return () => {
            unsubscribeDocs();
            unsubscribeRisk();
        };
    }, []);


    return (
        <div className="flex bg-bg-secondary w-full h-screen overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ zIndex: 0 }}>
                <div className="absolute top-[20%] left-[10%] w-64 h-64 border-l border-t border-cyan-500/10"></div>
                <div className="absolute bottom-[20%] right-[10%] w-48 h-48 border-r border-b border-orange-500/10"></div>
            </div>

            {/* Main Header */}
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800/50 flex items-center justify-between px-6 z-50 bg-secondary/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-accent-orange font-bold text-2xl">A</span>
                        <h1 className="text-white font-bold tracking-tight text-lg">Asai Analytics: Project Status</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Visual Widgets */}
                    <div className="hidden md:flex items-center gap-8 mr-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project Progress</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-cyan transition-all duration-500" style={{ width: `${Math.min(docCount * 10, 100)}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-accent-cyan">{Math.min(docCount * 10, 100)}%</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Score</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full animate-pulse ${riskLevel === 'High' ? 'bg-red-500' : riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                <span className={`text-xs font-bold ${riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-orange-400' : 'text-green-400'}`}>{riskLevel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="glass-card flex items-center gap-2 px-3 py-1.5 border-slate-700/50">
                            <span className="text-slate-500 text-xs">🔍</span>
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="bg-transparent border-none outline-none text-xs w-48 text-text-primary"
                            />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 cursor-pointer hover:bg-slate-700 transition-fast" title="Notifications">
                            🔔
                        </div>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer transition-fast ${activeView === 'settings' ? 'bg-accent-cyan/20 border-accent-cyan/50' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'}`}
                            onClick={() => setActiveView(activeView === 'dashboard' ? 'settings' : 'dashboard')}
                            title="Settings"
                        >
                            ⚙️
                        </div>
                        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                            <div className="flex flex-col items-end hidden lg:flex">
                                <span className="text-[10px] font-bold text-white">Archie S.</span>
                                <button
                                    onClick={() => signOut(auth)}
                                    className="text-[9px] text-accent-cyan hover:underline cursor-pointer uppercase font-black"
                                >
                                    Sign Out
                                </button>
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-accent-cyan/50 p-0.5">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Archie" alt="Profile" className="rounded-full bg-slate-900 w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex w-full h-full relative z-10" style={{ marginTop: '80px', paddingTop: '20px' }}>
                <Sidebar activeItem={activeItem} setActiveItem={(item) => {
                    setActiveItem(item);
                    setActiveView('dashboard');
                }} />
                <main className="flex-1 flex overflow-hidden">
                    {activeView === 'dashboard' ? (
                        <>
                            <ChatInterface clientHint={activeItem} />
                            <LiveTriage />
                        </>
                    ) : (
                        <Settings />
                    )}
                </main>
            </div>
        </div>
    );
}

