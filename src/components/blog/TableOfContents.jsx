import { useEffect, useState, useRef } from "react";

export default function TableOfContents() {
    const [headings, setHeadings] = useState([]);
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        // Find all headings in the article
        const article = document.querySelector("article.mdx");
        if (!article) return;

        const elements = article.querySelectorAll("h1, h2, h3");
        const items = [];

        elements.forEach((el, i) => {
            // Create an ID if not present
            if (!el.id) {
                el.id = el.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "") || `heading-${i}`;
            }
            items.push({
                id: el.id,
                text: el.textContent,
                level: parseInt(el.tagName[1]),
            });
        });

        setHeadings(items);
        if (items.length > 0) setActiveId(items[0].id);

        // Observe which heading is in view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-80px 0px -70% 0px" }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (headings.length === 0) return null;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                    open
                        ? "text-accent"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
                aria-label="Table of contents"
                title="Table of Contents"
            >
                <i className="hgi-stroke hgi-menu-08 text-base"></i>
            </button>

            {open && (
                <div className="absolute top-12 right-0 w-72 max-h-80 overflow-y-auto bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-3 z-50">
                    <div className="flex items-center gap-2 px-2 pb-2 mb-1 border-b border-gray-100 dark:border-neutral-900">
                        <i className="hgi-stroke hgi-menu-08 text-xs text-gray-400"></i>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 font-product-sans">
                            Table of Contents
                        </span>
                    </div>
                    <nav className="flex flex-col gap-0.5">
                        {headings.map((h) => (
                            <a
                                key={h.id}
                                href={`#${h.id}`}
                                onClick={() => setOpen(false)}
                                className={`block px-2 py-1.5 rounded-lg text-xs font-product-sans transition-all duration-200 truncate ${
                                    h.level === 1 ? "font-bold" : ""
                                } ${
                                    h.level === 3 ? "pl-6" : h.level === 2 ? "pl-4" : "pl-2"
                                } ${
                                    activeId === h.id
                                        ? "bg-accent/10 text-accent font-medium"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-900"
                                }`}
                            >
                                {h.text}
                            </a>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    );
}
