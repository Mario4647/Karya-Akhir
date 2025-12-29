import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Form = () => {
    const [activeTab, setActiveTab] = useState('signin');
    const [signUpData, setSignUpData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [signInData, setSignInData] = useState({
        email: "",
        password: ""
    });
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResetLinkSent, setIsResetLinkSent] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateSignUp = () => {
        const newErrors = {};
        if (!signUpData.email) {
            newErrors.email = "Email tidak boleh kosong";
        } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
            newErrors.email = "Email tidak valid";
        }
        if (!signUpData.password) {
            newErrors.password = "Kata sandi tidak boleh kosong";
        } else if (signUpData.password.length < 6) {
            newErrors.password = "Kata sandi minimal 6 karakter";
        }
        if (signUpData.password !== signUpData.confirmPassword) {
            newErrors.confirmPassword = "Kata sandi tidak cocok";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSignIn = () => {
        const newErrors = {};
        if (!signInData.email) {
            newErrors.email = "Email tidak boleh kosong";
        } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
            newErrors.email = "Email tidak valid";
        }
        if (!signInData.password) {
            newErrors.password = "Kata sandi tidak boleh kosong";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForgotPassword = () => {
        const newErrors = {};
        if (!forgotPasswordEmail) {
            newErrors.forgotPassword = "Email tidak boleh kosong";
        } else if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
            newErrors.forgotPassword = "Email tidak valid";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUpChange = (e) => {
        const { name, value } = e.target;
        setSignUpData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
        if (submitSuccess) {
            setSubmitSuccess(false);
        }
    };

    const handleSignInChange = (e) => {
        const { name, value } = e.target;
        setSignInData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
        if (submitSuccess) {
            setSubmitSuccess(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!validateForgotPassword()) return;

        setLoading(true);
        try {
            // PERBAIKAN DISINI: Redirect ke halaman yang benar
            const siteUrl = window.location.origin; // Misal: https://yourdomain.com
            const redirectUrl = `${siteUrl}/reset-password`; // Arahkan ke halaman reset password
            
            console.log("Mengirim reset password ke:", forgotPasswordEmail);
            console.log("Redirect ke:", redirectUrl);

            const { error } = await supabase.auth.resetPasswordForEmail(
                forgotPasswordEmail,
                {
                    redirectTo: redirectUrl,
                }
            );

            if (error) {
                throw error;
            }

            setIsResetLinkSent(true);
            setErrors({});
            
            // Reset form setelah 5 detik
            setTimeout(() => {
                setIsForgotPassword(false);
                setIsResetLinkSent(false);
                setForgotPasswordEmail("");
            }, 5000);
            
        } catch (error) {
            console.error("Forgot Password Error:", error);
            setErrors({ 
                forgotPassword: error.message === "User not found" 
                    ? "Email tidak terdaftar" 
                    : error.message === "rate limit exceeded"
                    ? "Terlalu banyak percobaan. Coba lagi nanti."
                    : "Terjadi kesalahan, coba lagi nanti"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!validateSignUp()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: signUpData.email,
                password: signUpData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth`, // Redirect setelah konfirmasi email
                }
            });

            if (error) {
                setErrors({
                    submit:
                        error.message === "User already registered"
                            ? "Email sudah terdaftar"
                            : error.message,
                });
                return;
            }

            if (data.user) {
                setSubmitSuccess(true);
                setSignUpData({ email: "", password: "", confirmPassword: "" });
                setTimeout(() => setSubmitSuccess(false), 5000);
            }
        } catch (error) {
            setErrors({ submit: "Terjadi kesalahan, coba lagi nanti" });
            console.error("Sign Up Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!validateSignIn()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: signInData.email,
                password: signInData.password
            });

            if (error) {
                setErrors({ submit: error.message === "Invalid login credentials" ? "Email atau kata sandi salah" : error.message });
                return;
            }

            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('roles')
                    .eq('id', data.user.id)
                    .single();

                if (!profileError && profile) {
                    setSubmitSuccess(true);
                    setSignInData({ email: "", password: "" });
                    
                    setTimeout(() => {
                        setSubmitSuccess(false);
                        if (profile.roles === 'admin') {
                            navigate("/admin");
                        } else if (profile.roles === 'user-raport') {
                            navigate("/dashboard-user");
                        } else {
                            navigate("/");
                        }
                    }, 1500);
                } else {
                    setSubmitSuccess(true);
                    setSignInData({ email: "", password: "" });
                    setTimeout(() => {
                        setSubmitSuccess(false);
                        navigate("/");
                    }, 1500);
                }
            }
        } catch (error) {
            setErrors({ submit: "Terjadi kesalahan, coba lagi nanti" });
            console.error("Sign In Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen bg-white pt-20 flex items-center justify-center">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-8" data-aos="fade-down" data-aos-duration="1000">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                           Selamat Datang Di Website Management Keuangan Pribadi
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Daftar dan Login untuk menggunakan fitur management keuangan 
                        </p>
                        <i className="bx bx-money text-5xl text-indigo-600 mt-4 animate-bounce"></i>
                    </div>
                    
                    <div className="max-w-md mx-auto bg-white shadow-lg border border-gray-200 rounded-lg p-6 md:p-8" data-aos="fade-up" data-aos-delay="600">
                        {/* Success Messages */}
                        {submitSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200/50 rounded-lg text-green-800 flex items-center gap-3 animate-pulse">
                                <i className="bx bx-check-circle text-xl text-green-500"></i>
                                <span className="font-medium">
                                    {activeTab === 'signup' ? 'Pendaftaran berhasil, periksa email Anda!' : 'Login berhasil!'}
                                </span>
                            </div>
                        )}
                        
                        {isResetLinkSent && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200/50 rounded-lg text-blue-800 flex items-center gap-3 animate-pulse">
                                <i className="bx bx-check-circle text-xl text-blue-500"></i>
                                <div>
                                    <p className="font-medium">Link reset password telah dikirim!</p>
                                    <p className="text-sm mt-1">
                                        Silakan periksa email <span className="font-semibold">{forgotPasswordEmail}</span>.
                                        <br />
                                        <span className="text-xs text-gray-600">Link akan mengarah ke halaman reset password.</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Messages */}
                        {errors.submit && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-lg text-red-800 flex items-center gap-3">
                                <i className="bx bx-error-circle text-xl text-red-500"></i>
                                <span className="font-medium">{errors.submit}</span>
                            </div>
                        )}

                        {/* Tabs Navigation */}
                        {!isForgotPassword && (
                            <div className="flex border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => {
                                        setActiveTab('signin');
                                        setIsForgotPassword(false);
                                        setIsResetLinkSent(false);
                                        setErrors({});
                                    }}
                                    className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-200 ${activeTab === 'signin'
                                        ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                        }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('signup');
                                        setIsForgotPassword(false);
                                        setIsResetLinkSent(false);
                                        setErrors({});
                                    }}
                                    className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-200 ${activeTab === 'signup'
                                        ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                        }`}
                                >
                                    Daftar
                                </button>
                            </div>
                        )}

                        {/* Forgot Password Form */}
                        {isForgotPassword ? (
                            <div>
                                <div className="mb-6">
                                    <button
                                        onClick={() => {
                                            setIsForgotPassword(false);
                                            setIsResetLinkSent(false);
                                            setForgotPasswordEmail("");
                                            setErrors({});
                                        }}
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
                                    >
                                        <i className="bx bx-arrow-back text-lg"></i>
                                        Kembali ke Login
                                    </button>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h3>
                                    <p className="text-gray-600 mb-6">
                                        Masukkan email Anda. Kami akan mengirimkan link untuk reset password.
                                    </p>
                                </div>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="relative min-h-[80px]">
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <i className="bx bx-envelope absolute left-3 top-4 text-gray-500 text-lg z-10"></i>
                                            <input
                                                type="email"
                                                value={forgotPasswordEmail}
                                                onChange={(e) => {
                                                    setForgotPasswordEmail(e.target.value);
                                                    if (errors.forgotPassword) {
                                                        setErrors(prev => ({ ...prev, forgotPassword: "" }));
                                                    }
                                                }}
                                                placeholder="Masukkan email terdaftar"
                                                className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.forgotPassword ? "border-red-300 bg-red-50" : ""
                                                    }`}
                                                disabled={isResetLinkSent}
                                            />
                                        </div>
                                        <div className="h-5 mt-1">
                                            {errors.forgotPassword && (
                                                <p className="text-red-500 text-sm flex items-center gap-1">
                                                    <i className="bx bx-error-circle"></i>
                                                    {errors.forgotPassword}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={loading || isResetLinkSent}
                                        className={`w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loading || isResetLinkSent ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700'}`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Mengirim...
                                            </>
                                        ) : isResetLinkSent ? (
                                            <>
                                                <i className="bx bx-check text-lg"></i>
                                                Terkirim!
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-mail-send text-lg"></i>
                                                Kirim Link Reset
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            /* Sign Up / Sign In Forms */
                            <>
                                {activeTab === 'signup' ? (
                                    <form onSubmit={handleSignUp} className="space-y-4">
                                        <div className="relative min-h-[80px]">
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <i className="bx bx-envelope absolute left-3 top-4 text-gray-500 text-lg z-10"></i>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={signUpData.email}
                                                    onChange={handleSignUpChange}
                                                    placeholder="Masukkan email"
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.email ? "border-red-300 bg-red-50" : ""
                                                        }`}
                                                />
                                            </div>
                                            <div className="h-5 mt-1">
                                                {errors.email && (
                                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                                        <i className="bx bx-error-circle"></i>
                                                        {errors.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative min-h-[80px]">
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Kata Sandi <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <i className="bx bx-lock-alt absolute left-3 top-4 text-gray-500 text-lg z-10"></i>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={signUpData.password}
                                                    onChange={handleSignUpChange}
                                                    placeholder="Masukkan kata sandi"
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.password ? "border-red-300 bg-red-50" : ""
                                                        }`}
                                                />
                                            </div>
                                            <div className="h-5 mt-1">
                                                {errors.password && (
                                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                                        <i className="bx bx-error-circle"></i>
                                                        {errors.password}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative min-h-[80px]">
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <i className="bx bx-lock-alt absolute left-3 top-4 text-gray-500 text-lg z-10"></i>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={signUpData.confirmPassword}
                                                    onChange={handleSignUpChange}
                                                    placeholder="Konfirmasi kata sandi"
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.confirmPassword ? "border-red-300 bg-red-50" : ""
                                                        }`}
                                                />
                                            </div>
                                            <div className="h-5 mt-1">
                                                {errors.confirmPassword && (
                                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                                        <i className="bx bx-error-circle"></i>
                                                        {errors.confirmPassword}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700'}`}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Memproses...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bx bx-user-plus text-lg"></i>
                                                    Daftar
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleSignIn} className="space-y-4">
                                        <div className="relative min-h-[80px]">
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <i className="bx bx-envelope absolute left-3 top-4 text-gray-500 text-lg z-10"></i>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={signInData.email}
                                                    onChange={handleSignInChange}
                                                    placeholder="Masukkan email"
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.email ? "border-red-300 bg-red-50" : ""
                                                        }`}
                                                />
                                            </div>
                                            <div className="h-5 mt-1">
                                                {errors.email && (
                                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                                        <i className="bx bx-error-circle"></i>
                                                        {errors.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative min-h-[80px]">
                                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                                Kata Sandi <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <i className="bx bx-lock-alt absolute left-3 top-4 text-gray-500 text-lg z-10"></i>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={signInData.password}
                                                    onChange={handleSignInChange}
                                                    placeholder="Masukkan kata sandi"
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.password ? "border-red-300 bg-red-50" : ""
                                                        }`}
                                                />
                                            </div>
                                            <div className="h-5 mt-1">
                                                {errors.password && (
                                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                                        <i className="bx bx-error-circle"></i>
                                                        {errors.password}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Forgot Password Link */}
                                        <div className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotPassword(true)}
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 ml-auto"
                                            >
                                                <i className="bx bx-key"></i>
                                                Lupa password?
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700'}`}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Memproses...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bx bx-log-in text-lg"></i>
                                                    Masuk
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}

                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-800">© {new Date().getFullYear()} Karya Akhir Procommit 2025</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Form;
