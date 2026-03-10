import { useState, useEffect, useMemo } from "react";

export default function ClipboardManager() {
    const [history, setHistory] = useState([]);
    const [current, setCurrent] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState(null);

    const fetchClipboard = async () => {
        try {
            const res = await fetch("/api/system?action=clipboard");
            const data = await res.json();
            if (data.history) setHistory(data.history);
            if (data.current) setCurrent(data.current);
        } catch (err) {
            console.error("Failed to fetch clipboard", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClipboard();
        const interval = setInterval(fetchClipboard, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = async (item) => {
        setCopying(item.id);
        try {
            const cmd = `elephant activate "clipboard;${item.id};copy;;"`;
            await fetch("/api/system", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "exec", command: cmd })
            });
            setTimeout(() => setCopying(null), 1000);
        } catch (err) {
            console.error("Failed to copy", err);
            setCopying(null);
        }
    };


    const filteredHistory = useMemo(() => {
        return history.filter(item => 
            (item.preview || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [history, search]);

    const cleanText = (text) => {
        if (!text) return "";
        if (text.length > 5000 || /[\x00-\x08\x0E-\x1F\x7F]/.test(text.substring(0, 100))) {
            return `[Binary/Data Content: ${text.length} bytes]`;
        }
        return text;
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header matches Blog/Notes */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-600 font-product-sans">clipboard history</h3>
            </div>

            {/* Live Clipboard matches refined section style */}
            <div className="group relative bg-gray-50/50 dark:bg-neutral-900/30 border border-gray-100 dark:border-neutral-900 rounded-[32px] p-6 mb-4 transition-all duration-500 hover:border-accent/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <i className="hgi-stroke hgi-copy-01 text-sm"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-product-sans">active content</span>
                </div>
                <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto scrollbar-hide leading-relaxed">
                    {cleanText(current) || "Clipboard is empty"}
                </pre>
            </div>

            {/* Search Bar matches standard input style */}
            <div className="relative group mb-2">
                <i className="hgi-stroke hgi-search-02 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-600 group-focus-within:text-accent transition-colors"></i>
                <input
                    type="text"
                    placeholder="Search history..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-100 dark:border-neutral-900 py-4 pl-12 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none focus:border-accent transition-all font-product-sans"
                />
            </div>

            {loading ? (
                <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-transparent border-b border-gray-100 dark:border-neutral-900">
                            <div className="w-10 h-10 rounded-full skeleton shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 skeleton"></div>
                                <div className="h-3 w-1/4 skeleton opacity-50"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col">
                    {filteredHistory.map((item) => (
                        <div 
                            key={item.id} 
                            className="group flex items-center gap-4 p-4 bg-transparent border-b border-gray-100 dark:border-neutral-900 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-900/50 flex items-center justify-center text-gray-400 shrink-0">
                                <i className={`hgi-stroke ${item.type === 'file' ? "hgi-image-01" : "hgi-note-01"} text-lg`}></i>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                {item.type === 'file' ? (
                                    <div className="mb-2 rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800 bg-black/5 dark:bg-white/5 max-w-[200px] aspect-video shadow-sm">
                                        <img 
                                            src={`/api/system?action=file-proxy&path=${encodeURIComponent(item.preview)}`} 
                                            alt="Clipboard screenshot" 
                                            className="w-full h-full object-contain bg-neutral-900/10 transition-transform group-hover:scale-105 duration-500"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-[10px] text-gray-400">Image missing</div>';
                                            }}
                                        />
                                    </div>
                                ) : null}
                                <div className="flex flex-col">
                                    <p 
                                        className="font-bold text-gray-900 dark:text-gray-100 font-product-sans text-sm leading-relaxed truncate"
                                    >
                                        {item.type === 'file' ? `Image File: ${item.preview.split('/').pop()}` : item.preview}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-neutral-500 font-product-sans mt-0.5 uppercase tracking-widest font-bold">
                                        {item.type}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-gray-300 dark:text-neutral-700 font-product-sans uppercase shrink-0">
                                    {item.subtext.split(' ').slice(1, 3).join(' ')}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={() => handleCopy(item)}
                                        className={`cursor-pointer p-2 rounded-full transition-all duration-300 ${
                                            copying === item.id 
                                                ? "text-green-500 bg-green-500/10"
                                                : "text-gray-400 hover:text-accent hover:bg-accent/10"
                                        }`}
                                        title="Restore to clipboard"
                                    >
                                        <i className={`hgi hgi-stroke ${copying === item.id ? "hgi-check-mark-circle-01" : "hgi-copy-01"} text-lg`}></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredHistory.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px] mt-4">
                            <p className="text-sm text-gray-400 font-product-sans">no history items found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
