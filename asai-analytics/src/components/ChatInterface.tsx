"use client";

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    time?: string;
    avatar?: string;
    citations?: {
        id: number;
        title: string;
        details: string;
        color: string;
    }[];
}

interface ChatInterfaceProps {
    clientHint?: string;
}

export default function ChatInterface({ clientHint }: ChatInterfaceProps) {
    const [user] = useAuthState(auth);

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'user',
            content: 'Ask Asai your request garding the \'Project Phoenix\' structural integrity report, key resoments?',
            time: '09:42 AM',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'
        },
        {
            role: 'assistant',
            content: 'Based on your request regarding the "Project Phoenix" structural integrity report, here is a summary of key findings and related documents.',
            time: '09:43 AM',
            citations: [
                { id: 1, title: 'Phoenix_Foundation_Analysis_v3.pdf', details: 'Pages 12-15: Soil load bearing capacity confirms requirements.', color: 'orange' },
                { id: 2, title: 'Subcontractor_Agreement_V2.docx', details: 'Section 4.1: Architect approved revised beam specifications.', color: 'cyan' },
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsThinking(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: currentInput,
                    clientHint: clientHint,
                    userId: user?.uid
                })

            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch AI response');
            }

            const data = await response.json();

            const aiMessage: Message = {
                role: 'assistant',
                content: data.answer,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error.message}. Please check your Gemini API key or Firestore collection.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900/10 backdrop-blur-md relative border-r border-slate-800/40 min-w-0">
            {/* AI Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-800/40 h-14 bg-secondary/20">
                <h2 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-[0.2em] text-white/70">
                    <span className="text-secondary-cyan">AI</span> Assistance
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                        Online
                    </div>
                    <span className="text-slate-700 text-xs cursor-pointer hover:text-white transition-fast">•••</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10">
                <div className="flex items-center gap-4 py-2 opacity-50">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Today</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                </div>

                {messages.map((msg, i) => (
                    // ... existing message mapping
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full overflow-hidden border backdrop-blur-md flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'assistant' ? 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange' : 'bg-slate-800 border-slate-700'}`}>
                            {msg.role === 'user' ? <img src={msg.avatar} alt="User" /> : 'A'}
                        </div>
                        <div className={`flex flex-col gap-3 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                            <div className={`p-4 rounded-xl text-xs leading-relaxed border transition-fast ${msg.role === 'user' ? 'bg-slate-800/80 border-slate-700 text-slate-200 shadow-lg' : 'bg-slate-900/60 border-slate-800/50 text-slate-300'}`}>
                                {msg.content}
                            </div>

                            {msg.citations && msg.citations.length > 0 && (
                                <div className="flex flex-col gap-2.5 mt-1 w-full">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] px-1">Source Citations</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {msg.citations.map((cite) => (
                                            <div
                                                key={cite.id}
                                                onClick={() => console.log(`Selected citation: ${cite.title}`)}
                                                className={`p-3 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-2 transition-fast hover:bg-white/[0.08] hover:border-white/10 cursor-pointer group active:scale-[0.98] active:bg-white/[0.1]`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] font-bold flex items-center gap-2 ${cite.color === 'orange' ? 'text-orange-400' : 'text-cyan-400'}`}>
                                                        <span className="opacity-60">Citation {cite.id}:</span>
                                                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] uppercase">{cite.title.split('.').pop()}</span>
                                                        <span className="group-hover:translate-x-1 transition-fast">{cite.title}</span>
                                                    </span>
                                                    <span className="text-slate-600 group-hover:text-white transition-fast text-xs">🔗</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{cite.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-accent-orange/10 border border-accent-orange/30 text-accent-orange flex items-center justify-center text-xs font-bold animate-pulse">
                            A
                        </div>
                        <div className="flex flex-col gap-3 max-w-[85%]">
                            <div className="p-4 rounded-xl text-xs leading-relaxed border bg-slate-900/40 border-slate-800/30 text-slate-500 italic flex items-center gap-2">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                                <span className="animate-bounce [animation-delay:0.4s]">.</span>
                                Asai is thinking
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Overlay */}
            <div className="p-8 border-t border-slate-800/40 bg-secondary/20">
                <div className="relative glass-card overflow-hidden bg-slate-800/20 border-white/10 focus-within:border-accent-cyan/60 focus-within:bg-slate-800/40 transition-fast group">
                    <div className="absolute left-4 top-4 flex items-center gap-2 text-accent-cyan/80 pointer-events-none group-focus-within:text-accent-cyan">
                        🎙️
                    </div>
                    <input
                        type="text"
                        placeholder="Ask Asai about your construction projects, documents, or data..."
                        className="w-full bg-transparent p-4 pl-12 pr-16 text-sm outline-none placeholder:text-slate-400 text-white font-medium"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-2 top-2 bottom-2 px-4 flex items-center justify-center rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan hover:text-white transition-fast border border-accent-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
