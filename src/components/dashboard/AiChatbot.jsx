import { useState, useEffect, useRef } from "react";
import { marked } from "marked";

export default function AiChatbot() {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hey Ajmal! I'm **Octo AI**, your dashboard's intelligent companion. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState("gpt-4o-mini");
    const [webSearch, setWebSearch] = useState(false);
    const [stats, setStats] = useState({ used: 0, limit: 50000000, remaining: 50000000, loading: true });
    const [streamingContent, setStreamingContent] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const puterLoaded = useRef(false);
    const scrollRef = useRef(null);

    // Fetch real usage from Puter.js API
    const fetchRealUsage = async () => {
        try {
            await loadPuter();
            const data = await window.puter.auth.getMonthlyUsage();
            
            if (data?.allowanceInfo) {
                const limit = data.allowanceInfo.monthUsageAllowance || 50000000;
                const remaining = data.allowanceInfo.remaining || 0;
                const used = limit - remaining;

                setStats({
                    used: used,
                    limit: limit,
                    remaining: remaining,
                    loading: false
                });
            }
        } catch (err) {
            console.error("Failed to fetch real usage:", err);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    // Initial fetch when Puter is ready
    useEffect(() => {
        const initUsage = async () => {
            await loadPuter();
            fetchRealUsage();
        };
        initUsage();
        
        // Refresh usage every 60 seconds
        const interval = setInterval(fetchRealUsage, 60000);
        return () => clearInterval(interval);
    }, []);

    const models = [
        { id: "gpt-5.4", name: "GPT-5.4", icon: "hgi-brain", color: "text-violet-500" },
        { id: "gpt-5.3-chat", name: "GPT-5.3", icon: "hgi-ai-chat-01", color: "text-blue-500" },
        { id: "o3-mini", name: "O3 Mini", icon: "hgi-ai-network", color: "text-emerald-500" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", icon: "hgi-zap", color: "text-orange-500" },
        { id: "claude-3-5-sonnet", name: "Claude 3.5", icon: "hgi-star", color: "text-fuchsia-500" }
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamingContent]);

    const loadPuter = () => {
        return new Promise((resolve) => {
            if (window.puter) { resolve(); return; }
            if (puterLoaded.current) {
                const check = setInterval(() => {
                    if (window.puter) { clearInterval(check); resolve(); }
                }, 100);
                return;
            }
            puterLoaded.current = true;
            const s = document.createElement("script");
            s.src = "https://js.puter.com/v2/";
            s.onload = () => {
                const check = setInterval(() => {
                    if (window.puter) { clearInterval(check); resolve(); }
                }, 100);
            };
            document.head.appendChild(s);
        });
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setStreamingContent("");
        setShowMenu(false); // Close menu on send

        try {
            await loadPuter();
            
            const options = { 
                model: model,
                stream: true,
                tools: webSearch ? [{ type: "web_search" }] : []
            };

            const response = await window.puter.ai.chat(
                messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                options
            );

            let fullContent = "";
            for await (const part of response) {
                if (part?.text) {
                    fullContent += part.text;
                    setStreamingContent(fullContent);
                }
            }

            setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
            setStreamingContent("");
            await fetchRealUsage();

        } catch (err) {
            console.error("AI Chat failed:", err);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error: " + err.message }]);
        } finally {
            setLoading(false);
            setStreamingContent("");
        }
    };

    return (
        <div className="w-full h-[70vh] flex flex-col animate-in fade-in zoom-in-95 duration-700">
            {/* Chat Interface */}
            <div className="flex-1 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl flex flex-col overflow-hidden shadow-sm relative">
                {/* Messages Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                >
                    {messages.map((m, idx) => (
                        <div 
                            key={idx}
                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[90%] px-5 py-3 rounded-2xl text-sm font-product-sans leading-relaxed ${
                                m.role === 'user' 
                                    ? 'bg-accent text-white rounded-tr-none shadow-md shadow-accent/10' 
                                    : 'bg-gray-50 dark:bg-black/40 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-neutral-800'
                            }`}>
                                <div 
                                  className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-code:text-accent dark:prose-code:text-white"
                                  dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }}
                                />
                            </div>
                        </div>
                    ))}
                    
                    {streamingContent && (
                        <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
                            <div className="max-w-[90%] px-5 py-3 rounded-2xl rounded-tl-none bg-gray-50 dark:bg-black/40 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-neutral-800">
                                <div 
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: marked.parse(streamingContent + " ⬤") }}
                                />
                            </div>
                        </div>
                    )}

                    {loading && !streamingContent && (
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center animate-pulse">
                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></span>
                            </div>
                            <div className="bg-gray-50 dark:bg-neutral-800/40 h-10 w-32 rounded-2xl rounded-tl-none animate-pulse"></div>
                        </div>
                    )}
                </div>

                {/* Integrated Menu (Dropdown above input) */}
                {showMenu && (
                    <div className="absolute bottom-20 left-4 right-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-neutral-800/50 rounded-3xl p-6 shadow-2xl z-50 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Model Selection */}
                            <div className="flex flex-col gap-3">
                                <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                    <i className="hgi-stroke hgi-brain text-xs"></i>
                                    Model Engine
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {models.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { setModel(m.id); setShowMenu(false); }}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[11px] font-bold font-product-sans transition-all duration-300 border ${
                                                model === m.id
                                                    ? "bg-accent/[0.03] border-accent/20 text-accent"
                                                    : "bg-gray-50 dark:bg-black/20 border-transparent text-gray-500 hover:border-gray-200 dark:hover:border-neutral-800"
                                            }`}
                                        >
                                            <i className={`hgi-stroke ${m.icon} ${model === m.id ? 'text-accent' : 'text-gray-400'}`}></i>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Capabilities & Stats */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <i className="hgi-stroke hgi-globe text-xs"></i>
                                        Capabilities
                                    </h4>
                                    <button 
                                        onClick={() => setWebSearch(!webSearch)}
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                                            webSearch ? "bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-500" : "bg-gray-50 dark:bg-black/20 border-transparent text-gray-500"
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold font-product-sans">Web Search</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${webSearch ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-neutral-800'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${webSearch ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <i className="hgi-stroke hgi-analytics-up text-xs"></i>
                                        Resources
                                    </h4>
                                    <div className="flex items-center justify-between text-[11px] font-bold font-product-sans">
                                        <span className="text-gray-400">Remaining</span>
                                        <span className="text-gray-900 dark:text-white">{(stats.remaining / 1000000).toFixed(2)}M Credits</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${Math.min((stats.used / stats.limit) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <form 
                    onSubmit={handleSend}
                    className="p-4 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-neutral-800 flex items-center gap-3 relative"
                >
                    <button 
                        type="button"
                        onClick={() => setShowMenu(!showMenu)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${showMenu ? 'bg-accent text-white' : 'text-gray-400 hover:text-accent hover:bg-accent/5'}`}
                        title="AI Settings"
                    >
                         <i className={`hgi-stroke ${showMenu ? 'hgi-cancel-01' : 'hgi-menu-01'} text-lg`}></i>
                    </button>
                    
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 py-2 flex items-center gap-2 focus-within:border-accent transition-colors shadow-sm">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setShowMenu(false)}
                            placeholder={webSearch ? "Search the web..." : "Type your message..."}
                            className="flex-1 bg-transparent border-none outline-none font-product-sans text-sm text-gray-900 dark:text-white placeholder:text-gray-400 py-1"
                        />
                        <button 
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-8 h-8 bg-accent hover:scale-105 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:scale-100 flex-shrink-0"
                        >
                            <i className={`hgi-stroke ${loading ? 'hgi-loading animate-spin' : 'hgi-sent'} text-sm`}></i>
                        </button>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setMessages([{ role: "assistant", content: "Chat cleared. Start fresh!" }])}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear History"
                    >
                         <i className="hgi-stroke hgi-delete-02 text-lg"></i>
                    </button>
                </form>
            </div>
        </div>
    );
}
