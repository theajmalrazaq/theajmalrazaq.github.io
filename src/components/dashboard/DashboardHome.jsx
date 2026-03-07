import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardHome() {
    const [posts, setPosts] = useState([]);
    const [ready, setReady] = useState(false); // true once auth confirmed
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        init();
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/dashboard/login";
    };

    // Hold render until auth confirmed (prevents flash of dashboard to unauthenticated users)
    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-600 border-t-accent dark:border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <section className="relative w-full flex justify-center overflow-hidden z-10">
            <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-15 pt-16 sm:pt-24 pb-16 sm:pb-8 flex flex-col gap-8 z-10">

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <h1 className="text-[40px] sm:text-[50px] [font-family:'GeistPixelGrid'] text-gray-900 dark:text-gray-100">
                        dashboard
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed max-w-3xl mx-auto text-center">
                        Manage your <strong>blog posts</strong> and published <strong>content</strong>.
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                        <a
                            href="/dashboard/new"
                            className="cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-900 dark:text-gray-100 hover:text-accent hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 font-product-sans font-medium text-sm"
                        >
                            new post
                            <i className="hgi-stroke hgi-plus text-base"></i>
                        </a>
                        <button
                            onClick={handleLogout}
                            className="cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 font-product-sans font-medium text-sm"
                        >
                            logout
                            <i className="hgi-stroke hgi-logout-02 text-base"></i>
                        </button>
                    </div>
                </div>

                {/* Post List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-600 border-t-accent dark:border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {posts.map((post, index) => (
                            <div
                                key={post.id}
                                className="flex flex-row items-center gap-4 sm:gap-8 group w-full py-4 border-b border-gray-100 dark:border-neutral-900 last:border-0"
                            >
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

                                {/* Actions — appear on hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                                    <a
                                        href={`/dashboard/edit?id=${post.id}`}
                                        className="cursor-pointer p-2 text-gray-400 dark:text-gray-500 hover:text-accent transition-colors duration-200"
                                        title="Edit"
                                    >
                                        <i className="hgi-stroke hgi-pencil-edit-01 text-base"></i>
                                    </a>
                                    {post.is_published && (
                                        <a
                                            href={`/blog/${post.slug}`}
                                            target="_blank"
                                            className="cursor-pointer p-2 text-gray-400 dark:text-gray-500 hover:text-accent transition-colors duration-200"
                                            title="View live"
                                        >
                                            <i className="hgi-stroke hgi-link-01 text-base"></i>
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDelete(post.id, post.title)}
                                        className="cursor-pointer p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors duration-200"
                                        title="Delete"
                                    >
                                        <i className="hgi-stroke hgi-delete-02 text-base"></i>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {posts.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-gray-400 dark:text-gray-500 font-product-sans text-sm">No posts yet.</p>
                                <a href="/dashboard/new" className="text-accent hover:underline mt-2 inline-block font-product-sans font-bold text-sm">
                                    write your first post →
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
