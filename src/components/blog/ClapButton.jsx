import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

/**
 * @param {{postId: string, initialClaps?: number, isNavbar?: boolean}} props
 */
export default function ClapButton({ postId, initialClaps = 0, isNavbar = false }) {
  const [claps, setClaps] = useState(initialClaps);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasClapped, setHasClapped] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const clappedPosts = JSON.parse(localStorage.getItem("clapped_posts") || "[]");
    if (clappedPosts.includes(postId)) {
      setHasClapped(true);
    }
  }, [postId]);

  // Sync with database claps if they change
  useEffect(() => {
    setClaps(initialClaps);
  }, [initialClaps]);

  const handleClap = async () => {
    if (isAnimating) return;

    const isUnclapping = hasClapped;
    setIsAnimating(true);
    setHasClapped(!isUnclapping);
    
    // Update local storage
    const clappedPosts = JSON.parse(localStorage.getItem("clapped_posts") || "[]");
    if (isUnclapping) {
      localStorage.setItem("clapped_posts", JSON.stringify(clappedPosts.filter(id => id !== postId)));
    } else {
      localStorage.setItem("clapped_posts", JSON.stringify([...clappedPosts, postId]));
    }
    
    // Optimistic update
    setClaps(prev => isUnclapping ? Math.max(0, prev - 1) : prev + 1);

    // Update DB
    const rpcName = isUnclapping ? 'decrement_claps' : 'increment_claps';
    const { error } = await supabase.rpc(rpcName, { post_id: postId });
    
    // Fallback if RPC isn't available (direct update on post_claps table)
    if (error) {
       await supabase
        .from("post_claps")
        .update({ claps: isUnclapping ? Math.max(0, claps - 1) : claps + 1 })
        .eq("post_id", postId);
    }

    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className={`flex items-center ${isNavbar ? "h-8 gap-2 px-4" : "flex-col gap-3"}`}>
      <button
        onClick={handleClap}
        disabled={isAnimating}
        className={`group relative flex items-center justify-center transition-all duration-500 
          ${hasClapped 
            ? "text-accent" 
            : "text-gray-400 dark:text-neutral-600 hover:text-accent"
          }`}
        aria-label={hasClapped ? "Unclap this post" : "Clap for this post"}
      >
        <i className={`hgi-stroke hgi-clapping-01 transition-transform duration-300 ${isNavbar ? "text-lg" : "text-6xl"} ${isAnimating ? "scale-125" : "group-hover:scale-110"}`}></i>
        
        {/* Particle Animation */}
        {isAnimating && (
          <span className={`absolute left-1/2 -translate-x-1/2 pointer-events-none text-accent font-bold animate-pulse ${isNavbar ? "text-[8px] top-0.5" : "text-2xl top-1/2 -translate-y-1/2 opacity-60"}`}>
            {hasClapped ? "+1" : "-1"}
          </span>
        )}
      </button>
      <span className={`${isNavbar ? "text-[10px]" : "text-sm"} font-product-sans font-bold text-gray-500 dark:text-gray-400 tracking-tight`}>
        {claps.toLocaleString()} <span className={isNavbar ? "hidden sm:inline" : ""}>claps</span>
      </span>
    </div>
  );
}
