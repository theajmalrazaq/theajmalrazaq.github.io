import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            window.location.href = "/dashboard";
        }
    };

    return (
        <section className="relative w-full flex justify-center overflow-hidden z-10">
            <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-15 pt-16 sm:pt-24 pb-16 sm:pb-8 flex flex-col items-center gap-8 z-10">

                {/* Heading */}
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <h1 className="text-[40px] sm:text-[50px] [font-family:'GeistPixelGrid'] text-gray-900 dark:text-gray-100">
                        admin login
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400 font-product-sans leading-relaxed max-w-3xl mx-auto text-center">
                        Enter your credentials to access the <strong>dashboard</strong>.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-6 mt-4">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="email"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 font-product-sans ml-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="mail@example.com"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full font-product-sans text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none focus:border-accent transition-colors duration-300"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="password"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 font-product-sans ml-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full font-product-sans text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none focus:border-accent transition-colors duration-300"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-product-sans text-center -mt-2">
                            {error}
                        </p>
                    )}

                    <div className="flex flex-col items-center gap-4 mt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer inline-flex items-center gap-2 pl-6 pr-4 py-2.5 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full text-gray-900 dark:text-gray-100 hover:text-accent hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 font-product-sans font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    authenticating
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                </>
                            ) : (
                                <>
                                    login
                                    <i className="hgi-stroke hgi-arrow-right-01 text-base"></i>
                                </>
                            )}
                        </button>

                        <a
                            href="/"
                            className="cursor-pointer text-xs font-product-sans text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                        >
                            ← back to portfolio
                        </a>
                    </div>
                </form>
            </div>
        </section>
    );
}
