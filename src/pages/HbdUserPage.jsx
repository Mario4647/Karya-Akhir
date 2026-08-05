import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  FiGift, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiSmile, 
  FiHeart, 
  FiCreditCard 
} from 'react-icons/fi';

export default function HbdUserPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingConfig, setSettingConfig] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);

  useEffect(() => {
    fetchUserDataAndConfig();
  }, []);

  const fetchUserDataAndConfig = async () => {
    try {
      setLoading(true);
      
      // 1. Get Auth User & Profile
      const { data: { user } } = await supabase.auth.getUser();
      let currentUserId = null;

      if (user) {
        currentUserId = user.id;
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id, name, email, roles, nomor_telepon')
          .eq('id', user.id)
          .single();

        setProfile(userProfile || { name: user.email?.split('@')[0], email: user.email });
      }

      // 2. Fetch Config dari tabel hbd_settings
      const { data: settings } = await supabase
        .from('hbd_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settings) {
        setSettingConfig(settings);

        // Inject Midtrans Script jika Client Key tersedia
        if (settings.midtrans_client_key) {
          const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
          const script = document.createElement('script');
          script.src = snapScriptUrl;
          script.setAttribute('data-client-key', settings.midtrans_client_key);
          document.body.appendChild(script);
        }

        // 3. Cek apakah user sudah pernah klaim untuk setting_id ini
        if (currentUserId) {
          const { data: claimData } = await supabase
            .from('hbd_claims')
            .select('id, status, transaction_ref, claimed_at')
            .eq('user_id', currentUserId)
            .eq('setting_id', settings.id)
            .maybeSingle();

          if (claimData) {
            setHasClaimed(true);
            setClaimStatus({
              success: claimData.status === 'success',
              message: `Anda sudah mengambil hadiah ini pada ${new Date(claimData.claimed_at).toLocaleString('id-ID')}.`,
              trxId: claimData.transaction_ref,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer Countdown Loop
  useEffect(() => {
    if (!settingConfig?.timer_end) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(settingConfig.timer_end).getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        setIsTimerFinished(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsTimerFinished(false);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settingConfig?.timer_end]);

  const handleClaimReward = async () => {
    if (!profile?.id || !settingConfig) return;

    setIsProcessing(true);
    setClaimStatus(null);

    try {
      const orderId = `HBD-CLAIM-${Date.now()}`;

      // Insert ke tabel hbd_claims
      const { error: claimError } = await supabase.from('hbd_claims').insert([
        {
          user_id: profile.id,
          setting_id: settingConfig.id,
          amount: settingConfig.amount,
          payment_method: settingConfig.payment_method,
          account_number: settingConfig.account_number,
          account_name: settingConfig.account_name,
          status: 'success',
          transaction_ref: orderId,
        },
      ]);

      if (claimError) throw claimError;

      // Catat juga ke tabel transactions utama
      await supabase.from('transactions').insert([
        {
          user_id: profile.id,
          type: 'income',
          amount: settingConfig.amount,
          category: 'HBD Gift',
          description: `Klaim Hadiah Ulang Tahun via ${settingConfig.payment_method} (${settingConfig.account_number})`,
          date: new Date().toISOString(),
        },
      ]);

      setHasClaimed(true);
      setClaimStatus({
        success: true,
        message: `Berhasil! Dana sebesar Rp ${Number(settingConfig.amount).toLocaleString('id-ID')} telah diproses ke ${settingConfig.payment_method} (${settingConfig.account_number} a.n ${settingConfig.account_name}).`,
        trxId: orderId,
      });

    } catch (error) {
      console.error('Pencairan gagal:', error);
      setClaimStatus({
        success: false,
        message: 'Gagal memproses klaim pembayaran. Silakan coba lagi.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-sky-100 overflow-hidden text-slate-800">
        
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-sky-300/20 rounded-full blur-lg"></div>
          
          <div className="flex justify-center mb-3">
            <FiGift className="text-5xl text-white animate-bounce" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide">Spesial Ulang Tahun!</h1>
          <p className="text-sky-100 text-sm mt-1 flex items-center justify-center gap-1">
            <span>Halo, <span className="font-semibold text-white">{profile?.name || 'Teman Sejati'}</span></span>
            <FiSmile className="text-lg" />
          </p>
        </div>

        <div className="p-6 text-center">
          {!isTimerFinished && !hasClaimed ? (
            <div className="my-4">
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium mb-4">
                <FiClock className="text-sky-500 text-base" />
                <span>Momen spesial akan terbuka dalam:</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Hari', val: timeLeft.days },
                  { label: 'Jam', val: timeLeft.hours },
                  { label: 'Menit', val: timeLeft.minutes },
                  { label: 'Detik', val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="bg-sky-50 border border-sky-100 rounded-2xl p-3 shadow-inner">
                    <span className="block text-2xl font-bold text-sky-600">
                      {String(item.val).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-6 italic">Tunggu sampai timer selesai untuk mengambil kejutanmu!</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 mb-2 text-sky-600 font-semibold text-sm">
                  <FiHeart className="text-rose-500 text-base" />
                  <span>Pesan Spesial:</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {settingConfig?.message}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs text-slate-500">Nominal Hadiah</p>
                  <p className="text-xl font-black text-sky-600">Rp {Number(settingConfig?.amount || 0).toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right flex items-center gap-1.5 px-3 py-1 bg-sky-200/60 text-sky-700 font-semibold rounded-full text-xs">
                  <FiCreditCard />
                  <span>{settingConfig?.payment_method}</span>
                </div>
              </div>

              {claimStatus && (
                <div className={`p-4 rounded-xl text-xs text-left flex items-start gap-3 ${claimStatus.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                  {claimStatus.success ? (
                    <FiCheckCircle className="text-emerald-600 text-xl flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiXCircle className="text-rose-600 text-xl flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{claimStatus.success ? 'Klaim Berhasil' : 'Gagal'}</p>
                    <p className="mt-1">{claimStatus.message}</p>
                  </div>
                </div>
              )}

              {!hasClaimed && (
                <button
                  onClick={handleClaimReward}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-base shadow-lg shadow-sky-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>Memproses Transaksi...</span>
                    </>
                  ) : (
                    <>
                      <FiGift className="text-xl" />
                      <span>AMBIL HADIAH SEKARANG</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
