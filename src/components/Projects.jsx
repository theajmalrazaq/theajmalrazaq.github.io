import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Add a check to ensure we're in browser environment
    if (typeof window !== "undefined") {
      async function fetchProjects() {
        try {
          const { data, error } = await supabase
            .from("selected_projects")
            .select("*");
          if (error) console.error("Supabase error:", error);
          else setProjects(data || []);
        } catch (e) {
          console.error("Fetch error:", e);
        }
      }
      fetchProjects();
    }
  }, []);

  return (
    <section>
      <div className="grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card text-white">
            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
            <p className="text-sm text-white">{project.description}</p>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              View Project
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
