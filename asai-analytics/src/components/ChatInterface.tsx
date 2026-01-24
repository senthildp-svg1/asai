"use client";

import React, { useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: {
        id: number;
        title: string;
        details: string;
        color: string;
    }[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Based on your request regarding the "Project Phoenix" structural integrity report, here is a summary of key findings and related documents.',
            citations: [
                { id: 1, title: 'Phoenix_Foundation_Analysis_v3.pdf', details: 'Pages 12-15: Soil load bearing capacity confirms requirements.', color: 'orange' },
                { id: 2, title: 'Subcontractor_Agreement_V2.docx', details: 'Section 4.1: Architect approved revised beam specifications.', color: 'cyan' },
            ]
        }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', content: input }]);
        setInput('');
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-secondary/30 backdrop-blur-sm relative">
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-800 h-16">
                <h2 className="text-sm font-bold flex items-center gap-2">
                    <span className="text-accent-cyan text-lg">AI</span> Assistance
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Online
                    </div>
                    <span className="text-slate-600 text-xs">•••</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center text-accent-orange font-bold text-xs ring-1 ring-accent-orange/50">
                                A
                            </div>
                        )}
                        <div className={`flex flex-col gap-4 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-accent-orange text-white' : 'glass-card text-text-primary'}`}>
                                {msg.content}
                            </div>

                            {msg.citations && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Source Citations</p>
                                    {msg.citations.map((cite) => (
                                        <div key={cite.id} className={`p-3 rounded-lg border border-${cite.color === 'orange' ? 'accent-orange' : 'accent-cyan'}/30 bg-${cite.color === 'orange' ? 'accent-orange' : 'accent-cyan'}/5 flex flex-col gap-1 transition-fast hover:bg-slate-800/50 cursor-pointer`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-bold text-accent-${cite.color}`}>Citation {cite.id}: [{cite.title.split('.').pop()?.toUpperCase()}] {cite.title}</span>
                                                <span className="text-slate-500">🔗</span>
                                            </div>
                                            <p className="text-xs text-text-secondary">{cite.details}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" alt="User" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-800">
                <div className="relative glass-card overflow-hidden">
                    <input
                        type="text"
                        placeholder="Ask Asai about your construction projects, documents, or data..."
                        className="w-full bg-transparent p-4 pr-16 text-sm outline-none placeholder:text-slate-500"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-lg bg-accent-orange text-white hover:bg-orange-600 transition-fast"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
