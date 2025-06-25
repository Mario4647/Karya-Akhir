import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check initial authentication state
        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    setUser(null);
                    navigate("/auth");
                } else {
                    setUser(user);
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
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                navigate("/auth");
            }
        });

        // Handle browser close to trigger logout
        const handleBeforeUnload = async () => {
            try {
                await supabase.auth.signOut();
            } catch (err) {
                console.error("Error during sign out on browser close:", err);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // Cleanup
        return () => {
            subscription.unsubscribe();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [navigate]);

    return { user, loading };
};

export const withAuth = (Component) => {
    return (props) => {
        const { user, loading } = useAuth();

        if (loading) {
            return <div>Memuat...</div>;
        }

        if (!user) {
            return null;
        }

        return <Component {...props} user={user} />;
    };
};