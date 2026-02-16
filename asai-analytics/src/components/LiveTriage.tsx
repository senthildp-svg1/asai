"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface Activity {
    time: string;
    type: string;
    title: string;
    details: string;
    status: string;
    icon: string;
}

export default function LiveTriage() {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const acts = snapshot.docs.map(doc => {
                const data = doc.data();
                // Map Firestore data to UI format
                return {
                    time: data.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now',
                    type: data.type || 'new',
                    title: data.title || 'Notification:',
                    details: data.details || '',
                    status: data.status || 'Complete',
                    icon: data.type === 'sync' ? '☁️' : data.type === 'alert' ? '⚠️' : '📄'
                } as Activity;
            });
            setActivities(acts);
        });

        return () => unsubscribe();
    }, []);


    return (
        <aside className="w-full h-full flex flex-col p-6 gap-6 bg-secondary/30 backdrop-blur-2xl">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase">Live Triage</h3>
                <span className="text-slate-700 text-[10px] cursor-pointer hover:text-white transition-fast">•••</span>
            </div>

            <div className="flex flex-col gap-0 overflow-y-auto pr-2 relative">
                {activities.map((act, i) => (
                    <div key={i} className="flex gap-4 relative pb-8 group">
                        {/* Timeline Connector Line */}
                        {i !== activities.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-gradient-to-b from-slate-700/50 to-transparent"></div>
                        )}

                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs backdrop-blur-md border transition-fast z-10 ${act.type === 'alert' ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-slate-800/40 border-slate-700/50'}`}>
                            {act.icon}
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] text-slate-500 font-bold tracking-wider">{act.time}</span>
                                {act.type === 'sync' && <span className="text-[9px] text-green-500 font-bold bg-green-500/10 px-1 rounded-sm">✓</span>}
                            </div>
                            <h4 className="text-[11px] font-bold text-slate-200">
                                <span className={act.type === 'alert' ? 'text-orange-400' : 'text-accent-cyan/80'}>{act.title}</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                {act.details}
                            </p>
                            <div className="mt-1">
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${act.type === 'alert' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-slate-800/60 text-slate-500 border border-slate-700/40'}`}>
                                    {act.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800/40">
                <button className="w-full py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-700/60 transition-fast">
                    View Full Logs
                </button>
            </div>
        </aside>
    );
}
