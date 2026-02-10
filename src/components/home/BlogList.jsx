import { useState } from "react";

export default function BlogList({ posts }) {
  const perPage = 5;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(posts.length / perPage);
  const visible = posts.slice(page * perPage, page * perPage + perPage);

  return (
    <>
      {/* Heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            className="text-[50px] [font-family:'GeistPixelSquare'] text-gray-900 dark:text-gray-100"
            id="blog-heading"
          >
            blog
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-product-sans mt-2">
            {posts.length} posts
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
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
      </div>

      {/* Description */}
      <p className="text-base text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed max-w-3xl">
        My thoughts on <strong>software development</strong>,{" "}
        <strong>life</strong>, and more.
      </p>

      {/* Blog Posts List */}
      <div className="flex flex-col gap-6 mt-4">
        {visible.map((post, index) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex gap-4 sm:gap-6 items-start group hover:opacity-75 transition-opacity duration-300"
          >
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 [font-family:'GeistPixelSquare'] text-lg font-bold w-12">
              {String(page * perPage + index + 1).padStart(2, "0")}.
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-product-sans text-gray-900 dark:text-gray-100 capitalize">
                  {post.title}
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-product-sans">
                {post.date}
              </p>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
