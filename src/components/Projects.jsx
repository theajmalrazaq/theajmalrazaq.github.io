import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export default function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from("selected_projects")
        .select("*");
      if (error) console.error(error);
      else setProjects(data);
    }
    fetchProjects();
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
