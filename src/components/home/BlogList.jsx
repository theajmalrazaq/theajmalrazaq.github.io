import { useState } from "react";

export default function BlogList({ posts, showPagination = true }) {
  const perPage = 5;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(posts.length / perPage);
  const visible = posts.slice(page * perPage, page * perPage + perPage);

  return (
    <>
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          {page > 0 && (
            <button
              onClick={() => setPage(page - 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 font-product-sans text-sm"
            >
              Load Prev
            </button>
          )}
          {page < totalPages - 1 && (
            <button
              onClick={() => setPage(page + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 font-product-sans text-sm"
            >
              Load Next
            </button>
          )}
        </div>
      )}

      {/* Blog Posts List */}
      <div className="flex flex-col gap-4 mt-4">
        {visible.map((post, index) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-row items-center gap-4 sm:gap-8 group hover:opacity-75 transition-opacity duration-300 w-full py-4 border-b border-gray-100 dark:border-neutral-900 last:border-0"
          >
            <div className="text-gray-500 dark:text-gray-400 [font-family:'GeistPixelGrid'] text-lg font-bold min-w-[40px]">
              {String(page * perPage + index + 1).padStart(2, "0")}.
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
              <h3 className="text-base font-product-sans font-bold text-gray-900 dark:text-gray-100 capitalize">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-product-sans whitespace-nowrap">
                {post.date}
              </p>
            </div>
            <i className="hgi-stroke hgi-arrow-right-01 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-400 dark:text-gray-500 flex-shrink-0"></i>
          </a>
        ))}
      </div>
    </>
  );
}
