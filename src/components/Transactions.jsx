import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { withAuth } from "../authMiddleware";

const Transactions = ({ user }) => {
    const [filter, setFilter] = useState({
        type: "all",
        category: "",
        startDate: "",
        endDate: "",
    });
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: null,
        type: "",
        amount: "",
        category: "",
        date: "",
        description: "",
    });
    const [editErrors, setEditErrors] = useState({});
    const [editSuccess, setEditSuccess] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const categories = {
        income: [
            { value: "gaji", label: "Gaji", icon: "bx-briefcase" },
            { value: "freelance", label: "Freelance", icon: "bx-laptop" },
            { value: "investasi", label: "Investasi", icon: "bx-trending-up" },
            { value: "bonus", label: "Bonus", icon: "bx-gift" },
            { value: "bisnis", label: "Bisnis", icon: "bx-store" },
            { value: "lainnya", label: "Lainnya", icon: "bx-dots-horizontal" },
        ],
        expense: [
            { value: "makanan", label: "Makanan", icon: "bx-food-menu" },
            { value: "transportasi", label: "Transportasi", icon: "bx-car" },
            { value: "tagihan", label: "Tagihan", icon: "bx-credit-card" },
            { value: "hiburan", label: "Hiburan", icon: "bx-movie" },
            { value: "kesehatan", label: "Kesehatan", icon: "bx-plus-medical" },
            { value: "pendidikan", label: "Pendidikan", icon: "bx-book" },
            { value: "belanja", label: "Belanja", icon: "bx-shopping-bag" },
            { value: "lainnya", label: "Lainnya", icon: "bx-dots-horizontal" },
        ],
    };

    // Fetch transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("date", { ascending: false });
                if (error) throw error;
                setTransactions(data || []);
                setFilteredTransactions(data || []);
            } catch (err) {
                setError("Gagal memuat transaksi: " + err.message);
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [user.id]);

    const validateEditForm = useCallback(() => {
        const newErrors = {};
        if (!editFormData.amount) {
            newErrors.amount = "Jumlah tidak boleh kosong";
        } else if (isNaN(editFormData.amount) || parseFloat(editFormData.amount) <= 0) {
            newErrors.amount = "Jumlah harus angka positif";
        } else if (parseFloat(editFormData.amount) > 999999999) {
            newErrors.amount = "Jumlah terlalu besar";
        }
        if (!editFormData.category) {
            newErrors.category = "Pilih kategori";
        }
        if (!editFormData.date) {
            newErrors.date = "Pilih tanggal";
        } else {
            const selectedDate = new Date(editFormData.date);
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            if (selectedDate > today) {
                newErrors.date = "Tanggal tidak boleh di masa depan";
            } else if (selectedDate < oneYearAgo) {
                newErrors.date = "Tanggal tidak boleh lebih dari 1 tahun yang lalu";
            }
        }
        if (editFormData.description && editFormData.description.length > 200) {
            newErrors.description = "Deskripsi maksimal 200 karakter";
        }
        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [editFormData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter({ ...filter, [name]: value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        let filtered = [...transactions];
        if (filter.type !== "all") {
            filtered = filtered.filter((t) => t.type === filter.type);
        }
        if (filter.category) {
            filtered = filtered.filter((t) => t.category === filter.category);
        }
        if (filter.startDate) {
            filtered = filtered.filter((t) => t.date >= filter.startDate);
        }
        if (filter.endDate) {
            filtered = filtered.filter((t) => t.date <= filter.endDate);
        }
        setFilteredTransactions(filtered);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleResetFilter = async () => {
        setFilter({
            type: "all",
            category: "",
            startDate: "",
            endDate: "",
        });
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: false });
            if (error) throw error;
            setTransactions(data || []);
            setFilteredTransactions(data || []);
            setCurrentPage(1);
        } catch (err) {
            setError("Gagal memuat transaksi: " + err.message);
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const transaction = transactions.find((t) => t.id === id);
        if (transaction) {
            setEditFormData({
                id: transaction.id,
                type: transaction.type,
                amount: transaction.amount.toString(),
                category: transaction.category,
                date: transaction.date,
                description: transaction.description || "",
            });
            setEditModalOpen(true);
            setEditErrors({});
            setEditSuccess(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({ ...prev, [name]: value }));
        if (editErrors[name]) {
            setEditErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (editSuccess) {
            setEditSuccess(false);
        }
    };

    const handleEditSubmit = async () => {
        if (!validateEditForm()) return;

        try {
            const updatedData = {
                type: editFormData.type,
                amount: parseFloat(editFormData.amount),
                category: editFormData.category,
                date: editFormData.date,
                description: editFormData.description || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from("transactions")
                .update(updatedData)
                .eq("id", editFormData.id)
                .eq("user_id", user.id);

            if (error) {
                setEditErrors({ submit: "Gagal memperbarui transaksi: " + error.message });
                return;
            }

            setTransactions((prev) =>
                prev.map((t) =>
                    t.id === editFormData.id ? { ...t, ...updatedData } : t
                )
            );
            setFilteredTransactions((prev) =>
                prev.map((t) =>
                    t.id === editFormData.id ? { ...t, ...updatedData } : t
                )
            );
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
                .from("transactions")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);
            if (error) throw error;
            setTransactions((prev) => prev.filter((t) => t.id !== id));
            setFilteredTransactions((prev) => prev.filter((t) => t.id !== id));
            setCurrentPage((prev) =>
                Math.min(prev, Math.ceil((filteredTransactions.length - 1) / itemsPerPage) || 1)
            );
        } catch (err) {
            setError("Gagal menghapus transaksi: " + err.message);
            console.error("Delete error:", err);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(value);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <section
            id="transactions"
            className="min-h-screen bg-white overflow-hidden pt-20"
        >
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div
                        className="text-center mb-8"
                        data-aos-duration="1000"
                        data-aos="fade-down"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Daftar Transaksi
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Pantau semua pemasukan dan pengeluaranmu di sini
                        </p>
                        <i className="bx bx-list-ul text-5xl text-indigo-600 mt-4 animate-bounce"></i>
                    </div>
                    <div
                        className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-lg transition-all duration-500 mb-4"
                        data-aos-delay="600"
                        data-aos="fade-up"
                    >
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-800 flex items-center gap-3">
                                <i className="bx bx-error-circle text-xl text-red-500"></i>
                                <span>{error}</span>
                            </div>
                        )}
                        <form
                            onSubmit={handleFilterSubmit}
                            className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Tipe Transaksi
                                </label>
                                <i className="bx bx-filter absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                <select
                                    name="type"
                                    value={filter.type}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white"
                                >
                                    <option value="all">Semua</option>
                                    <option value="income">Pemasukan</option>
                                    <option value="expense">Pengeluaran</option>
                                </select>
                                <i className="bx bx-chevron-down absolute right-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Kategori
                                </label>
                                <i className="bx bx-category absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                <select
                                    name="category"
                                    value={filter.category}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white"
                                >
                                    <option value="">Semua</option>
                                    {[
                                        ...categories.income.map((cat) => ({
                                            ...cat,
                                            type: "income",
                                        })),
                                        ...categories.expense.map((cat) => ({
                                            ...cat,
                                            type: "expense",
                                        })),
                                    ].map((cat) => (
                                        <option
                                            key={`${cat.type}-${cat.value}`}
                                            value={cat.value}
                                        >
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                <i className="bx bx-chevron-down absolute right-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Dari Tanggal
                                </label>
                                <i className="bx bx-calendar absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filter.startDate}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Sampai Tanggal
                                </label>
                                <i className="bx bx-calendar absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filter.endDate}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300"
                                />
                            </div>
                            <div className="flex gap-4 mt-6 sm:col-span-2 md:col-span-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-search text-lg"></i>
                                    Filter
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <i className="bx bx-reset text-lg"></i>
                                    Reset
                                </button>
                            </div>
                        </form>
                        {loading ? (
                            <div className="text-center py-6">
                                <i className="bx bx-loader-alt text-3xl text-indigo-600 animate-spin"></i>
                                <p className="text-gray-700 mt-2">Memuat transaksi...</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto shadow-lg">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                                                    Tanggal
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                                                    Kategori
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                                                    Jumlah
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                                                    Deskripsi
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentTransactions.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="5"
                                                        className="px-4 py-6 text-center text-gray-700 text-base font-medium"
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            <i className="bx bx-info-circle text-3xl text-gray-500"></i>
                                                            <span>Belum ada transaksi</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentTransactions.map((transaction) => (
                                                    <tr
                                                        key={transaction.id}
                                                        className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                                    >
                                                        <td className="px-4 py-3 text-sm text-gray-800">
                                                            {formatDate(transaction.date)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                                                            {[
                                                                ...categories.income,
                                                                ...categories.expense,
                                                            ].find(
                                                                (cat) =>
                                                                    cat.value ===
                                                                    transaction.category
                                                            )?.label || transaction.category}
                                                        </td>
                                                        <td
                                                            className={`px-4 py-3 text-sm font-semibold ${
                                                                transaction.type === "income"
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }`}
                                                        >
                                                            {formatCurrency(transaction.amount)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800">
                                                            {transaction.description || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleEdit(transaction.id)
                                                                }
                                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200"
                                                                title="Edit"
                                                            >
                                                                <i className="bx bx-edit text-lg"></i>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(transaction.id)
                                                                }
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
                                                className={`px-3 py-1 rounded-lg ${
                                                    currentPage === index + 1
                                                        ? "bg-indigo-600 text-white"
                                                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                } transition-all duration-300`}
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
                            <h3 className="text-xl font-bold text-gray-800">
                                Edit Transaksi
                            </h3>
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
                                <span>Transaksi berhasil diperbarui!</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="flex justify-center gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleEditChange({
                                            target: { name: "type", value: "income" },
                                        })
                                    }
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                        editFormData.type === "income"
                                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                    }`}
                                >
                                    <i className="bx bx-trending-up text-lg"></i>
                                    Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleEditChange({
                                            target: { name: "type", value: "expense" },
                                        })
                                    }
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                        editFormData.type === "expense"
                                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                    }`}
                                >
                                    <i className="bx bx-trending-down text-lg"></i>
                                    Pengeluaran
                                </button>
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Jumlah <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-money absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={editFormData.amount}
                                        onChange={handleEditChange}
                                        placeholder="Jumlah (Rp)"
                                        min="0"
                                        step="1000"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                            editErrors.amount ? "border-red-300 bg-red-50" : ""
                                        }`}
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
                                    Kategori <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-category absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                    <select
                                        name="category"
                                        value={editFormData.category}
                                        onChange={handleEditChange}
                                        className={`w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white ${
                                            editErrors.category ? "border-red-300 bg-red-50" : ""
                                        }`}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories[editFormData.type]?.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                    <i className="bx bx-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg pointer-events-none"></i>
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
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                    <input
                                        type="date"
                                        name="date"
                                        value={editFormData.date}
                                        onChange={handleEditChange}
                                        max={new Date().toISOString().split("T")[0]}
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${
                                            editErrors.date ? "border-red-300 bg-red-50" : ""
                                        }`}
                                    />
                                </div>
                                {editErrors.date && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {editErrors.date}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Deskripsi <span className="text-gray-500 font-normal">(Opsional)</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-note absolute left-3 top-4 text-gray-500 text-lg"></i>
                                    <textarea
                                        name="description"
                                        value={editFormData.description}
                                        onChange={handleEditChange}
                                        placeholder="Catatan tambahan tentang transaksi ini..."
                                        maxLength="200"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 resize-none ${
                                            editErrors.description ? "border-red-300 bg-red-50" : ""
                                        }`}
                                        rows="3"
                                    />
                                    <span className="absolute bottom-2 right-4 text-xs text-gray-600">
                                        {editFormData.description.length}/200
                                    </span>
                                </div>
                                {editErrors.description && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {editErrors.description}
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

export default withAuth(Transactions);