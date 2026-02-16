"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

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
    const [user] = useAuthState(auth);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<Category[]>([
        { name: 'CLIENTS', count: '0', items: [] },
        { name: 'PRODUCTS', count: '0', items: [] },
        { name: 'DOMAIN', count: '0', items: [] },
    ]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.uid);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            alert(`File '${file.name}' indexed successfully! ${data.extracted?.client ? `Classified under ${data.extracted.client}` : ''}`);
        } catch (error: any) {
            console.error("Upload error:", error);
            alert("Upload failed: " + error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        <aside
            className="w-80 h-full flex flex-col p-6 gap-6 border-r border-slate-800/40 relative z-30 shrink-0"
            style={{
                backgroundColor: '#05070a',
                zIndex: 30,
                paddingTop: '40px' // Added extra padding here
            }}
        >
            {/* 1. SEARCH & CATEGORIES HEADER */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Document Categories</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700/50 p-3 pl-10 rounded-lg text-xs outline-none focus:border-cyan-500 transition-fast text-white"
                    />
                    <span className="absolute left-3 top-3.5 text-slate-500 text-xs">
                        🔍
                    </span>
                </div>
            </div>

            {/* 2. UPLOAD BUTTON SECTION (MOVED BELOW SEARCH FOR SAFETY) */}
            <div className="flex flex-col gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,image/*"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 shadow-xl group border-2 border-cyan-500/50"
                    style={{
                        backgroundColor: '#0891b2',
                        color: 'white',
                        fontWeight: '900',
                        fontSize: '12px'
                    }}
                >
                    <span className="text-xl group-hover:scale-125 transition-transform">
                        {isUploading ? '⏳' : '📥'}
                    </span>
                    <span className="uppercase tracking-widest">
                        {isUploading ? 'Uploading...' : 'Sync Local Data'}
                    </span>
                </button>
            </div>

            {/* 3. CATEGORY LIST */}
            <nav className="flex-1 flex flex-col gap-10 overflow-y-auto pr-2">
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
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer text-xs transition-fast group border text-left bg-transparent ${activeItem === item ? 'bg-cyan-500/20 border-cyan-500/40 shadow-lg' : 'hover:bg-cyan-500/10 border-transparent hover:border-cyan-500/20'}`}
                                    style={{ outline: 'none' }}
                                >
                                    <div className={`w-6 h-6 rounded bg-slate-800/80 flex items-center justify-center ${activeItem === item ? 'bg-cyan-500/30' : 'group-hover:bg-cyan-500/20'}`}>
                                        <span className={`text-cyan-400 transition-fast ${activeItem === item ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>📁</span>
                                    </div>
                                    <span className={`flex-1 transition-fast ${activeItem === item ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'}`}>{item}</span>
                                    <span className={activeItem === item ? 'text-cyan-500' : 'text-slate-600 group-hover:text-slate-400'}>⌵</span>
                                </button>
                            ))}
                            {cat.items.length === 0 && (
                                <div className="px-3 py-2 text-[10px] text-slate-600 italic">No items found</div>
                            )}
                        </div>
                    </div>
                ))}
            </nav>

            {/* 4. FOOTER / SYSTEM HEALTH */}
            <div className="mt-auto pt-6 border-t border-slate-800/50">
                <div className="p-4 glass-card border-slate-700/30 text-[10px] flex flex-col gap-3 bg-slate-900/40">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold tracking-tight">System Health</span>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-green-500 font-bold uppercase tracking-wider text-[8px]">Stable</span>
                        </div>
                    </div>
                    <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden border border-slate-700/30">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[85%] shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
