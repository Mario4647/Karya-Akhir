import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient"; 
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
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
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();


        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                setUser(session?.user || null);
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                navigate("/auth");
            }
        });

        return () => subscription.unsubscribe();
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