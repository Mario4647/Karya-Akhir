import { useState, useCallback } from "react";

const Budget = () => {
    const [budgets, setBudgets] = useState([]);
    const [formData, setFormData] = useState({
        category: "",
        amount: "",
        period: "monthly"
    });
    const [errors, setErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const categories = [
        { value: "makanan", label: "Makanan" },
        { value: "transportasi", label: "Transportasi" },
        { value: "tagihan", label: "Tagihan" },
        { value: "hiburan", label: "Hiburan" },
        { value: "kesehatan", label: "Kesehatan" },
        { value: "pendidikan", label: "Pendidikan" },
        { value: "belanja", label: "Belanja" },
        { value: "lainnya", label: "Lainnya" }
    ];

    const periods = [
        { value: "monthly", label: "Bulanan" },
        { value: "weekly", label: "Mingguan" },
        { value: "yearly", label: "Tahunan" }
    ];

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.category) {
            newErrors.category = "Pilih kategori";
        }
        if (!formData.amount) {
            newErrors.amount = "Jumlah tidak boleh kosong";
        } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Jumlah harus angka positif";
        } else if (parseFloat(formData.amount) > 999999999) {
            newErrors.amount = "Jumlah terlalu besar";
        }
        if (!formData.period) {
            newErrors.period = "Pilih periode";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        if (submitSuccess) {
            setSubmitSuccess(false);
        }
    }, [errors, submitSuccess]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        const newBudget = {
            id: Date.now(),
            category: formData.category,
            amount: parseFloat(formData.amount),
            period: formData.period,
            spent: 0, // Placeholder: to be calculated from transactions
            createdAt: new Date().toISOString()
        };
        setBudgets([...budgets, newBudget]);
        setFormData({
            category: "",
            amount: "",
            period: "monthly"
        });
        setSubmitSuccess(true);
        setTimeout(() => {
            setSubmitSuccess(false);
        }, 3000);
        console.log("Budget added:", newBudget);
    };

    const handleEdit = (id) => {
        console.log("Edit budget ID:", id);
    };

    const handleDelete = (id) => {
        console.log("Delete budget ID:", id);
        setBudgets(budgets.filter(b => b.id !== id));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    };

    return (
        <section id="budget" className="min-h-screen overflow-hidden bg-white pt-20">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="text-center mb-8" data-aos-duration="1000" data-aos="fade-down">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Rencana Anggaran
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Atur dan pantau anggaranmu untuk pengeluaran yang lebih terkontrol
                        </p>
                        <i className="bx bx-wallet text-5xl text-indigo-600 mt-4 animate-bounce"></i>
                    </div>
                    <div className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-lg transition-all duration-500 mb-4" data-aos-delay="600" data-aos="fade-up">
                        {submitSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200/50 rounded-lg text-green-800 flex items-center gap-3 animate-pulse">
                                <i className="bx bx-check-circle text-xl text-green-500"></i>
                                <span className="font-medium">Anggaran berhasil disimpan!</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Kategori <span className="text-red-500">*</span>
                                </label>
                                <i className="bx bx-category absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
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
                                <i className="bx bx-chevron-down absolute right-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                {errors.category && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.category}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Jumlah <span className="text-red-500">*</span>
                                </label>
                                <i className="bx bx-money absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
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
                                {errors.amount && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Periode <span className="text-red-500">*</span>
                                </label>
                                <i className="bx bx-calendar absolute left-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
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
                                <i className="bx bx-chevron-down absolute right-3 top-[calc(50%+16px)] transform -translate-y-1/2 text-gray-500 text-lg"></i>
                                {errors.period && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <i className="bx bx-error-circle"></i>
                                        {errors.period}
                                    </p>
                                )}
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
                        </form>
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
                                    {budgets.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-6 text-center text-gray-700 text-base font-medium">
                                                <div className="flex flex-col items-center gap-2">
                                                    <i className="bx bx-info-circle text-5xl text-gray-500"></i>
                                                    <span>Belum ada rencana anggaran</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        budgets.map((budget) => (
                                            <tr key={budget.id} className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                                <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                                                    {categories.find(cat => cat.value === budget.category)?.label || budget.category}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{formatCurrency(budget.amount)}</td>
                                                <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(budget.spent)}</td>
                                                <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(budget.amount - budget.spent)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                                                    {periods.find(p => p.value === budget.period)?.label || budget.period}
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
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Budget;