import { useState, useRef, useEffect } from "react";

const USER = "ajmal";
const HOST = "omarchy";
const DEFAULT_HOME = "/home/theajmalrazaq";

export default function Terminal({ isActive }) {
    const [history, setHistory] = useState([
        { type: "system", content: "Welcome to Omarchy Terminal v1.0.0" },
        { type: "system", content: "Type 'help' for available commands." }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [cwd, setCwd] = useState(DEFAULT_HOME);
    const [executing, setExecuting] = useState(false);
    
    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    // Auto-focus input when tab is active
    useEffect(() => {
        if (isActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isActive]);

    // Scroll to bottom whenever history changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            const cmd = inputValue.trim();
            if (cmd) executeCommand(cmd);
            setInputValue("");
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
                setHistoryIndex(newIndex);
                setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInputValue("");
            }
        }
    };

    const executeCommand = async (cmd) => {
        setHistory(prev => [...prev, { type: "command", content: cmd, path: cwd.replace(DEFAULT_HOME, "~") }]);
        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        
        const [baseCmd, ...args] = cmd.split(" ");

        // Internal commands
        if (baseCmd === "clear") {
            setHistory([]);
            return;
        }

        if (baseCmd === "help") {
            setHistory(prev => [...prev, { type: "system", content: "Available: clear, help, cd, ls, and system commands." }]);
            return;
        }

        if (baseCmd === "cd") {
            let target = args[0] || DEFAULT_HOME;
            if (target === "~") target = DEFAULT_HOME;
            
            let newPath = target.startsWith("/") ? target : `${cwd}/${target}`;
            // Clean up path (handle .. and .)
            const parts = newPath.split('/').filter(p => p !== '' && p !== '.');
            const stack = [];
            for (const p of parts) {
                if (p === '..') {
                    if (stack.length > 0) stack.pop();
                } else {
                    stack.push(p);
                }
            }
            newPath = '/' + stack.join('/');

            try {
                const res = await fetch(`/api/system?action=validate&path=${encodeURIComponent(newPath)}`);
                const data = await res.json();
                if (data.exists) {
                    setCwd(data.path || newPath);
                } else {
                    setHistory(prev => [...prev, { type: "stderr", content: `cd: no such file or directory: ${target}` }]);
                }
            } catch (err) {
                setHistory(prev => [...prev, { type: "stderr", content: "cd: validation failed." }]);
            }
            return;
        }

        setExecuting(true);
        try {
            const res = await fetch("/api/system", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "exec", command: cmd, cwd }),
            });
            const data = await res.json();
            
            if (data.stdout) {
                setHistory(prev => [...prev, { type: "stdout", content: data.stdout }]);
            }
            if (data.stderr) {
                setHistory(prev => [...prev, { type: "stderr", content: data.stderr }]);
            }
            if (!data.success && data.error) {
                 const errMsg = data.details || data.error;
                 setHistory(prev => [...prev, { type: "stderr", content: errMsg }]);
            }
        } catch (err) {
            setHistory(prev => [...prev, { type: "stderr", content: "Network error." }]);
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div 
            className="w-full max-w-4xl mx-auto h-[450px] bg-black/90 dark:bg-black/95 border border-gray-200/20 dark:border-neutral-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
            onClick={() => inputRef.current?.focus()}
        >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-[11px] font-product-sans font-bold text-gray-400 dark:text-neutral-500 ml-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7L8.22654 8.05719C8.74218 8.50163 9 8.72386 9 9C9 9.27614 8.74218 9.49836 8.22654 9.94281L7 11" />
                            <path d="M11 11H14" />
                            <path d="M12 21C15.7497 21 17.6246 21 18.9389 20.0451C19.3634 19.7367 19.7367 19.3634 20.0451 18.9389C21 17.6246 21 15.7497 21 12C21 8.25027 21 6.3754 20.0451 5.06107C19.7367 4.6366 19.3634 4.26331 18.9389 3.95491C17.6246 3 15.7497 3 12 3C8.25027 3 6.3754 3 5.06107 3.95491C4.6366 4.26331 4.26331 4.6366 3.95491 5.06107C3 6.3754 3 8.25027 3 12C3 15.7497 3 17.6246 3.95491 18.9389C4.26331 19.3634 4.6366 19.7367 5.06107 20.0451C6.3754 21 8.25027 21 12 21Z" />
                        </svg>
                        {USER}@{HOST} — {cwd.replace(DEFAULT_HOME, "~")}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {executing && (
                         <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest font-bold">bash</span>
                </div>
            </div>

            {/* Terminal Body */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1.5 scroll-smooth"
            >
                {history.map((line, i) => (
                    <div key={i} className="break-words leading-relaxed">
                        {line.type === "command" ? (
                            <div className="flex items-start gap-2.5 text-gray-400">
                                <span className="text-accent shrink-0 font-bold">❯</span>
                                <span className="text-[11px] opacity-40 font-bold hidden sm:inline">{line.path}</span>
                                <span className="text-gray-100 font-bold">{line.content}</span>
                            </div>
                        ) : line.type === "system" ? (
                             <div className="text-blue-400 opacity-80 italic italic">{line.content}</div>
                        ) : line.type === "stderr" ? (
                            <div className="text-red-400/90 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10 whitespace-pre-wrap">{line.content}</div>
                        ) : (
                            <div className="text-gray-300 whitespace-pre-wrap pl-6">{line.content}</div>
                        )}
                    </div>
                ))}
                
                {/* Active Input Line */}
                <div className="flex items-center gap-2.5 pt-2">
                    <span className="text-accent shrink-0 font-bold">❯</span>
                    <span className="text-[11px] text-gray-500 font-bold hidden sm:inline">
                        {cwd.replace(DEFAULT_HOME, "~")}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 font-bold caret-accent"
                        autoFocus
                    />
                </div>
            </div>

            <div className="px-6 py-3 bg-black/50 border-t border-white/5 text-[9px] text-gray-600 font-mono uppercase tracking-widest flex items-center justify-between">
                <span>omarchy shell control</span>
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    online
                </span>
            </div>
        </div>
    );
}
