import { useState, useEffect } from "react";
// import { supabase } from "../../lib/supabaseClient";

     ///////////////////////////////////
    // LIKEVIEW COMPONENT
   ///////////////////////////////////

export default function LikeView({ blogId, initialViews = 0, initialLikes = 0 }) {

  ///////////////////////////////////
  // STATE MANAGEMENT
  ///////////////////////////////////

  const [views, setViews] = useState(initialViews);
  const [aura, setAura] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  ///////////////////////////////////
  // COMPONENT INITIALIZATION
  ///////////////////////////////////
  
  useEffect(() => {
    // Initialize liked posts from localStorage
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

  ///////////////////////////////////
  // FETCH BLOG DATA FROM SUPABASE
  ///////////////////////////////////
  
  const fetchBlogData = async () => {
    // Supabase disabled — using initial values
  };

  ///////////////////////////////////
  // INCREMENT VIEWS FUNCTIONALITY
  ///////////////////////////////////
  
  const incrementViews = async () => {
    // Don't increment views for localhost/development
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost'))) {
      return;
    }

    // Get viewed posts from localStorage
    let viewedPosts = [];
    try {
      const stored = localStorage.getItem("viewedPosts");
      viewedPosts = stored ? JSON.parse(stored) : [];
      
      if (!Array.isArray(viewedPosts)) {
        viewedPosts = [];
      }
    } catch (error) {
      console.error("Error parsing viewed posts from localStorage:", error);
      viewedPosts = [];
    }

    // If already viewed, don't increment
    if (viewedPosts.includes(blogId.toString())) {
      return;
    }

    // Supabase disabled — skip view increment
    viewedPosts.push(blogId.toString());
    localStorage.setItem("viewedPosts", JSON.stringify(viewedPosts));
  };

  ///////////////////////////////////
  // TOGGLE LIKE FUNCTIONALITY
  ///////////////////////////////////
  
  const toggleLike = async () => {
    // Prevent action if already liked or loading
    if (isLoading || hasLiked) return;

    setIsLoading(true);
    
    // Supabase disabled — handle like locally
    setHasLiked(true);
    setAura(prev => prev + 1);

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
    setIsLoading(false);
  };

  ///////////////////////////////////
  // COMPONENT RENDER
  ///////////////////////////////////
  
  return (
    <button
      onClick={toggleLike}
      disabled={isLoading || hasLiked}
      className="flex items-center gap-1 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>🌀</span>
      {aura}
      <span>{hasLiked ? `Aura Point` : 'Aura++'}</span>
    </button>
  );
}
