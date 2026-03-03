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

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            if (user) {
                inactivityTimer = setTimeout(async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    navigate("/auth");
                }, INACTIVITY_TIMEOUT);
            }
        };

        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    setUser(null);
                    navigate("/auth");
                } else {
                    setUser(user);
                    resetInactivityTimer();
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                setUser(session?.user || null);
                resetInactivityTimer();
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                navigate("/auth");
                clearTimeout(inactivityTimer);
            }
        });

        const activityEvents = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
        activityEvents.forEach((event) => {
            window.addEventListener(event, resetInactivityTimer);
        });

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

export const withAuth = (Component, allowedRoles = ['user', 'user-raport', 'admin', 'admin-event']) => {
    return (props) => {
        const { user, loading } = useAuth();
        const navigate = useNavigate();
        const [userRole, setUserRole] = useState(null);
        const [checkingRole, setCheckingRole] = useState(true);

        useEffect(() => {
            const checkRole = async () => {
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('roles')
                        .eq('id', user.id)
                        .single();
                    
                    setUserRole(profile?.roles || 'user');
                }
                setCheckingRole(false);
            };

            checkRole();
        }, [user]);

        useEffect(() => {
            if (!loading && !user) {
                navigate('/auth');
            }
            
            if (!loading && !checkingRole && user && !allowedRoles.includes(userRole)) {
                navigate('/');
            }
        }, [loading, checkingRole, user, userRole, navigate]);

        if (loading || checkingRole) {
            return (
                <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                    <div className="text-center bg-white p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-700">Memeriksa autentikasi...</p>
                    </div>
                </div>
            );
        }

        if (!user || !allowedRoles.includes(userRole)) {
            return null;
        }

        return <Component {...props} user={user} userRole={userRole} />;
    };
};

export default withAuth;
