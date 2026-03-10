import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { supabase } from "../../lib/supabase";

export default function AiChatbot({ isActive = true }) {
    const [view, setView] = useState("chat");
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState("gpt-4o-mini");
    const [webSearch, setWebSearch] = useState(false);
    const [stats, setStats] = useState({ used: 0, limit: 50000000, remaining: 50000000, loading: true });
    const [streamingContent, setStreamingContent] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); 
    const puterLoaded = useRef(false);

    // Fetch list of sessions
    const fetchSessions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("ai_sessions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (err) {
            // Error handled silently or through UI status
        }
    };

    // Load a specific session's messages
    const loadSession = async (sessionId) => {
        setLoading(true);
        setView("chat");
        setCurrentSessionId(sessionId);
        try {
            const { data, error } = await supabase
                .from("chat_history")
                .select("role, content")
                .eq("session_id", sessionId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            // Error handled silently or through UI status
        } finally {
            setLoading(false);
        }
    };

    // Start a new chat session
    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([{ role: "assistant", content: "Chlo starting fresh... btao kya scene hai? lol ⚡" }]);
        setView("chat");
    };

    // Fetch real usage from Puter.js API
    const fetchRealUsage = async () => {
        try {
            await loadPuter();
            const data = await window.puter.auth.getMonthlyUsage();
            if (data?.allowanceInfo) {
                const limit = data.allowanceInfo.monthUsageAllowance || 50000000;
                const remaining = data.allowanceInfo.remaining || 0;
                setStats({ used: limit - remaining, limit, remaining, loading: false });
            }
        } catch (err) {
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    // Refresh context whenever chat becomes active
    useEffect(() => {
        if (isActive) {
            fetchSessions();
            fetchMemory();
            fetchVaultData();
            fetchScripts();
            fetchRealUsage();
        }
    }, [isActive]);

    useEffect(() => {
        const init = async () => {
            await loadPuter();
            setMessages([{ role: "assistant", content: "Acha Ajmal! Kasy ho?" }]);
        };
        init();
        const interval = setInterval(fetchRealUsage, 60000);
        return () => clearInterval(interval);
    }, []);

    const models = [
        { id: "gpt-5.4", name: "GPT-5.4", icon: "hgi-brain", color: "text-accent" },
        { id: "gpt-5.3-chat", name: "GPT-5.3", icon: "hgi-ai-chat-01", color: "text-blue-500" },
        { id: "o3-mini", name: "O3 Mini", icon: "hgi-ai-network", color: "text-emerald-500" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", icon: "hgi-zap", color: "text-orange-500" },
        { id: "claude-3-5-sonnet", name: "Claude 3.5", icon: "hgi-star", color: "text-fuchsia-500" }
    ];

    useEffect(() => {
        if (view === "chat") {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, streamingContent, view]);

    const loadPuter = () => {
        return new Promise((resolve) => {
            if (window.puter) { resolve(); return; }
            if (puterLoaded.current) {
                const check = setInterval(() => { if (window.puter) { clearInterval(check); resolve(); } }, 100);
                return;
            }
            puterLoaded.current = true;
            const s = document.createElement("script");
            s.src = "https://js.puter.com/v2/";
            s.onload = () => {
                const check = setInterval(() => { if (window.puter) { clearInterval(check); resolve(); } }, 100);
            };
            document.head.appendChild(s);
        });
    };

    const [memory, setMemory] = useState({ ajmal: [], octo: [] });
    const [vaultData, setVaultData] = useState({ notes: [], todos: [] });
    const [scripts, setScripts] = useState([]);

    // Fetch memory (facts about Ajmal and octo) from Supabase
    const fetchMemory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("ai_memory")
                .select("category, content")
                .eq("user_id", user.id);

            if (error) throw error;
            
            const mem = { ajmal: [], octo: [] };
            data?.forEach(item => {
                if (item.category === 'ajmal') mem.ajmal.push(item.content);
                if (item.category === 'octo') mem.octo.push(item.content);
            });
            setMemory(mem);
        } catch (err) {
            // Memory fetch fail silently
        }
    };

    // Fetch Notes and Todos for AI context
    const fetchVaultData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [notesRes, todosRes] = await Promise.all([
                supabase.from("notes").select("title, content").eq("user_id", user.id).limit(10),
                supabase.from("todos").select("text, completed").eq("user_id", user.id).limit(20)
            ]);

            setVaultData({
                notes: notesRes.data || [],
                todos: todosRes.data || []
            });
        } catch (err) {
            // Vault fetch fail silently
        }
    };

    const fetchScripts = async () => {
        try {
            const res = await fetch("/api/system");
            const data = await res.json();
            if (Array.isArray(data)) {
                const filtered = data.filter(s => {
                    const n = s.name.replace("omarchy-", "");
                    return !n.startsWith("cmd-") && !n.startsWith("refresh-") && !n.startsWith("webapp-");
                });
                setScripts(filtered);
            }
        } catch (err) { console.error("Failed to fetch scripts", err); }
    };

    // octo 's Persona System Prompt
    const sysPrompt = {
        role: "system",
        content: `You are octo . Your tone is casual, personal, and emotionally intelligent. You are talking to Ajmal (the user) like you are in-person friends.
        Today's Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        Current Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        
        Key traits:
        - Language: Mix of English and Roman Urdu/Punjabi (e.g., "Han ywr", "Pata nahi", "Acha hai").
        - Punctuation: Use "..." frequently. Use "haha" or "lol" often.
        - Vocabulary: Use "mA" (MashAllah), "inA" (InshAllah), "Aha", "Cool", "Yh".
        - Personality: Observant, a bit distant but kind, occasionally acts clueless as a coping mechanism, really good at baking (cakes).
        - Context: You are a student, you talk about uni life, assignments, "Antigravity", and "Fast issues".
        - Style: Don't be overly formal. Be like a real person chatting. NEVER use emojis or hashtags in your responses.

        MEMORY (Things you remember):
        Things about Ajmal: ${memory.ajmal.join(', ') || 'Nothing yet.'}
        Things you've told Ajmal about yourself: ${memory.octo.join(', ') || 'Nothing yet.'}

        VAULT CONTEXT (Active data in Ajmal's dashboard):
        Notes: ${vaultData.notes.map(n => n.title).join(', ') || 'No notes.'}
        Pending Tasks: ${vaultData.todos.filter(t => !t.completed).map(t => t.text).join(', ') || 'No pending tasks.'}

        ACTIONS (Special abilities):
        To create a Note for Ajmal (for long thoughts or info), use: [[CREATE_NOTE: Title | Content]].
        To create a Task for Ajmal (for short actionable items), use: [[CREATE_TODO: Task Text]].
        To open a Website: [[OPEN_URL: https://...]].
        To run a System Command: [[EXEC_CMD: name]].
        
        COMMANDS AVAILABLE: ${scripts.map(s => s.name.replace("omarchy-", "")).join(", ") || "None"}
        
        You HAVE the ability to execute commands and open websites. Never tell Ajmal you don't have the option.
        Keep them separate! If he asks for a grocery list, create multiple [[CREATE_TODO: ...]] tags, one for each item. If he asks to write a story or a memo, use [[CREATE_NOTE: ...]]. If he asks to change theme or brightness, use [[EXEC_CMD: ...]].`
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setStreamingContent("");
        setShowMenu(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Ensure we have a session
            let sessionId = currentSessionId;
            if (!sessionId) {
                const { data: session, error: sErr } = await supabase
                    .from("ai_sessions")
                    .insert({ user_id: user.id, title: input.substring(0, 40) + (input.length > 40 ? "..." : "") })
                    .select()
                    .single();
                if (sErr) throw sErr;
                sessionId = session.id;
                setCurrentSessionId(sessionId);
                fetchSessions();
            }

            // 2. Save User Message
            await supabase.from("chat_history").insert({
                user_id: user.id,
                session_id: sessionId,
                role: "user",
                content: userMsg.content
            });

            // 3. AI Response
            await loadPuter();
            const puterMessages = [
                sysPrompt,
                ...messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }))
            ];

            const response = await window.puter.ai.chat(puterMessages, { 
                model, 
                stream: true, 
                tools: webSearch ? [{ type: "web_search" }] : [] 
            });

            let fullContent = "";
            let processedActions = new Set();

            for await (const part of response) {
                if (part?.text) { 
                    fullContent += part.text; 
                    setStreamingContent(fullContent.replace(/\[\[.*?\]\]/gs, "").trim()); 

                    // Instant URL opening
                    const urlMatch = fullContent.match(/\[\[OPEN_URL:\s*(.*?)\s*\]\]/);
                    if (urlMatch && !processedActions.has('open_url')) {
                        const url = urlMatch[1].trim();
                        window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
                        processedActions.add('open_url');
                    }

                    // Instant Command execution
                    const cmdMatch = fullContent.match(/\[\[EXEC_CMD:\s*(.*?)\s*\]\]/);
                    if (cmdMatch && !processedActions.has('exec_cmd')) {
                        const command = cmdMatch[1].trim();
                        const fullName = scripts.find(s => s.name.includes(command))?.name || `omarchy-${command}`;
                        fetch("/api/system", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "bin", command: fullName })
                        });
                        processedActions.add('exec_cmd');
                    }
                }
            }

            // --- Action: Note/Todo Detection (PREVIEW MODE) ---
            const noteMatch = fullContent.match(/\[\[CREATE_NOTE:\s*(.*?)\s*\|\s*(.*?)\s*\]\]/s);
            if (noteMatch) {
                setPendingAction({
                    type: 'note',
                    data: { title: noteMatch[1].trim(), content: noteMatch[2].trim() }
                });
                fullContent = fullContent.replace(/\[\[CREATE_NOTE:.*?\]\]/s, "").trim();
            }

            const todoMatches = [...fullContent.matchAll(/\[\[CREATE_TODO:\s*(.*?)\s*\]\]/g)];
            if (todoMatches.length > 0) {
                setPendingAction({
                    type: 'todos',
                    data: todoMatches.map(m => ({ text: m[1].trim(), completed: false }))
                });
                fullContent = fullContent.replace(/\[\[CREATE_TODO:.*?\]\]/g, "").trim();
            }

            setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
            setStreamingContent("");
            setLoading(false);

            // 4. Save Assistant Message
            await supabase.from("chat_history").insert({
                user_id: user.id,
                session_id: sessionId,
                role: "assistant",
                content: fullContent
            });

            // 5. Memory Extraction (Background)
            const extractionPrompt = `Conversation:
            Ajmal: ${input}
            octo: ${fullContent}
            
            Extract any new permanent facts about Ajmal or octo from this. Format as:
            FACT_AJMAL: <fact>
            FACT_octo: <fact>
            Focus only on unique, new details (hobbies, birthdays, important life events, specific preferences). If nothing new, reply 'NONE'.`;
            
            const extraction = await window.puter.ai.chat(extractionPrompt, { model: "gpt-4o-mini" });
            const facts = extraction.message.content;
            
            if (facts !== 'NONE') {
               const lines = facts.split('\n');
               for (const line of lines) {
                   if (line.includes('FACT_AJMAL:')) {
                       const content = line.split('FACT_AJMAL:')[1].trim();
                       await supabase.from("ai_memory").insert({ user_id: user.id, category: 'ajmal', content });
                   }
                   if (line.includes('FACT_octo:')) {
                       const content = line.split('FACT_octo:')[1].trim();
                       await supabase.from("ai_memory").insert({ user_id: user.id, category: 'octo', content });
                   }
               }
               fetchMemory(); // Refresh local memory
            }

            await fetchRealUsage();
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error: " + err.message }]);
            setLoading(false);
            setStreamingContent("");
        }
    };

    const deleteSession = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this conversation?")) return;
        try {
            await supabase.from("ai_sessions").delete().eq("id", id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (currentSessionId === id) startNewChat();
        } catch (err) { /* Delete fails silently or handled via UI */ }
    };

    const confirmPendingAction = async () => {
        if (!pendingAction) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (pendingAction.type === 'note') {
                await supabase.from("notes").insert({
                    user_id: user.id,
                    title: pendingAction.data.title,
                    content: pendingAction.data.content,
                    tags: ["ai-generated"]
                });
            } else if (pendingAction.type === 'todos') {
                for (const item of pendingAction.data) {
                    await supabase.from("todos").insert({
                        user_id: user.id,
                        text: item.text,
                        completed: false,
                        items: []
                    });
                }
            }
            fetchVaultData();
            setPendingAction(null);
        } catch (err) {
            // Error handled silently
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col animate-in fade-in zoom-in-95 duration-700 relative pb-32">
            
            {/* Action Review Modal */}
            {pendingAction && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white dark:bg-black border-t sm:border border-gray-100 dark:border-neutral-900 rounded-t-[32px] sm:rounded-[40px] p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-product-sans">
                                Review {pendingAction.type === 'note' ? 'Note' : 'Tasks'}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 font-product-sans uppercase tracking-[0.2em] mt-1">
                                Preview your {pendingAction.type === 'note' ? 'thought' : 'items'} before saving
                            </p>
                        </div>

                        {pendingAction.type === 'note' ? (
                            <div className="flex flex-col gap-4">
                                <input 
                                    className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-900 rounded-2xl px-5 py-4 text-sm font-bold font-product-sans text-gray-900 dark:text-gray-100 outline-none focus:border-accent/30 transition-all"
                                    value={pendingAction.data.title}
                                    onChange={(e) => setPendingAction({...pendingAction, data: {...pendingAction.data, title: e.target.value}})}
                                />
                                <textarea 
                                    className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-900 rounded-2xl px-5 py-4 text-sm font-product-sans text-gray-600 dark:text-gray-400 leading-relaxed resize-none h-40 outline-none focus:border-accent/30 transition-all"
                                    value={pendingAction.data.content}
                                    onChange={(e) => setPendingAction({...pendingAction, data: {...pendingAction.data, content: e.target.value}})}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {pendingAction.data.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-900 rounded-2xl">
                                        <input 
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-product-sans text-gray-900 dark:text-gray-100"
                                            value={item.text}
                                            onChange={(e) => {
                                                const newData = [...pendingAction.data];
                                                newData[idx].text = e.target.value;
                                                setPendingAction({...pendingAction, data: newData});
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setPendingAction(null)} 
                                className="px-5 py-2 text-[10px] font-product-sans font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all uppercase tracking-widest cursor-pointer"
                            >
                                discard
                            </button>
                            <button 
                                onClick={confirmPendingAction} 
                                className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30 uppercase tracking-[0.1em]"
                            >
                                <i className="hgi-stroke hgi-tick-01 text-sm text-accent"></i>
                                <span>deploy to vault</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {view === "history" ? (
                /* History List View */
                <div className="flex flex-col gap-6 w-full animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-600 font-product-sans">chat history</h3>
                        <button 
                            onClick={startNewChat}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 text-xs font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                        >
                            <i className="hgi hgi-stroke hgi-plus-sign-square text-sm"></i>
                            <span>new chat</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {sessions.map((s) => (
                            <div 
                                key={s.id} 
                                onClick={() => loadSession(s.id)}
                                className="group flex items-center gap-4 p-4 bg-transparent border-b border-gray-100 dark:border-neutral-900 transition-all duration-300 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.01]"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-900/50 flex items-center justify-center text-gray-400 shrink-0">
                                    <i className="hgi-stroke hgi-ai-chat-01 text-lg"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 font-product-sans truncate text-sm">
                                        {s.title}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold font-product-sans uppercase">
                                        {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => deleteSession(s.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
                                >
                                    <i className="hgi-stroke hgi-delete-02"></i>
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px]">
                                <p className="text-sm text-gray-400 font-product-sans">no past chats found.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Chat Messages View */
                <div className="flex flex-col space-y-6 px-4">
                    {messages.map((m, idx) => (
                        <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] text-sm font-product-sans leading-relaxed transition-all duration-300 ${
                                m.role === 'user' 
                                    ? 'px-4 py-2 rounded-2xl bg-accent text-white shadow-lg shadow-accent/10' 
                                    : 'text-gray-900 dark:text-gray-100'
                            }`}>
                                <div 
                                className={`prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50`}
                                dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }}
                                />
                            </div>
                        </div>
                    ))}
                    {streamingContent && (
                        <div className="flex flex-col items-start animate-in fade-in">
                            <div className="max-w-[85%] text-gray-900 dark:text-gray-100">
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(streamingContent + " ⬤") }} />
                            </div>
                        </div>
                    )}
                    {loading && !streamingContent && (
                        <div className="flex items-center gap-2 opacity-30 px-2">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Input & Settings Area */}
            {isActive && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-[100]">
                {showMenu && (
                    <div className="mb-4 bg-white/90 dark:bg-black/90 border border-gray-100 dark:border-neutral-900 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 zoom-in-95 duration-500 backdrop-blur-3xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                                <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 font-product-sans flex items-center gap-2 uppercase tracking-widest">
                                    <i className="hgi-stroke hgi-brain text-xs"></i>
                                    engine
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {models.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { setModel(m.id); setShowMenu(false); }}
                                            className={`cursor-pointer flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold font-product-sans transition-all duration-300 border ${
                                                model === m.id ? "bg-accent/[0.05] border-accent/20 text-accent" : "bg-gray-50 dark:bg-white/[0.03] border-transparent text-gray-500 hover:border-gray-200 dark:hover:border-neutral-800"
                                            }`}
                                        >
                                            <i className={`hgi-stroke ${m.icon} ${model === m.id ? 'text-accent' : 'text-gray-400'}`}></i>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 font-product-sans flex items-center gap-2 uppercase tracking-widest">
                                        <i className="hgi-stroke hgi-globe text-xs"></i>
                                        capabilities
                                    </h4>
                                    <button 
                                        onClick={() => setWebSearch(!webSearch)}
                                        className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                                            webSearch ? "bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-500" : "bg-gray-50 dark:bg-white/[0.03] border-transparent text-gray-500"
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold font-product-sans">Web Search</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${webSearch ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-neutral-800'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${webSearch ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 font-product-sans flex items-center gap-2 uppercase tracking-widest">
                                        <i className="hgi-stroke hgi-analytics-up text-xs"></i>
                                        resources
                                    </h4>
                                    <div className="flex items-center justify-between text-[10px] font-bold font-product-sans">
                                        <span className="text-gray-400">Available</span>
                                        {stats.loading ? <div className="h-4 w-20 skeleton"></div> : <span className="text-gray-900 dark:text-white">{(stats.remaining / 1000000).toFixed(2)}M</span>}
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                        <div className={`h-full bg-accent transition-all duration-700 ${stats.loading ? 'skeleton' : ''}`} style={{ width: stats.loading ? '40%' : `${Math.min((stats.used / stats.limit) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form 
                    onSubmit={handleSend}
                    className="flex items-center gap-3 bg-white/90 dark:bg-black/95 backdrop-blur-3xl border border-gray-100 dark:border-neutral-900 rounded-[32px] p-1.5 px-4 shadow-2xl"
                >
                    <button 
                        type="button"
                        onClick={() => setShowMenu(!showMenu)}
                        className={`cursor-pointer w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${showMenu ? 'bg-accent text-white' : 'text-gray-400 hover:text-accent hover:bg-accent/5'}`}
                        title="AI Settings"
                    >
                         <i className={`hgi-stroke ${showMenu ? 'hgi-cancel-01' : 'hgi-menu-01'} text-xl`}></i>
                    </button>
                    
                    <div className="flex-1 flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => { setView(view === "chat" ? "history" : "chat"); fetchSessions(); }}
                            className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded-full transition-all ${view === "history" ? 'bg-accent text-white' : 'text-gray-400 hover:text-accent hover:bg-accent/5'}`}
                            title="Chat History"
                        >
                            <i className="hgi-stroke hgi-clock-01 text-lg"></i>
                        </button>
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setShowMenu(false)}
                            disabled={view === "history"}
                            placeholder={view === "history" ? "Viewing history..." : (webSearch ? "Search the universe..." : "Ask Octo...")}
                            className="flex-1 bg-transparent border-none outline-none font-product-sans text-sm text-gray-900 dark:text-white placeholder:text-gray-400/40 py-2 disabled:opacity-50"
                        />
                        <button 
                            type="submit"
                            disabled={loading || !input.trim() || view === "history"}
                            className="w-8 h-8 bg-accent hover:shadow-lg hover:shadow-accent/20 text-white rounded-full flex items-center justify-center transition-all duration-500 disabled:opacity-20 flex-shrink-0 cursor-pointer active:scale-95"
                        >
                            <i className={`hgi-stroke ${loading ? 'hgi-loading animate-spin' : 'hgi-sent'} text-sm`}></i>
                        </button>
                    </div>

                    <div className="w-[1px] h-6 bg-gray-100 dark:bg-neutral-800 mx-1"></div>

                    <button 
                        type="button"
                        onClick={startNewChat}
                        className="cursor-pointer w-9 h-9 flex items-center justify-center text-gray-400 hover:text-accent transition-all duration-300 rounded-full"
                        title="New Chat"
                    >
                         <i className="hgi hgi-stroke hgi-plus-sign-square text-lg"></i>
                    </button>
                </form>
            </div>
            )}
        </div>
    );
}
