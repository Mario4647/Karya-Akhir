import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { withAuth } from "../authMiddleware";

const Budget = ({ user }) => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: null,
        category: "",
        amount: "",
        period: "monthly",
    });
    const [editErrors, setEditErrors] = useState({});
    const [editSuccess, setEditSuccess] = useState(false);
    const [formData, setFormData] = useState({
        category: "",
        amount: "",
        period: "monthly",
    });
    const [errors, setErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const categories = [
        { value: "makanan", label: "Makanan" },
        { value: "transportasi", label: "Transportasi" },
        { value: "tagihan", label: "Tagihan" },
        { value: "hiburan", label: "Hiburan" },
        { value: "kesehatan", label: "Kesehatan" },
        { value: "pendidikan", label: "Pendidikan" },
        { value: "belanja", label: "Belanja" },
        { value: "ngedate", label: "Ngedate" },
        { value: "liburan", label: "Liburan" },
        { value: "lainnya", label: "Lainnya" },
    ];

    const periods = [
        { value: "monthly", label: "Bulanan" },
        { value: "weekly", label: "Mingguan" },
        { value: "yearly", label: "Tahunan" },
    ];

    // Fetch budgets and calculate spent amounts
    useEffect(() => {
        const fetchBudgetsAndSpent = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch budgets
                const { data: budgetsData, error: budgetsError } = await supabase
                    .from("budgets")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });
                if (budgetsError) throw budgetsError;

                // Fetch transactions to calculate spent
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from("transactions")
                    .select("category, amount, date")
                    .eq("user_id", user.id)
                    .eq("type", "expense");
                if (transactionsError) throw transactionsError;

                // Calculate spent for each budget
                const budgetsWithSpent = budgetsData.map((budget) => {
                    const periodStart = new Date();
                    if (budget.period === "monthly") {
                        periodStart.setDate(1);
                    } else if (budget.period === "weekly") {
                        const day = periodStart.getDay();
                        periodStart.setDate(periodStart.getDate() - (day === 0 ? 6 : day - 1));
                    } else if (budget.period === "yearly") {
                        periodStart.setMonth(0, 1);
                    }
                    periodStart.setHours(0, 0, 0, 0);

                    const spent = transactionsData
                        .filter(
                            (t) =>
                                t.category === budget.category &&
                                new Date(t.date) >= periodStart
                        )
                        .reduce((sum, t) => sum + t.amount, 0);

                    return { ...budget, spent };
                });

                setBudgets(budgetsWithSpent || []);
            } catch (err) {
                setError("Gagal memuat anggaran: " + err.message);
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBudgetsAndSpent();
    }, [user.id]);

    const validateForm = useCallback(
        (data) => {
            const newErrors = {};
            if (!data.category) {
                newErrors.category = "Pilih kategori";
            }
            if (!data.amount) {
                newErrors.amount = "Jumlah tidak boleh kosong";
            } else if (isNaN(data.amount) || parseFloat(data.amount) <= 0) {
                newErrors.amount = "Jumlah harus angka positif";
            } else if (parseFloat(data.amount) > 999999999) {
                newErrors.amount = "Jumlah terlalu besar";
            }
            if (!data.period) {
                newErrors.period = "Pilih periode";
            }
            return newErrors;
        },
        []
    );

    const handleChange = useCallback(
        (e) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
            if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: "" }));
            }
            if (submitSuccess) {
                setSubmitSuccess(false);
            }
        },
        [errors, submitSuccess]
    );

    const handleEditChange = useCallback(
        (e) => {
            const { name, value } = e.target;
            setEditFormData((prev) => ({ ...prev, [name]: value }));
            if (editErrors[name]) {
                setEditErrors((prev) => ({ ...prev, [name]: "" }));
            }
            if (editSuccess) {
                setEditSuccess(false);
            }
        },
        [editErrors, editSuccess]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm(formData);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {
            const newBudget = {
                user_id: user.id,
                category: formData.category,
                amount: parseFloat(formData.amount),
                period: formData.period,
            };

            const { error } = await supabase.from("budgets").insert([newBudget]);
            if (error) throw error;

            // Refetch budgets to include spent
            const { data: budgetsData, error: fetchError } = await supabase
                .from("budgets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (fetchError) throw fetchError;

            const { data: transactionsData, error: transactionsError } = await supabase
                .from("transactions")
                .select("category, amount, date")
                .eq("user_id", user.id)
                .eq("type", "expense");
            if (transactionsError) throw transactionsError;

            const budgetsWithSpent = budgetsData.map((budget) => {
                const periodStart = new Date();
                if (budget.period === "monthly") {
                    periodStart.setDate(1);
                } else if (budget.period === "weekly") {
                    const day = periodStart.getDay();
                    periodStart.setDate(periodStart.getDate() - (day === 0 ? 6 : day - 1));
                } else if (budget.period === "yearly") {
                    periodStart.setMonth(0, 1);
                }
                periodStart.setHours(0, 0, 0, 0);

                const spent = transactionsData
                    .filter(
                        (t) =>
                            t.category === budget.category &&
                            new Date(t.date) >= periodStart
                    )
                    .reduce((sum, t) => sum + t.amount, 0);

                return { ...budget, spent };
            });

            setBudgets(budgetsWithSpent);
            setFormData({
                category: "",
                amount: "",
                period: "monthly",
            });
            setSubmitSuccess(true);
            setCurrentPage(1);
            setTimeout(() => {
                setSubmitSuccess(false);
            }, 3000);
        } catch (err) {
            setErrors({ submit: "Gagal menyimpan anggaran: " + err.message });
            console.error("Submit error:", err);
        }
    };

    const handleEdit = (id) => {
        const budget = budgets.find((b) => b.id === id);
        if (budget) {
            setEditFormData({
                id: budget.id,
                category: budget.category,
                amount: budget.amount.toString(),
                period: budget.period,
            });
            setEditModalOpen(true);
            setEditErrors({});
            setEditSuccess(false);
        }
    };

    const handleEditSubmit = async () => {
        const newErrors = validateForm(editFormData);
        setEditErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {
            const updatedData = {
                category: editFormData.category,
                amount: parseFloat(editFormData.amount),
                period: editFormData.period,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from("budgets")
                .update(updatedData)
                .eq("id", editFormData.id)
                .eq("user_id", user.id);
            if (error) {
                setEditErrors({ submit: "Gagal memperbarui anggaran: " + error.message });
                return;
            }

            // Refetch budgets to update spent
            const { data: budgetsData, error: fetchError } = await supabase
                .from("budgets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (fetchError) throw fetchError;

            const { data: transactionsData, error: transactionsError } = await supabase
                .from("transactions")
                .select("category, amount, date")
                .eq("user_id", user.id)
                .eq("type", "expense");
            if (transactionsError) throw transactionsError;

            const budgetsWithSpent = budgetsData.map((budget) => {
                const periodStart = new Date();
                if (budget.period === "monthly") {
                    periodStart.setDate(1);
                } else if (budget.period === "weekly") {
                    const day = periodStart.getDay();
                    periodStart.setDate(periodStart.getDate() - (day === 0 ? 6 : day - 1));
                } else if (budget.period === "yearly") {
                    periodStart.setMonth(0, 1);
                }
                periodStart.setHours(0, 0, 0, 0);

                const spent = transactionsData
                    .filter(
                        (t) =>
                            t.category === budget.category &&
                            new Date(t.date) >= periodStart
                    )
                    .reduce((sum, t) => sum + t.amount, 0);

                return { ...budget, spent };
            });

            setBudgets(budgetsWithSpent);
            setEditSuccess(true);
            setTimeout(() => {
                setEditModalOpen(false);
                setEditSuccess(false);
            }, 1500);
        } catch (err) {
            setEditErrors({ submit: "Terjadi kesalahan, coba lagi nanti" });
            console.error("Edit error:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from("budgets")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);
            if (error) throw error;
            setBudgets((prev) => prev.filter((b) => b.id !== id));
            setCurrentPage((prev) =>
                Math.min(prev, Math.ceil((budgets.length - 1) / itemsPerPage) || 1)
            );
        } catch (err) {
            setError("Gagal menghapus anggaran: " + err.message);
            console.error("Delete error:", err);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
    };

    // Pagination logic
    const totalPages = Math.ceil(budgets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBudgets = budgets.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <section id="budget" className="min-h-screen overflow-hidden bg-white pt-20">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="text-center mb-8" data-aos="fade-down" data-aos-duration="1000">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Rencana Anggaran
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Atur dan pantau anggaranmu untuk pengeluaran yang lebih terkontrol
                        </p>
                        <i className="bx bx-wallet text-5xl text-indigo-600 mt-4 animate-bounce"></i>
                    </div>
                    <div
                        className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-lg transition-all duration-500 mb-4"
                        data-aos="fade-up"
                        data-aos-delay="600"
                    >
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-800 flex items-center gap-3">
                                <i className="bx bx-error-circle text-xl text-red-500"></i>
                                <span>{error}</span>
                            </div>
                        )}
                        {submitSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200/50 rounded-lg text-green-800 flex items-center gap-3 animate-pulse">
                                <i className="bx bx-check-circle text-xl text-green-500"></i>
                                <span className="font-medium">Anggaran berhasil disimpan!</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="relative min-h-[80px]">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Kategori <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-category absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white ${errors.category ? "border-red-300 bg-red-50" : ""}`}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <i className="bx bx-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10 pointer-events-none"></i>
                                </div>
                                <div className="h-5 mt-1">
                                    {errors.category && (
                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                            <i className="bx bx-error-circle"></i>
                                            {errors.category}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="relative min-h-[80px]">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Jumlah <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-money absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="Jumlah (Rp)"
                                        min="0"
                                        step="1000"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.amount ? "border-red-300 bg-red-50" : ""}`}
                                    />
                                </div>
                                <div className="h-5 mt-1">
                                    {errors.amount && (
                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                            <i className="bx bx-error-circle"></i>
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="relative min-h-[80px]">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Periode <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                    <select
                                        name="period"
                                        value={formData.period}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white ${errors.period ? "border-red-300 bg-red-50" : ""}`}
                                    >
                                        {periods.map((period) => (
                                            <option key={period.value} value={period.value}>{period.label}</option>
                                        ))}
                                    </select>
                                    <i className="bx bx-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10 pointer-events-none"></i>
                                </div>
                                <div className="h-5 mt-1">
                                    {errors.period && (
                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                            <i className="bx bx-error-circle"></i>
                                            {errors.period}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-3 mt-4">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-save text-lg"></i>
                                    Simpan Anggaran
                                </button>
                            </div>
                            {errors.submit && (
                                <div className="sm:col-span-3 mt-4 p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-800 flex items-center gap-3">
                                    <i className="bx bx-error-circle text-xl text-red-500"></i>
                                    <span>{errors.submit}</span>
                                </div>
                            )}
                        </form>
                        {loading ? (
                            <div className="text-center py-6">
                                <i className="bx bx-loader-alt text-3xl text-indigo-600 animate-spin"></i>
                                <p className="text-gray-700 mt-2">Memuat anggaran...</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto shadow-lg">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Kategori</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Jumlah</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Terpakai</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Sisa</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Periode</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentBudgets.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-6 text-center text-gray-700 text-base font-medium">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <i className="bx bx-info-circle text-5xl text-gray-500"></i>
                                                            <span>Belum ada rencana anggaran</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentBudgets.map((budget) => (
                                                    <tr key={budget.id} className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                                        <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                                                            {categories.find((cat) => cat.value === budget.category)?.label || budget.category}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800">{formatCurrency(budget.amount)}</td>
                                                        <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(budget.spent)}</td>
                                                        <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(budget.amount - budget.spent)}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                                                            {periods.find((p) => p.value === budget.period)?.label || budget.period}
                                                        </td>
                                                        <td className="px-4 py-3 flex gap-2">
                                                            <button
                                                                onClick={() => handleEdit(budget.id)}
                                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200"
                                                                title="Edit"
                                                            >
                                                                <i className="bx bx-edit text-lg"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(budget.id)}
                                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
                                                                title="Hapus"
                                                            >
                                                                <i className="bx bx-trash text-lg"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-4 flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-all duration-300"
                                        >
                                            <i className="bx bx-chevron-left"></i>
                                        </button>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => handlePageChange(index + 1)}
                                                className={`px-3 py-1 rounded-lg ${currentPage === index + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} transition-all duration-300`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-all duration-300"
                                        >
                                            <i className="bx bx-chevron-right"></i>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* Edit Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Edit Anggaran</h3>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                <i className="bx bx-x text-2xl"></i>
                            </button>
                        </div>
                        {editSuccess && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200/50 rounded-xl text-green-800 flex items-center gap-2 animate-pulse">
                                <i className="bx bx-check-circle text-lg text-green-500"></i>
                                <span>Anggaran berhasil diperbarui!</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Kategori <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-category absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                    <select
                                        name="category"
                                        value={editFormData.category}
                                        onChange={handleEditChange}
                                        className={`w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white ${editErrors.category ? "border-red-300 bg-red-50" : ""}`}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <i className="bx bx-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10 pointer-events-none"></i>
                                </div>
                                {editErrors.category && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {editErrors.category}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Jumlah <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-money absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={editFormData.amount}
                                        onChange={handleEditChange}
                                        placeholder="Jumlah (Rp)"
                                        min="0"
                                        step="1000"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${editErrors.amount ? "border-red-300 bg-red-50" : ""}`}
                                    />
                                </div>
                                {editErrors.amount && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {editErrors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Periode <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10"></i>
                                    <select
                                        name="period"
                                        value={editFormData.period}
                                        onChange={handleEditChange}
                                        className={`w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white ${editErrors.period ? "border-red-300 bg-red-50" : ""}`}
                                    >
                                        {periods.map((period) => (
                                            <option key={period.value} value={period.value}>{period.label}</option>
                                        ))}
                                    </select>
                                    <i className="bx bx-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg z-10 pointer-events-none"></i>
                                </div>
                                {editErrors.period && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {editErrors.period}
                                    </p>
                                )}
                            </div>
                            {editErrors.submit && (
                                <div className="p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-800 flex items-center gap-3">
                                    <i className="bx bx-error-circle text-xl text-red-500"></i>
                                    <span>{editErrors.submit}</span>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleEditSubmit}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-save text-lg"></i>
                                    Simpan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-x text-lg"></i>
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default withAuth(Budget);
