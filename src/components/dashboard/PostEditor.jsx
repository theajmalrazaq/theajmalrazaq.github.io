import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { marked } from "marked";

export default function PostEditor({ postId = null }) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [socialImage, setSocialImage] = useState("");
    const [keywords, setKeywords] = useState("");
    const [readTime, setReadTime] = useState(5);
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!postId);
    const [preview, setPreview] = useState(false);
    const [activeTab, setActiveTab] = useState("content"); // "content" | "meta"

    // AI assistant state
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiIdea, setAiIdea] = useState("");
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiStatus, setAiStatus] = useState("");
    const puterLoaded = useRef(false);

    // Load Puter.js script dynamically
    const loadPuter = () => {
        return new Promise((resolve) => {
            if (window.puter) { resolve(); return; }
            if (puterLoaded.current) {
                const check = setInterval(() => {
                    if (window.puter) { clearInterval(check); resolve(); }
                }, 100);
                return;
            }
            puterLoaded.current = true;
            const s = document.createElement("script");
            s.src = "https://js.puter.com/v2/";
            s.onload = () => {
                const check = setInterval(() => {
                    if (window.puter) { clearInterval(check); resolve(); }
                }, 100);
            };
            document.head.appendChild(s);
        });
    };

    const generateWithAi = async () => {
        if (!aiIdea.trim()) return;
        setAiGenerating(true);
        setAiStatus("loading puter.js...");

        try {
            await loadPuter();
            setAiStatus("generating post with ai...");

            const prompt = `You are a professional blog content writer. Write a complete blog post based on this idea: "${aiIdea}"

Respond ONLY with valid JSON (no markdown code blocks, no extra text). Use this exact structure:
{
  "title": "An engaging, SEO-friendly title",
  "slug": "url-friendly-slug",
  "description": "A compelling 1-2 sentence summary",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
  "read_time": 5,
  "social_image": "A relevant high-quality landscape image URL from Unsplash. Use the format: https://images.unsplash.com/photo-{id}?w=1200&q=80 — pick a real Unsplash photo ID that matches the topic.",
  "content": "Full markdown blog post content with ## headings, **bold**, lists, code blocks etc. Make it detailed, professional, and at least 800 words."
}`;

            const response = await window.puter.ai.chat(prompt, {
                model: "gpt-4.1-nano",
            });

            // Handle various Puter.js response formats
            let text = "";
            if (typeof response === "string") {
                text = response;
            } else if (response?.message?.content) {
                const c = response.message.content;
                text = typeof c === "string" ? c : Array.isArray(c) ? c.map(b => b.text || "").join("") : String(c);
            } else if (response?.text) {
                text = response.text;
            } else {
                text = JSON.stringify(response);
            }

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI did not return valid JSON");

            const data = JSON.parse(jsonMatch[0]);

            setTitle(data.title || "");
            setSlug(data.slug || "");
            setDescription(data.description || "");
            setKeywords(data.keywords || "");
            setReadTime(data.read_time || 5);
            setContent(data.content || "");
            setSocialImage(data.social_image || "");

            setAiStatus("done!");
            setTimeout(() => {
                setShowAiModal(false);
                setAiStatus("");
                setAiIdea("");
            }, 800);
        } catch (err) {
            console.error("AI generation failed:", err);
            setAiStatus("failed: " + err.message);
            setTimeout(() => setAiStatus(""), 3000);
        } finally {
            setAiGenerating(false);
        }
    };

    useEffect(() => {
        if (postId) fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        setFetching(true);
        const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
        if (data) {
            setTitle(data.title || "");
            setSlug(data.slug || "");
            setDescription(data.description || "");
            setContent(data.content || "");
            setSocialImage(data.social_image || "");
            setKeywords(data.keywords ? data.keywords.join(", ") : "");
            setReadTime(data.read_time || 5);
            setIsPublished(data.is_published || false);
        }
        setFetching(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const postData = {
            title,
            slug: slug.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
            description,
            content,
            social_image: socialImage,
            keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
            read_time: parseInt(readTime),
            is_published: isPublished,
            date: new Date().toISOString(),
        };

        const result = postId
            ? await supabase.from("posts").update(postData).eq("id", postId)
            : await supabase.from("posts").insert([postData]);

        if (result.error) {
            alert("Error saving: " + result.error.message);
        } else {
            window.location.href = "/dashboard";
        }
        setLoading(false);
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-600 border-t-accent dark:border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="relative w-full flex justify-center overflow-hidden z-10">
            <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-15 pt-16 sm:pt-24 pb-16 sm:pb-8 flex flex-col gap-8 z-10">

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <h1 className="text-[40px] sm:text-[50px] [font-family:'GeistPixelGrid'] text-gray-900 dark:text-gray-100">
                        {postId ? "edit post" : "new post"}
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed max-w-3xl mx-auto text-center">
                        {postId ? "Update your existing" : "Write a new"} <strong>blog post</strong> below.
                    </p>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-2">
                        <a
                            href="/dashboard"
                            className="cursor-pointer inline-flex items-center gap-2 pr-4 pl-2 py-2 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 font-product-sans font-medium text-sm"
                        >
                            <i className="hgi-stroke hgi-arrow-left-01 text-base"></i>
                            back
                        </a>
                        {!postId && (
                            <button
                                type="button"
                                onClick={() => setShowAiModal(true)}
                                className="cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-full text-violet-500 hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:border-violet-500/50 transition-all duration-300 font-product-sans font-medium text-sm"
                            >
                                ai write
                                <i className="hgi-stroke hgi-magic-wand-01 text-base"></i>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setPreview(!preview)}
                            className={`cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 border rounded-full transition-all duration-300 font-product-sans font-medium text-sm ${
                                preview
                                    ? "bg-accent/10 border-accent/30 text-accent"
                                    : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:text-accent hover:bg-accent/10 hover:border-accent/30"
                            }`}
                        >
                            {preview ? "editing" : "preview"}
                            <i className={`hgi-stroke ${preview ? "hgi-view-off-01" : "hgi-view-02"} text-base`}></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPublished(!isPublished)}
                            className={`cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 border rounded-full transition-all duration-300 font-product-sans font-medium text-sm ${
                                isPublished
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                    : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            
                            {isPublished ? "published" : "draft"}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-900 dark:text-gray-100 hover:text-accent hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 font-product-sans font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>saving <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span></>
                            ) : (
                                <>{postId ? "update" : "publish"} <i className="hgi-stroke hgi-arrow-right-01 text-base"></i></>
                            )}
                        </button>
                    </div>

                    {/* Tab switcher for metadata */}
                    {!preview && (
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full p-1 text-xs font-product-sans font-bold">
                            {["content", "meta"].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`cursor-pointer px-4 py-1.5 rounded-full transition-all duration-300 capitalize ${
                                        activeTab === tab
                                            ? "bg-white dark:bg-black text-gray-900 dark:text-gray-100 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Title input — always visible */}
                {!preview && (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Post title..."
                        required
                        className="w-full text-2xl sm:text-3xl font-bold bg-transparent outline-none border-b border-gray-100 dark:border-neutral-900 pb-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-200 dark:placeholder:text-neutral-800 font-product-sans"
                    />
                )}

                {/* Content tab */}
                {!preview && activeTab === "content" && (
                    <div className="flex flex-col gap-6">
                        {/* Inline slug + read time */}
                        <div className="flex flex-wrap items-center gap-3 -mt-4">
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-product-sans">
                                <i className="hgi-stroke hgi-link-01 text-xs"></i>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="url-slug"
                                    className="bg-transparent outline-none font-mono text-accent placeholder:text-gray-300 dark:placeholder:text-neutral-700 w-36"
                                />
                            </div>
                            <span className="text-gray-200 dark:text-neutral-800">·</span>
                            <div className="flex items-center gap-1 text-xs text-gray-400 font-product-sans">
                                <i className="hgi-stroke hgi-clock-01 text-xs"></i>
                                <input
                                    type="number"
                                    value={readTime}
                                    onChange={(e) => setReadTime(e.target.value)}
                                    className="bg-transparent outline-none w-8 font-mono text-gray-500 dark:text-gray-400"
                                />
                                <span>min read</span>
                            </div>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your content in markdown..."
                            required
                            className="w-full min-h-[500px] bg-transparent outline-none border-none text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed resize-none text-base py-2 border-t border-gray-100 dark:border-neutral-900 pt-4"
                        />
                    </div>
                )}

                {/* Meta tab */}
                {!preview && activeTab === "meta" && (
                    <div className="flex flex-col gap-6 border-t border-gray-100 dark:border-neutral-900 pt-6">
                        {[
                            { label: "Description", value: description, onChange: setDescription, placeholder: "A short summary of the post...", rows: 3 },
                        ].map(({ label, value, onChange, placeholder, rows }) => (
                            <div key={label} className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 font-product-sans">
                                    {label}
                                </label>
                                <textarea
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder={placeholder}
                                    rows={rows}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl font-product-sans text-sm text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-neutral-700 outline-none focus:border-accent transition-colors duration-300 resize-none"
                                />
                            </div>
                        ))}

                        {[
                            { label: "Thumbnail URL", value: socialImage, onChange: setSocialImage, placeholder: "https://..." },
                            { label: "Keywords (comma separated)", value: keywords, onChange: setKeywords, placeholder: "react, design, css..." },
                        ].map(({ label, value, onChange, placeholder }) => (
                            <div key={label} className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 font-product-sans">
                                    {label}
                                </label>
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full font-product-sans text-sm text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-neutral-700 outline-none focus:border-accent transition-colors duration-300"
                                />
                            </div>
                        ))}

                        {socialImage && (
                            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-900 mt-2">
                                <img src={socialImage} className="w-full h-full object-cover" alt="Cover preview" />
                            </div>
                        )}
                    </div>
                )}

                {/* Preview mode */}
                {preview && (
                    <div className="border-t border-gray-100 dark:border-neutral-900 pt-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-400 font-product-sans">Live Preview</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-bold [font-family:'GeistPixelGrid'] text-gray-900 dark:text-gray-100 mb-8">
                            {title || "Untitled"}
                        </h2>
                        <div
                            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:font-product-sans prose-p:text-gray-500 dark:prose-p:text-gray-400 prose-headings:font-product-sans"
                            dangerouslySetInnerHTML={{ __html: marked.parse(content || "_Nothing to preview yet..._") }}
                        />
                    </div>
                )}

                {/* AI Modal */}
                {showAiModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !aiGenerating && setShowAiModal(false)}>
                        <div
                            className="w-full max-w-lg mx-4 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-8 flex flex-col gap-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                                    <i className="hgi-stroke hgi-magic-wand-01 text-lg"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-product-sans">AI Writer</h3>
                                    <p className="text-xs text-gray-400 font-product-sans">powered by puter.js · no api keys needed</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 font-product-sans">Your idea or topic</label>
                                <textarea
                                    value={aiIdea}
                                    onChange={(e) => setAiIdea(e.target.value)}
                                    placeholder="e.g. A guide on building accessible React components with ARIA patterns..."
                                    rows={4}
                                    disabled={aiGenerating}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl font-product-sans text-sm text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-neutral-700 outline-none focus:border-violet-500 transition-colors duration-300 resize-none disabled:opacity-50"
                                />
                            </div>

                            {aiStatus && (
                                <div className="flex items-center gap-2 text-xs font-product-sans text-violet-500">
                                    {aiGenerating && <span className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>}
                                    {aiStatus}
                                </div>
                            )}

                            <div className="flex items-center gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAiModal(false)}
                                    disabled={aiGenerating}
                                    className="cursor-pointer px-4 py-2 rounded-full text-sm font-product-sans font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 disabled:opacity-50"
                                >
                                    cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={generateWithAi}
                                    disabled={aiGenerating || !aiIdea.trim()}
                                    className="cursor-pointer inline-flex items-center gap-2 pl-4 pr-2 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-white font-product-sans font-medium text-sm hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {aiGenerating ? (
                                        <>generating <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span></>
                                    ) : (
                                        <>generate <i className="hgi-stroke hgi-arrow-right-01 text-base"></i></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
}
