import { useState, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { withAuth } from "../authMiddleware";

const Add = ({ user }) => {
    const [formData, setFormData] = useState({
        type: "income",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
    });
    const [errors, setErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const categories = useMemo(
        () => ({
            income: [
                { value: "gaji", label: "💼 Gaji", icon: "bx-briefcase" },
                { value: "freelance", label: "💻 Freelance", icon: "bx-laptop" },
                { value: "investasi", label: "📈 Investasi", icon: "bx-trending-up" },
                { value: "bonus", label: "🎁 Bonus", icon: "bx-gift" },
                { value: "bisnis", label: "🏪 Bisnis", icon: "bx-store" },
                { value: "lainnya", label: "📋 Lainnya", icon: "bx-dots-horizontal" },
            ],
            expense: [
                { value: "makanan", label: "🍽️ Makanan", icon: "bx-food-menu" },
                { value: "transportasi", label: "🚗 Transportasi", icon: "bx-car" },
                { value: "tagihan", label: "💳 Tagihan", icon: "bx-credit-card" },
                { value: "hiburan", label: "🎬 Hiburan", icon: "bx-movie" },
                { value: "kesehatan", label: "🏥 Kesehatan", icon: "bx-plus-medical" },
                { value: "pendidikan", label: "📚 Pendidikan", icon: "bx-book" },
                { value: "belanja", label: "🛍️ Belanja", icon: "bx-shopping-bag" },
                { value: "lainnya", label: "📋 Lainnya", icon: "bx-dots-horizontal" },
            ],
        }),
        []
    );

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.amount) {
            newErrors.amount = "Jumlah tidak boleh kosong";
        } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Jumlah harus angka positif";
        } else if (parseFloat(formData.amount) > 999999999) {
            newErrors.amount = "Jumlah terlalu besar";
        }
        if (!formData.category) {
            newErrors.category = "Pilih kategori";
        }
        if (!formData.date) {
            newErrors.date = "Pilih tanggal";
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            if (selectedDate > today) {
                newErrors.date = "Tanggal tidak boleh di masa depan";
            } else if (selectedDate < oneYearAgo) {
                newErrors.date = "Tanggal tidak boleh lebih dari 1 tahun yang lalu";
            }
        }
        if (formData.description && formData.description.length > 200) {
            newErrors.description = "Deskripsi maksimal 200 karakter";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleChange = useCallback(
        (e) => {
            const { name, value } = e.target;
            if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: "" }));
            }
            if (name === "type") {
                setFormData((prev) => ({ ...prev, [name]: value, category: "" }));
            } else {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
            if (submitSuccess) {
                setSubmitSuccess(false);
            }
        },
        [errors, submitSuccess]
    );

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const transactionData = {
                user_id: user.id, // Use authenticated user's ID
                type: formData.type,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date,
                description: formData.description || null,
                created_at: new Date().toISOString(),
            };

            const { error } = await supabase.from("transactions").insert([transactionData]);

            if (error) {
                setErrors({ submit: "Gagal menyimpan transaksi: " + error.message });
                return;
            }

            setFormData({
                type: formData.type,
                amount: "",
                category: "",
                date: new Date().toISOString().split("T")[0],
                description: "",
            });
            setSubmitSuccess(true);
            setTimeout(() => {
                setSubmitSuccess(false);
            }, 3000);
        } catch (err) {
            setErrors({ submit: "Terjadi kesalahan, coba lagi nanti" });
            console.error("Submit error:", err);
        }
    };
    const formatCurrency = (value) => {
        if (!value) return "";
        return new Intl.NumberFormat("id-ID").format(value);
    };

    return (
        <section id="add" className="min-h-screen bg-white overflow-hidden">
            <div className="container">
                <div className="max-w-2xl mx-auto px-4 mt-6">
                    <div
                        className="text-center mb-8"
                        data-aos-duration="1000"
                        data-aos="fade-down"
                    >
                        <h2 className="text-5xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Tambah Transaksi
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Catat pemasukan atau pengeluaranmu dengan mudah
                        </p>
                        <i className="bx bx-plus-circle text-5xl text-indigo-600 dark:text-indigo-400 mt-4 animate-bounce"></i>
                    </div>
                    <div
                        className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-lg transition-all duration-500 mb-4"
                        data-aos-delay="600"
                        data-aos="fade-up"
                    >
                        {submitSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200/50 rounded-xl text-green-800 flex items-center gap-3 animate-pulse">
                                <i className="bx bx-check-circle text-xl text-green-500"></i>
                                <span className="font-medium">Transaksi berhasil disimpan!</span>
                            </div>
                        )}
                        <div className="flex justify-center gap-4 mb-6">
                            <button
                                type="button"
                                onClick={() =>
                                    handleChange({ target: { name: "type", value: "income" } })
                                }
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${formData.type === "income"
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
                                    handleChange({ target: { name: "type", value: "expense" } })
                                }
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${formData.type === "expense"
                                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                    }`}
                            >
                                <i className="bx bx-trending-down text-lg"></i>
                                Pengeluaran
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Jumlah <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-money absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="Jumlah (Rp)"
                                        min="0"
                                        step="1000"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.amount ? "border-red-300 bg-red-50" : ""
                                            }`}
                                    />
                                    {formData.amount && (
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">
                                            {formatCurrency(formData.amount)}
                                        </span>
                                    )}
                                </div>
                                {errors.amount && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.amount}
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
                                        value={formData.category}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 appearance-none bg-white ${errors.category ? "border-red-300 bg-red-50" : ""
                                            }`}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories[formData.type].map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                    <i className="bx bx-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg pointer-events-none"></i>
                                </div>
                                {errors.category && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.category}
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
                                        value={formData.date}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split("T")[0]}
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 ${errors.date ? "border-red-300 bg-red-50" : ""
                                            }`}
                                    />
                                </div>
                                {errors.date && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.date}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Deskripsi <span className="text-gray-500 font-normal">(Opsional)</span>
                                </label>
                                <div className="relative">
                                    <i className="bx bx-note absolute left-3 top-3 text-gray-500 text-lg"></i>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Catatan tambahan tentang transaksi ini..."
                                        maxLength="200"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 resize-none ${errors.description ? "border-red-300 bg-red-50" : ""
                                            }`}
                                        rows="3"
                                    />
                                    <span className="absolute bottom-2 right-4 text-xs text-gray-600">
                                        {formData.description.length}/200
                                    </span>
                                </div>
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                            {errors.submit && (
                                <div className="p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-800 flex items-center gap-3">
                                    <i className="bx bx-error-circle text-xl text-red-500"></i>
                                    <span>{errors.submit}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="w-full py-3 bg-gradient-to-r shadow-lg from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <i className="bx bx-save text-lg"></i>
                                Simpan Transaksi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default withAuth(Add);