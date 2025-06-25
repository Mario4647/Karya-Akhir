import { useState } from "react";

const Header = () => {
    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const [namaUser] = useState("Hizkia Siahaan");

    return (
        <>
            <section id="dashboard" className="min-h-screen pt-24 overflow-hidden pb-6" data-aos-duration="1000" data-aos="fade-down">
                <div className="container">
                    <div className="max-w-7xl mx-auto px-4 mt-6">
                        <div className="relative">
                            <div className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-2xl transition-all duration-500 mb-4">
                                <div className="flex items-start gap-4 mb-6" data-aos-delay="600" data-aos="fade-down">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
                                            <i className="bx bx-id-card text-2xl text-white"></i>
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                            <span className="text-xs text-white">✓</span>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                                                Selamat datang kembali,
                                            </h2>
                                            <div className="animate-wave origin-bottom">👋</div>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                            {namaUser}
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-3" data-aos-delay="600" data-aos="fade-left">
                                    <div className="flex items-center gap-3 text-sm md:text-base text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="font-medium">Hari ini</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {today}
                                        </span>
                                    </div>

                                    <p className="text-base md:text-lg text-gray-700 leading-relaxed pl-5 border-l-4 border-gradient-to-b border-blue-500/50">
                                        Kelola uangmu dan tetap pada jalur keuangan yang sehat.
                                        <span className="inline-block ml-2 text-blue-600 font-semibold">
                                            Mari mulai hari yang produktif!
                                        </span>
                                        <span className="inline-block ml-1 animate-pulse">💪</span>
                                    </p>
                                </div>

                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-aos-delay="600" data-aos="fade-up">
                                    <div className="flex items-center p-4 bg-gradient-to-br shadow-lg from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                        <div className="w-10 h-10 bg-blue-500 shadow-lg rounded-lg flex items-center justify-center mr-4">
                                            <i className="bx bx-wallet text-white text-lg"></i>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Saldo Hari Ini</div>
                                            <div className="text-lg font-semibold text-gray-900">Rp 0</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center shadow-lg p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                        <div className="w-10 h-10 bg-green-500 rounded-lg shadow-lg flex items-center justify-center mr-4">
                                            <i className="bx bx-trending-up text-white text-lg"></i>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Pemasukan</div>
                                            <div className="text-lg font-semibold text-gray-900">Rp 0</div>
                                        </div>
                                    </div>

                                    <div className="flex shadow-lg items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-200/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                        <div className="w-10 h-10 bg-indigo-500 shadow-lg rounded-lg flex items-center justify-center mr-4">
                                            <i className="bx bx-target-lock text-white text-lg"></i>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Target Bulan Ini</div>
                                            <div className="text-lg font-semibold text-gray-900">Rp 0</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes wave {
                        0%, 100% { transform: rotate(0deg); }
                        25% { transform: rotate(-10deg); }
                        75% { transform: rotate(10deg); }
                    }

                    .animate-wave {
                        animation: wave 2s ease-in-out infinite;
                    }
                `}</style>
            </section>
        </>
    );
};

export default Header;