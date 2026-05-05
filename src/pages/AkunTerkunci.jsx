import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { BiLock, BiLogOut, BiShield, BiCheckCircle } from 'react-icons/bi';

const AkunTerkunci = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <BiLock
            key={i}
            className="absolute text-gray-800"
            style={{
              top:  `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${24 + Math.random() * 24}px`,
              transform: `rotate(${Math.random() * 30 - 15}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 bg-white w-full max-w-md border-2 border-gray-200 rounded shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden">

        {/* Top accent bar */}
        <div className="h-2 bg-[#4a90e2]" />

        <div className="p-8 text-center">

          {/* Lock icon */}
          <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.15)]">
            <BiLock className="text-4xl text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Akun Terkunci</h1>

          {/* Main message */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded p-5 mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)] text-left">
            <p className="text-gray-700 leading-relaxed text-sm">
              Akun anda saat ini telah dikunci dikarenakan status siswa anda telah dinyatakan{" "}
              <span className="font-bold text-green-600 text-base">LULUS</span>,
              data anda telah terlindungi di website ini.
            </p>
          </div>

          {/* Info points */}
          <div className="space-y-2 mb-7">
            {[
              "Data Anda aman dan tidak dapat diakses pihak lain",
              "Hubungi admin jika membutuhkan bantuan",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                <BiCheckCircle className="text-green-500 flex-shrink-0 text-base" />
                {text}
              </div>
            ))}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full py-3 bg-[#4a90e2] hover:bg-[#357abd] active:translate-y-0.5 text-white font-semibold rounded border-2 border-[#2d6da3] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Keluar...
              </>
            ) : (
              <>
                <BiLogOut className="text-lg" />
                Logout
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="text-xs text-gray-400 mt-5 flex items-center justify-center gap-1">
            <BiShield />
            Sistem mengenkripsi data untuk keamanan akun Anda
          </p>
        </div>
      </div>
    </div>
  );
};

export default AkunTerkunci;
