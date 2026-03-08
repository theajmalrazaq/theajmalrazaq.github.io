import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import PersonalVault from "./PersonalVault";
import SpotifyWidget from "./SpotifyWidget";
import GithubFeed from "./GithubFeed";
import AiChatbot from "./AiChatbot";
import FileExplorer from "./FileExplorer";
import { FlickeringGrid } from "../ui/FlickeringGrid";

export default function DashboardHome() {
    const [posts, setPosts] = useState([]);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab ] = useState(null); // null | "blog" | "feed" | "chat" | "notes" | "todo"
    const [currentTime, setCurrentTime] = useState(new Date());

    // Pull fresh data whenever the active tab changes
    useEffect(() => {
        if (!activeTab) return;
        if (activeTab === "blog") fetchPosts();
    }, [activeTab]);

    useEffect(() => {
        init();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = "/dashboard/login";
            return;
        }
        setReady(true);
        fetchPosts();
    };

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("posts")
            .select("id, title, date, is_published, slug")
            .order("date", { ascending: false });

        if (!error) setPosts(data || []);
        setTimeout(() => setLoading(false), 1500);
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        const { error } = await supabase.from("posts").delete().eq("id", id);
        if (!error) setPosts(posts.filter((p) => p.id !== id));
    };

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-600 border-t-accent dark:border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <section className="relative w-full flex justify-center overflow-hidden z-10 min-h-screen bg-white dark:bg-black">
            {/* Background Effect - Exact match to PageLayout.astro */}
            <div 
                className="absolute inset-x-0 top-0 h-[100px] sm:h-[120px] w-full overflow-hidden z-0 pointer-events-none"
                style={{ 
                    maskImage: 'linear-gradient(to bottom, black, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)'
                }}
            >
                <FlickeringGrid 
                    squareSize={2}
                    gridGap={6}
                    maxOpacity={0.3}
                    flickerChance={0.2}
                    className="w-full h-full"
                />
            </div>

            <div className={`relative w-full transition-all duration-700 ease-in-out px-4 pb-16 ${
                activeTab ? "max-w-6xl pt-12 sm:pt-20" : "max-w-4xl pt-16 sm:pt-8"
            } mx-auto flex flex-col gap-8 z-10`}>

                {/* Home View (Visible when no tab is selected) */}
                <div className={`flex flex-col gap-8 transition-all duration-700 ease-in-out ${
                    activeTab ? "opacity-0 invisible h-0 -mb-8 scale-95 overflow-hidden" : "opacity-100 visible h-auto"
                }`}>
                    <div className="flex flex-col items-center justify-center pt-12 sm:pt-16 -mb-4">
                        <div className="relative">
                            <h2 className="relative text-6xl sm:text-7xl font-bold tracking-widest font-['Product Sans'] text-gray-900 dark:text-white transition-all duration-500">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s?[AP]M/i, '')}
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-neutral-500 font-product-sans mt-2 text-center">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <SpotifyWidget />

                    <h1 className="text-[40px] sm:text-[50px] [font-family:'GeistPixelGrid'] text-gray-900 dark:text-gray-100 text-center">
                        Hi Ajmal!
                    </h1>
                </div>

                {/* Main Navigation */}
                <div className={`flex flex-col items-center gap-6 transition-all duration-500 ${activeTab ? "mb-4 border-b border-gray-100 dark:border-neutral-900 pb-6" : ""}`}>
                    <div className={`flex items-center justify-center gap-1 bg-gray-100/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-full p-1 mx-auto w-fit transition-all duration-500`}>
                        {[
                            { id: "blog", icon: "hgi-note-01", label: "blog" },
                            { id: "feed", icon: "hgi-github", label: "feed" },
                            { id: "chat", icon: "hgi-ai-chat-02", label: "octo ai" },
                            { id: "files", icon: "hgi-folder-02", label: "files" },
                            { id: "notes", icon: "hgi-note", label: "notes" },
                            { id: "todo", icon: "hgi-task-01", label: "to-do" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                                className={`cursor-pointer flex items-center justify-center gap-2 px-6 py-2 rounded-full text-sm font-product-sans font-bold transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-neutral-700 outline-none ring-0"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                            >
                                <i className={`hgi-stroke ${tab.icon} text-lg`}></i>
                                <span className={activeTab ? "hidden sm:inline" : ""}>{tab.label}</span>
                            </button>
                        ))}
                        
                        {activeTab && (
                            <button 
                                onClick={() => setActiveTab(null)}
                                className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-red-500 transition-colors ml-1 border-l border-gray-200 dark:border-neutral-800"
                            >
                                <i className="hgi-stroke hgi-cancel-01 text-lg"></i>
                            </button>
                        )}
                    </div>

                    {!activeTab && (
                        <p className="text-sm text-gray-500 dark:text-neutral-500 font-product-sans max-w-md mx-auto text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                            Select a tool to begin your workflow.
                        </p>
                    )}
                </div>

                {/* Content Area */}
                <div className="w-full h-full pb-20">
                    <div className={activeTab === "blog" ? "block" : "hidden"}>
                        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-600 font-product-sans">personal blog</h3>
                                <a
                                    href="/dashboard/new"
                                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 text-xs font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                                >
                                    <i className="hgi-stroke hgi-plus text-sm"></i>
                                    <span>new post</span>
                                </a>
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
                                            <div className="h-4 w-12 skeleton"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {posts.map((post) => (
                                        <div key={post.id} className="group flex items-center gap-4 p-4 bg-transparent border-b border-gray-100 dark:border-neutral-900 transition-all duration-300">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-900/50 flex items-center justify-center text-gray-400 shrink-0">
                                                <i className="hgi-stroke hgi-note-01 text-lg"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 font-product-sans truncate text-sm">
                                                        {post.title}
                                                    </h3>
                                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-product-sans font-bold ${
                                                        post.is_published
                                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                            : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 border border-gray-200 dark:border-neutral-700"
                                                    }`}>
                                                        {post.is_published ? "live" : "draft"}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-neutral-500 font-product-sans truncate">
                                                    {post.slug}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-gray-300 dark:text-neutral-700 font-product-sans uppercase">
                                                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <a href={`/dashboard/edit?id=${post.id}`} className="p-2 text-gray-400 hover:text-accent transition-colors"><i className="hgi-stroke hgi-pencil-edit-01"></i></a>
                                                    <button onClick={() => handleDelete(post.id, post.title)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><i className="hgi-stroke hgi-delete-02"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {posts.length === 0 && (
                                        <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px]">
                                            <p className="text-sm text-gray-400 font-product-sans">no posts found.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className={activeTab === "feed" ? "block" : "hidden"}>
                        <GithubFeed />
                    </div>

                    <div className={activeTab === "notes" ? "block" : "hidden"}>
                        <PersonalVault initialSection="notes" hideNav={true} isActive={activeTab === "notes"} />
                    </div>

                    <div className={activeTab === "todo" ? "block" : "hidden"}>
                        <PersonalVault initialSection="todos" hideNav={true} isActive={activeTab === "todo"} />
                    </div>

                    <div className={activeTab === "chat" ? "block text-left" : "hidden"}>
                        <AiChatbot isActive={activeTab === "chat"} />
                    </div>

                    <div className={activeTab === "files" ? "block text-left" : "hidden"}>
                        <FileExplorer isActive={activeTab === "files"} />
                    </div>
                </div>
            </div>
        </section>
    );
}
