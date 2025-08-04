import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LikeView({ blogId, initialViews = 0, initialLikes = 0 }) {
  const [views, setViews] = useState(initialViews);
  const [aura, setAura] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has already liked this post
    let likedPosts = [];
    try {
      const stored = localStorage.getItem("likedPosts");
      likedPosts = stored ? JSON.parse(stored) : [];
      // Ensure it's an array
      if (!Array.isArray(likedPosts)) {
        likedPosts = [];
      }
    } catch (error) {
      console.error("Error parsing liked posts from localStorage:", error);
      likedPosts = [];
    }
    setHasLiked(likedPosts.includes(blogId.toString()));

    // Fetch real data and increment view count when component mounts
    fetchBlogData();
    incrementViews();
  }, [blogId]);

  const fetchBlogData = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_data')
        .select('likes_count, views_count')
        .eq('id', blogId)
        .single();

      if (error) {
        console.error("Error fetching blog data:", error);
      } else if (data) {
        setAura(data.likes_count || 0);
        setViews(data.views_count || 0);
      }
    } catch (error) {
      console.error("Error fetching blog data:", error);
    }
  };

  const incrementViews = async () => {
    // Don't increment views for localhost/development
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost'))) {
      return;
    }

    try {
      const { error } = await supabase.rpc('increment_view', {
        blog_id: blogId
      });

      if (error) {
        console.error("Error incrementing views:", error);
      } else {
        // Fetch updated count after incrementing
        await fetchBlogData();
      }
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const toggleLike = async () => {
    if (isLoading || hasLiked) return; // Prevent action if already liked

    setIsLoading(true);
    
    try {
      // Like the post (no unlike functionality)
      const { error } = await supabase.rpc('increment_like', {
        blog_id: blogId
      });

      if (error) {
        console.error("Error incrementing likes:", error);
      } else {
        setHasLiked(true);
        
        // Add to localStorage
        let likedPosts = [];
        try {
          const stored = localStorage.getItem("likedPosts");
          likedPosts = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(likedPosts)) {
            likedPosts = [];
          }
        } catch (error) {
          console.error("Error parsing liked posts from localStorage:", error);
          likedPosts = [];
        }
        likedPosts.push(blogId.toString());
        localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
        
        // Fetch updated count after incrementing
        await fetchBlogData();
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading || hasLiked}
      className="flex items-center gap-1 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>🌀</span>
      <span>{hasLiked ? `${aura} Aura Point` : 'Aura++'}</span>
    </button>
  );
}
