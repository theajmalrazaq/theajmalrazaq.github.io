import { useState, useEffect, memo, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import DashboardModal from "./DashboardModal";

export default function PersonalVault({ initialSection = "notes", hideNav = false, isActive = true }) {
    const [activeSection, setActiveSection] = useState(initialSection); // "notes" | "todos"
    const [notes, setNotes] = useState([]);
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTodo, setNewTodo] = useState("");
    const [editingNote, setEditingNote] = useState(null);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [noteTags, setNoteTags] = useState("");
    const [todoFilter, setTodoFilter] = useState("all"); // "all" | "pending" | "completed"
    const [user, setUser] = useState(null);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiPreview, setAiPreview] = useState(null); // { type, data }
    const [aiStatus, setAiStatus] = useState("");
    const [puterReady, setPuterReady] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [subtaskModal, setSubtaskModal] = useState(null); // { rootTodo, parentId }
    const [subtaskInput, setSubtaskInput] = useState("");
    const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm, type, confirmText }

    useEffect(() => {
        if (initialSection) setActiveSection(initialSection);
        checkUser();
        loadPuter();
    }, [initialSection]);

    const loadPuter = () => {
        if (window.puter || customElements.get("puter-dialog")) { setPuterReady(true); return; }
        const s = document.createElement("script");
        s.src = "https://js.puter.com/v2/";
        s.onload = () => setPuterReady(true);
        document.head.appendChild(s);
    };

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) setLoading(false);
    };

    // Force refresh whenever section changes or component becomes active
    useEffect(() => {
        if (user && isActive) {
            // Fetch both to ensure the vault is fully synced
            fetchNotes();
            fetchTodos();
        }
    }, [user, activeSection, isActive]);

    // --- Data Fetching (Direct Supabase) ---
    const fetchNotes = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });
        
        if (!error) setNotes(data || []);
        setLoading(false);
    };

    const fetchTodos = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("todos")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        
        if (!error) setTodos(data || []);
        setLoading(false);
    };

    // --- Todo Logic (Updated for JSONB) ---
    const addTodo = async (e) => {
        if (e) e.preventDefault();
        if (!newTodo || !newTodo.trim()) return;

        const { data, error } = await supabase
            .from("todos")
            .insert({ text: newTodo, user_id: user.id, items: [] })
            .select();

        if (!error && data) {
            setTodos([data[0], ...todos]);
            setNewTodo("");
        }
    };

    // Helper to find and update a nested item
    const updateNestedItem = (items, targetId, updater) => {
        return items.map(item => {
            if (item.id === targetId) return updater(item);
            if (item.items?.length > 0) {
                return { ...item, items: updateNestedItem(item.items, targetId, updater) };
            }
            return item;
        });
    };

    // Helper to remove a nested item
    const removeNestedItem = (items, targetId) => {
        return items
            .filter(item => item.id !== targetId)
            .map(item => ({
                ...item,
                items: item.items ? removeNestedItem(item.items, targetId) : []
            }));
    };

    const addSubtask = useCallback((rootTodo, parentId) => {
        setSubtaskModal({ rootTodo, parentId });
        setSubtaskInput("");
    }, []);

    const confirmAddSubtask = async () => {
        if (!subtaskInput || !subtaskInput.trim() || !subtaskModal) return;

        const { rootTodo, parentId } = subtaskModal;
        const newSubtask = { id: crypto.randomUUID(), text: subtaskInput, completed: false, items: [] };
        
        // If the parent is the root itself
        let updatedItems;
        if (rootTodo.id === parentId) {
            updatedItems = [...(rootTodo.items || []), newSubtask];
        } else {
            updatedItems = updateNestedItem(rootTodo.items, parentId, (item) => ({
                ...item, 
                items: [...(item.items || []), newSubtask]
            }));
        }

        const { data, error } = await supabase
            .from("todos")
            .update({ items: updatedItems })
            .eq("id", rootTodo.id)
            .select()
            .single();

        if (!error) {
            setTodos(prev => prev.map(t => t.id === rootTodo.id ? data : t));
            setSubtaskModal(null);
            setSubtaskInput("");
        }
    };

    const toggleTodo = useCallback(async (rootTodo, itemId, isRoot) => {
        setTogglingId(itemId);
        
        let update;
        const newStatus = isRoot ? !rootTodo.completed : null;

        // Recursive helper to toggle an item and all its children
        const toggleWithChildren = (item, status) => {
            const updated = { ...item, completed: status };
            if (updated.items) {
                updated.items = updated.items.map(child => toggleWithChildren(child, status));
            }
            return updated;
        };

        if (isRoot) {
            const updatedRoot = toggleWithChildren(rootTodo, !rootTodo.completed);
            update = { completed: updatedRoot.completed, items: updatedRoot.items };
        } else {
            // Find the item to get its current status for toggling
            let targetStatus = false;
            const findStatus = (items) => {
                for (const item of items) {
                    if (item.id === itemId) { targetStatus = !item.completed; break; }
                    if (item.items) findStatus(item.items);
                }
            };
            findStatus(rootTodo.items);

            const updatedItems = updateNestedItem(rootTodo.items, itemId, (item) => 
                toggleWithChildren(item, targetStatus)
            );
            update = { items: updatedItems };
        }

        const { data, error } = await supabase
            .from("todos")
            .update(update)
            .eq("id", rootTodo.id)
            .select()
            .single();

        if (!error) {
            setTodos(prev => prev.map(t => t.id === rootTodo.id ? data : t));
        }
        setTogglingId(null);
    }, [todos]);

    const deleteTodo = useCallback(async (rootTodo, itemId, isRoot) => {
        setConfirmModal({
            title: isRoot ? "delete task?" : "delete subtask?",
            message: "are you sure you want to remove this item? this action cannot be undone.",
            confirmText: "delete",
            type: "danger",
            onConfirm: async () => {
                if (isRoot) {
                    const { error } = await supabase.from("todos").delete().eq("id", rootTodo.id);
                    if (!error) setTodos(prev => prev.filter(t => t.id !== rootTodo.id));
                } else {
                    const updatedItems = removeNestedItem(rootTodo.items, itemId);
                    const { data, error } = await supabase
                        .from("todos")
                        .update({ items: updatedItems })
                        .eq("id", rootTodo.id)
                        .select()
                        .single();
                    if (!error) setTodos(prev => prev.map(t => t.id === rootTodo.id ? data : t));
                }
                setConfirmModal(null);
            }
        });
    }, [todos]);

    // --- Notes Logic (Direct Supabase) ---
    const saveNote = async () => {
        if (!noteTitle.trim() && !noteContent.trim()) {
            setEditingNote(null);
            return;
        }
        setSaving(true);

        if (editingNote?.id) {
            const { data, error } = await supabase
                .from("notes")
                .update({ 
                    title: noteTitle, 
                    content: noteContent, 
                    tags: noteTags.split(",").map(t => t.trim()).filter(t => t),
                    updated_at: new Date().toISOString() 
                })
                .eq("id", editingNote.id)
                .select();
            
            if (!error && data) {
                setNotes(notes.map(n => n.id === editingNote.id ? data[0] : n));
                setEditingNote(null);
                setNoteTitle("");
                setNoteContent("");
            }
            setSaving(false);
        } else {
            const { data, error } = await supabase
                .from("notes")
                .insert({ 
                    title: noteTitle, 
                    content: noteContent, 
                    tags: noteTags.split(",").map(t => t.trim()).filter(t => t),
                    user_id: user.id 
                })
                .select();
            
            if (!error && data) {
                setNotes([data[0], ...notes]);
                setEditingNote(null);
                setNoteTitle("");
                setNoteContent("");
                setNoteTags("");
            }
            setSaving(false);
        }
    };

    const deleteNote = async (id) => {
        setConfirmModal({
            title: "delete note?",
            message: "are you sure you want to delete this note? this action cannot be undone.",
            confirmText: "delete",
            type: "danger",
            onConfirm: async () => {
                const { error } = await supabase
                    .from("notes")
                    .delete()
                    .eq("id", id);
                
                if (!error) {
                    setNotes(notes.filter(n => n.id !== id));
                }
                setConfirmModal(null);
            }
        });
    };

    // --- AI Logic (Puter.js) ---
    const fixGrammar = async () => {
        if (!noteTitle.trim() && !noteContent.trim()) return;
        setAiProcessing(true);
        setAiStatus("Fixing grammar...");

        try {
            const prompt = `You are a professional editor. Fix the grammar, spelling, and flow of this note. 
            Keep the tone natural but polished. 
            Title: "${noteTitle}"
            Content: "${noteContent}"
            
            Respond ONLY with valid JSON (no markdown code blocks):
            {
              "title": "the fixed title",
              "content": "the fixed content"
            }`;

            const response = await window.puter.ai.chat(prompt);
            const text = typeof response === 'string' ? response : (response.message?.content || response.text || JSON.stringify(response));
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid AI response");
            const data = JSON.parse(jsonMatch[0]);

            setNoteTitle(data.title);
            setNoteContent(data.content);
            setAiStatus("Done!");
            setTimeout(() => setAiStatus(""), 1500);
        } catch (err) {
            setAiStatus("Error fixing grammar.");
        } finally {
            setAiProcessing(false);
        }
    };

    const generateTasks = async (e) => {
        if (e) e.preventDefault();
        if (!newTodo.trim()) return;
        setAiProcessing(true);
        setAiStatus("Planning tasks...");

        try {
            const prompt = `Goal: "${newTodo}"
            Break this down into logical groups and items as described in the goal.
            STRICT RULES:
            1. Be LITERAL. Only include what is explicitly mentioned or naturally implied by the numbering (e.g. if "Ex 1.1 and 1.2" are mentioned, create those items).
            2. Do NOT add generic fluff tasks like "setup", "review", or "read objective".
            3. Group by the highest level mentioned (e.g. Chapter, Module, or Lab).
            
            Respond ONLY with a valid JSON array of objects:
            [
              { "text": "Group Title (e.g. Chapter 1)", "subtasks": ["Item (e.g. Ex 1.1)", "Item (e.g. Ex 1.2)"] }
            ]`;

            const response = await window.puter.ai.chat(prompt);
            const text = typeof response === 'string' ? response : (response.message?.content || response.text || JSON.stringify(response));
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("Invalid AI response");
            const data = JSON.parse(jsonMatch[0]);

            setAiPreview({ type: 'todos', data });
        } catch (err) {
            setAiStatus("Error planning tasks.");
        } finally {
            setAiProcessing(false);
        }
    };

    const addAiTasks = async () => {
        if (!aiPreview || aiPreview.type !== 'todos') return;
        setLoading(true);
        
        try {
            const tasksToInsert = aiPreview.data.map(item => ({
                text: item.text,
                user_id: user.id,
                items: (item.subtasks || []).map(s => ({
                    id: crypto.randomUUID(),
                    text: s,
                    completed: false,
                    items: []
                }))
            }));

            const { data, error } = await supabase
                .from("todos")
                .insert(tasksToInsert)
                .select();
                
            if (!error && data) {
                setTodos([...data, ...todos]);
                setNewTodo("");
                setAiPreview(null);
            }
        } catch (err) {
            // Error managed silently
        } finally {
            setLoading(false);
        }
    };

    // Move TodoItem outside the component below

    return (
        <>
            <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4">
            {!hideNav && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-gray-100/50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-full shrink-0">
                        {[{ id: "notes", icon: "hgi-note" }, { id: "todos", icon: "hgi-task-01" }].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-product-sans font-bold transition-all duration-300 capitalize cursor-pointer ${
                                    activeSection === tab.id
                                        ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-neutral-700"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                            >
                                <i className={`hgi-stroke ${tab.icon} text-base`}></i>
                                {tab.id}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="min-h-[400px]">
                {loading && (
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                        <div className="h-8 w-1/4 skeleton mb-4"></div>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-neutral-900">
                                <div className="w-10 h-10 rounded-full skeleton shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 skeleton"></div>
                                    <div className="h-3 w-1/2 skeleton"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {user && !loading && activeSection === "todos" && (
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-600 font-product-sans">personal tasks</h3>
                            <div className="flex items-center gap-1.5">
                                {["all", "pending", "completed"].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTodoFilter(f)}
                                        className={`px-3 py-1 text-[10px] font-product-sans font-bold border transition-all rounded-full uppercase tracking-tight cursor-pointer ${
                                            todoFilter === f 
                                                ? "bg-accent/10 border-accent/20 text-accent font-bold" 
                                                : "bg-transparent border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); if (newTodo.trim()) addTodo(); }} 
                                className="relative flex items-center bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-neutral-900 rounded-3xl p-1.5 transition-all focus-within:border-accent/30"
                            >
                                <input
                                    type="text"
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    placeholder="What's on your mind?"
                                    className="flex-1 px-4 py-2.5 bg-transparent font-product-sans text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-neutral-700"
                                />
                                <div className="flex gap-1.5">
                                    <button 
                                        type="submit"
                                        disabled={!newTodo.trim()}
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30 disabled:opacity-30 uppercase"
                                    >
                                        <i className="hgi-stroke hgi-plus text-sm"></i>
                                        <span>Add</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => generateTasks(e)}
                                        disabled={aiProcessing || !newTodo.trim()}
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-product-sans font-bold text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-accent/20 hover:border-accent/40 disabled:opacity-30 uppercase"
                                    >
                                        {aiProcessing ? (
                                            <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <i className="hgi-stroke hgi-magic-wand-01 text-sm"></i>
                                        )}
                                        <span>AI Plan</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="flex flex-col gap-0">
                            {todos
                                .filter(t => {
                                    if (todoFilter === "pending") return !t.completed;
                                    if (todoFilter === "completed") return t.completed;
                                    return true;
                                })
                                .map(todo => (
                                    <TodoItem 
                                        key={todo.id} 
                                        todo={todo} 
                                        rootTodo={todo} 
                                        onToggle={toggleTodo}
                                        onAddSub={addSubtask}
                                        onDelete={deleteTodo}
                                        togglingId={togglingId}
                                    />
                                ))}
                            {todos.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px]">
                                    <p className="text-sm text-gray-400 font-product-sans font-bold">no tasks found.</p>
                                </div>
                             )}
                        </div>
                    </div>
                )}
        
                {user && !loading && activeSection === "notes" && (
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                        {editingNote ? (
                            <div className="flex flex-col gap-6 bg-white dark:bg-neutral-950/20 border border-gray-100 dark:border-neutral-800 p-6 sm:p-10 rounded-[40px] animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex flex-col gap-6">
                                    <input
                                        type="text"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        placeholder="Note title..."
                                        className="w-full text-2xl font-bold bg-transparent outline-none border-b border-gray-100 dark:border-neutral-900 pb-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-200 dark:placeholder:text-neutral-800 font-product-sans"
                                    />
                                    
                                    <div className="flex flex-wrap items-center gap-3 -mt-2">
                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-product-sans">
                                            <i className="hgi-stroke hgi-tag-01 text-xs text-accent"></i>
                                            <input
                                                type="text"
                                                value={noteTags}
                                                onChange={(e) => setNoteTags(e.target.value)}
                                                placeholder="add tags..."
                                                className="bg-transparent outline-none font-bold text-accent placeholder:text-gray-300 dark:placeholder:text-neutral-700 w-32"
                                            />
                                        </div>
                                        <span className="text-gray-200 dark:text-neutral-800 text-xs">·</span>
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-600 font-product-sans uppercase">
                                            {editingNote?.id ? `Last saved: ${new Date(editingNote.updated_at).toLocaleDateString()}` : "New Entry"}
                                        </span>
                                    </div>

                                    <textarea
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="Start writing your thoughts..."
                                        rows={8}
                                        className="w-full bg-transparent outline-none text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed resize-none text-base border-t border-gray-100 dark:border-neutral-900 pt-6"
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-6 border-t border-gray-50 dark:border-neutral-900/50">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={fixGrammar}
                                            disabled={aiProcessing}
                                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-[10px] font-product-sans font-bold text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-accent/20 hover:border-accent/40 disabled:opacity-50"
                                        >
                                            <i className={`hgi-stroke ${aiProcessing ? 'hgi-loading animate-spin' : 'hgi-magic-wand-01'} text-xs`}></i>
                                            <span>fix grammar</span>
                                        </button>
                                        {aiStatus && <span className="text-[10px] text-accent font-bold self-center animate-pulse">{aiStatus}</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setEditingNote(null)} 
                                            disabled={saving}
                                            className="px-4 py-2 text-[11px] font-bold text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-product-sans uppercase disabled:opacity-50 cursor-pointer"
                                        >
                                            discard
                                        </button>
                                        <button 
                                            onClick={saveNote} 
                                            disabled={saving}
                                            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2 text-[11px] font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30 uppercase disabled:opacity-50 min-w-[120px] justify-center"
                                        >
                                            {saving ? (
                                                <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                <i className="hgi-stroke hgi-plus text-xs"></i>
                                            )}
                                            <span>{saving ? "saving..." : "save changes"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-600 font-product-sans">your notes</h3>
                                    <button 
                                        onClick={() => { setEditingNote({}); setNoteTitle(""); setNoteContent(""); setNoteTags(""); }}
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                                    >
                                        <i className="hgi-stroke hgi-plus text-sm"></i>
                                        <span>new note</span>
                                    </button>
                                </div>
                                
                                {notes.length === 0 && (
                                    <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-neutral-900 rounded-[32px]">
                                        <p className="text-sm text-gray-400 font-product-sans">No notes found. Create your first one!</p>
                                    </div>
                                )}

                                {notes.map(note => (
                                    <div 
                                        key={note.id} 
                                        onClick={() => { 
                                            setEditingNote(note); 
                                            setNoteTitle(note.title); 
                                            setNoteContent(note.content); 
                                            setNoteTags(note.tags?.join(", ") || "");
                                        }}
                                        className="group cursor-pointer relative flex items-center gap-4 p-4 bg-transparent border-b border-gray-100 dark:border-neutral-900 transition-all duration-300"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-900/50 flex items-center justify-center text-gray-400 shrink-0">
                                            <i className="hgi-stroke hgi-note-01 text-lg"></i>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 font-product-sans truncate text-sm">
                                                    {note.title || "Untitled Note"}
                                                </h3>
                                                {note.tags && note.tags.slice(0, 1).map(tag => (
                                                    <span key={tag} className="flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-product-sans font-bold bg-accent/10 text-accent border border-accent/20 uppercase">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {note.tags && note.tags.length > 1 && (
                                                    <span className="text-[9px] font-bold text-gray-400 font-product-sans">+{note.tags.length - 1}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-neutral-500 font-product-sans truncate">
                                                {note.content}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold text-gray-300 dark:text-neutral-700 font-product-sans uppercase transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
                                                {new Date(note.updated_at || note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                            <div className="absolute right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button className="p-2 text-gray-400 hover:text-accent transition-colors cursor-pointer"><i className="hgi-stroke hgi-pencil-edit-01"></i></button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                                >
                                                    <i className="hgi-stroke hgi-delete-02"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

            {/* AI Preview Modal */}
            {/* AI Preview Modal */}
            {/* AI Preview Modal */}
            <DashboardModal
                isOpen={!!aiPreview}
                onClose={() => setAiPreview(null)}
                title="ai planner"
                subtitle="live preview"
                maxWidth="max-w-lg"
            >
                <div className="flex-1 overflow-y-auto max-h-[45vh] pr-2 custom-scrollbar">
                    <div className="flex flex-col border-t border-gray-50 dark:border-neutral-950">
                        {aiPreview?.data?.map((item, idx) => (
                            <div key={idx} className="flex flex-col">
                                <div className="flex items-center py-6 border-b border-gray-50 dark:border-neutral-950">
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-product-sans">{item.text}</span>
                                </div>
                                {item.subtasks?.map((sub, sIdx) => (
                                    <div key={sIdx} className="flex items-center py-5 pl-8 border-b border-gray-50 dark:border-neutral-950/50 last:border-0">
                                        <span className="text-sm text-gray-500 dark:text-neutral-600 font-product-sans leading-none">{sub}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 dark:border-neutral-950">
                    <button 
                        onClick={() => setAiPreview(null)}
                        className="px-5 py-2 text-[10px] font-product-sans font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all cursor-pointer"
                    >
                        discard
                    </button>
                    <button 
                        onClick={addAiTasks}
                        className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30"
                    >
                        <i className="hgi-stroke hgi-tick-01 text-sm text-accent"></i>
                        <span>deploy plan</span>
                    </button>
                </div>
            </DashboardModal>

            {/* Add Subtask Modal */}
            <DashboardModal
                isOpen={!!subtaskModal}
                onClose={() => setSubtaskModal(null)}
                title="add subtask"
                subtitle="new item for your task"
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col gap-5">
                    <div className="relative">
                        <input 
                            autoFocus
                            type="text"
                            value={subtaskInput}
                            onChange={(e) => setSubtaskInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmAddSubtask()}
                            placeholder="What needs to be done?"
                            className="w-full bg-gray-50/50 dark:bg-neutral-900/30 border border-gray-100 dark:border-neutral-800/50 rounded-2xl px-5 py-4 text-sm font-product-sans text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-neutral-700 focus:outline-none focus:border-accent/30 transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => setSubtaskModal(null)}
                            className="px-4 py-2 text-[10px] font-product-sans font-bold text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all cursor-pointer uppercase tracking-wider"
                        >
                            cancel
                        </button>
                        <button 
                            onClick={confirmAddSubtask}
                            disabled={!subtaskInput.trim()}
                            className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-product-sans font-bold text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-accent/10 rounded-full transition-all duration-300 border border-gray-200 dark:border-neutral-800 hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            <i className="hgi-stroke hgi-plus text-xs text-accent"></i>
                            <span>add item</span>
                        </button>
                    </div>
                </div>
            </DashboardModal>

            {/* Global Confirmation Modal */}
            <DashboardModal
                isOpen={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                title={confirmModal?.title || "Confirm action"}
                subtitle="please confirm to proceed"
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-sm text-gray-500 dark:text-neutral-500 font-product-sans leading-relaxed">
                        {confirmModal?.message}
                    </p>

                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => setConfirmModal(null)}
                            className="px-4 py-2 text-[10px] font-product-sans font-bold text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all cursor-pointer uppercase tracking-wider"
                        >
                            cancel
                        </button>
                        <button 
                            onClick={() => confirmModal?.onConfirm()}
                            className={`cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-product-sans font-bold rounded-full transition-all duration-300 border uppercase tracking-wider ${
                                confirmModal?.type === 'danger'
                                    ? "text-red-500 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/40"
                                    : "text-accent hover:bg-accent/10 border-accent/20 hover:border-accent/40"
                            }`}
                        >
                            <span>{confirmModal?.confirmText || "confirm"}</span>
                        </button>
                    </div>
                </div>
            </DashboardModal>
        </>
    );
}
const TodoItem = memo(({ todo, rootTodo, depth = 0, onToggle, onAddSub, onDelete, togglingId }) => {
    const isRoot = todo.id === rootTodo.id;
    const subtasks = todo.items || [];
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
        <div className="flex flex-col">
            <div
                className={`group flex items-center gap-4 p-4 bg-transparent border-b border-gray-100 dark:border-neutral-900 transition-all duration-300 hover:bg-gray-50/30 dark:hover:bg-white/[0.01]`}
                style={{ paddingLeft: `${depth > 0 ? (depth * 28) + 16 : 16}px` }}
            >
                <div className="flex items-center gap-2">
                    {subtasks.length > 0 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className={`cursor-pointer w-4 h-4 flex items-center justify-center text-gray-400 hover:text-accent transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        >
                            <i className="hgi-stroke hgi-arrow-right-01 text-[10px]"></i>
                        </button>
                    )}
                    <button
                        onClick={() => onToggle(rootTodo, todo.id, isRoot)}
                        disabled={togglingId === todo.id}
                        className={`cursor-pointer w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 shrink-0 ${
                            todo.completed
                                ? "bg-accent border-accent text-white"
                                : "border-gray-200 dark:border-neutral-800 hover:border-accent"
                        } ${togglingId === todo.id ? "opacity-50" : ""}`}
                    >
                        {togglingId === todo.id ? (
                            <span className={`w-2 h-2 border-2 ${todo.completed ? 'border-white' : 'border-accent'} border-t-transparent rounded-full animate-spin`}></span>
                        ) : (
                            todo.completed && <i className="hgi-stroke hgi-tick-01 text-[10px] font-bold"></i>
                        )}
                    </button>
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className={`font-product-sans text-sm font-bold transition-all duration-500 truncate ${
                        todo.completed ? "text-gray-400 dark:text-neutral-600 line-through" : "text-gray-900 dark:text-gray-100"
                    }`}>
                        {todo.text}
                    </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddSub(rootTodo, todo.id); }}
                        className="p-2 text-gray-400 hover:text-accent transition-colors shrink-0 cursor-pointer"
                        title="Add subtask"
                    >
                        <i class="hgi hgi-stroke hgi-plus-sign-square"></i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(rootTodo, todo.id, isRoot); }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                    >
                        <i className="hgi-stroke hgi-delete-02 text-base"></i>
                    </button>
                </div>
            </div>
            {isExpanded && subtasks.map(sub => (
                <TodoItem 
                    key={sub.id} 
                    todo={sub} 
                    rootTodo={rootTodo} 
                    depth={depth + 1} 
                    onToggle={onToggle}
                    onAddSub={onAddSub}
                    onDelete={onDelete}
                    togglingId={togglingId}
                />
            ))}
        </div>
    );
});
