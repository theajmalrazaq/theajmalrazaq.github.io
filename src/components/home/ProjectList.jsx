import { useState } from "react";

export default function ProjectList({ projects }) {
  const perPage = 5;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(projects.length / perPage);
  const visible = projects.slice(page * perPage, page * perPage + perPage);

  return (
    <>
      <div className="flex flex-col items-center justify-center text-center gap-4">
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
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

      {/* Projects List */}
      <div className="mt-4 flex flex-col gap-6">
        {visible.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-4 sm:gap-6 items-center text-center group hover:opacity-75 transition-opacity duration-300"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center text-lg">
              📦
            </div>
            <div className="flex-1 flex flex-col gap-1 items-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-product-sans font-bold text-gray-900 dark:text-gray-100 capitalize">
                    {repo.name}
                  </h3>
                  <i className="hgi-stroke hgi-arrow-up-right-01 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-400 dark:text-gray-500 flex-shrink-0"></i>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-product-sans whitespace-nowrap">
                  {repo.stargazers_count > 0 && (
                    <span className="flex items-center gap-1">⭐ {repo.stargazers_count}</span>
                  )}
                  {repo.forks_count > 0 && (
                    <span className="flex items-center gap-1">🍴 {repo.forks_count}</span>
                  )}
                </div>
              </div>
              {repo.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-product-sans leading-relaxed line-clamp-2 max-w-2xl">
                  {repo.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                {repo.language && (
                  <span className="inline-flex items-center px-3 py-0.5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-xs font-product-sans text-gray-600 dark:text-gray-400">
                    {repo.language}
                  </span>
                )}
                {repo.topics?.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-3 py-0.5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-xs font-product-sans text-gray-600 dark:text-gray-400"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
