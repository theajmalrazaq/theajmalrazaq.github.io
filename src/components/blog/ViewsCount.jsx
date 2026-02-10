import { useState } from "react";
// import { supabase } from "../../lib/supabaseClient";

export default function ViewsCount({ blogId }) {
  const [views, setViews] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return <span className="text-white/60">•••</span>;
  }

  return <span className="text-white/60">{views.toLocaleString()}</span>;
}