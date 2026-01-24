"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import LiveTriage from '@/components/LiveTriage';

export default function Dashboard() {
    return (
        <div className="flex bg-bg-secondary w-full h-screen overflow-hidden">
            {/* Search Header Overlay (Subtle) */}
            <div className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800 flex items-center justify-between px-6 z-10 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <span className="text-accent-orange font-bold text-xl">A</span>
                    <span className="text-white font-bold tracking-tight">Asai Analytics</span>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="glass-card flex items-center gap-2 px-3 py-1.5">
                        <span className="text-slate-500 text-xs">🔍</span>
                        <input
                            type="text"
                            placeholder="Global Search..."
                            className="bg-transparent border-none outline-none text-xs w-64 text-text-primary"
                        />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        🔔
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-accent-cyan/50">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Archie" alt="Profile" />
                    </div>
                </div>
            </div>

            <div className="flex w-full pt-16">
                <Sidebar />
                <ChatInterface />
                <LiveTriage />
            </div>
        </div>
    );
}
