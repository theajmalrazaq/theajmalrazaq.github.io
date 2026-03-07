import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

export default function MovieBox() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null); // { path, isSeries, title, poster, ... }
    const [streamUrl, setStreamUrl] = useState(null);
    const [streamLoading, setStreamLoading] = useState(false);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    // Initial load for trending (fallback popular movies)
    useEffect(() => {
        fetchTrending();
    }, []);

    const fetchTrending = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/moviebox?action=trending');
            const data = await response.json();
            if (data.results) {
                setTrendingMovies(data.results.slice(0, 10));
            }
        } catch (error) {
            console.error("Failed to fetch trending:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        try {
            setLoading(true);
            const response = await fetch(`/api/moviebox?action=search&query=${encodeURIComponent(searchQuery)}&type=all`);
            const data = await response.json();
            if (data.results) {
                setSearchResults(data.results);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectMedia = async (media) => {
        setSelectedMedia(media);
        setStreamUrl(null);
        setStreamLoading(true);
        try {
            // Check if it's a TV series by looking at its properties or detailPath
            const isSeries = media.type === 'series' || media.detailPath.includes('-series-');
            const response = await fetch(`/api/moviebox?action=stream&path=${media.detailPath}&isSeries=${isSeries}`);
            const data = await response.json();
            if (data.stream?.url) {
                setStreamUrl(data.stream.url);
            }
        } catch (error) {
            console.error("Failed to get stream url:", error);
        } finally {
            setStreamLoading(false);
        }
    };

    // Video Player Setup with Hls.js
    useEffect(() => {
        if (streamUrl && videoRef.current) {
            const video = videoRef.current;
            
            if (Hls.isSupported()) {
                if (hlsRef.current) hlsRef.current.destroy();
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hlsRef.current = hls;
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.log("Auto-play blocked"));
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS (Safari/iOS)
                video.src = streamUrl;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.log("Auto-play blocked"));
                });
            }
        }
        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [streamUrl]);

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Player Overlay */}
            {selectedMedia && (
                <div className="fixed inset-0 z-[200] bg-black bg-opacity-95 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-5xl relative aspect-video bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800">
                        {streamLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <p className="text-white/60 font-product-sans animate-pulse">Establishing secure connection...</p>
                            </div>
                        ) : streamUrl ? (
                            <video 
                                ref={videoRef}
                                className="w-full h-full"
                                controls
                                playsInline
                                poster={selectedMedia.imageUrl}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-product-sans">
                                Failed to load stream. Please try another mirror or movie.
                            </div>
                        )}
                        
                        <button 
                            onClick={() => { setSelectedMedia(null); setStreamUrl(null); }}
                            className="absolute top-4 right-4 z-[210] p-3 bg-black/40 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all active:scale-90"
                        >
                            <i className="hgi-stroke hgi-cancel-01 text-2xl"></i>
                        </button>
                    </div>
                    
                    <div className="mt-8 flex flex-col items-center text-center gap-2 max-w-2xl px-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white font-product-sans">{selectedMedia.title}</h2>
                        <p className="text-white/40 text-sm font-product-sans leading-relaxed">
                            Watch in high definition directly via MovieBox API. Please note that streaming depends on available mirrors.
                        </p>
                    </div>
                </div>
            )}

            {/* Content Header & Search */}
            <div className={`flex flex-col gap-10 ${selectedMedia ? 'opacity-20 pointer-events-none' : ''}`}>
                <div className="flex flex-col items-center gap-6">
                    <div className="text-center">
                        <h2 className="text-[40px] sm:text-[50px] [font-family:'GeistPixelGrid'] text-gray-900 dark:text-gray-100 flex items-center justify-center gap-3">
                            <i className="hgi-stroke hgi-movie-01 text-accent"></i>
                            the cinema
                        </h2>
                        <p className="text-gray-500 dark:text-neutral-500 font-product-sans mt-2">
                            Stream your favorite movies and series directly from your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
                        <div className="absolute -inset-1.5 bg-accent/20 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative flex items-center gap-3 p-2 bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm">
                            <i className="hgi-stroke hgi-search-01 text-gray-400 ml-4 text-xl"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search movies, series, or people..."
                                className="flex-1 bg-transparent py-3 text-lg font-product-sans text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[22px] font-product-sans font-bold text-base hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Searching...' : 'Explore'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Main Content Grid */}
                <div className="flex flex-col gap-12">
                    {searchResults.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-900 pb-4">
                                <h3 className="text-xl font-bold font-product-sans text-gray-900 dark:text-white flex items-center gap-2">
                                    Search Results <span className="text-sm font-normal text-gray-400">({searchResults.length})</span>
                                </h3>
                                <button onClick={() => setSearchResults([])} className="text-sm text-accent hover:underline">Clear</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {searchResults.map((media, i) => (
                                    <MediaCard key={i} media={media} onClick={() => selectMedia(media)} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Trending / Default Content */}
                            <div className="flex flex-col gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1.5 bg-accent rounded-full"></div>
                                    <h3 className="text-xl font-bold font-product-sans text-gray-900 dark:text-white">Trending Now</h3>
                                </div>
                                
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-gray-100 dark:border-neutral-900 border-t-accent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                        {trendingMovies.length > 0 ? (
                                            trendingMovies.map((media, i) => (
                                                <MediaCard key={i} media={media} onClick={() => selectMedia(media)} />
                                            ))
                                        ) : (
                                            <p className="col-span-full text-center py-12 text-gray-400 font-product-sans">Use the search bar above to find your favorite movies.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function MediaCard({ media, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="group relative flex flex-col gap-3 cursor-pointer transition-all duration-500 hover:-translate-y-2"
        >
            <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm transition-all group-hover:shadow-2xl group-hover:border-accent/30">
                {media.imageUrl ? (
                    <img 
                        src={media.imageUrl} 
                        alt={media.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <i className="hgi hgi-stroke hgi-movie-01 text-4xl"></i>
                        <span className="text-xs font-product-sans uppercase tracking-widest">Cinema App</span>
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-lg">
                        <i className="hgi-stroke hgi-play text-xl ml-1"></i>
                    </button>
                    <p className="mt-4 text-white font-product-sans text-xs font-bold uppercase tracking-widest translate-y-2 group-hover:translate-y-0 transition-all duration-700">Watch Now</p>
                </div>
                
                {media.type && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white uppercase tracking-wider">
                        {media.type}
                    </div>
                )}
            </div>
            
            <div className="px-2">
                <h4 className="font-product-sans font-bold text-gray-800 dark:text-gray-100 text-sm truncate group-hover:text-accent transition-colors">
                    {media.title}
                </h4>
                {media.year && (
                    <p className="text-xs text-gray-400 dark:text-neutral-500 font-product-sans mt-0.5">
                        {media.year} • {media.type === 'series' ? 'TV Series' : 'Movie'}
                    </p>
                )}
            </div>
        </div>
    );
}
