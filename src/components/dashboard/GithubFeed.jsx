import { useState, useEffect, useRef } from "react";

export default function GithubFeed() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState("");
    const [summarizing, setSummarizing] = useState(false);
    const puterLoaded = useRef(false);
    const username = "theajmalrazaq";

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

    const generateSummary = async (feedEntries) => {
        if (!feedEntries || feedEntries.length === 0) return;
        setSummarizing(true);
        try {
            await loadPuter();
            const titles = feedEntries.map(e => e.title.replace(/<[^>]*>/g, '')).join("\n");
            const prompt = `You are a dashboard assistant for Ajmal (@theajmalrazaq). Summarize the following "GitHub Network Feed" in 2 concise sentences. 
            
            IMPORTANT: This feed contains activity from both Ajmal AND people he follows. Do NOT attribute everything to Ajmal. Be specific about who did what (e.g., "T8RIN released..." or "Ajmal pushed..."). If there is a lot of activity, summarize the general trend (e.g., "Your network is active in ImageToolbox..."). 
            
            Use bold text for key technologies, project names, or usernames.
            
            Feed Activities:
            ${titles}`;
            
            const response = await window.puter.ai.chat(prompt, {
                model: "gpt-4.1-nano",
            });

            // Handle various Puter.js response formats
            let text = "";
            if (typeof response === "string") {
                text = response;
            } else if (response?.message?.content) {
                const c = response.message.content;
                text = typeof c === "string" ? c : Array.isArray(c) ? c.map(b => b.text || "").join("") : String(c);
            } else if (response?.text) {
                text = response.text;
            } else {
                text = JSON.stringify(response);
            }
            
            setSummary(text.trim());
        } catch (err) {
            console.error("Summary failed:", err);
        } finally {
            setSummarizing(false);
        }
    };

    useEffect(() => {
        const fetchGithubFeed = async () => {
            try {
                const response = await fetch('/api/github-feed');
                if (response.ok) {
                    const data = await response.json();
                    setEntries(data);
                    // Generate AI summary once we have entries
                    generateSummary(data);
                }
            } catch (error) {
                console.error("Error fetching GitHub feed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGithubFeed();
    }, []);

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
        }
        if (seconds < 172800) return "yesterday";
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-200 dark:border-neutral-800 border-t-accent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold font-product-sans text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <i className="hgi-stroke hgi-github text-lg"></i>
                        GitHub Feed
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-neutral-500 font-product-sans">Dashboard Timeline</p>
                </div>
                <div className="flex items-center gap-2">
                    {summarizing && (
                         <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/5 border border-violet-500/20 rounded-full">
                            <span className="w-2 h-2 border border-violet-500 border-t-transparent rounded-full animate-spin"></span>
                            <span className="text-[9px] font-bold text-violet-500 font-product-sans uppercase tracking-wider">AI Thinking...</span>
                         </div>
                    )}
                    <a 
                        href={`https://github.com/${username}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-accent hover:underline bg-accent/5 px-3 py-1.5 rounded-full border border-accent/10"
                    >
                        Profile →
                    </a>
                </div>
            </div>

            {summary && (
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.03] border border-violet-500/10 rounded-2xl p-5 mb-2 group animate-in zoom-in-95 duration-500">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="hgi-stroke hgi-magic-wand-01 text-4xl text-violet-500"></i>
                    </div>
                    <div className="flex flex-col gap-2 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-violet-500/80 font-product-sans uppercase tracking-[0.2em]">AI Intelligence</span>
                            <div className="h-[1px] flex-1 bg-violet-500/10"></div>
                        </div>
                        <p 
                            className="text-[13px] text-gray-600 dark:text-gray-300 font-product-sans leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: summary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>') }}
                        />
                    </div>
                </div>
            )}

            <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gradient-to-b before:from-accent/30 before:via-gray-100 dark:before:via-neutral-800 before:to-transparent">
                {entries.map((entry) => (
                    <div 
                        key={entry.id || Math.random()}
                        className="group relative"
                    >
                        {/* Dot on time line */}
                        <div className="absolute -left-[33px] top-1 w-[22px] h-[22px] rounded-full bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 flex items-center justify-center z-10 group-hover:border-accent group-hover:scale-110 transition-all duration-300">
                             {entry.thumbnail ? (
                                <img 
                                    src={entry.thumbnail} 
                                    className="w-4 h-4 rounded-full" 
                                    alt="" 
                                />
                            ) : (
                                <i className="hgi-stroke hgi-github-01 text-[10px] text-gray-400"></i>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-baseline justify-between gap-4">
                                <div 
                                    className="text-[13px] font-product-sans text-gray-600 dark:text-gray-300 leading-snug [&>a]:font-bold [&>a]:text-gray-900 [&>a]:dark:text-white [&>a]:hover:text-accent [&>a]:transition-colors"
                                    dangerouslySetInnerHTML={{ __html: entry.title }}
                                />
                                <span className="text-[10px] text-gray-400 dark:text-neutral-600 font-product-sans whitespace-nowrap bg-gray-50 dark:bg-neutral-900/50 px-2 py-0.5 rounded-full border border-gray-100 dark:border-neutral-800">
                                    {timeAgo(entry.published)}
                                </span>
                            </div>

                            <a 
                                href={entry.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-accent/80 hover:text-accent transition-colors"
                            >
                                <i className="hgi-stroke hgi-link-01 text-[10px]"></i>
                                View details
                            </a>
                        </div>
                    </div>
                ))}

                {entries.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-xs text-gray-400 font-product-sans">Feed unavailable or empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}
