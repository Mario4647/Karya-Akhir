import { useState, useEffect } from "react";

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
            }`}
        >
            <button
                onClick={scrollToTop}
                className="w-15 h-15 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-110"
                title="Kembali ke Atas"
            >
                <i className="bx bx-chevron-up text-2xl"></i>
            </button>
        </div>
    );
};

export default ScrollToTop;