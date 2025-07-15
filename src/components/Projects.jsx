import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
export default function Projects({ children }) {
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
      <div className="flex flex-col items-center justify-center gap-8 p-6 w-full">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-card text-white bg-black border border-white/10 p-4 rounded-3xl shadow-lg flex sm:flex-row flex-col shadow-accent items-start gap-4 w-auto "
          >
            <div>
              <img
                src={project.img}
                alt={project.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <img src={project.icon} alt="" className="w-15 h-15" />
                <h3 className="text-3xl font-semibold text-white font-recoleta">
                  {project.name}
                </h3>
                <p className="text-sm text-white">{project.description}</p>
              </div>

              <div className="flex justify-between items-center h-full">
                <div className="relative mt-4 flex items-center justify-between w-fit ">
                  <div className=" bg-accent w-5 h-9 absolute rounded-full"></div>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="z-99 relative"
                  >
                    <div
                      className="w-fit bg-black/5 border text-accent sm:px-3 px-1 py-2 border-white/10 rounded-xl backdrop-blur-2xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer sm:text-base text-sm flex justify-center items-center gap-2"
                      aria-label="View Project"
                    >
                      View Project
                      <div className="bg-gradient-to-r to-black/0 p-2 text-white shadow-accent rounded-full flex items-center justify-center w-auto">
                        {children}
                      </div>
                    </div>
                  </a>
                </div>

                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {" "}
                  Github{" "}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
