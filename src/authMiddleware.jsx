import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

// Hook untuk mengecek autentikasi
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        let inactivityTimer;

        const fetchUserRole = async (userId) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('roles')
                .eq('id', userId)
                .single();
            
            setUserRole(profile?.roles || 'user');
        };

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            if (user) {
                inactivityTimer = setTimeout(async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    setUserRole(null);
                    navigate("/auth");
                }, INACTIVITY_TIMEOUT);
            }
        };

        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    setUser(null);
                    setUserRole(null);
                } else {
                    setUser(user);
                    await fetchUserRole(user.id);
                    resetInactivityTimer();
                }
            } catch (err) {
                console.error("Auth check error:", err);
                setUser(null);
                setUserRole(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                setUser(session?.user || null);
                if (session?.user) {
                    fetchUserRole(session.user.id);
                }
                resetInactivityTimer();
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setUserRole(null);
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
    }, [navigate]);

    return { user, userRole, loading };
};

// HOC untuk halaman yang memerlukan autentikasi
export const withAuth = (Component, allowedRoles = ['user', 'user-raport', 'admin', 'admin-event']) => {
    return (props) => {
        const { user, userRole, loading } = useAuth();
        const navigate = useNavigate();

        useEffect(() => {
            if (!loading && !user) {
                navigate('/auth');
            }
            
            if (!loading && user && !allowedRoles.includes(userRole)) {
                // Jika role tidak diizinkan, redirect ke halaman yang sesuai
                if (userRole === 'user-raport') {
                    navigate('/dashboard-user');
                } else {
                    navigate('/');
                }
            }
        }, [loading, user, userRole, navigate]);

        if (loading) {
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

// HOC untuk halaman publik (seperti login) - TIDAK memerlukan autentikasi
export const withoutAuth = (Component) => {
    return (props) => {
        const { user, loading } = useAuth();
        const navigate = useNavigate();

        useEffect(() => {
            if (!loading && user) {
                // Jika sudah login, redirect ke halaman yang sesuai berdasarkan role
                const redirectUser = async () => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('roles')
                        .eq('id', user.id)
                        .single();
                    
                    const role = profile?.roles || 'user';
                    
                    if (role === 'admin') {
                        navigate('/admin');
                    } else if (role === 'admin-event') {
                        navigate('/admin/concert-dashboard');
                    } else if (role === 'user-raport') {
                        navigate('/dashboard-user');
                    } else {
                        navigate('/concerts');
                    }
                };
                
                redirectUser();
            }
        }, [loading, user, navigate]);

        if (loading) {
            return (
                <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
                    <div className="text-center bg-white p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-700">Memuat...</p>
                    </div>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

export default withAuth;
