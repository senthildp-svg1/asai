"use client";

import React from 'react';

export default function Sidebar() {
    const categories = [
        { name: 'CLIENTS', count: '1,254', items: ['Acme Corp', 'Global Build', 'Metro Infrastructure'] },
        { name: 'PRODUCTS', count: '1,254', items: ['Heavy Machinery', 'Safety Equipment', 'Building Materials'] },
        { name: 'DOMAIN', count: '532', items: ['Regulations', 'Contracts', 'Technical Specs'] },
    ];

    return (
        <aside className="w-80 h-full flex flex-col p-4 gap-6 border-r border-slate-800 bg-secondary/50 backdrop-blur-xl">
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full bg-slate-900/50 border border-slate-700 p-2 pl-8 rounded-md text-sm outline-none focus:border-cyan-500"
                    />
                    <span className="absolute left-2 top-2 text-slate-500">
                        🔍
                    </span>
                </div>
            </div>

            <nav className="flex flex-col gap-8">
                {categories.map((cat) => (
                    <div key={cat.name} className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-text-secondary text-xs font-bold tracking-widest">{cat.name} ({cat.count})</h3>
                            <span className="text-slate-600 text-[10px]">•••</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {cat.items.map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer text-sm transition-fast group"
                                >
                                    <span className="text-accent-cyan opacity-40 group-hover:opacity-100">📁</span>
                                    <span className="flex-1">{item}</span>
                                    <span className="text-slate-600">⌵</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-auto p-4 glass-card text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-text-secondary">System Health</span>
                    <span className="text-green-500">●</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-accent-cyan h-full w-[85%]"></div>
                </div>
            </div>
        </aside>
    );
}
