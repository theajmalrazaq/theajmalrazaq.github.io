import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LikesCount({ blogId }) {
  const [likes, setLikes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!blogId) {
      setIsLoading(false);
      return;
    }
    fetchLikesCount();
  }, [blogId]);

  const fetchLikesCount = async () => {
    try {
      console.log("Fetching likes for blogId:", blogId);
      const { data, error } = await supabase
        .from("blog_data")
        .select("likes_count")
        .eq("id", blogId)
        .single();

      console.log("Likes data response:", data, "Error:", error);
      if (error) {
        console.error("Error fetching likes:", error);
        setLikes(0);
      } else {
        setLikes(data?.likes_count || 0);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
      setLikes(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <span className="text-white/60">•••</span>;
  }

  return <span className="text-white/60">{likes.toLocaleString()}</span>;
}