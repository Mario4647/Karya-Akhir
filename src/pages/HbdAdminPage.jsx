import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  FiSettings, 
  FiSave, 
  FiClock, 
  FiCreditCard, 
  FiKey, 
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

export default function HbdAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeConfigId, setActiveConfigId] = useState(null);

  const [formData, setFormData] = useState({
    timerEnd: '',
    message: '',
    paymentMethod: 'GoPay',
    accountNumber: '',
    accountName: '',
    amount: 100000,
    midtransClientKey: '',
    midtransServerKey: '',
  });

  const paymentOptions = [
    { value: 'GoPay', label: 'GoPay (E-Wallet)' },
    { value: 'OVO', label: 'OVO (E-Wallet)' },
    { value: 'DANA', label: 'DANA (E-Wallet)' },
    { value: 'ShopeePay', label: 'ShopeePay (E-Wallet)' },
    { value: 'BCA', label: 'Bank BCA' },
    { value: 'Mandiri', label: 'Bank Mandiri' },
    { value: 'BRI', label: 'Bank BRI' },
    { value: 'BNI', label: 'Bank BNI' },
  ];

  useEffect(() => {
    loadAdminConfig();
  }, []);

  const loadAdminConfig = async () => {
    try {
      setLoading(true);
      const { data: config } = await supabase
        .from('hbd_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (config) {
        setActiveConfigId(config.id);
        setFormData({
          timerEnd: config.timer_end ? new Date(config.timer_end).toISOString().slice(0, 16) : '',
          message: config.message || '',
          paymentMethod: config.payment_method || 'GoPay',
          accountNumber: config.account_number || '',
          accountName: config.account_name || '',
          amount: config.amount || 100000,
          midtransClientKey: config.midtrans_client_key || '',
          midtransServerKey: config.midtrans_server_key || '',
        });
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        timer_end: new Date(formData.timerEnd).toISOString(),
        message: formData.message,
        payment_method: formData.paymentMethod,
        account_number: formData.accountNumber,
        account_name: formData.accountName,
        amount: Number(formData.amount),
        midtrans_client_key: formData.midtransClientKey,
        midtrans_server_key: formData.midtransServerKey,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      if (activeConfigId) {
        // Update data eksis
        const { error } = await supabase
          .from('hbd_settings')
          .update(payload)
          .eq('id', activeConfigId);

        if (error) throw error;
      } else {
        // Buat record baru jika belum ada
        const { data: newSetting, error } = await supabase
          .from('hbd_settings')
          .insert([payload])
          .select('id')
          .single();

        if (error) throw error;
        if (newSetting) setActiveConfigId(newSetting.id);
      }

      setNotification({
        type: 'success',
        text: 'Pengaturan HBD & Pembayaran berhasil disimpan ke database!',
      });
    } catch (err) {
      console.error('Gagal menyimpan:', err);
      setNotification({
        type: 'error',
        text: 'Gagal menyimpan pengaturan. Silakan periksa koneksi Supabase Anda.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-sky-100 p-8 text-slate-800">
        
        {/* Header Admin */}
        <div className="border-b border-sky-100 pb-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl">
              <FiSettings className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-sky-800">Dashboard Admin HBD</h1>
              <p className="text-xs text-slate-500 mt-0.5">Atur timer, pesan ulang tahun, dan jalur e-wallet/bank pencairan Midtrans.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-sky-100 text-sky-700 font-semibold rounded-full text-xs">
            HBD Panel v1.0
          </span>
        </div>

        {notification && (
          <div className={`p-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {notification.type === 'success' ? <FiCheckCircle className="text-lg flex-shrink-0" /> : <FiXCircle className="text-lg flex-shrink-0" />}
            <span>{notification.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Timer & Message */}
          <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-sm uppercase tracking-wider">
              <FiClock className="text-base" />
              <span>1. Pengaturan Timer & Pesan</span>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Waktu Selesai Timer</label>
              <input
                type="datetime-local"
                required
                value={formData.timerEnd}
                onChange={(e) => setFormData({ ...formData, timerEnd: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pesan Ucapan Ulang Tahun</label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tulis ucapan ulang tahun di sini..."
                className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
              />
            </div>
          </div>

          {/* Section 2: Destination E-Wallet & Bank */}
          <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-sm uppercase tracking-wider">
              <FiCreditCard className="text-base" />
              <span>2. Pengaturan Tujuan Pembayaran / Pencairan</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih E-Wallet / Bank</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
                >
                  {paymentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Hadiah (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Rekening / HP E-Wallet</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Midtrans API Credentials */}
          <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-sm uppercase tracking-wider">
              <FiKey className="text-base" />
              <span>3. Midtrans API Credentials (Demo)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client Key</label>
                <input
                  type="text"
                  value={formData.midtransClientKey}
                  onChange={(e) => setFormData({ ...formData, midtransClientKey: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Server Key</label>
                <input
                  type="text"
                  value={formData.midtransServerKey}
                  onChange={(e) => setFormData({ ...formData, midtransServerKey: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-base shadow-lg shadow-sky-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FiSave className="text-xl" />
            <span>{saving ? 'Saving Config...' : 'SIMPAN PENGATURAN ADMIN'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
