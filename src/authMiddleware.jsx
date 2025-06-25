import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

    useEffect(() => {
        let inactivityTimer;

        // Function to reset the inactivity timer
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            if (user) { // Only set timer if user is logged in
                inactivityTimer = setTimeout(async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    navigate("/auth");
                }, INACTIVITY_TIMEOUT);
            }
        };

        // Check initial authentication state
        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    setUser(null);
                    navigate("/auth");
                } else {
                    setUser(user);
                    resetInactivityTimer(); // Start timer after successful auth
                }
            } catch (err) {
                console.error("Auth check error:", err);
                setUser(null);
                navigate("/auth");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                setUser(session?.user || null);
                resetInactivityTimer(); // Start timer on sign-in
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                navigate("/auth");
                clearTimeout(inactivityTimer); // Clear timer on sign-out
            }
        });

        // Event listeners for user activity
        const activityEvents = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
        activityEvents.forEach((event) => {
            window.addEventListener(event, resetInactivityTimer);
        });

        // Cleanup
        return () => {
            clearTimeout(inactivityTimer);
            activityEvents.forEach((event) => {
                window.removeEventListener(event, resetInactivityTimer);
            });
            subscription.unsubscribe();
        };
    }, [navigate, user]);

    return { user, loading };
};

export const withAuth = (Component) => {
    return (props) => {
        const { user, loading } = useAuth();

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                        <span className="text-gray-700">Memuat...</span>
                    </div>
                </div>
            );
        }

        if (!user) {
            return null;
        }

        return <Component {...props} user={user} />;
    };
};