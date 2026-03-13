import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

export default function AiVoiceAssistant({ isActive }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const puterLoaded = useRef(false);
    const [scripts, setScripts] = useState([]);
    const [memory, setMemory] = useState({ ajmal: [], octo: [] });
    const [vaultData, setVaultData] = useState({ notes: [], todos: [] });
    const isProcessing = useRef(false);
    const musicWasPlaying = useRef(false);
    const cancelRequest = useRef(false);

    const controlSpotify = async (command) => {
        try {
            if (command === "check") {
                const res = await fetch("/api/spotify");
                const data = await res.json();
                return data.isPlaying;
            }
            await fetch(`/api/spotify?command=${command}`, { method: "POST" });
        } catch (e) {}
    };

    useEffect(() => {
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
        loadPuter();
    }, []);

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
        } catch (err) { /* silent */ }
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
        } catch (err) { /* silent */ }
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

    useEffect(() => {
        const prewarmDenoise = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: { noiseSuppression: true, echoCancellation: true } 
                });
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {}
        };
        
        prewarmDenoise();
        fetchScripts();
        fetchMemory();
        fetchVaultData();
    }, [isActive]);

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            setError(`Recognition error: ${event.error}`);
            setIsListening(false);
        };
    }, []);

    const toggleListening = async () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setTranscript("");
            setAiResponse("");
            setError(null);

            // Pause music if playing
            const isPlaying = await controlSpotify("check");
            if (isPlaying) {
                musicWasPlaying.current = true;
                await controlSpotify("pause");
            } else {
                musicWasPlaying.current = false;
            }

            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const processCommand = async (text) => {
        if (!text || isProcessing.current) return;
        isProcessing.current = true;
        setLoading(true);
        setAiResponse("");
        setError(null);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const scriptList = scripts.map(s => s.name.replace("omarchy-", "")).join(", ");
            const sysPrompt = `You are octo, a human girl and Ajmal's close friend. 
            NEVER refer to yourself as an AI or a bot. You are human. 
            Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            Current Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}

            Tone: Very casual, personal, and friendly. 
            Language: Mix English/Urdu/Punjabi (e.g., "Han ywr", "Acha", "mA", "inA"). 
            
            Actions:
            - Create Note: [[CREATE_NOTE: Title | Content]]
            - Create Task: [[CREATE_TODO: Task Text]]
            - Create Blog Post: [[CREATE_POST: Title | Content | Description | Keywords | Social Image URL]]
            - Social Image URL: Use a high-quality landscape Unsplash image related to the topic.
            - Open Website: [[OPEN_URL: https://...]]
            - Run Command: [[EXEC_CMD: name]]
            Commands list: ${scriptList}
            
            Keep replies very short (1-2 sentences). Use "..." and "haha" or "lol". 
            NEVER use emojis or hashtags.
            You HAVE the ability to execute commands and open websites. Never say you don't have the option.
            Put tags at the very END.`;

            const puterMessages = [
                { role: "system", content: sysPrompt },
                ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: text }
            ];

            const response = await window.puter.ai.chat(puterMessages, { stream: true, model: 'gpt-4o-mini' });
            let fullContent = "";
            let processedActions = new Set();
            
            for await (const part of response) {
                if (!isProcessing.current) break;
                if (part?.text) {
                    fullContent += part.text;
                    const cleanResponse = fullContent.replace(/\[\[[^\]]*\]\]?/g, "").trim();
                    setAiResponse(cleanResponse);

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

            // Persistence actions at the end
            if (!isProcessing.current) return;
            const noteMatch = fullContent.match(/\[\[CREATE_NOTE:\s*(.*?)\s*\|\s*(.*?)\s*\]\]/s);
            if (noteMatch) {
                await supabase.from("notes").insert({
                    user_id: user.id,
                    title: noteMatch[1].trim(),
                    content: noteMatch[2].trim(),
                    tags: ["voice-generated"]
                });
            }
            const todoMatch = fullContent.match(/\[\[CREATE_TODO:\s*(.*?)\s*\]\]/);
            if (todoMatch) {
                await supabase.from("todos").insert({
                    user_id: user.id,
                    text: todoMatch[1].trim(),
                    completed: false,
                    items: []
                });
            }

            const postMatch = fullContent.match(/\[\[CREATE_POST:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]\]/s);
            if (postMatch) {
                await supabase.from("posts").insert([{
                    title: postMatch[1].trim(),
                    content: postMatch[2].trim(),
                    description: postMatch[3].trim(),
                    keywords: postMatch[4].trim().split(",").map(k => k.trim()).filter(Boolean),
                    social_image: postMatch[5].trim(),
                    slug: postMatch[1].trim().toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
                    read_time: Math.max(1, Math.ceil(postMatch[2].trim().split(/\s+/).length / 200)),
                    is_published: false,
                    date: new Date().toISOString()
                }]);
            }

            // Save conversation history
            const cleanFinal = fullContent.replace(/\[\[[^\]]*\]\]?/g, "").trim();
            setMessages(prev => [...prev.slice(-10), { role: "user", content: text }, { role: "assistant", content: cleanFinal }]);
        } catch (err) {
            console.error("Voice processing error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            isProcessing.current = false;
            setTranscript("");
            
            // Resume music if it was playing before
            if (musicWasPlaying.current) {
                await controlSpotify("play");
                musicWasPlaying.current = false;
            }
        }
    };

    const handleCancel = async () => {
        cancelRequest.current = true;
        if (isListening) recognitionRef.current.stop();
        setTranscript("");
        setAiResponse("");
        setError(null);
        setLoading(false);
        isProcessing.current = false;

        // Resume music if it was playing before
        if (musicWasPlaying.current) {
            await controlSpotify("play");
            musicWasPlaying.current = false;
        }
    };

    useEffect(() => {
        if (!isListening && transcript && !loading) {
            if (cancelRequest.current) {
                cancelRequest.current = false;
                setTranscript("");
                return;
            }
            processCommand(transcript);
        } else if (!isListening && !loading && !isProcessing.current && musicWasPlaying.current) {
            // Resume if we stopped listening but didn't trigger a command (e.g. silent or manual stop)
            controlSpotify("play");
            musicWasPlaying.current = false;
        }
    }, [isListening]);

    return (
        <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                    {isListening && (
                        <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping scale-150 opacity-30"></div>
                    )}
                    {isListening && (
                        <div className="absolute inset-0 bg-accent/10 rounded-full animate-ping [animation-delay:0.5s] scale-[2] opacity-20"></div>
                    )}

                    <button
                        onClick={toggleListening}
                        disabled={loading}
                        className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl cursor-pointer ${
                            isListening 
                                ? "bg-accent text-white scale-110 shadow-accent/40" 
                                : "bg-white dark:bg-neutral-900 text-gray-400 dark:text-neutral-500 hover:text-accent hover:border-accent/30 border border-gray-100 dark:border-neutral-800"
                        }`}
                    >
                        <i className={`hgi hgi-stroke ${isListening ? 'hgi-mic-01 animate-pulse' : 'hgi-mic-01'} text-5xl`}></i>
                    </button>
                </div>

                {(isListening || transcript || aiResponse || error || loading) && (
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-neutral-950 text-[10px] font-product-sans font-bold text-gray-400 dark:text-neutral-600 hover:text-red-500 hover:bg-red-500/10 border border-gray-200 dark:border-neutral-800 transition-all duration-300 animate-in fade-in slide-in-from-top-2 cursor-pointer uppercase tracking-widest"
                    >
                        <i className="hgi hgi-stroke hgi-cancel-01 text-xs"></i>
                        cancel
                    </button>
                )}
            </div>

            <div className="flex flex-col items-center gap-4 text-center max-w-lg px-4">
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-500 font-product-sans uppercase tracking-[0.2em]">
                        {isListening ? (
                            <span className="flex items-center gap-2 animate-pulse text-accent">
                                <i className="hgi-stroke hgi-cleaning-01 text-xs"></i>
                                denoising active
                            </span>
                        ) : loading ? (
                            <span className="flex items-center gap-2 text-emerald-500">
                                <i className="hgi-stroke hgi-ai-network text-xs animate-spin-slow"></i>
                                thinking...
                            </span>
                        ) : "octo "}
                    </h3>
                </div>
                
                {transcript && (
                    <p className="text-sm text-gray-500 dark:text-neutral-400 italic font-product-sans leading-relaxed">
                        "{transcript}"
                    </p>
                )}

                {aiResponse && (
                    <div className="mt-4 p-6 bg-accent/5 rounded-3xl border border-accent/10 animate-in slide-in-from-bottom-4 duration-500">
                        <p className="text-base text-accent font-product-sans font-bold">
                            {aiResponse}
                        </p>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-2">
                        {error}
                    </p>
                )}
                
                {!isListening && !loading && !transcript && (
                    <p className="text-[10px] text-gray-400 dark:text-neutral-600 uppercase tracking-[0.3em] font-bold">
                        Click the mic and say a command
                    </p>
                )}
            </div>
        </div>
    );
}
