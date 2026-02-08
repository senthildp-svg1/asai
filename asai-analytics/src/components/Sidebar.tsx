"use client";

import React, { useEffect, useState } from 'react';
import { seedDatabase } from '@/lib/seed-util';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface SidebarProps {
    activeItem: string;
    setActiveItem: (item: string) => void;
}

interface Category {
    name: string;
    count: string;
    items: string[];
}

export default function Sidebar({ activeItem, setActiveItem }: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSeeding, setIsSeeding] = useState(false);
    const [categories, setCategories] = useState<Category[]>([
        { name: 'CLIENTS', count: '0', items: [] },
        { name: 'PRODUCTS', count: '0', items: [] },
        { name: 'DOMAIN', count: '0', items: [] },
    ]);

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            await seedDatabase();
            alert("Database seeded successfully!");
        } catch (error: any) {
            console.error("Seeding error:", error);
            alert("Seeding failed: " + error.message);
        } finally {
            setIsSeeding(false);
        }
    };

    useEffect(() => {

        const unsubscribe = onSnapshot(collection(db, "documents"), (snapshot) => {
            const clients = new Set<string>();
            const products = new Set<string>();
            const domains = new Set<string>();

            snapshot.docs.forEach(doc => {
                const metadata = doc.data().metadata;
                if (metadata) {
                    if (metadata.client) clients.add(metadata.client);
                    if (metadata.product) products.add(metadata.product);
                    if (metadata.domain) domains.add(metadata.domain);
                }
            });

            setCategories([
                { name: 'CLIENTS', count: clients.size.toLocaleString(), items: Array.from(clients).sort() },
                { name: 'PRODUCTS', count: products.size.toLocaleString(), items: Array.from(products).sort() },
                { name: 'DOMAIN', count: domains.size.toLocaleString(), items: Array.from(domains).sort() },
            ]);
        });

        return () => unsubscribe();
    }, []);


    return (
        <aside className="w-80 h-full flex flex-col p-6 gap-6 border-r border-slate-800/40 bg-secondary/30 backdrop-blur-2xl relative z-20" style={{ zIndex: 20 }}>
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Document Categories</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search document categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/40 border border-slate-700/50 p-2.5 pl-9 rounded-lg text-xs outline-none focus:border-cyan-500/50 transition-fast"
                    />
                    <span className="absolute left-3 top-3 text-slate-500 text-xs">
                        🔍
                    </span>
                </div>
            </div>

            <nav className="flex flex-col gap-10 overflow-y-auto pr-2">
                {categories.map((cat) => (
                    <div key={cat.name} className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-white/90 text-[10px] font-bold tracking-[0.2em]">{cat.name} <span className="text-slate-400 ml-1">({cat.count} Docs)</span></h3>
                            <span className="text-slate-600 text-[10px] cursor-pointer hover:text-white transition-fast">•••</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {cat.items.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        setActiveItem(item);
                                    }}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-xs transition-fast group border text-left bg-transparent ${activeItem === item ? 'bg-accent-cyan/20 border-accent-cyan/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'hover:bg-accent-cyan/10 border-transparent hover:border-accent-cyan/20'}`}
                                    style={{ outline: 'none' }}
                                >
                                    <div className={`w-6 h-6 rounded bg-slate-800/80 flex items-center justify-center ${activeItem === item ? 'bg-accent-cyan/30' : 'group-hover:bg-accent-cyan/20'}`}>
                                        <span className={`text-accent-cyan transition-fast ${activeItem === item ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>📁</span>
                                    </div>
                                    <span className={`flex-1 transition-fast ${activeItem === item ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'}`}>{item}</span>
                                    <span className={activeItem === item ? 'text-accent-cyan' : 'text-slate-600 group-hover:text-slate-400'}>⌵</span>
                                </button>
                            ))}
                            <div className="p-2 px-10 text-[10px] text-accent-cyan/60 font-medium cursor-pointer hover:text-accent-cyan transition-fast">
                                More...
                            </div>
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-4 flex flex-col gap-2">
                <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="w-full py-2 rounded-lg bg-accent-orange/20 border border-accent-orange/40 text-[10px] text-accent-orange font-bold uppercase tracking-widest hover:bg-accent-orange/30 transition-fast disabled:opacity-50"
                >
                    {isSeeding ? 'Seeding...' : 'Seed Database'}
                </button>
            </div>

            <div className="mt-auto p-4 glass-card border-slate-700/30 text-[10px] flex flex-col gap-3 bg-slate-900/40">
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold tracking-tight">System Health</span>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-green-500 font-bold uppercase tracking-wider text-[8px]">Stable</span>
                    </div>
                </div>
                <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden border border-slate-700/30">
                    <div className="bg-gradient-to-r from-accent-cyan to-cyan-400 h-full w-[85%] shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                </div>
            </div>
        </aside>
    );
}
