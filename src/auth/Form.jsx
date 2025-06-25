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
    const [errors, setErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
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

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!validateSignUp()) return;

        try {
            const { data, error } = await supabase.auth.signUp({
                email: signUpData.email,
                password: signUpData.password
            });

            if (error) {
                setErrors({ submit: error.message === "User already registered" ? "Email sudah terdaftar" : error.message });
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
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!validateSignIn()) return;

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
                setSubmitSuccess(true);
                setSignInData({ email: "", password: "" });
                setTimeout(() => {
                    setSubmitSuccess(false);
                    navigate("/");
                }, 3000);
            }
        } catch (error) {
            setErrors({ submit: "Terjadi kesalahan, coba lagi nanti" });
            console.error("Sign In Error:", error);
        }
    };

    return (
        <section className="min-h-screen bg-white pt-20 flex items-center justify-center">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-8" data-aos="fade-down" data-aos-duration="1000">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Welcome to Money Management
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Sign up or log in to manage your finances
                        </p>
                        <i className="bx bx-money text-5xl text-indigo-600 mt-4 animate-bounce"></i>
                    </div>
                    <div className="max-w-md mx-auto bg-white shadow-lg border border-gray-200 rounded-lg p-6 md:p-8" data-aos="fade-up" data-aos-delay="600">
                        {submitSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200/50 rounded-lg text-green-800 flex items-center gap-3 animate-pulse">
                                <i className="bx bx-check-circle text-xl text-green-500"></i>
                                <span className="font-medium">
                                    {activeTab === 'signup' ? 'Pendaftaran berhasil, periksa email Anda!' : 'Login berhasil!'}
                                </span>
                            </div>
                        )}
                        {errors.submit && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-lg text-red-800 flex items-center gap-3">
                                <i className="bx bx-error-circle text-xl text-red-500"></i>
                                <span className="font-medium">{errors.submit}</span>
                            </div>
                        )}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setActiveTab('signin')}
                                className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-200 ${
                                    activeTab === 'signin'
                                        ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setActiveTab('signup')}
                                className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-200 ${
                                    activeTab === 'signup'
                                        ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>
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
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                                errors.email ? "border-red-300 bg-red-50" : ""
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
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                                errors.password ? "border-red-300 bg-red-50" : ""
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
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                                errors.confirmPassword ? "border-red-300 bg-red-50" : ""
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
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-user-plus text-lg"></i>
                                    Daftar
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
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                                errors.email ? "border-red-300 bg-red-50" : ""
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
                                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                                errors.password ? "border-red-300 bg-red-50" : ""
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
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-log-in text-lg"></i>
                                    Masuk
                                </button>
                            </form>
                        )}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-800">© {new Date().getFullYear()} All rights reserved</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Form;