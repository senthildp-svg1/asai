"use client";

import React from 'react';

export default function LiveTriage() {
    const activities = [
        { time: '10:45 AM', type: 'sync', title: 'OneDrive Sync', details: 'Site_Photos_Nov2023 folder updated (24 files synced).', status: 'Complete', icon: '☁️' },
        { time: '10:42 AM', type: 'alert', title: 'AI Alert', details: 'Potential compliance issue detected in Subcontractor_Agreement_V2.docx regarding labor safety clauses.', status: 'Review Required', icon: '⚠️' },
        { time: '10:38 AM', type: 'new', title: 'New Document', details: 'Steel_Beam_Specs_RevisionA.pdf uploaded by John D. to Products category.', status: 'Indexed', icon: '📄' },
    ];

    return (
        <aside className="w-80 h-full flex flex-col p-4 gap-6 border-l border-slate-800 bg-secondary/50 backdrop-blur-xl">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-text-secondary text-xs font-bold tracking-widest">LIVE TRIAGE</h3>
                <span className="text-slate-600 text-[10px]">•••</span>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto">
                {activities.map((act, i) => (
                    <div key={i} className="flex gap-3 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm glass-card ${act.type === 'alert' ? 'border-orange-500/50' : 'border-slate-700'}`}>
                            {act.icon}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] text-slate-500 font-bold">{act.time}</span>
                                {act.type === 'sync' && <span className="text-[10px] text-green-500 font-bold">✓</span>}
                            </div>
                            <h4 className="text-xs font-bold text-white">{act.title}</h4>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                                {act.details}
                            </p>
                            <div className="mt-1 flex items-center gap-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${act.type === 'alert' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {act.status}
                                </span>
                            </div>
                        </div>
                        {i !== activities.length - 1 && (
                            <div className="absolute left-4 top-10 bottom-[-24px] w-[1px] bg-slate-800"></div>
                        )}
                    </div>
                ))}
            </div>
        </aside>
    );
}
