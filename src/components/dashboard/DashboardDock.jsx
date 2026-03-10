import { useState, useEffect } from "react";
import DashboardModal from "./DashboardModal";

export default function DashboardDock() {
    const [links, setLinks] = useState([
        { id: 1, name: "LinkedIn", url: "https://linkedin.com", favicon: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128" },
        { id: 2, name: "Gmail", url: "https://gmail.com", favicon: "https://www.google.com/s2/favicons?domain=gmail.com&sz=128" },
        { id: 3, name: "Github", url: "https://github.com", favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=128" },
        { id: 4, name: "YouTube", url: "https://youtube.com", favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128" }
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newLink, setNewLink] = useState({ name: "", url: "" });

    // Load from localStorage on mount and migrate old data
    useEffect(() => {
        const savedLinks = localStorage.getItem("dashboard_links");
        if (savedLinks) {
            try {
                let parsed = JSON.parse(savedLinks);
                // Migration: If any link doesn't have a favicon, try to generate one
                const migrated = parsed.map(link => {
                    if (!link.favicon && link.url) {
                        try {
                            const domain = new URL(link.url).hostname.replace("www.", "");
                            return { ...link, favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` };
                        } catch (e) {
                            return link;
                        }
                    }
                    return link;
                });
                setLinks(migrated);
            } catch (err) {
                console.error("Failed to parse links", err);
            }
        }
    }, []);

    // Save to localStorage whenever links change
    useEffect(() => {
        localStorage.setItem("dashboard_links", JSON.stringify(links));
    }, [links]);

    const addLink = () => {
        if (!newLink.url) return;
        
        let url = newLink.url;
        if (!url.startsWith("http")) url = "https://" + url;
        
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.replace("www.", "");
            const name = hostname.split('.')[0];
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
            
            const link = {
                id: Date.now(),
                name: capitalizedName,
                url: url,
                favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
            };
            
            setLinks([...links, link]);
            setNewLink({ name: "", url: "" });
            setIsAdding(false);
        } catch (e) {
            alert("Please enter a valid URL.");
        }
    };

    const removeLink = (id) => {
        setLinks(links.filter(l => l.id !== id));
    };

    return (
        <>
            {/* Add Link Modal */}
            <DashboardModal 
                isOpen={isAdding} 
                onClose={() => setIsAdding(false)}
                title="add quick link"
                subtitle="insert a url to pin it to your dock"
            >
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-700 ml-1">paste url</span>
                    <input 
                        type="text" 
                        placeholder="e.g. twitter.com"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addLink()}
                        autoFocus
                        className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-900 rounded-2xl px-5 py-4 text-sm font-product-sans text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-neutral-700 focus:outline-none focus:border-accent/30 transition-all"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button 
                        onClick={() => setIsAdding(false)}
                        className="px-5 py-2 text-[10px] font-product-sans font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all cursor-pointer"
                    >
                        cancel
                    </button>
                    <button 
                        onClick={addLink}
                        className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                    >
                        <i className="hgi hgi-stroke hgi-plus text-sm text-accent"></i>
                        <span>add to dock</span>
                    </button>
                </div>
            </DashboardModal>

            {/* The Dock - Fixed to bottom */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-gray-200 dark:border-neutral-800 rounded-full transition-all duration-300">
                {links.map((link) => (
                    <div key={link.id} className="relative group/item">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 flex items-center justify-center rounded-full bg-transparent text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 overflow-hidden"
                        >
                            {link.favicon ? (
                                <img src={link.favicon} className="w-5 h-5 object-contain" alt="" />
                            ) : (
                                <i className={`${link.icon} text-lg`}></i>
                            )}
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[9px] font-bold font-product-sans rounded-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/item:translate-y-0 whitespace-nowrap">
                                {link.name}
                            </span>
                        </a>
                        <button 
                            onClick={() => removeLink(link.id)}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-500/10 hover:bg-red-500 text-transparent hover:text-white rounded-full flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/item:opacity-100 border border-transparent hover:border-red-600"
                        >
                            <i className="hgi-stroke hgi-cancel-01 text-[8px]"></i>
                        </button>
                    </div>
                ))}

                <div className="w-[1px] h-6 bg-gray-200 dark:bg-neutral-800 mx-1"></div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                        isAdding 
                        ? "bg-accent text-white" 
                        : "text-gray-400 hover:text-accent hover:bg-white dark:hover:bg-neutral-800"
                    }`}
                >
                    <i className="hgi hgi-stroke hgi-plus-sign-square text-lg"></i>
                </button>
            </div>
        </>
    );
}
