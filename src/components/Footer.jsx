import { useState } from "react";
import { supabase } from "../supabaseClient";

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState("");
    const [subscribeError, setSubscribeError] = useState("");
    const [subscribeSuccess, setSubscribeSuccess] = useState(false);

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setSubscribeError("");
        setSubscribeSuccess(false);

        if (!email) {
            setSubscribeError("Email tidak boleh kosong");
            return;
        }
        if (!validateEmail(email)) {
            setSubscribeError("Masukkan email yang valid");
            return;
        }

        try {
            const { error } = await supabase
                .from("subscriptions")
                .insert([{ email }]);
            if (error) {
                if (error.code === "23505") {
                    setSubscribeError("Email sudah terdaftar");
                } else {
                    throw error;
                }
            } else {
                setSubscribeSuccess(true);
                setEmail("");
                setTimeout(() => {
                    setSubscribeSuccess(false);
                }, 3000);
            }
        } catch (err) {
            setSubscribeError("Gagal berlangganan: " + err.message);
            console.error("Subscribe error:", err);
        }
    };

    return (
        <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 py-12 mt-auto">
            <div className="container max-w-7xl mx-auto px-4 sm:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Kolom 1: About */}
                    <div
                        className="space-y-4"
                        data-aos="fade-up"
                        data-aos-duration="1000"
                    >
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="bx bx-info-circle text-blue-400"></i>
                            Tentang Kami
                        </h4>
                        <p className="text-sm md:text-base leading-relaxed">
                            Money Management Tracker adalah solusi untuk mengelola keuanganmu dengan mudah. Kami membantu kamu mencatat pemasukan, pengeluaran, dan merencanakan anggaran untuk masa depan yang lebih teratur dan bebas finansial.
                        </p>
                    </div>

                    {/* Kolom 2: Fitur Aplikasi */}
                    <div
                        className="space-y-4"
                        data-aos="fade-up"
                        data-aos-duration="1000"
                        data-aos-delay="200"
                    >
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="bx bx-list-check text-blue-400"></i>
                            Fitur Aplikasi
                        </h4>
                        <ul className="space-y-2 text-sm md:text-base">
                            <li className="flex items-center gap-2">
                                <i className="bx bx-check-circle text-blue-400"></i>
                                Pencatatan Transaksi Harian
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bx bx-check-circle text-blue-400"></i>
                                Visualisasi Statistik Keuangan
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bx bx-check-circle text-blue-400"></i>
                                Perencanaan Anggaran Bulanan
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bx bx-check-circle text-blue-400"></i>
                                Pantau Saldo dan Pengeluaran
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 3: Contact */}
                    <div
                        className="space-y-4"
                        data-aos="fade-up"
                        data-aos-duration="1000"
                        data-aos-delay="400"
                    >
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="bx bx-support text-blue-400"></i>
                            Kontak Kami
                        </h4>
                        <ul className="space-y-2 text-sm md:text-base">
                            <li className="flex items-center gap-2">
                                <i className="bx bx-envelope text-blue-400"></i>
                                <span>support@managementkeuangan.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bx bx-phone text-blue-400"></i>
                                <span>+62 895-275-541-25</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bx bx-map text-blue-400"></i>
                                <span>Jl. Keuangan No. 123, Jakarta</span>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 4: Subscription Form */}
                    <div
                        className="space-y-4"
                        data-aos="fade-up"
                        data-aos-duration="1000"
                        data-aos-delay="600"
                    >
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="bx bx-news text-blue-400"></i>
                            Berlangganan
                        </h4>
                        <p className="text-sm md:text-base">
                            Dapatkan tips keuangan dan pembaruan langsung di emailmu!
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-3">
                            <div className="relative">
                                <i className="bx bx-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setSubscribeError("");
                                        setSubscribeSuccess(false);
                                    }}
                                    placeholder="Masukkan email"
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-gray-800 ${subscribeError ? "border-red-300 bg-red-50" : ""
                                        }`}
                                />

                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <i className="bx bx-send text-lg"></i>
                                Berlangganan
                            </button>
                            {subscribeError && (
                                <p className="text-red-400 text-sm flex items-center gap-1">
                                    <i className="bx bx-error-circle"></i>
                                    {subscribeError}
                                </p>
                            )}
                            {subscribeSuccess && (
                                <p className="text-green-400 text-sm flex items-center gap-1 animate-pulse">
                                    <i className="bx bx-check-circle"></i>
                                    Berhasil berlangganan!
                                </p>
                            )}
                        </form>
                    </div>
                </div>
                <div className="mt-12 border-t border-gray-700 pt-6 text-center">
                    <p className="text-sm text-gray-400">
                        © {currentYear} Karya Akhir Procommit 2025.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
