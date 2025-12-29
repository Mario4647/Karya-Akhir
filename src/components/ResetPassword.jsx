import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Cek apakah user datang dari link reset password
        const checkHash = () => {
            const hash = window.location.hash;
            // Supabase menggunakan access_token di URL fragment
            if (hash.includes('access_token') && hash.includes('type=recovery')) {
                console.log("Reset password link detected");
            }
        };
        
        checkHash();
        
        // Cek session setelah 1 detik
        const timer = setTimeout(() => {
            setSessionChecked(true);
        }, 1000);
        
        return () => clearTimeout(timer);
    }, []);

    const validateForm = () => {
        const newErrors = {};
        
        if (!password) {
            newErrors.password = "Password tidak boleh kosong";
        } else if (password.length < 6) {
            newErrors.password = "Password minimal 6 karakter";
        }
        
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Password tidak cocok";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            setSuccess(true);
            setErrors({});
            
            // Logout dan redirect ke login setelah 3 detik
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/auth');
            }, 3000);
            
        } catch (error) {
            console.error("Reset Password Error:", error);
            setErrors({ 
                submit: error.message.includes('expired') 
                    ? "Link reset password sudah kadaluarsa"
                    : error.message.includes('Invalid')
                    ? "Sesi tidak valid. Silakan request link reset password baru."
                    : "Terjadi kesalahan. Silakan coba lagi."
            });
        } finally {
            setLoading(false);
        }
    };

    if (!sessionChecked) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memeriksa sesi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <i className="bx bx-lock-alt text-5xl text-blue-600 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Masukkan password baru Anda
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {success ? (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="bx bx-check-circle text-green-400 text-xl"></i>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        Password berhasil direset!
                                    </h3>
                                    <p className="mt-2 text-sm text-green-700">
                                        Anda akan diarahkan ke halaman login...
                                    </p>
                                    <p className="mt-1 text-xs text-gray-600">
                                        Silakan login dengan password baru Anda.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errors.submit && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <i className="bx bx-error-circle text-red-400 text-xl"></i>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                {errors.submit}
                                            </h3>
                                            <p className="mt-1 text-xs text-red-700">
                                                Kembali ke halaman login dan klik "Lupa password?" untuk request link baru.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Password Baru
                                </label>
                                <div className="mt-1 relative">
                                    <i className="bx bx-lock-alt absolute left-3 top-3 text-gray-400"></i>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: '' });
                                        }}
                                        className={`appearance-none block w-full pl-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Konfirmasi Password Baru
                                </label>
                                <div className="mt-1 relative">
                                    <i className="bx bx-lock-alt absolute left-3 top-3 text-gray-400"></i>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                        }}
                                        className={`appearance-none block w-full pl-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Ketik ulang password baru"
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/auth')}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Kembali ke Login
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
