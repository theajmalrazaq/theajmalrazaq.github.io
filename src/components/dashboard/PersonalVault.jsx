import { useState, useEffect } from "react";

export default function PersonalVault({ initialSection = "notes", hideNav = false }) {
    const [activeSection, setActiveSection] = useState(initialSection); // "notes" | "todos" | "links"

    useEffect(() => {
        if (initialSection) {
            setActiveSection(initialSection);
        }
    }, [initialSection]);
    const [notes, setNotes] = useState([]);
    const [todos, setTodos] = useState([]);
    const [links, setLinks] = useState([]);
    const [newTodo, setNewTodo] = useState("");
    const [newLink, setNewLink] = useState({ title: "", url: "" });
    const [editingNote, setEditingNote] = useState(null);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");

    // Load data from localStorage on mount
    useEffect(() => {
        const savedNotes = localStorage.getItem("vault_notes");
        const savedTodos = localStorage.getItem("vault_todos");
        const savedLinks = localStorage.getItem("vault_links");
        if (savedNotes) setNotes(JSON.parse(savedNotes));
        if (savedTodos) setTodos(JSON.parse(savedTodos));
        if (savedLinks) setLinks(JSON.parse(savedLinks));
    }, []);

    // Save data whenever it changes
    useEffect(() => {
        localStorage.setItem("vault_notes", JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem("vault_todos", JSON.stringify(todos));
    }, [todos]);

    useEffect(() => {
        localStorage.setItem("vault_links", JSON.stringify(links));
    }, [links]);

    // --- Todo Logic ---
    const addTodo = (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        const todo = {
            id: Date.now(),
            text: newTodo,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        setTodos([todo, ...todos]);
        setNewTodo("");
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(t => t.id !== id));
    };

    // --- Link Logic ---
    const addLink = (e) => {
        e.preventDefault();
        if (!newLink.url.trim()) return;
        const link = {
            id: Date.now(),
            title: newLink.title || newLink.url,
            url: newLink.url.startsWith("http") ? newLink.url : `https://${newLink.url}`,
            createdAt: new Date().toISOString(),
        };
        setLinks([link, ...links]);
        setNewLink({ title: "", url: "" });
    };

    const deleteLink = (id) => {
        setLinks(links.filter(l => l.id !== id));
    };

    // --- Notes Logic ---
    const saveNote = () => {
        if (!noteTitle.trim() && !noteContent.trim()) {
            setEditingNote(null);
            return;
        }

        if (editingNote && editingNote.id) {
            setNotes(notes.map(n => n.id === editingNote.id ? { ...n, title: noteTitle, content: noteContent, updatedAt: new Date().toISOString() } : n));
        } else {
            const newNote = {
                id: Date.now(),
                title: noteTitle,
                content: noteContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setNotes([newNote, ...notes]);
        }
        setEditingNote(null);
        setNoteTitle("");
        setNoteContent("");
    };

    const startEditNote = (note) => {
        setEditingNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content);
    };

    const deleteNote = (id) => {
        if (window.confirm("Delete this note?")) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Sub-tabs - Only show if not specialized */}
            {!hideNav && (
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center gap-2 p-1 bg-gray-100/50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-2xl w-fit mx-auto">
                        {[
                            { id: "notes", icon: "hgi-note" },
                            { id: "todos", icon: "hgi-task-01" },
                            { id: "links", icon: "hgi-link-01" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-product-sans font-bold transition-all duration-300 capitalize ${
                                    activeSection === tab.id
                                        ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-neutral-700"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                            >
                                <i className={`hgi-stroke ${tab.icon} text-base`}></i>
                                {tab.id}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500/80 font-product-sans uppercase tracking-wider">
                            Stored locally on this device
                        </span>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeSection === "todos" ? (
                    <div className="flex flex-col gap-6 max-w-xl mx-auto">
                        <form onSubmit={addTodo} className="flex gap-2">
                            <input
                                type="text"
                                value={newTodo}
                                onChange={(e) => setNewTodo(e.target.value)}
                                placeholder="What needs to be done?"
                                className="flex-1 px-4 py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl font-product-sans text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-accent transition-all"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-product-sans font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2"
                            >
                                <i className="hgi-stroke hgi-plus text-base"></i>
                                Add
                            </button>
                        </form>

                        <div className="flex flex-col gap-2">
                            {todos.map(todo => (
                                <div
                                    key={todo.id}
                                    className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-neutral-900/30 border border-gray-100 dark:border-neutral-800/50 rounded-2xl group transition-all hover:border-gray-200 dark:hover:border-neutral-700"
                                >
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            todo.completed
                                                ? "bg-accent border-accent text-white"
                                                : "border-gray-300 dark:border-neutral-700 hover:border-accent"
                                        }`}
                                    >
                                        {todo.completed && <i className="hgi-stroke hgi-tick-01 text-[10px] font-bold"></i>}
                                    </button>
                                    <span className={`flex-1 font-product-sans text-sm transition-all ${
                                        todo.completed ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"
                                    }`}>
                                        {todo.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                    >
                                        <i className="hgi-stroke hgi-delete-02 text-base"></i>
                                    </button>
                                </div>
                            ))}
                            {todos.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-3xl">
                                    <p className="text-gray-400 dark:text-neutral-600 font-product-sans text-sm">No tasks yet. Stay productive!</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeSection === "links" ? (
                    <div className="flex flex-col gap-6 max-w-xl mx-auto">
                        <form onSubmit={addLink} className="flex flex-col gap-3 p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-product-sans">Save a bookmark</h3>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={newLink.title}
                                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                    placeholder="Title (optional)"
                                    className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl font-product-sans text-sm outline-none focus:border-accent"
                                />
                                <input
                                    type="text"
                                    value={newLink.url}
                                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                    placeholder="URL (e.g. google.com)"
                                    required
                                    className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl font-product-sans text-sm outline-none focus:border-accent"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-accent text-white rounded-xl font-product-sans font-bold text-sm hover:opacity-90 transition-all"
                            >
                                Save Bookmark
                            </button>
                        </form>

                        <div className="grid grid-cols-1 gap-2">
                            {links.map(link => (
                                <div
                                    key={link.id}
                                    className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl group transition-all hover:border-accent/30"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400">
                                        <i className="hgi-stroke hgi-link-01 text-sm"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-product-sans truncate">{link.title}</h4>
                                        <a href={link.url} target="_blank" className="text-xs text-accent hover:underline truncate block">{link.url}</a>
                                    </div>
                                    <button
                                        onClick={() => deleteLink(link.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                    >
                                        <i className="hgi-stroke hgi-delete-02 text-base"></i>
                                    </button>
                                </div>
                            ))}
                            {links.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-3xl">
                                    <p className="text-gray-400 dark:text-neutral-600 font-product-sans text-sm">No bookmarks yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {editingNote || (!notes.length && !editingNote) ? (
                            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
                                <input
                                    type="text"
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    placeholder="Note Title"
                                    className="w-full text-xl font-bold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-300 font-product-sans"
                                />
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Write your thoughts here..."
                                    rows={8}
                                    className="w-full bg-transparent outline-none text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed resize-none text-base border-t border-gray-100 dark:border-neutral-800 pt-4"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            setEditingNote(null);
                                            setNoteTitle("");
                                            setNoteContent("");
                                        }}
                                        className="px-4 py-2 text-sm font-product-sans text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveNote}
                                        className="px-6 py-2 bg-accent text-white rounded-full font-product-sans font-bold text-sm hover:opacity-90 transition-all"
                                    >
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setEditingNote({ id: null })}
                                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-3xl hover:border-accent/50 hover:bg-accent/5 transition-all group min-h-[160px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all text-gray-400">
                                        <i className="hgi-stroke hgi-plus text-lg"></i>
                                    </div>
                                    <span className="text-sm font-product-sans font-bold text-gray-500 dark:text-gray-400 group-hover:text-accent transition-all">New Note</span>
                                </button>

                                {notes.map(note => (
                                    <div
                                        key={note.id}
                                        className="group relative flex flex-col gap-3 p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl hover:border-accent/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                        onClick={() => startEditNote(note)}
                                    >
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-product-sans truncate pr-8">
                                            {note.title || "Untitled Note"}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-product-sans line-clamp-3">
                                            {note.content || "Empty note content..."}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-product-sans mt-auto border-t border-gray-50 dark:border-neutral-800 pt-3">
                                            Updated {new Date(note.updatedAt).toLocaleDateString()}
                                        </p>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                        >
                                            <i className="hgi-stroke hgi-delete-02 text-base"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
