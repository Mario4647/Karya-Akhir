import { useState } from "react";
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

const Statistics = () => {
    const [transactions] = useState([]); // Empty transaction data

    // Pie Chart Data (Placeholder for empty state)
    const pieData = {
        labels: ["Pemasukan", "Pengeluaran"],
        datasets: [
            {
                data: [0, 0], // No data
                backgroundColor: ["#34D399", "#F87171"], // Green for income, red for expense
                borderColor: ["#fff", "#fff"],
                borderWidth: 2
            }
        ]
    };

    // Line Chart Data (Placeholder for empty state)
    const lineData = {
        labels: [], // No dates
        datasets: [
            {
                label: "Pemasukan",
                data: [],
                borderColor: "#34D399",
                backgroundColor: "rgba(52, 211, 153, 0.2)",
                fill: true,
                tension: 0.4
            },
            {
                label: "Pengeluaran",
                data: [],
                borderColor: "#F87171",
                backgroundColor: "rgba(248, 113, 113, 0.2)",
                fill: true,
                tension: 0.4
            }
        ]
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    font: { size: 14, family: "'Inter', sans-serif" },
                    color: "#374151"
                }
            },
            title: {
                display: true,
                text: "Distribusi Pemasukan & Pengeluaran",
                font: { size: 18, family: "'Inter', sans-serif", weight: "bold" },
                color: "#374151"
            }
        }
    };

    const lineOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    font: { size: 14, family: "'Inter', sans-serif" },
                    color: "#374151"
                }
            },
            title: {
                display: true,
                text: "Tren Transaksi",
                font: { size: 18, family: "'Inter', sans-serif", weight: "bold" },
                color: "#374151"
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`,
                    font: { size: 12, family: "'Inter', sans-serif" },
                    color: "#6B7280"
                },
                grid: { color: "#E5E7EB" }
            },
            x: {
                ticks: {
                    font: { size: 12, family: "'Inter', sans-serif" },
                    color: "#6B7280"
                },
                grid: { display: false }
            }
        }
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
                    <div className="relative bg-white backdrop-blur-xl shadow-lg border border-white text-gray-800 p-8 md:p-10 rounded-lg transition-all duration-500 mb-4" data-aos-delay="600" data-aos="fade-up">
                        {transactions.length === 0 ? (
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
                                    <Line data={lineData} options={lineOptions} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Statistics;