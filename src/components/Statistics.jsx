import { useState, useEffect } from "react";
import { Pie, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title
} from "chart.js";
import { supabase } from "../supabaseClient";
import { withAuth } from "../authMiddleware";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title
);

const Statistics = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    .order("date", { ascending: true });
                if (error) throw error;
                setTransactions(data || []);
            } catch (err) {
                setError("Gagal memuat transaksi: " + err.message);
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [user.id]);

    // Process data for Pie Chart
    const pieData = {
        labels: ["Pemasukan", "Pengeluaran"],
        datasets: [
            {
                data: [
                    transactions
                        .filter((t) => t.type === "income")
                        .reduce((sum, t) => sum + t.amount, 0),
                    transactions
                        .filter((t) => t.type === "expense")
                        .reduce((sum, t) => sum + t.amount, 0),
                ],
                backgroundColor: ["#34D399", "#F87171"],
                borderColor: ["#fff", "#fff"],
                borderWidth: 2,
            },
        ],
    };

    // Process data for Line Chart (group by date)
    const getLineChartData = () => {
        // Group transactions by date
        const groupedByDate = transactions.reduce((acc, t) => {
            const date = new Date(t.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            if (!acc[date]) {
                acc[date] = { income: 0, expense: 0 };
            }
            acc[date][t.type] += t.amount;
            return acc;
        }, {});

        // Sort dates
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
            return new Date(a.split(" ").reverse().join("-")) - new Date(b.split(" ").reverse().join("-"));
        });

        return {
            labels: sortedDates,
            datasets: [
                {
                    label: "Pemasukan",
                    data: sortedDates.map((date) => groupedByDate[date].income),
                    borderColor: "#34D399",
                    backgroundColor: "rgba(52, 211, 153, 0.2)",
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: "Pengeluaran",
                    data: sortedDates.map((date) => groupedByDate[date].expense),
                    borderColor: "#F87171",
                    backgroundColor: "rgba(248, 113, 113, 0.2)",
                    fill: true,
                    tension: 0.4,
                },
            ],
        };
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    font: { size: 14, family: "'Inter', sans-serif" },
                    color: "#374151",
                },
            },
            title: {
                display: true,
                text: "Distribusi Pemasukan & Pengeluaran",
                font: { size: 18, family: "'Inter', sans-serif", weight: "bold" },
                color: "#374151",
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.parsed || 0;
                        return `${context.label}: Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
                    },
                },
            },
        },
    };

    const lineOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    font: { size: 14, family: "'Inter', sans-serif" },
                    color: "#374151",
                },
            },
            title: {
                display: true,
                text: "Tren Transaksi",
                font: { size: 18, family: "'Inter', sans-serif", weight: "bold" },
                color: "#374151",
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y || 0;
                        return `${context.dataset.label}: Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`,
                    font: { size: 12, family: "'Inter', sans-serif" },
                    color: "#6B7280",
                },
                grid: { color: "#E5E7EB" },
            },
            x: {
                ticks: {
                    font: { size: 12, family: "'Inter', sans-serif" },
                    color: "#6B7280",
                },
                grid: { display: false },
            },
        },
    };

    return (
        <section id="stats" className="min-h-screen overflow-hidden bg-white pt-20">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 mt-6">
                    <div className="text-center mb-8" data-aos-duration="1000" data-aos="fade-down">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent leading-tight">
                            Statistik Keuangan
                        </h2>
                        <p className="text-base md:text-lg text-gray-700 mt-2">
                            Visualisasi pemasukan dan pengeluaranmu
                        </p>
                        <i className="bx bx-pie-chart-alt text-5xl text-indigo-600 mt-4 animate-bounce"></i>
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
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-700 text-base font-medium">
                                <i className="bx bx-loader-alt text-5xl text-indigo-600 animate-spin mb-4"></i>
                                <span>Memuat data transaksi...</span>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-700 text-base font-medium">
                                <i className="bx bx-info-circle text-5xl text-gray-500 mb-4"></i>
                                <span>Belum ada data transaksi</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
                                    <Pie data={pieData} options={pieOptions} />
                                </div>
                                <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
                                    <Line data={getLineChartData()} options={lineOptions} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default withAuth(Statistics);