import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  validateEmail, 
  validatePasswordStrength,
  globalRateLimiter,
  sanitizeInput,
  debounce
} from '../utils/security';
import { withoutAuth } from '../authMiddleware';
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

// Array icon untuk background
const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull
];

const Form = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ valid: true, errors: [] });
  
  const navigate = useNavigate();

  // Generate icon positions
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

  // Handle input change dengan sanitasi
  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name.includes('email') ? value : sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [name]: sanitized }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Cek kekuatan password
    if (name === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }
  };

  // Validasi form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email harus diisi';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email tidak valid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    }
    
    if (activeTab === 'signup') {
      if (formData.password.length < 8) {
        newErrors.password = 'Password minimal 8 karakter';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Password tidak cocok';
      }
      
      if (!passwordStrength.valid) {
        newErrors.password = passwordStrength.errors.join('. ');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle sign in dengan rate limiting
  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // Rate limiting
    const rateCheck = globalRateLimiter.check(formData.email, 'login');
    if (!rateCheck.allowed) {
      setErrors({ submit: rateCheck.reason });
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        globalRateLimiter.recordFailure(formData.email);
        setErrors({ submit: error.message });
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/concerts');
        }, 1500);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    const rateCheck = globalRateLimiter.check(formData.email, 'signup');
    if (!rateCheck.allowed) {
      setErrors({ submit: rateCheck.reason });
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.email.split('@')[0]
          }
        }
      });
      
      if (error) {
        setErrors({ submit: error.message });
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/concerts');
        }, 2000);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(forgotEmail)) {
      setErrors({ forgot: 'Email tidak valid' });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        setErrors({ forgot: error.message });
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsForgotPassword(false);
          setForgotEmail('');
        }, 3000);
      }
    } catch (error) {
      setErrors({ forgot: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
      {/* Decorative Icons */}
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

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Smareta Events
            </h1>
            <p className="text-gray-600">
              {isForgotPassword ? 'Reset Password' : 'Login atau Daftar untuk melanjutkan'}
            </p>
          </div>

          {/* Card Utama */}
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-6 md:p-8">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded flex items-center gap-3">
                <BiCheckCircle className="text-green-500 text-xl" />
                <p className="text-green-700">
                  {isForgotPassword 
                    ? 'Link reset password telah dikirim ke email Anda' 
                    : activeTab === 'signin' 
                      ? 'Login berhasil! Mengalihkan...' 
                      : 'Pendaftaran berhasil! Silakan cek email untuk verifikasi.'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded flex items-center gap-3">
                <BiErrorCircle className="text-red-500 text-xl" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            )}

            {!isForgotPassword ? (
              <>
                {/* Tab Navigation */}
                <div className="flex bg-gray-100 p-1 rounded border-2 border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-3 text-center font-medium transition-all rounded ${
                      activeTab === 'signin'
                        ? 'bg-[#4a90e2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <BiLogIn className="inline mr-2" />
                    Login
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 py-3 text-center font-medium transition-all rounded ${
                      activeTab === 'signup'
                        ? 'bg-[#4a90e2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <BiUserPlus className="inline mr-2" />
                    Daftar
                  </button>
                </div>

                <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      <BiEnvelope className="inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nama@email.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded focus:border-[#4a90e2] focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      <BiLock className="inline mr-2" />
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="********"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded focus:border-[#4a90e2] focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                    
                    {/* Password Strength Indicator */}
                    {activeTab === 'signup' && formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded ${
                                formData.password.length >= level * 2
                                  ? passwordStrength.valid 
                                    ? 'bg-green-500' 
                                    : 'bg-yellow-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {passwordStrength.errors.map((err, i) => (
                          <p key={i} className="text-xs text-gray-500">• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password (hanya untuk signup) */}
                  {activeTab === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        <BiLock className="inline mr-2" />
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="********"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded focus:border-[#4a90e2] focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                        disabled={loading}
                      />
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {/* Forgot Password Link */}
                  {activeTab === 'signin' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-sm text-[#4a90e2] hover:text-[#357abd] font-medium"
                      >
                        Lupa password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#4a90e2] text-white font-bold rounded border-2 border-[#357abd] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] hover:bg-[#357abd] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        {activeTab === 'signin' ? <BiLogIn /> : <BiUserPlus />}
                        <span>{activeTab === 'signin' ? 'Masuk' : 'Daftar'}</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Forgot Password Form */
              <div>
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="mb-4 text-[#4a90e2] hover:text-[#357abd] flex items-center gap-2"
                >
                  <BiArrowBack />
                  <span>Kembali ke Login</span>
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4">Reset Password</h2>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      <BiEnvelope className="inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded focus:border-[#4a90e2] focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                      disabled={loading}
                    />
                    {errors.forgot && (
                      <p className="text-red-500 text-sm mt-1">{errors.forgot}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#4a90e2] text-white font-bold rounded border-2 border-[#357abd] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] hover:bg-[#357abd] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <BiMailSend />
                        <span>Kirim Link Reset</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <BiShield className="inline mr-1" />
            <span>Sistem aman dengan proteksi rate limiting & XSS protection</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default withoutAuth(Form);
