"use client";

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    time?: string;
    avatar?: string;
    images?: string[]; // Array of image URLs or base64 strings
    imageNote?: string; // Note about image generation status
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

    const handleDownloadPDF = async (msg: Message) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Brand Header
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('ASAI ANALYTICS', 20, 25);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('PROJECT ELEVATION REPORT', 20, 32);

            yPos = 50;
            doc.setTextColor(30, 41, 59); // slate-800

            // Parse message content into sections based on headers
            const lines = msg.content.split('\n');
            lines.forEach((line) => {
                if (line.startsWith('# ')) {
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.text(line.replace('# ', '').toUpperCase(), 20, yPos);
                    yPos += 10;
                } else if (line.startsWith('## ')) {
                    yPos += 5;
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text(line.replace('## ', ''), 20, yPos);
                    yPos += 8;
                } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const text = line.trim().substring(2);
                    const splitText = doc.splitTextToSize(`• ${text}`, pageWidth - 40);
                    doc.text(splitText, 25, yPos);
                    yPos += (splitText.length * 5) + 2;
                } else if (line.trim().length > 0) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const splitText = doc.splitTextToSize(line.trim(), pageWidth - 40);
                    doc.text(splitText, 20, yPos);
                    yPos += (splitText.length * 5) + 3;
                }

                // Check for page overflow
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
            });

            // Add Images
            if (msg.images && msg.images.length > 0) {
                doc.addPage();
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('GENERATED ELEVATION DESIGNS', 20, 20);

                let imgY = 30;
                for (let i = 0; i < msg.images.length; i++) {
                    const imgData = msg.images[i];
                    try {
                        // Assuming images are base64 (which we now force in our backend)
                        // If it's a URL, this might fail unless we pre-fetch (but we fixed backend to send base64)
                        doc.addImage(imgData, 'JPEG', 20, imgY, 170, 110);
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'italic');
                        doc.text(`Design Option ${i + 1}`, 20, imgY + 115);
                        imgY += 125;

                        if (imgY > 250 && i < msg.images.length - 1) {
                            doc.addPage();
                            imgY = 20;
                        }
                    } catch (e) {
                        console.warn("Could not add image to PDF:", e);
                    }
                }
            }

            doc.save(`Asai_Report_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error("PDF Generation error:", err);
            alert("Could not generate PDF. Please try again.");
        }
    };

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
                images: data.images || [],
                imageNote: data.imageNote
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
        <div className="flex-1 flex flex-col bg-slate-900/10 backdrop-blur-md relative border-r border-slate-800/40 min-w-0" style={{ height: '100%', maxHeight: '100vh' }}>
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
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10" style={{ maxHeight: 'calc(100vh - 250px)' }}>
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

                            {/* Image Gallery */}
                            {msg.images && msg.images.length > 0 && (
                                <div className="flex flex-col gap-2.5 mt-3 w-full">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Generated Designs</p>
                                        <button
                                            onClick={() => handleDownloadPDF(msg)}
                                            className="text-[9px] font-bold text-accent-cyan hover:text-white transition-fast flex items-center gap-1.5 bg-accent-cyan/10 px-2 py-1 rounded border border-accent-cyan/20"
                                        >
                                            📥 Download PDF Report
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {msg.images.map((imageUrl, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-fast">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Design ${idx + 1}`}
                                                    className="w-full h-auto object-cover"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-fast">
                                                    <p className="text-[8px] text-white font-bold">Design Option {idx + 1}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Image Note */}
                            {msg.imageNote && (
                                <div className="mt-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                                    <p className="text-[10px] text-cyan-400 italic">{msg.imageNote}</p>
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
            <div className="p-8 border-t border-slate-800/40 bg-secondary/20" style={{ position: 'sticky', bottom: 0, zIndex: 50 }}>
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
