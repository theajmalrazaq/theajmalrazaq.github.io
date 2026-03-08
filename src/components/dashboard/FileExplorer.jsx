import { useState, useEffect } from "react";

export default function FileExplorer({ isActive }) {
    const [directoryHandle, setDirectoryHandle] = useState(null);
    const [items, setItems] = useState([]);
    const [path, setPath] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null); 
    const [needsPermission, setNeedsPermission] = useState(false);

    // Persistence Logic (IndexedDB)
    useEffect(() => {
        const initPersistence = async () => {
            try {
                const handle = await getSavedHandle();
                if (handle) {
                    setDirectoryHandle(handle);
                    setPath([handle]);
                    // Check if we already have permission (unlikely on fresh load)
                    const status = await handle.queryPermission({ mode: 'read' });
                    if (status === 'granted') {
                        readDirectory(handle);
                    } else {
                        setNeedsPermission(true);
                    }
                }
            } catch (err) {
                console.error("Persistence init failed", err);
            }
        };
        initPersistence();
    }, []);

    const saveHandle = async (handle) => {
        const db = await openDB();
        const tx = db.transaction('handles', 'readwrite');
        await tx.objectStore('handles').put(handle, 'last_folder');
    };

    const getSavedHandle = async () => {
        const db = await openDB();
        const tx = db.transaction('handles', 'readonly');
        return tx.objectStore('handles').get('last_folder');
    };

    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FileExplorerDB', 1);
            request.onupgradeneeded = (e) => {
                e.target.result.createObjectStore('handles');
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    };

    const openFolder = async () => {
        try {
            const handle = await window.showDirectoryPicker();
            setDirectoryHandle(handle);
            setPath([handle]);
            setNeedsPermission(false);
            await saveHandle(handle);
            readDirectory(handle);
        } catch (err) {
            console.error("Folder pick failed:", err);
        }
    };

    const restoreFolder = async () => {
        if (!directoryHandle) return;
        try {
            // Re-verify requires user gesture (click)
            const status = await directoryHandle.requestPermission({ mode: 'read' });
            if (status === 'granted') {
                setNeedsPermission(false);
                readDirectory(directoryHandle);
            }
        } catch (err) {
            console.error("Permission request failed", err);
        }
    };

    const readDirectory = async (handle) => {
        setLoading(true);
        const folderItems = [];
        for await (const entry of handle.values()) {
            let thumbnail = null;
            if (entry.kind === "file") {
                const extension = entry.name.split('.').pop().toLowerCase();
                if (["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm"].includes(extension)) {
                    try {
                        const file = await entry.getFile();
                        thumbnail = URL.createObjectURL(file);
                    } catch (e) {
                        // Thumbnail fail silently
                    }
                }
            }

            folderItems.push({
                name: entry.name,
                kind: entry.kind,
                handle: entry,
                thumbnail
            });
        }
        // Sort: folders first
        const sorted = folderItems.sort((a, b) => {
            if (a.kind === "directory" && b.kind === "file") return -1;
            if (a.kind === "file" && b.kind === "directory") return 1;
            return a.name.localeCompare(b.name);
        });
        setItems(sorted);
        setLoading(false);
    };

    const handleItemClick = async (item) => {
        if (item.kind === "directory") {
            const newPath = [...path, item.handle];
            setPath(newPath);
            readDirectory(item.handle);
        } else {
            const file = await item.handle.getFile();
            const url = URL.createObjectURL(file);
            const extension = item.name.split('.').pop().toLowerCase();
            
            let type = "other";
            if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) type = "image";
            if (["mp4", "webm", "ogg", "mov", "mkv"].includes(extension)) type = "video";
            if (["mp3", "wav", "m4a", "flac"].includes(extension)) type = "audio";
            if (["txt", "md", "js", "json", "html", "css", "ts", "py"].includes(extension)) type = "text";

            if (type === "text") {
                const text = await file.text();
                setPreview({ name: item.name, content: text, type });
            } else {
                setPreview({ name: item.name, url, type });
            }
        }
    };

    const goBack = () => {
        if (path.length <= 1) return;
        const newPath = path.slice(0, -1);
        setPath(newPath);
        readDirectory(newPath[newPath.length - 1]);
    };

    const getIcon = (item) => {
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
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    {path.length > 1 && (
                        <button 
                            onClick={goBack}
                            className="cursor-pointer text-gray-400 hover:text-accent transition-colors"
                        >
                            <i className="hgi-stroke hgi-arrow-left-01 text-lg"></i>
                        </button>
                    )}
                    <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-600 font-product-sans">
                        {path.length > 1 ? path[path.length - 1].name : "your storage"}
                    </h3>
                </div>

                <button 
                    onClick={openFolder}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                >
                    <i className={`hgi-stroke ${!directoryHandle ? 'hgi-folder-open' : 'hgi-folder-upload'} text-sm`}></i>
                    <span>{!directoryHandle ? "link storage" : "switch folder"}</span>
                </button>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {!directoryHandle && !loading && (
                    <div className="col-span-full py-24 bg-gray-50/50 dark:bg-neutral-950/20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[40px] flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center mb-4">
                            <i className="hgi hgi-stroke hgi-folder-open text-3xl text-accent opacity-50"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-product-sans mb-1">Local Storage</h3>
                        <p className="text-xs text-gray-400 font-product-sans max-w-xs mb-8">Link a system directory to browse and play media directly on your dashboard.</p>
                        <button 
                            onClick={openFolder}
                            className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 text-xs font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                        >
                            <i className="hgi-stroke hgi-link text-sm"></i>
                            <span>Link Storage</span>
                        </button>
                    </div>
                )}

                {needsPermission && !loading && (
                    <div className="col-span-full py-24 bg-gray-50/50 dark:bg-neutral-950/20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[40px] flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center mb-4">
                            <i className="hgi hgi-stroke hgi-shield-tick text-3xl text-accent opacity-50"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-product-sans mb-1">Verify Access</h3>
                        <p className="text-xs text-gray-400 font-product-sans max-w-xs mb-8">This folder was previously linked. A quick verification is required to restore access.</p>
                        <button 
                            onClick={restoreFolder}
                            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-xs font-product-sans font-bold text-white bg-accent rounded-full transition-all duration-300 shadow-lg shadow-accent/20"
                        >
                            <i className="hgi-stroke hgi-unlock text-sm"></i>
                            <span>Restore Folder Access</span>
                        </button>
                    </div>
                )}

                {directoryHandle && items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleItemClick(item)}
                        className="group flex flex-col items-center gap-3 p-4 bg-transparent hover:bg-gray-400/5 dark:hover:bg-white/[0.02] rounded-[32px] border border-transparent hover:border-gray-100 dark:hover:border-neutral-900 transition-all duration-500 cursor-pointer"
                    >
                        <div className={`w-16 h-16 flex items-center justify-center rounded-[24px] bg-gray-50 dark:bg-neutral-900/50 text-gray-400 group-hover:text-accent group-hover:bg-accent/5 transition-all duration-300 transform group-hover:scale-110 shadow-sm border border-transparent group-hover:border-accent/10 relative overflow-hidden`}>
                            {item.thumbnail ? (
                                item.name.match(/\.(mp4|webm)$/i) ? (
                                    <video className="w-full h-full object-cover">
                                        <source src={item.thumbnail} />
                                    </video>
                                ) : (
                                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                                )
                            ) : (
                                <i className={`hgi-stroke ${getIcon(item)} text-2xl`}></i>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-neutral-400 font-product-sans truncate w-full text-center px-1">
                            {item.name}
                        </span>
                    </button>
                ))}
                
                {directoryHandle && items.length === 0 && !loading && (
                    <div className="col-span-full py-20 bg-gray-50/50 dark:bg-neutral-950/20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px] flex flex-col items-center justify-center text-gray-400">
                        <i className="hgi hgi-stroke hgi-folder-open text-3xl mb-2 opacity-50"></i>
                        <p className="text-sm font-product-sans">Empty directory</p>
                    </div>
                )}
            </div>

            {/* Preview Modal (Same as before but refined) */}
            {preview && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl h-[85vh] bg-white dark:bg-black rounded-[40px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl relative border border-white/10">
                        {/* Preview Header */}
                        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                            <div className="bg-black/50 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10">
                                <h3 className="text-sm font-bold text-white font-product-sans">{preview.name}</h3>
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
                            {preview.type === "image" && (
                                <img src={preview.url} alt={preview.name} className="max-w-full max-h-full object-contain rounded-xl" />
                            )}
                            {preview.type === "video" && (
                                <video controls autoPlay className="max-w-full max-h-full rounded-xl">
                                    <source src={preview.url} />
                                </video>
                            )}
                            {preview.type === "audio" && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                                        <i className="hgi-stroke hgi-music-note-01 text-4xl text-accent"></i>
                                    </div>
                                    <audio controls src={preview.url} className="w-80" />
                                </div>
                            )}
                            {preview.type === "text" && (
                                <pre className="w-full h-full p-8 text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-neutral-900/50 rounded-[28px] overflow-auto whitespace-pre-wrap">
                                    {preview.content}
                                </pre>
                            )}
                            {preview.type === "other" && (
                                <div className="text-center">
                                    <i className="hgi hgi-stroke hgi-file-01 text-6xl text-gray-400 mb-4 opacity-50"></i>
                                    <p className="text-lg font-product-sans text-gray-500">Preview not available for this file type.</p>
                                    <a href={preview.url} download={preview.name} className="mt-6 inline-flex px-8 py-3 bg-accent text-white rounded-full font-bold font-product-sans hover:scale-105 transition-all">Download File</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
