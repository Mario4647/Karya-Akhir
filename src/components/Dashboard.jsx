import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { withAuth } from "../authMiddleware";
import { format } from "date-fns";

const Dashboard = ({ user }) => {
    const [namaUser, setNamaUser] = useState("Tamu");
    const [userRole, setUserRole] = useState("user");
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
    const [partnerStatus, setPartnerStatus] = useState(false);
    const [partnerInfo, setPartnerInfo] = useState(null);
    const navigate = useNavigate();

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

    // Fetch user profile, financial data, and partner status
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user profile
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("email, roles, name, trip_access_granted, trip_access_granted_at")
                    .eq("id", user.id)
                    .single();

                if (profileError) throw profileError;
                
                if (!profileData) {
                    // No profile exists, set default email or handle accordingly
                    setNamaUser(user.email || "Tamu");
                    setNewEmail(user.email || "");
                    setUserRole("user");
                    setPartnerStatus(false);
                } else {
                    setNamaUser(profileData.name || profileData.email || "Tamu");
                    setNewEmail(profileData.email || "");
                    setUserRole(profileData.roles || "user");
                    setPartnerStatus(profileData.trip_access_granted || false);
                    
                    // Fetch partner info if partner status is true
                    if (profileData.trip_access_granted) {
                        const { data: partnerData, error: partnerError } = await supabase
                            .from("trip_access")
                            .select(`
                                *,
                                owner:owner_id (
                                    name,
                                    email
                                ),
                                partner:partner_id (
                                    name,
                                    email
                                )
                            `)
                            .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
                            .eq('status', 'active')
                            .single();

                        if (!partnerError && partnerData) {
                            setPartnerInfo(partnerData);
                        }
                    }
                }

                // Fetch financial data
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
                setUserRole("user");
                setPartnerStatus(false);
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

    const handleAdminDashboardClick = () => {
        navigate("/admin");
    };

    const handleAdminTripDashboardClick = () => {
        navigate("/admin/tripsettings");
    };

    const handleUserTripDashboardClick = () => {
        navigate("/triplist");
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
            className="min-h-screen pt-24 overflow-hidden pb-6 bg-gradient-to-br from-blue-50 to-indigo-50"
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
                        <div className="relative bg-white backdrop-blur-xl shadow-2xl border border-white/50 text-gray-800 p-10 md:p-12 rounded-3xl transition-all duration-500">
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
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
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
                                        
                                        {/* Partner Status Badge */}
                                        {partnerStatus && (
                                            <div className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium flex items-center">
                                                <i className="bx bx-heart mr-1 text-purple-600"></i>
                                                Status Pasangan
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Role badge */}
                                    <div className="mb-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            userRole === "admin" 
                                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200" 
                                                : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200"
                                        }`}>
                                            <i className={`bx ${
                                                userRole === "admin" ? "bx-shield-alt" : "bx-user"
                                            } mr-1`}></i>
                                            {userRole === "admin" ? "Administrator" : "Pengguna"}
                                        </span>
                                    </div>

                                    {/* Dashboard Navigation Buttons */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {/* Admin Dashboard Button - Only visible for admin users */}
                                        {userRole === "admin" && (
                                            <button
                                                onClick={handleAdminDashboardClick}
                                                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors duration-200 text-base px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                                aria-label="Admin Dashboard"
                                            >
                                                <i className="bx bx-dashboard text-lg"></i>
                                                <span>Admin Dashboard</span>
                                            </button>
                                        )}

                                        {/* Admin Trip Dashboard Button - Only for admin */}
                                        {userRole === "admin" && (
                                            <button
                                                onClick={handleAdminTripDashboardClick}
                                                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors duration-200 text-base px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                                aria-label="Trip Dashboard"
                                            >
                                                <i className="bx bx-train text-lg"></i>
                                                <span>Trip Dashboard</span>
                                            </button>
                                        )}

                                        

                                        {/* List Trip Pasangan Button - Only for partner status */}
                                        {partnerStatus && (
                                            <button
                                                onClick={handleUserTripDashboardClick}
                                                className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors duration-200 text-base px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg"
                                                aria-label="List Trip Pasangan"
                                            >
                                                <i className="bx bx-list-check text-lg"></i>
                                                <span>List Trip Pasangan</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Partner Info */}
                                    {partnerStatus && partnerInfo && (
                                        <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                            <p className="text-sm text-purple-700">
                                                <i className="bx bx-info-circle mr-1"></i>
                                                Anda memiliki akses trip dari: 
                                                <span className="font-semibold ml-1">
                                                    {partnerInfo.owner_id === user.id 
                                                        ? partnerInfo.partner?.name || partnerInfo.partner?.email 
                                                        : partnerInfo.owner?.name || partnerInfo.owner?.email}
                                                </span>
                                            </p>
                                            <p className="text-xs text-purple-600 mt-1">
                                                Akses diberikan: {format(new Date(partnerInfo.granted_at), 'dd MMM yyyy HH:mm')}
                                            </p>
                                        </div>
                                    )}
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
                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium">
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

                            {/* Quick Stats Section */}
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Akun</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                                <i className="bx bx-user-check text-indigo-600"></i>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Role</p>
                                                <p className="font-medium text-gray-900">{userRole === "admin" ? "Administrator" : "Pengguna"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className={`p-2 ${partnerStatus ? 'bg-green-100' : 'bg-gray-100'} rounded-lg mr-3`}>
                                                <i className={`bx ${partnerStatus ? 'bx-heart text-green-600' : 'bx-user-x text-gray-600'}`}></i>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Status Pasangan</p>
                                                <p className={`font-medium ${partnerStatus ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {partnerStatus ? "Aktif" : "Tidak Aktif"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                <i className="bx bx-calendar text-blue-600"></i>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Terdaftar Sejak</p>
                                                <p className="font-medium text-gray-900">
                                                    {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '-'}
                                                </p>
                                            </div>
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
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Kelola Profil</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
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
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 transition-all duration-200"
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
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDeleteProfile}
                                        disabled={confirmDelete !== "HAPUS"}
                                        className={`px-4 py-2 text-sm font-medium text-white shadow-lg rounded-lg flex items-center gap-2 transition-all duration-200 ${confirmDelete === "HAPUS"
                                            ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                            : "bg-gradient-to-r from-red-400 to-pink-400 cursor-not-allowed"
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
