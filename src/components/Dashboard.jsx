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
                    .eq("id", user.id)
                    .single();
                if (profileError) throw profileError;
                setNamaUser(profileData.email || "Tamu");

                // Fetch transactions
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from("transactions")
                    .select("type, amount")
                    .eq("user_id", user.id);
                if (transactionsError) throw transactionsError;

                // Calculate balance, income, and expense
                const incomeTotal = transactionsData
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0);
                const expenseTotal = transactionsData
                    .filter((t) => t.type === "expense")
                    .reduce((sum, t) => sum + t.amount, 0);
                setIncome(incomeTotal);
                setExpense(expenseTotal);
                setBalance(incomeTotal - expenseTotal);

                // Fetch budgets and calculate spent
                const { data: budgetsData, error: budgetsError } = await supabase
                    .from("budgets")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("period", "monthly"); // Focus on monthly budgets for current month
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
                setNamaUser("Tamu");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
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
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                                            Selamat datang kembali,
                                        </h2>
                                        <div className="animate-wave text-2xl origin-bottom">👋</div>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                        {namaUser}
                                    </h3>
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