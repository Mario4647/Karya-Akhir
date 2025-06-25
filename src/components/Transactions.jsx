import { useState } from "react";

const Transactions = () => {
    const [filter, setFilter] = useState({
        type: "all",
        category: "",
        startDate: "",
        endDate: ""
    });

    const [transactions, setTransactions] = useState([]);

    const categories = {
        income: [
            { value: "gaji", label: "Gaji" },
            { value: "freelance", label: "Freelance" },
            { value: "investasi", label: "Investasi" },
            { value: "bonus", label: "Bonus" },
            { value: "bisnis", label: "Bisnis" },
            { value: "lainnya", label: "Lainnya" }
        ],
        expense: [
            { value: "makanan", label: "Makanan" },
            { value: "transportasi", label: "Transportasi" },
            { value: "tagihan", label: "Tagihan" },
            { value: "hiburan", label: "Hiburan" },
            { value: "kesehatan", label: "Kesehatan" },
            { value: "pendidikan", label: "Pendidikan" },
            { value: "belanja", label: "Belanja" },
            { value: "lainnya", label: "Lainnya" }
        ]
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter({ ...filter, [name]: value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        let filtered = transactions;
        if (filter.type !== "all") {
            filtered = filtered.filter(t => t.type === filter.type);
        }
        if (filter.category) {
            filtered = filtered.filter(t => t.category === filter.category);
        }
        if (filter.startDate) {
            filtered = filtered.filter(t => t.date >= filter.startDate);
        }
        if (filter.endDate) {
            filtered = filtered.filter(t => t.date <= filter.endDate);
        }
        setTransactions(filtered);
    };

    const handleResetFilter = () => {
        setFilter({
            type: "all",
            category: "",
            startDate: "",
            endDate: ""
        });
        setTransactions([]);
    };

    const handleEdit = (id) => {
        console.log("Edit transaction ID:", id);
    };

    const handleDelete = (id) => {
        console.log("Delete transaction ID:", id);
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <section id="transactions" className="min-h-screen bg-white overflow-hidden pt-20">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="text-center mb-8" data-aos-duration="1000" data-aos="fade-down">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Daftar Transaksi
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Pantau semua pemasukan dan pengeluaranmu di sini
                        </p>
                        <i className="bx bx-list-ul text-5xl text-indigo-600 mt-4 animate-bounce"></i>
                    </div>
                    <div className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-lg transition-all duration-500 mb-4" data-aos-delay="600" data-aos="fade-up">
                        <form onSubmit={handleFilterSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                                    {[...categories.income.map(cat => ({ ...cat, type: 'income' })), ...categories.expense.map(cat => ({ ...cat, type: 'expense' }))].map((cat) => (
                                        <option key={`${cat.type}-${cat.value}`} value={cat.value}>{cat.label}</option>
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
                        <div className="overflow-x-auto shadow-lg">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-white">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-white">Kategori</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-white">Jumlah</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-white">Deskripsi</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-white">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-6 text-center text-gray-700 text-base font-medium">
                                                <div className="flex flex-col items-center gap-2">
                                                    <i className="bx bx-info-circle text-3xl text-gray-500"></i>
                                                    <span>Belum ada transaksi</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((transaction) => (
                                            <tr key={transaction.id} className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                                <td className="px-4 py-3 text-sm text-gray-800">{formatDate(transaction.date)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                                                    {[...categories.income, ...categories.expense].find(cat => cat.value === transaction.category)?.label || transaction.category}
                                                </td>
                                                <td className={`px-4 py-3 text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{transaction.description || '-'}</td>
                                                <td className="px-4 py-3 flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(transaction.id)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <i className="bx bx-edit text-lg"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(transaction.id)}
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

export default Transactions;