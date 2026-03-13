import { useEffect } from "react";

export default function DashboardModal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-md", zIndex = "z-[200]", hideHeader = false, padding = "p-8" }) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300`}>
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div className={`w-full ${maxWidth} bg-white dark:bg-black border border-gray-100 dark:border-neutral-900 rounded-[32px] sm:rounded-[40px] ${padding} flex flex-col gap-6 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl relative z-10 overflow-hidden`}>
                {!hideHeader && (
                    <div className="flex items-start justify-between">
                        <div>
                            {title && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-product-sans lowercase">{title}</h3>}
                            {subtitle && <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 font-product-sans mt-0.5 lowercase">{subtitle}</p>}
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-400 transition-colors cursor-pointer"
                        >
                            <i className="hgi-stroke hgi-cancel-01 text-sm"></i>
                        </button>
                    </div>
                )}
                
                <div className={`flex flex-col ${!hideHeader ? "gap-4" : ""} h-full`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
