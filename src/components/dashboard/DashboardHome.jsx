import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import PersonalVault from "./PersonalVault";
import SpotifyWidget from "./SpotifyWidget";
import GithubFeed from "./GithubFeed";
import AiChatbot from "./AiChatbot";
import MovieBox from "./MovieBox";
import { FlickeringGrid } from "../ui/FlickeringGrid";

export default function DashboardHome() {
    const [posts, setPosts] = useState([]);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(null); // null | "blog" | "feed" | "chat" | "notes" | "todo" | "cinema"
    const [currentTime, setCurrentTime] = useState(new Date());

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
        setLoading(false);
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
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-accent/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <h2 className="relative text-6xl sm:text-7xl font-bold tracking-widest [font-family:'GeistPixelGrid'] text-gray-900 dark:text-white transition-all duration-500 hover:scale-105">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                    <div className={`flex items-center justify-center gap-1 bg-gray-100/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200/50 dark:border-neutral-800/50 rounded-full p-1 mx-auto w-fit shadow-sm transition-all duration-500`}>
                        {[
                            { id: "blog", icon: "hgi-note-01", label: "Blog" },
                            { id: "feed", icon: "hgi-github", label: "Feed" },
                            { id: "chat", icon: "hgi-ai-chat-02", label: "Octo AI" },
                            { id: "notes", icon: "hgi-note", label: "Notes" },
                            { id: "todo", icon: "hgi-task-01", label: "To-Do" },
                            { id: "cinema", icon: "hgi-movie-01", label: "Cinema" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-full text-sm font-product-sans font-bold transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-black text-gray-900 dark:text-gray-100 shadow-sm outline-none ring-0"
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
                                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-red-500 transition-colors ml-1 border-l border-gray-200 dark:border-neutral-800"
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
                <div className="w-full h-full">
                    {activeTab === "blog" && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-900 pb-4">
                                <h2 className="text-xl font-bold font-product-sans text-gray-900 dark:text-white">Content Manager</h2>
                                <a
                                    href="/dashboard/new"
                                    className="cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 bg-accent text-white rounded-full hover:scale-105 transition-all duration-300 font-product-sans font-bold text-xs"
                                >
                                    New Post
                                    <i className="hgi-stroke hgi-plus text-sm"></i>
                                </a>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-600 border-t-accent dark:border-t-white rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {posts.map((post, index) => (
                                        <div key={post.id} className="flex flex-row items-center gap-4 sm:gap-8 group w-full py-4 border-b border-gray-100 dark:border-neutral-900 last:border-0">
                                            <div className="text-gray-300 dark:text-neutral-700 [font-family:'GeistPixelGrid'] text-lg font-bold min-w-[40px]">
                                                {String(index + 1).padStart(2, "0")}.
                                            </div>
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left overflow-hidden">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <h3 className="text-sm sm:text-base font-product-sans font-bold text-gray-900 dark:text-gray-100 truncate group-hover:opacity-75 transition-opacity duration-300">
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
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-product-sans whitespace-nowrap flex-shrink-0">
                                                    {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                                                <a href={`/dashboard/edit?id=${post.id}`} className="p-2 text-gray-400 hover:text-accent transition-colors"><i className="hgi-stroke hgi-pencil-edit-01"></i></a>
                                                <button onClick={() => handleDelete(post.id, post.title)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><i className="hgi-stroke hgi-delete-02"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                    {posts.length === 0 && <div className="text-center py-20 text-gray-400">No posts found.</div>}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === "feed" && <GithubFeed />}
                    {activeTab === "notes" && <PersonalVault initialSection="notes" hideNav={true} />}
                    {activeTab === "todo" && <PersonalVault initialSection="todos" hideNav={true} />}
                    {activeTab === "cinema" && <MovieBox />}
                    {activeTab === "chat" && <AiChatbot />}
                </div>
            </div>
        </section>
    );
}
