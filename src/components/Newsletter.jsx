import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Newsletter({ direction = "flex-col" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("newsletter")
        .insert([{ email: email.trim().toLowerCase() }])
        .select();

      if (error) {
        // Handle duplicate email error
        if (error.code === "23505") {
          setStatus("error");
          setMessage("This email is already subscribed!");
        } else {
          throw error;
        }
      } else {
        setStatus("success");
        setMessage("Successfully subscribed! Welcome aboard 🎉");
        setEmail("");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 5000);
  };

  return (
    <section className="relative flex justify-center items-center w-full px-4 sm:px-0">
      {/* Background decoration */}

      <div className="w-full max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className={`space-y-4 w-full flex ${direction} justify-center items-center gap-4`}
        >
          <div
            className={`relative ${
              direction === "flex-row" ? "flex-1" : "w-full"
            }`}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-6 py-3 rounded-full bg-black/50 border border-white/10 text-white placeholder-white/50 focus:border-accent focus:outline-none transition-all duration-300 font-product-sans backdrop-blur-md shadow-accent-soft"
              disabled={status === "loading"}
              required
              data-aos="focus-up"
              data-aos-delay="500"
              data-aos-duration="800"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className={`font-nixel tracking-[1px] text-white bg-accent hover:bg-accent/90 disabled:bg-accent/50 px-6 py-3 ${
              direction === "flex-row" ? "w-auto whitespace-nowrap" : "w-full"
            } rounded-full transition-all duration-300 ease-in-out hover:scale-105 disabled:scale-100 cursor-pointer text-base flex justify-center items-center gap-2 relative shadow-accent-soft border border-accent/20`}
            data-aos="focus-up"
            data-aos-delay="500"
            data-aos-duration="800"
            style={{ wordSpacing: "-7px" }}
          >
            {status === "loading" ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                subscribing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                subscribe now
              </>
            )}
          </button>
        </form>

        {/* Status message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${
              status === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : status === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
            data-aos="focus-up"
            data-aos-duration="300"
          >
            <p className="text-sm font-product-sans text-center">{message}</p>
          </div>
        )}

        {/* Additional info */}
        <div
          className="mt-4 text-center"
          data-aos="focus-up"
          data-aos-delay="500"
          data-aos-duration="800"
        >
          <p className="text-xs text-white/50 font-product-sans">
            No spam, unsubscribe at any time. Privacy respected.
          </p>
        </div>
      </div>
    </section>
  );
}
