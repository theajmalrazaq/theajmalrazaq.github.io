import { useState, useEffect } from "react";

export default function SpotifyWidget() {
    const [track, setTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({ position: 0, duration: 0 });

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/spotify");
            const data = await res.json();
            if (data.active) {
                setTrack(data.track);
                setIsPlaying(data.isPlaying);
                setProgress({ position: data.position, duration: data.duration });
            } else {
                setTrack(null);
                setIsPlaying(false);
            }
        } catch (e) {
            console.error("Spotify API error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const sendCommand = async (command) => {
        try {
            await fetch(`/api/spotify?command=${command}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ command }),
            });
            setTimeout(fetchStatus, 300);
        } catch (e) {
            console.error("Failed to send command", e);
        }
    };

    if (loading && !track) return null;

    const progressPercent = progress.duration > 0 
        ? (progress.position / progress.duration) * 100 
        : 0;

    return (
        <div className="w-full flex justify-center  group">
            <div className="relative flex flex-col bg-gray-50/50 dark:bg-neutral-900/20 border border-gray-100 dark:border-neutral-800/50 rounded-3xl transition-all duration-500 hover:border-accent/10 overflow-hidden">
                <div className="flex items-center gap-6 p-4">
                    {/* Artwork (Left) */}
                    <div 
                        onClick={() => sendCommand("open")}
                        className="relative w-12 h-12 rounded-2xl overflow-hidden bg-emerald-500/5 flex items-center justify-center shrink-0 border border-gray-100 dark:border-neutral-800 transition-all duration-500 group-hover:scale-105 cursor-pointer hover:opacity-80 active:scale-95"
                        title="Open Spotify"
                    >
                        {track?.artUrl ? (
                            <img src={track.artUrl} alt="Art" className="w-full h-full object-cover" />
                        ) : (
                            <i className={`hgi-stroke hgi-spotify text-2xl ${isPlaying ? "text-emerald-500 animate-spin-slow" : "text-gray-400/30"}`}></i>
                        )}
                    </div>

                    {/* Track Info (Middle) */}
                    <div className="flex flex-col gap-1.5 min-w-[140px] max-w-[200px]">
                        <h4 className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate font-product-sans">
                            {track?.title || "Spotify Player"}
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 truncate font-product-sans uppercase mb-1">
                            {track?.artist || "Standby Mode"}
                        </p>
                        
                        {/* Tiny Progress Bar */}
                        <div className="h-0.5 w-full bg-gray-100 dark:bg-neutral-800/50 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-accent dark:bg-white rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Controls (Right) */}
                    <div className="flex items-center gap-2 border-l border-gray-100 dark:border-neutral-800/50 pl-6">
                        <button 
                            onClick={() => sendCommand("prev")}
                            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all transform hover:scale-110"
                            title="Previous"
                        >
                            <i className="hgi-stroke hgi-arrow-left-01 text-base"></i>
                        </button>
                        <button 
                            onClick={() => sendCommand("playpause")}
                            className="w-9 h-9 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-110 transition-transform"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            <i className={`hgi-stroke ${isPlaying ? "hgi-pause" : "hgi-play"} text-base`}></i>
                        </button>
                        <button 
                            onClick={() => sendCommand("next")}
                            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all transform hover:scale-110"
                            title="Next"
                        >
                            <i className="hgi-stroke hgi-arrow-right-01 text-base"></i>
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .animate-spin-slow {
                    animation: spin 6s linear infinite;
                }
            `}} />
        </div>
    );
}
