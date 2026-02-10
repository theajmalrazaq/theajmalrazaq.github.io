import { useState, useEffect } from "react";
// import { supabase } from "../../lib/supabaseClient";

export default function LikesCount({ blogId }) {
  const [likes, setLikes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return <span className="text-white/60">•••</span>;
  }

  return <span className="text-white/60">{likes.toLocaleString()}</span>;
}