import { useEffect, useState } from "react";
import PostEditor from "./PostEditor.jsx";

export default function PostEditorWrapper() {
    const [postId, setPostId] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        if (!id) {
            window.location.href = "/dashboard";
        } else {
            setPostId(id);
            setReady(true);
        }
    }, []);

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-10 h-10 border-4 border-gray-200 dark:border-neutral-600 border-t-accent dark:border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return <PostEditor postId={postId} />;
}
