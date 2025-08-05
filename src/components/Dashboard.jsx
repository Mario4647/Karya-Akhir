import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { withAuth } from "../authMiddleware";

const Dashboard = ({ user }) => {
    const [namaUser, setNamaUser] = useState("Tamu");
    const [balance, setBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [budgetTotal, setBudgetTotal] = useState(0);
    const [budgetSpent, setBudgetSpent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString("id-ID", { hour12: false })
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("edit");
    const [newEmail, setNewEmail] = useState("");
    const [confirmDelete, setConfirmDelete] = useState("");

    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("id-ID", { hour12: false }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch user profile and financial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user profile
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("email")
                    .eq("id", user.id);

                if (profileError) throw profileError;
                if (profileData.length === 0) {
                    // No profile exists, set default email or handle accordingly
                    setNamaUser(user.email || "Tamu");
                    setNewEmail(user.email || "");
                } else {
                    setNamaUser(profileData[0].email || "Tamu");
                    setNewEmail(profileData[0].email || "");
                }

                // Rest of the fetchData logic remains the same
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from("transactions")
                    .select("type, amount, category, date")
                    .eq("user_id", user.id);
                if (transactionsError) throw transactionsError;

                const incomeTotal = transactionsData
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0);
                const expenseTotal = transactionsData
                    .filter((t) => t.type === "expense")
                    .reduce((sum, t) => sum + t.amount, 0);
                setIncome(incomeTotal);
                setExpense(expenseTotal);
                setBalance(incomeTotal - expenseTotal);

                const { data: budgetsData, error: budgetsError } = await supabase
                    .from("budgets")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("period", "monthly");
                if (budgetsError) throw budgetsError;

                const currentMonthStart = new Date();
                currentMonthStart.setDate(1);
                currentMonthStart.setHours(0, 0, 0, 0);

                const { data: budgetTransactions, error: budgetTransactionsError } = await supabase
                    .from("transactions")
                    .select("category, amount, date")
                    .eq("user_id", user.id)
                    .eq("type", "expense")
                    .gte("date", currentMonthStart.toISOString());
                if (budgetTransactionsError) throw budgetTransactionsError;

                const totalBudget = budgetsData.reduce((sum, b) => sum + b.amount, 0);
                const totalSpent = budgetsData.reduce((sum, budget) => {
                    const spent = budgetTransactions
                        .filter((t) => t.category === budget.category)
                        .reduce((sum, t) => sum + t.amount, 0);
                    return sum + spent;
                }, 0);

                setBudgetTotal(totalBudget);
                setBudgetSpent(totalSpent);
            } catch (err) {
                setError("Gagal memuat data: " + err.message);
                console.error("Fetch error:", err);
                setNamaUser(user.email || "Tamu");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
    };

    const openModal = () => {
        setIsModalOpen(true);
        setActiveTab("edit");
        setConfirmDelete("");
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setConfirmDelete("");
    };

    const handleEditEmail = async (e) => {
        e.preventDefault();
        try {
            setError(null);
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ email: newEmail })
                .eq("id", user.id);
            if (profileError) throw profileError;

            const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
            if (authError) throw authError;

            setNamaUser(newEmail);
            closeModal();
        } catch (err) {
            setError("Gagal memperbarui email: " + err.message);
        }
    };

    const handleDeleteProfile = async () => {
        if (confirmDelete !== "HAPUS") return;
        try {
            setError(null);
            // Delete profile (RLS will handle the deletion based on auth.uid() = id)
            const { error: profileError } = await supabase
                .from("profiles")
                .delete()
                .eq("id", user.id);
            if (profileError) throw profileError;

            // Sign out user
            await supabase.auth.signOut();
            closeModal();
        } catch (err) {
            setError("Gagal menghapus profil: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <i className="bx bx-loader-alt text-5xl text-indigo-600 animate-spin"></i>
                    <span className="text-gray-700">Memuat dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <section
            id="dashboard"
            className="min-h-screen pt-24 overflow-hidden pb-6 bg-white"
            data-aos-duration="1000"
            data-aos="fade-down"
        >
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="relative">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-800 flex items-center gap-3">
                                <i className="bx bx-error-circle text-xl text-red-500"></i>
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="relative bg-white backdrop-blur-xl shadow-xl border border-white text-gray-800 p-10 md:p-12 rounded-2xl transition-all duration-500">
                            <div
                                className="flex items-start gap-4 mb-8"
                                data-aos-delay="600"
                                data-aos="fade-down"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
                                        <i className="bx bx-id-card text-3xl text-white"></i>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                        <span className="text-sm text-white">✓</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Salam */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight truncate">
                                            Selamat datang kembali,
                                        </h2>
                                        <div className="animate-wave text-xl sm:text-2xl origin-bottom">👋</div>
                                    </div>

                                    {/* Nama user + Tombol edit */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                                            {namaUser}
                                        </h3>
                                        <button
                                            onClick={openModal}
                                            className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-base sm:text-lg"
                                            aria-label="Edit profile"
                                        >
                                            <i className="bx bx-edit text-xl sm:text-2xl md:text-3xl"></i>
                                            <span>Edit Profile</span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                            <div
                                className="space-y-4"
                                data-aos-delay="600"
                                data-aos="fade-left"
                            >
                                <div className="flex items-center gap-3 text-sm md:text-base text-gray-600">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium">Hari ini</span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        {today} {currentTime}
                                    </span>
                                </div>
                                <p className="text-base md:text-lg text-gray-700 leading-relaxed pl-5 border-l-4 border-gradient-to-b border-blue-500/50">
                                    Kelola keuanganmu dengan bijak untuk masa depan yang lebih cerah.
                                    Mulai dari mencatat pemasukan dan pengeluaran, hingga merencanakan anggaran bulanan, setiap langkah kecil membawa kamu lebih dekat ke tujuan finansialmu.
                                    Tetap disiplin, pantau pengeluaran, dan pastikan anggaranmu sesuai dengan prioritas hidupmu.
                                    <span className="inline-block ml-2 text-blue-600 font-semibold">
                                        Yuk, mulai hari ini dengan langkah yang produktif menuju kebebasan finansial!
                                    </span>
                                    <span className="inline-block ml-1 animate-pulse">💪</span>
                                </p>
                            </div>
                            <div
                                className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                                data-aos-delay="600"
                                data-aos="fade-up"
                            >
                                <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg mr-4">
                                        <i className="bx bx-wallet text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">
                                            Saldo Hari Ini
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(balance)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg mr-4">
                                        <i className="bx bx-trending-up text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">
                                            Pemasukan
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(income)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200/50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-lg mr-4">
                                        <i className="bx bx-trending-down text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">
                                            Pengeluaran
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(expense)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg mr-4">
                                        <i className="bx bx-pie-chart-alt text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">
                                            Anggaran Bulanan
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(budgetTotal)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Terpakai: {formatCurrency(budgetSpent)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Edit and Delete */}
            {isModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Kelola Profil</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-600 hover:text-gray-800"
                                aria-label="Close modal"
                            >
                                <i className="bx bx-x text-xl"></i>
                            </button>
                        </div>
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setActiveTab("edit")}
                                className={`px-4 py-2 text-sm font-medium ${activeTab === "edit"
                                    ? "border-b-2 border-indigo-600 text-indigo-600"
                                    : "text-gray-600 hover:text-indigo-600"
                                    }`}
                            >
                                Edit Email
                            </button>
                            <button
                                onClick={() => setActiveTab("delete")}
                                className={`px-4 py-2 text-sm font-medium ${activeTab === "delete"
                                    ? "border-b-2 border-red-600 text-red-600"
                                    : "text-gray-600 hover:text-red-600"
                                    }`}
                            >
                                Hapus Profil
                            </button>
                        </div>
                        {activeTab === "edit" && (
                            <form onSubmit={handleEditEmail} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Masukkan email baru"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200  rounded-lg hover:bg-gray-300"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 shadow-lg rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                    >
                                        <i className="bx bx-save text-base"></i>
                                        Simpan
                                    </button>

                                </div>
                            </form>
                        )}
                        {activeTab === "delete" && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Untuk menghapus profil Anda, ketik{" "}
                                    <span className="font-semibold text-red-600">"HAPUS"</span> di kolom
                                    di bawah ini. Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <input
                                    type="text"
                                    value={confirmDelete}
                                    onChange={(e) => setConfirmDelete(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Ketik HAPUS untuk mengonfirmasi"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDeleteProfile}
                                        disabled={confirmDelete !== "HAPUS"}
                                        className={`px-4 py-2 text-sm font-medium text-white shadow-lg rounded-lg flex items-center gap-2 ${confirmDelete === "HAPUS"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-red-400 cursor-not-allowed"
                                            }`}
                                    >
                                        <i className="bx bx-trash text-base"></i>
                                        Hapus Profil
                                    </button>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    );
};

export default withAuth(Dashboard);