import { supabase } from "../../lib/supabase";

export default function LogoutButton() {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/dashboard/login";
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110"
            title="Logout"
            aria-label="Logout"
        >
            <i className="hgi-stroke hgi-logout-02 text-base"></i>
        </button>
    );
}
