import React, { useState } from 'react';
import { 
  FaHome, 
  FaHistory, 
  FaUser, 
  FaBell, 
  FaEye, 
  FaEyeSlash,
  FaArrowUp,
  FaArrowDown,
  FaChevronRight,
  FaChevronLeft,
  FaQrcode,
  FaUniversity,
  FaUserFriends,
  FaClock,
  FaCheckCircle,
  FaCreditCard,
  FaExchangeAlt,
  FaPlus,
  FaMinus,
  FaTimes,
  FaFilter,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaWallet,
  FaBuilding,
  FaMotorcycle,
  FaCar,
  FaUserTie,
  FaShieldAlt,
  FaLock
} from 'react-icons/fa';
import { 
  MdAccountBalance, 
  MdPayment, 
  MdArrowForward,
  MdOutlineHistory,
  MdOutlineArrowUpward,
  MdOutlineArrowDownward
} from 'react-icons/md';
import { 
  RiBankFill, 
  RiQrCodeFill,
  RiUserFill,
  RiTimeFill
} from 'react-icons/ri';

// Generate random transaction ID
const generateRandomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SEA';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate random reference number
const generateRefNumber = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Transaction data
const transactions = [
  // Income transactions
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'income',
    title: 'Qhusnun Rental Motor dan Mobil',
    amount: 750000,
    date: '12 April 2025',
    time: '17:54 WIB',
    description: 'Pembayaran sewa motor dan mobil',
    category: 'Rental',
    status: 'completed',
    icon: <FaMotorcycle />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'income',
    title: 'Nasywa Nabila Putri',
    amount: 800000,
    date: '25 Juni 2025',
    time: '12:34 WIB',
    description: 'Transfer dari rekening lain',
    category: 'Transfer',
    status: 'completed',
    icon: <FaUserFriends />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'income',
    title: 'Rental Motor Tugu Yogyakarta',
    amount: 700000,
    date: '3 September 2025',
    time: '19:21 WIB',
    description: 'Pembayaran sewa motor',
    category: 'Rental',
    status: 'completed',
    icon: <FaMotorcycle />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'income',
    title: 'Biwa Rental Motor Lempuyangan',
    amount: 900000,
    date: '29 September 2025',
    time: '09:50 WIB',
    description: 'Pembayaran sewa motor',
    category: 'Rental',
    status: 'completed',
    icon: <FaMotorcycle />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'income',
    title: 'Maryko Wildan P',
    amount: 400000,
    date: '30 April 2025',
    time: '09:21 WIB',
    description: 'Transfer dari rekening lain',
    category: 'Transfer',
    status: 'completed',
    icon: <FaUserTie />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'income',
    title: 'Maryko Wildan P',
    amount: 200000,
    date: '15 Mei 2025',
    time: '10:40 WIB',
    description: 'Transfer dari rekening lain',
    category: 'Transfer',
    status: 'completed',
    icon: <FaUserTie />
  },
  // Expense transactions
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'expense',
    title: 'KAI',
    amount: 70000,
    date: '28 Maret 2025',
    time: '20:19 WIB',
    description: 'Pembelian tiket kereta api',
    category: 'Transportasi',
    status: 'completed',
    icon: <FaBuilding />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'expense',
    title: 'KAI',
    amount: 100000,
    date: '30 Maret 2025',
    time: '10:59 WIB',
    description: 'Pembelian tiket kereta api',
    category: 'Transportasi',
    status: 'completed',
    icon: <FaBuilding />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'expense',
    title: 'Gopay - Gojek 085655634184',
    amount: 300000,
    date: '27 Oktober 2025',
    time: '09:53 WIB',
    description: 'Top up Gopay',
    category: 'E-wallet',
    status: 'completed',
    icon: <MdPayment />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'expense',
    title: 'Gopay - Gojek 085655634184',
    amount: 700000,
    date: '21 Desember 2025',
    time: '15:30 WIB',
    description: 'Top up Gopay',
    category: 'E-wallet',
    status: 'completed',
    icon: <MdPayment />
  },
  {
    id: generateRandomId(),
    ref: generateRefNumber(),
    type: 'expense',
    title: 'OVO INDONESIA 085655634184',
    amount: 1300000,
    date: '21 April 2026',
    time: '07:47 WIB',
    description: 'Top up OVO',
    category: 'E-wallet',
    status: 'completed',
    icon: <FaWallet />
  }
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// PIN Login Component
const PinLogin = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const CORRECT_PIN = '060906';

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      setPin(pin + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = () => {
    if (pin === CORRECT_PIN) {
      onSuccess();
    } else {
      setError('PIN yang Anda masukkan salah');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-blue-600 font-bold text-3xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">SeaBank</h1>
          <p className="text-blue-200 text-sm mt-1">Masukkan PIN untuk melanjutkan</p>
        </div>

        {/* PIN Display */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FaLock className="text-gray-400 w-4 h-4" />
              <span className="text-sm text-gray-500">Masukkan PIN</span>
            </div>
            <button 
              onClick={() => setShowPin(!showPin)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPin ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>

          {/* PIN Dots */}
          <div className="flex justify-center gap-4 mb-6">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all ${
                  index < pin.length 
                    ? 'bg-blue-600 scale-110' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
                <FaTimes className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* PIN Display Text */}
          <div className="text-center mb-6">
            <span className="text-2xl font-mono tracking-widest">
              {showPin ? pin : '•'.repeat(pin.length)}
            </span>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-16 bg-gray-50 hover:bg-gray-100 rounded-xl text-xl font-semibold text-gray-800 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-16 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors active:scale-95"
            >
              <FaTimes className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-16 bg-gray-50 hover:bg-gray-100 rounded-xl text-xl font-semibold text-gray-800 transition-colors active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              className="h-16 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition-colors active:scale-95"
            >
              <FaChevronRight className="w-5 h-5 mx-auto" />
            </button>
          </div>

          {/* Forgot PIN */}
          <div className="mt-6 text-center">
            <button className="text-blue-600 text-sm font-medium hover:underline">
              Lupa PIN?
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-4 text-center">
          <p className="text-blue-200 text-xs flex items-center justify-center gap-1">
            <FaShieldAlt className="w-3 h-3" />
            PIN Anda aman dan terenkripsi
          </p>
        </div>
      </div>
    </div>
  );
};

// Home Component
const HomePage = ({ onHistoryClick }) => {
  const [showBalance, setShowBalance] = useState(true);
  const totalBalance = 661000;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Gradient */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-4 pt-8 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">S</span>
            </div>
            <h1 className="text-white text-xl font-bold">SeaBank</h1>
          </div>
          <div className="flex gap-4">
            <button className="text-white">
              <FaBell className="w-5 h-5" />
            </button>
            <button className="text-white">
              <FaUser className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Balance Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Saldo</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-bold text-gray-800">
                  {showBalance ? formatCurrency(totalBalance) : '•••••••'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showBalance ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-600 text-xs font-semibold">Aktif</span>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <FaPlus className="w-4 h-4" />
              Top Up
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2">
              <FaExchangeAlt className="w-4 h-4" />
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="grid grid-cols-4 gap-2">
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                <RiQrCodeFill className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">QRIS</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                <RiBankFill className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Bank</span>
            </button>
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                <RiUserFill className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Sesama</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1 group"
              onClick={onHistoryClick}
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                <RiTimeFill className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Riwayat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Transaksi Terbaru</h2>
          <button 
            onClick={onHistoryClick}
            className="text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            Lihat Semua
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <FaArrowUp className={`w-4 h-4 text-green-600`} />
                    ) : (
                      <FaArrowDown className={`w-4 h-4 text-red-600`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{transaction.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span>{transaction.time}</span>
                      <span>•</span>
                      <span className="text-green-600 font-medium">Selesai</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className={`text-sm font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around py-2 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-0.5 text-blue-600">
            <FaHome className="w-6 h-6" />
            <span className="text-xs font-medium">Beranda</span>
          </button>
          <button 
            className="flex flex-col items-center gap-0.5 text-gray-400"
            onClick={onHistoryClick}
          >
            <MdOutlineHistory className="w-6 h-6" />
            <span className="text-xs font-medium">Riwayat</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-400">
            <FaUser className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// History Page Component
const HistoryPage = ({ onBack }) => {
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' ? true : t.type === filter
  );

  const getTotalIncome = () => {
    return transactions.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return transactions.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <FaChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-xl font-bold flex-1">Riwayat Transaksi</h1>
          <button className="text-white">
            <FaFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Pemasukan</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(getTotalIncome())}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Pengeluaran</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(getTotalExpense())}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl p-1 shadow-sm flex">
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('all')}
          >
            Semua
          </button>
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'income' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('income')}
          >
            <span className="flex items-center justify-center gap-1">
              <FaArrowUp className="w-3 h-3" />
              Pemasukan
            </span>
          </button>
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'expense' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('expense')}
          >
            <span className="flex items-center justify-center gap-1">
              <FaArrowDown className="w-3 h-3" />
              Pengeluaran
            </span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 mt-4 space-y-3 pb-4">
        {filteredTransactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedTransaction(transaction)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <MdOutlineArrowUpward className={`w-5 h-5 text-green-600`} />
                  ) : (
                    <MdOutlineArrowDownward className={`w-5 h-5 text-red-600`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{transaction.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{transaction.date}</span>
                    <span>•</span>
                    <span>{transaction.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">ID: {transaction.id}</p>
                </div>
              </div>
              <div className="text-right ml-2">
                <p className={`text-sm font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <FaCheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Selesai</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Detail Transaksi</h3>
                <p className="text-sm text-gray-500">ID: {selectedTransaction.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                selectedTransaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {selectedTransaction.type === 'income' ? (
                  <FaArrowUp className={`w-8 h-8 text-green-600`} />
                ) : (
                  <FaArrowDown className={`w-8 h-8 text-red-600`} />
                )}
              </div>

              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'} {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-sm text-gray-500 mt-1">{selectedTransaction.description}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pengirim/Penerima</span>
                  <span className="font-medium text-gray-800">{selectedTransaction.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tanggal</span>
                  <span className="font-medium text-gray-800">{selectedTransaction.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Waktu</span>
                  <span className="font-medium text-gray-800">{selectedTransaction.time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kategori</span>
                  <span className="font-medium text-gray-800">{selectedTransaction.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <FaCheckCircle className="w-3 h-3" />
                    Selesai
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Referensi</span>
                  <span className="font-mono text-xs text-gray-600">{selectedTransaction.ref}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around py-2 max-w-md mx-auto">
          <button 
            className="flex flex-col items-center gap-0.5 text-gray-400"
            onClick={onBack}
          >
            <FaHome className="w-6 h-6" />
            <span className="text-xs font-medium">Beranda</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-blue-600">
            <MdOutlineHistory className="w-6 h-6" />
            <span className="text-xs font-medium">Riwayat</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-400">
            <FaUser className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const handlePinSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PinLogin onSuccess={handlePinSuccess} />;
  }

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-gray-50">
      {currentPage === 'home' ? (
        <HomePage onHistoryClick={() => setCurrentPage('history')} />
      ) : (
        <HistoryPage onBack={() => setCurrentPage('home')} />
      )}
    </div>
  );
};

export default App;
