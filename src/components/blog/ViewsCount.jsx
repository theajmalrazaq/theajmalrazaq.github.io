import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ViewsCount({ blogId }) {
  const [views, setViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!blogId) {
      setIsLoading(false);
      return;
    }
    fetchViewsCount();
  }, [blogId]);

  const fetchViewsCount = async () => {
    try {
      console.log("Fetching views for blogId:", blogId);
      const { data, error } = await supabase
        .from("blog_data")
        .select("views_count")
        .eq("id", blogId)
        .single();

      console.log("Views data response:", data, "Error:", error);
      if (error) {
        console.error("Error fetching views:", error);
        setViews(0);
      } else {
        setViews(data?.views_count || 0);
      }
    } catch (error) {
      console.error("Error fetching views:", error);
      setViews(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <span className="text-white/60">•••</span>;
  }

  return <span className="text-white/60">{views.toLocaleString()}</span>;
}