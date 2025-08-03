import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { ThumbsUp } from 'lucide-react';

export default function LikeView({ blogId, initialViews = 0, initialLikes = 0 }) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
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
        setLikes(data.likes_count || 0);
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
    <div id="like-button" className="flex items-center justify-center pt-52">
      <button className="relative" onClick={toggleLike} disabled={isLoading || hasLiked}>
        <div className="relative before:transition-opacity isolate size-28 rounded-full flex items-center justify-center gradient-box_gradientBorder__H_SK6" 
             style={{
               '--borderWidth': 1,
               '--background': 'linear-gradient(to bottom right, rgba(23, 23, 23, 70%) 0%, #525252 62%, rgba(23, 23, 23, 70%) 100%)',
               border: '1px solid transparent'
             }}>
          
          {/* Blur effect when not liked */}
          <span style={{
            transform: hasLiked ? 'translateX(0px) translateY(120%) rotate(-10deg) translateZ(0px)' : 'translateX(0px) translateY(0%) translateZ(0px)',
            filter: hasLiked ? 'blur(2px)' : 'blur(0px)',
            opacity: hasLiked ? 0 : 1,
            transition: 'all 0.3s ease'
          }}>
            <ThumbsUp 
              size={56} 
              className="text-neutral-500"
              fill="rgba(112, 112, 112, 0.1)"
              stroke="url(#paint1_linear_thumbs_up)"
            />
          </span>

          {/* Liked state */}
          <span className="absolute" style={{
            opacity: hasLiked ? 1 : 0,
            filter: hasLiked ? 'blur(0px)' : 'blur(2px)',
            transform: hasLiked ? 'translateY(0%) translateZ(0px)' : 'translateY(120%) translateZ(0px)',
            transition: 'all 0.3s ease'
          }}>
            <ThumbsUp 
              size={56} 
              className="text-accent"
            />
          </span>
        </div>

        {/* Like count display */}
        <span className="px-4 flex items-center text-9xl font-rethink font-extrabold text-neutral-900 pointer-events-none absolute top-[-85%] left-1/2 -translate-x-1/2" 
              style={{
                maskImage: 'linear-gradient(rgba(0, 0, 0, 0.97) 0%, rgba(0, 0, 0, 0) 110%)',
                '--text-shadow-color': 'rgba(82, 82, 82, 0.8)',
                textShadow: '-0.3px 0 var(--text-shadow-color), 0 0.3px var(--text-shadow-color), 0.3px 0 var(--text-shadow-color), 0 -0.3px var(--text-shadow-color)',
                opacity: 1
              }}>
          {likes.toString().split('').map((digit, index) => (
            <span key={index} style={{ opacity: 1 }}>{digit}</span>
          ))}
          <span className="absolute left-0 inset-y-0 bg-neutral-800 ml-1 self-stretch w-px invisible" 
                style={{ translate: '232px', opacity: 0.651644 }}></span>
        </span>
      </button>
    </div>
  );
}
