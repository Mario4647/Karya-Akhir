// src/auth/Form.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDeviceFingerprint } from "../hooks/useDeviceFingerprint";
import { banService } from "../services/banService";
import BanPopup from "../components/bans/BanPopup";
import {
  BiUser,
  BiEnvelope,
  BiLock,
  BiLogIn,
  BiUserPlus,
  BiKey,
  BiArrowBack,
  BiCheckCircle,
  BiErrorCircle,
  BiMailSend,
  BiShield,
  BiMoney,
  BiMusic,
  BiMicrophone,
  BiCamera,
  BiVideo,
  BiStar,
  BiHeart,
  BiDiamond,
  BiCrown,
  BiRocket,
  BiPalette,
  BiBrush,
  BiPaint,
  BiBook,
  BiMessage,
  BiVolumeFull
} from 'react-icons/bi';

// Array icon untuk background dekoratif
const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull, BiMoney
];

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
    const [deviceBan, setDeviceBan] = useState(null);
    const [showBanPopup, setShowBanPopup] = useState(false);
    const [isCheckingBan, setIsCheckingBan] = useState(true);
    const [deviceTracked, setDeviceTracked] = useState(false);
    
    const navigate = useNavigate();
    const { fingerprint, deviceInfo, ipAddress, isReady } = useDeviceFingerprint();

    // Generate icon positions untuk background
    const [iconPositions] = useState(() => {
        const positions = [];
        for (let i = 0; i < 30; i++) {
            positions.push({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                rotate: `${Math.random() * 360}deg`,
                scale: 0.6 + Math.random() * 0.8,
                opacity: 0.08 + Math.random() * 0.1,
                icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
            });
        }
        return positions;
    });

    // Generate icon untuk tombol
    const [buttonIconPositions] = useState(() => {
        const positions = [];
        for (let i = 0; i < 15; i++) {
            positions.push({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                rotate: `${Math.random() * 360}deg`,
                scale: 0.4 + Math.random() * 0.6,
                opacity: 0.2 + Math.random() * 0.2,
                icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
            });
        }
        return positions;
    });

    // ==================== HANDLERS ====================

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

    // ==================== DEVICE CHECKING ====================

    useEffect(() => {
        const checkDeviceBan = async () => {
            if (fingerprint && isReady) {
                console.log('🔍 Checking device ban for fingerprint:', fingerprint);
                setIsCheckingBan(true);
                try {
                    const banCheck = await banService.checkDeviceBan(fingerprint);
                    console.log('Ban check result:', banCheck);
                    
                    if (banCheck.isBanned) {
                        console.log('🚫 Device is banned!', banCheck.ban);
                        setDeviceBan(banCheck);
                        setShowBanPopup(true);
                    } else {
                        console.log('✅ Device is not banned');
                    }
                } catch (error) {
                    console.error('Error checking device ban:', error);
                } finally {
                    setIsCheckingBan(false);
                }
            }
        };
        
        checkDeviceBan();
    }, [fingerprint, isReady]);

    const validateDevice = async (email = null) => {
        if (!fingerprint) {
            console.log('⚠️ Fingerprint not available yet');
            return true;
        }

        try {
            const banCheck = await banService.checkDeviceBan(fingerprint, email);
            
            if (banCheck.isBanned) {
                console.log('🚫 Device is banned, showing popup');
                setDeviceBan(banCheck);
                setShowBanPopup(true);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error validating device:', error);
            return true;
        }
    };

    // ==================== TRACK DEVICE FUNCTION ====================

    const trackDevice = async (email, userId = null, actionType = 'login') => {
        try {
            if (!fingerprint || !deviceInfo || !ipAddress) {
                console.log('⚠️ Device info not complete, skipping tracking');
                return;
            }

            console.log(`📱 Tracking device for ${actionType}:`, email);
            
            const deviceData = {
                userId: userId,
                email: email,
                deviceFingerprint: fingerprint,
                ipAddress: ipAddress,
                userAgent: deviceInfo.userAgent || navigator.userAgent,
                platform: deviceInfo.platform || navigator.platform,
                browser: deviceInfo.browser || 'Unknown',
                os: deviceInfo.os || 'Unknown',
                screenResolution: deviceInfo.screenResolution || `${window.screen.width}x${window.screen.height}`,
                languages: deviceInfo.languages || navigator.language,
                timezone: deviceInfo.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            };

            const trackResult = await banService.trackDeviceLogin(deviceData);
            
            if (trackResult.success) {
                console.log(`✅ Device tracked successfully for ${email}`);
                setDeviceTracked(true);
            } else {
                console.error('❌ Failed to track device:', trackResult.error);
            }

            await banService.logLoginAttempt({
                email: email,
                userId: userId,
                deviceFingerprint: fingerprint,
                ipAddress: ipAddress,
                userAgent: deviceInfo.userAgent || navigator.userAgent,
                actionType: actionType,
                success: true,
            });

        } catch (error) {
            console.error('Error tracking device:', error);
        }
    };

    // ==================== VALIDATION FUNCTIONS ====================

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

    // ==================== AUTH HANDLERS ====================

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!validateSignUp()) return;

        const isDeviceAllowed = await validateDevice(signUpData.email);
        if (!isDeviceAllowed) {
            console.log('❌ Device not allowed to register');
            return;
        }

        setLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: signUpData.email,
                password: signUpData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth`,
                    data: {
                        full_name: signUpData.email.split('@')[0]
                    }
                }
            });

            if (authError) {
                let errorMessage = authError.message;
                
                if (authError.message === "User already registered") {
                    errorMessage = "Email sudah terdaftar";
                } else if (authError.message.includes('rate limit')) {
                    errorMessage = "Terlalu banyak percobaan. Coba lagi nanti.";
                } else if (authError.message.includes('Password')) {
                    errorMessage = "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
                }
                
                setErrors({ submit: errorMessage });
                return;
            }

            if (authData.user) {
                try {
                    await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: authData.user.id,
                                email: signUpData.email,
                                full_name: signUpData.email.split('@')[0],
                                roles: 'user',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }
                        ]);
                } catch (profileError) {
                    console.error('Error creating profile:', profileError);
                }

                await trackDevice(signUpData.email, authData.user.id, 'register');

                await banService.logLoginAttempt({
                    email: signUpData.email,
                    userId: authData.user.id,
                    deviceFingerprint: fingerprint,
                    ipAddress: ipAddress,
                    userAgent: deviceInfo?.userAgent || navigator.userAgent,
                    actionType: 'register',
                    success: true,
                });

                setSubmitSuccess(true);
                setSignUpData({ email: "", password: "", confirmPassword: "" });
                
                console.log('✅ User registered successfully:', authData.user.email);
                
                setTimeout(() => {
                    setSubmitSuccess(false);
                    handleAutoLogin(signUpData.email, signUpData.password);
                }, 2000);
            }
        } catch (error) {
            console.error("Sign Up Error:", error);
            setErrors({ 
                submit: "Terjadi kesalahan sistem. Coba lagi nanti atau hubungi admin." 
            });
            
            await banService.logLoginAttempt({
                email: signUpData.email,
                deviceFingerprint: fingerprint,
                ipAddress: ipAddress,
                userAgent: deviceInfo?.userAgent || navigator.userAgent,
                actionType: 'register',
                success: false,
                errorMessage: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!validateSignIn()) return;

        const isDeviceAllowed = await validateDevice(signInData.email);
        if (!isDeviceAllowed) {
            console.log('❌ Device not allowed to login');
            return;
        }

        setLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: signInData.email,
                password: signInData.password
            });

            if (authError) {
                let errorMessage = authError.message;
                
                if (authError.message === 'Invalid login credentials') {
                    errorMessage = 'Email atau kata sandi salah';
                } else if (authError.message.includes('rate limit')) {
                    errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti.';
                } else if (authError.message.includes('Email not confirmed')) {
                    errorMessage = 'Email belum dikonfirmasi. Periksa inbox email Anda.';
                }
                
                setErrors({ submit: errorMessage });
                
                await banService.logLoginAttempt({
                    email: signInData.email,
                    deviceFingerprint: fingerprint,
                    ipAddress: ipAddress,
                    userAgent: deviceInfo?.userAgent || navigator.userAgent,
                    actionType: 'login',
                    success: false,
                    errorMessage: authError.message
                });
                
                return;
            }

            if (authData.user) {
                try {
                    await supabase
                        .from('profiles')
                        .update({
                            last_login: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', authData.user.id);
                } catch (profileError) {
                    console.error('Error updating profile:', profileError);
                }

                await trackDevice(signInData.email, authData.user.id, 'login');

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('roles')
                    .eq('id', authData.user.id)
                    .single();

                setSubmitSuccess(true);
                setSignInData({ email: "", password: "" });
                
                console.log('✅ User logged in successfully:', authData.user.email);
                
                setTimeout(() => {
                    setSubmitSuccess(false);
                    if (!profileError && profile) {
                        if (profile.roles === 'admin') {
                            navigate("/admin");
                        } else if (profile.roles === 'admin-event') {
                            navigate("/admin/concert-dashboard");
                        } else if (profile.roles === 'user-raport') {
                            navigate("/dashboard-user");
                        } else {
                            navigate("/");
                        }
                    } else {
                        navigate("/");
                    }
                }, 1500);
            }
        } catch (error) {
            console.error("Sign In Error:", error);
            setErrors({ 
                submit: "Terjadi kesalahan sistem. Coba lagi nanti atau hubungi admin." 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAutoLogin = async (email, password) => {
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) {
                console.error('Auto login failed:', authError);
                return;
            }

            if (authData.user) {
                await trackDevice(email, authData.user.id, 'login');
                navigate("/");
            }
        } catch (error) {
            console.error('Auto login error:', error);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!validateForgotPassword()) return;

        setLoading(true);
        try {
            const siteUrl = window.location.origin;
            const redirectUrl = `${siteUrl}/reset-password`;

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

    // ==================== APPEAL HANDLER ====================

    const handleAppealSubmit = async (appealData) => {
        try {
            console.log('Submitting appeal:', appealData);
            
            const result = await banService.submitAppeal({
                ...appealData,
                userId: deviceBan?.ban?.user_id,
            });

            if (result.success) {
                alert('✅ Banding berhasil diajukan. Mohon tunggu respon dari admin.');
                setShowBanPopup(false);
            } else {
                alert('❌ Gagal mengajukan banding: ' + result.error);
            }
            
            return result;
        } catch (error) {
            console.error('Error submitting appeal:', error);
            alert('❌ Gagal mengajukan banding: ' + error.message);
            return { success: false, error: error.message };
        }
    };

    const handleCloseBanPopup = () => {
        setShowBanPopup(false);
    };

    // ==================== RENDER ====================

    return (
        <section className="min-h-screen bg-[#faf7f2] relative overflow-hidden pt-20 flex items-center justify-center px-4">
            {/* Decorative Icons Background */}
            <div className="absolute inset-0 pointer-events-none">
                {iconPositions.map((pos, i) => {
                    const IconComponent = pos.icon;
                    return (
                        <div
                            key={i}
                            className="absolute text-gray-600"
                            style={{
                                top: pos.top,
                                left: pos.left,
                                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                                opacity: pos.opacity,
                                zIndex: 0
                            }}
                        >
                            <IconComponent size={32} />
                        </div>
                    );
                })}
            </div>

            {/* Ban Popup */}
            {showBanPopup && deviceBan && (
                <BanPopup
                    ban={deviceBan.ban}
                    onClose={handleCloseBanPopup}
                    onSubmitAppeal={handleAppealSubmit}
                />
            )}

            {/* Loading overlay saat checking ban */}
            {isCheckingBan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
                    <div className="bg-white rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] border-2 border-gray-200 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4a90e2] border-t-transparent mb-4"></div>
                        <p className="text-gray-700 font-medium">Memeriksa status device...</p>
                        <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
                    </div>
                </div>
            )}

            <div className="w-full max-w-7xl mx-auto relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                           Selamat Datang Di Website Smareta Event
                        </h2>
                        <p className="text-base md:text-lg text-gray-600 mt-2">
                            Daftar dan Login untuk membeli Tiket
                        </p>
                        <div className="mt-4">
                            <BiMoney className="text-5xl text-[#4a90e2] animate-pulse mx-auto" />
                        </div>
                    </div>
                    
                    <div className="max-w-md mx-auto">
                        {/* Card Utama dengan Shadow Tebal dan Border */}
                        <div className="bg-white/95 backdrop-blur-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,0.25)] border-2 border-gray-200 rounded p-6 md:p-8 relative overflow-hidden">
                            
                            {/* Decorative Icons di dalam card */}
                            <div className="absolute inset-0 pointer-events-none">
                                {buttonIconPositions.slice(0, 8).map((pos, i) => {
                                    const IconComponent = pos.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="absolute text-gray-400/30"
                                            style={{
                                                top: pos.top,
                                                left: pos.left,
                                                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                                                opacity: pos.opacity,
                                                zIndex: 0
                                            }}
                                        >
                                            <IconComponent size={24} />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="relative z-10">
                                {/* Success Messages */}
                                {submitSuccess && (
                                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)] text-green-800 flex items-center gap-3">
                                        <BiCheckCircle className="text-xl text-green-500" />
                                        <span className="font-medium">
                                            {activeTab === 'signup' ? 'Pendaftaran berhasil, periksa email Anda!' : 'Login berhasil!'}
                                        </span>
                                    </div>
                                )}
                                
                                {isResetLinkSent && (
                                    <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)] text-blue-800 flex items-center gap-3">
                                        <BiCheckCircle className="text-xl text-blue-500" />
                                        <div>
                                            <p className="font-medium">Link reset password telah dikirim!</p>
                                            <p className="text-sm mt-1">
                                                Silakan periksa email <span className="font-semibold">{forgotPasswordEmail}</span>.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Error Messages */}
                                {errors.submit && (
                                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)] text-red-800 flex items-center gap-3">
                                        <BiErrorCircle className="text-xl text-red-500" />
                                        <span className="font-medium">{errors.submit}</span>
                                    </div>
                                )}

                                {/* Device Tracking Status */}
                                {deviceTracked && process.env.NODE_ENV === 'development' && (
                                    <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded">
                                        <p className="text-sm text-blue-700 flex items-center gap-2">
                                            <BiCheckCircle className="text-green-500" />
                                            Device berhasil ditrack ke database
                                        </p>
                                    </div>
                                )}

                                {/* Tabs Navigation */}
                                {!isForgotPassword && (
                                    <div className="flex bg-gray-100 p-1 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] mb-6">
                                        <button
                                            onClick={() => {
                                                setActiveTab('signin');
                                                setIsForgotPassword(false);
                                                setIsResetLinkSent(false);
                                                setErrors({});
                                            }}
                                            disabled={isCheckingBan}
                                            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-all duration-300 rounded disabled:opacity-50 ${
                                                activeTab === 'signin'
                                                ? 'bg-[#4a90e2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                                                : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                        >
                                            <BiLogIn className={`inline mr-2 text-lg ${activeTab === 'signin' ? 'text-white' : 'text-gray-500'}`} />
                                            Login
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('signup');
                                                setIsForgotPassword(false);
                                                setIsResetLinkSent(false);
                                                setErrors({});
                                            }}
                                            disabled={isCheckingBan}
                                            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-all duration-300 rounded disabled:opacity-50 ${
                                                activeTab === 'signup'
                                                ? 'bg-[#4a90e2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                                                : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                        >
                                            <BiUserPlus className={`inline mr-2 text-lg ${activeTab === 'signup' ? 'text-white' : 'text-gray-500'}`} />
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
                                                disabled={isCheckingBan}
                                                className="text-[#4a90e2] hover:text-[#357abd] flex items-center gap-2 mb-4 disabled:opacity-50 font-medium"
                                            >
                                                <BiArrowBack className="text-lg" />
                                                Kembali ke Login
                                            </button>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                                <BiKey className="text-[#4a90e2]" />
                                                Reset Password
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                Masukkan email Anda. Kami akan mengirimkan link untuk reset password.
                                            </p>
                                        </div>

                                        <form onSubmit={handleForgotPassword} className="space-y-4">
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <BiEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg z-10" />
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
                                                        disabled={loading || isResetLinkSent || isCheckingBan}
                                                        className={`w-full pl-10 pr-4 py-3 rounded border-2 border-gray-200 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all duration-300 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                                                            errors.forgotPassword ? "border-red-300 bg-red-50/50" : ""
                                                        } disabled:opacity-50`}
                                                    />
                                                </div>
                                                <div className="h-5 mt-1">
                                                    {errors.forgotPassword && (
                                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                                            <BiErrorCircle />
                                                            {errors.forgotPassword}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Tombol Kirim Link Reset dengan Icon Ramai */}
                                            <div className="relative overflow-hidden rounded border-2 border-[#357abd] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] mt-6">
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {buttonIconPositions.slice(8, 15).map((pos, i) => {
                                                        const IconComponent = pos.icon;
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="absolute text-white/40"
                                                                style={{
                                                                    top: pos.top,
                                                                    left: pos.left,
                                                                    transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                                                                    opacity: pos.opacity,
                                                                    zIndex: 1
                                                                }}
                                                            >
                                                                <IconComponent size={20} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={loading || isResetLinkSent || isCheckingBan}
                                                    className="relative z-10 w-full py-3 bg-[#4a90e2] text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#357abd] disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                            Mengirim...
                                                        </>
                                                    ) : isResetLinkSent ? (
                                                        <>
                                                            <BiCheckCircle className="text-lg" />
                                                            Terkirim!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BiMailSend className="text-lg" />
                                                            Kirim Link Reset
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'signup' ? (
                                            <form onSubmit={handleSignUp} className="space-y-5">
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        <BiEnvelope className="inline mr-2 text-gray-500" />
                                                        Email <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={signUpData.email}
                                                        onChange={handleSignUpChange}
                                                        placeholder="contoh@email.com"
                                                        disabled={loading || isCheckingBan}
                                                        className={`w-full px-4 py-3 rounded border-2 border-gray-200 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all duration-300 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                                                            errors.email ? "border-red-300 bg-red-50/50" : ""
                                                        } disabled:opacity-50`}
                                                    />
                                                    {errors.email && (
                                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <BiErrorCircle />
                                                            {errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        <BiLock className="inline mr-2 text-gray-500" />
                                                        Kata Sandi <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={signUpData.password}
                                                        onChange={handleSignUpChange}
                                                        placeholder="Minimal 6 karakter"
                                                        disabled={loading || isCheckingBan}
                                                        className={`w-full px-4 py-3 rounded border-2 border-gray-200 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all duration-300 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                                                            errors.password ? "border-red-300 bg-red-50/50" : ""
                                                        } disabled:opacity-50`}
                                                    />
                                                    {errors.password && (
                                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <BiErrorCircle />
                                                            {errors.password}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        <BiLock className="inline mr-2 text-gray-500" />
                                                        Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={signUpData.confirmPassword}
                                                        onChange={handleSignUpChange}
                                                        placeholder="Ulangi kata sandi"
                                                        disabled={loading || isCheckingBan}
                                                        className={`w-full px-4 py-3 rounded border-2 border-gray-200 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all duration-300 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                                                            errors.confirmPassword ? "border-red-300 bg-red-50/50" : ""
                                                        } disabled:opacity-50`}
                                                    />
                                                    {errors.confirmPassword && (
                                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <BiErrorCircle />
                                                            {errors.confirmPassword}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {/* Tombol Daftar dengan Icon Ramai */}
                                                <div className="relative overflow-hidden rounded border-2 border-[#357abd] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] mt-6">
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {buttonIconPositions.map((pos, i) => {
                                                            const IconComponent = pos.icon;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="absolute text-white/40"
                                                                    style={{
                                                                        top: pos.top,
                                                                        left: pos.left,
                                                                        transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                                                                        opacity: pos.opacity,
                                                                        zIndex: 1
                                                                    }}
                                                                >
                                                                    <IconComponent size={22} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={loading || isCheckingBan}
                                                        className="relative z-10 w-full py-3 bg-[#4a90e2] text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#357abd] disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                                Memproses...
                                                            </>
                                                        ) : isCheckingBan ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                                Memeriksa...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <BiUserPlus className="text-lg" />
                                                                Daftar
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleSignIn} className="space-y-5">
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        <BiEnvelope className="inline mr-2 text-gray-500" />
                                                        Email <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={signInData.email}
                                                        onChange={handleSignInChange}
                                                        placeholder="contoh@email.com"
                                                        disabled={loading || isCheckingBan}
                                                        className={`w-full px-4 py-3 rounded border-2 border-gray-200 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all duration-300 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                                                            errors.email ? "border-red-300 bg-red-50/50" : ""
                                                        } disabled:opacity-50`}
                                                    />
                                                    {errors.email && (
                                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <BiErrorCircle />
                                                            {errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        <BiLock className="inline mr-2 text-gray-500" />
                                                        Kata Sandi <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={signInData.password}
                                                        onChange={handleSignInChange}
                                                        placeholder="Masukkan kata sandi"
                                                        disabled={loading || isCheckingBan}
                                                        className={`w-full px-4 py-3 rounded border-2 border-gray-200 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all duration-300 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                                                            errors.password ? "border-red-300 bg-red-50/50" : ""
                                                        } disabled:opacity-50`}
                                                    />
                                                    {errors.password && (
                                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <BiErrorCircle />
                                                            {errors.password}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Forgot Password Link */}
                                                <div className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsForgotPassword(true)}
                                                        disabled={isCheckingBan}
                                                        className="text-sm text-[#4a90e2] hover:text-[#357abd] hover:underline flex items-center gap-1 ml-auto disabled:opacity-50 font-medium"
                                                    >
                                                        <BiKey />
                                                        Lupa password?
                                                    </button>
                                                </div>

                                                {/* Tombol Masuk dengan Icon Ramai */}
                                                <div className="relative overflow-hidden rounded border-2 border-[#357abd] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] mt-6">
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {buttonIconPositions.map((pos, i) => {
                                                            const IconComponent = pos.icon;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="absolute text-white/40"
                                                                    style={{
                                                                        top: pos.top,
                                                                        left: pos.left,
                                                                        transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                                                                        opacity: pos.opacity,
                                                                        zIndex: 1
                                                                    }}
                                                                >
                                                                    <IconComponent size={22} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={loading || isCheckingBan}
                                                        className="relative z-10 w-full py-3 bg-[#4a90e2] text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#357abd] disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                                Memproses...
                                                            </>
                                                        ) : isCheckingBan ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                                Memeriksa...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <BiLogIn className="text-lg" />
                                                                Masuk
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                )}

                                <div className="text-center mt-8 pt-6 border-t-2 border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        © {new Date().getFullYear()} Mario Septian 2026
                                        <span className="block text-xs text-gray-500 mt-1">
                                            <BiShield className="inline mr-1" />
                                            Sistem menenkripsi data untuk keamanan akun Anda
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Form;
