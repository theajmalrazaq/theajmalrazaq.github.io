import { useState, useEffect } from "react";
import DashboardModal from "./DashboardModal";

const DEFAULT_HOME = "/home/theajmalrazaq";

export default function FileExplorer({ isActive }) {
    const [path, setPath] = useState(DEFAULT_HOME);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (isActive) {
            readDirectory(path);
        }
    }, [isActive, path]);

    const readDirectory = async (targetPath) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/system?action=ls&path=${encodeURIComponent(targetPath)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort: folders first
                setItems(data.sort((a, b) => {
                    if (a.kind === "directory" && b.kind === "file") return -1;
                    if (a.kind === "file" && b.kind === "directory") return 1;
                    return a.name.localeCompare(b.name);
                }));
            }
        } catch (err) {
            console.error("Failed to read directory", err);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = async (item) => {
        if (item.kind === "directory") {
            setPath(item.path);
        } else {
            const extension = item.name.split('.').pop().toLowerCase();
            let type = "other";
            if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) type = "image";
            if (["mp4", "webm", "ogg", "mov", "mkv"].includes(extension)) type = "video";
            if (["mp3", "wav", "m4a", "flac"].includes(extension)) type = "audio";
            if (["txt", "md", "js", "json", "html", "css", "ts", "py"].includes(extension)) type = "text";

            if (type === "text") {
                try {
                    const res = await fetch(`/api/system?action=read&path=${encodeURIComponent(item.path)}`);
                    const data = await res.json();
                    setPreview({ name: item.name, content: data.content, type });
                } catch (err) {
                    console.error("Failed to read file", err);
                }
            } else {
                // For images/videos, we need a way to serve them.
                // Since this is a local dashboard, we can use a direct file path if the server handles it,
                // but usually browsers block file://. 
                // For now, we'll label them as preview unavailable or use a placeholder.
                setPreview({ name: item.name, url: item.path, type, isLocal: true });
            }
        }
    };

    const goBack = () => {
        if (path === DEFAULT_HOME) return;
        const parentPath = path.split('/').slice(0, -1).join('/') || '/';
        if (parentPath.startsWith(DEFAULT_HOME) || parentPath === DEFAULT_HOME) {
            setPath(parentPath);
        }
    };

    const getIcon = (item) => {
        if (!item || !item.name) return "hgi-file-01";
        if (item.kind === "directory") return "hgi-folder-01";
        const extension = item.name.split('.').pop().toLowerCase();
        if (["jpg", "jpeg", "png", "webp"].includes(extension)) return "hgi-image-01";
        if (["mp4", "webm", "mov", "mkv"].includes(extension)) return "hgi-video-01";
        if (["mp3", "wav", "flac"].includes(extension)) return "hgi-music-note-01";
        if (["zip", "rar", "7z"].includes(extension)) return "hgi-archive";
        return "hgi-file-01";
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-3">
                    {path !== DEFAULT_HOME && (
                        <button 
                            onClick={goBack}
                            className="cursor-pointer text-gray-400 hover:text-accent transition-colors"
                        >
                            <i className="hgi-stroke hgi-arrow-left-01 text-lg"></i>
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-product-sans lowercase truncate max-w-[200px] sm:max-w-md">
                            {path.replace(DEFAULT_HOME, "~") || "root"}
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-600 font-product-sans lowercase">
                            {items.length} items
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => readDirectory(path)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900 text-gray-400 hover:text-accent transition-all cursor-pointer border border-gray-100 dark:border-neutral-800"
                    >
                        <i className="hgi-stroke hgi-refresh text-sm"></i>
                    </button>
                </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleItemClick(item)}
                        className="group flex flex-col items-center gap-3 p-4 bg-transparent hover:bg-gray-400/5 dark:hover:bg-white/[0.02] rounded-[32px] border border-transparent hover:border-gray-100 dark:hover:border-neutral-900 transition-all duration-500 cursor-pointer"
                    >
                        <div className={`w-16 h-16 flex items-center justify-center rounded-[24px] bg-gray-50 dark:bg-neutral-900/50 text-gray-400 group-hover:text-accent group-hover:bg-accent/5 transition-all duration-300 transform group-hover:scale-110 shadow-sm border border-transparent group-hover:border-accent/10 relative overflow-hidden`}>
                            <i className={`hgi-stroke ${getIcon(item)} text-2xl`}></i>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-neutral-400 font-product-sans truncate w-full text-center px-1 lowercase">
                            {item.name}
                        </span>
                    </button>
                ))}
                
                {items.length === 0 && !loading && (
                    <div className="col-span-full py-20 bg-gray-50/50 dark:bg-neutral-950/20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px] flex flex-col items-center justify-center text-gray-400">
                        <i className="hgi hgi-stroke hgi-folder-open text-3xl mb-2 opacity-50"></i>
                        <p className="text-sm font-product-sans">Empty directory</p>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Preview Modal */}
            <DashboardModal
                isOpen={!!preview}
                onClose={() => setPreview(null)}
                hideHeader={true}
                padding="p-0"
                maxWidth="max-w-5xl"
                zIndex="z-[250]"
            >
                <div className="h-[85vh] flex flex-col relative bg-white dark:bg-black">
                    {/* Preview Header */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                        <div className="bg-black/50 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10">
                            <h3 className="text-sm font-bold text-white font-product-sans">{preview?.name}</h3>
                        </div>
                        <button 
                            onClick={() => setPreview(null)}
                            className="w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-xl text-white rounded-full hover:bg-red-500/80 transition-all cursor-pointer border border-white/10"
                        >
                            <i className="hgi-stroke hgi-cancel-01"></i>
                        </button>
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 flex items-center justify-center overflow-auto p-12">
                        {preview?.type === "text" ? (
                            <pre className="w-full h-full p-8 text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-neutral-900/50 rounded-[28px] overflow-auto whitespace-pre-wrap">
                                {preview.content}
                            </pre>
                        ) : (
                            <div className="text-center">
                                <i className={`hgi hgi-stroke ${getIcon({name: preview?.name, kind: 'file'})} text-6xl text-gray-400 mb-4 opacity-50`}></i>
                                <p className="text-lg font-product-sans text-gray-500">Preview not available via System API yet.</p>
                                <p className="text-xs text-gray-400 mt-2 font-mono">{preview?.url}</p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardModal>
        </div>
    );
}
