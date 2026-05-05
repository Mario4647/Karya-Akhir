import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  BiLock, BiLockOpen, BiUser, BiEnvelope, BiTime,
  BiSearch, BiRefresh, BiShield, BiX, BiErrorCircle,
} from 'react-icons/bi';

// ────────────────────────────────────────────
// Signature Preview Modal
// ────────────────────────────────────────────
const SignatureModal = ({ data, onClose }) => (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded border-2 border-gray-200 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] p-6 w-full max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">Tanda Tangan</h3>
          <p className="text-sm text-gray-500">{data.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border-2 border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <BiX className="text-gray-500" />
        </button>
      </div>
      <div className="border-2 border-gray-200 rounded overflow-hidden bg-slate-50">
        <img
          src={data.signature}
          alt="Tanda tangan"
          className="w-full object-contain"
        />
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Nama konfirmasi: <span className="font-semibold text-gray-600">{data.confirmName}</span>
      </p>
    </div>
  </div>
);

// ────────────────────────────────────────────
// Main Admin Page
// ────────────────────────────────────────────
const AdminAccountLocks = () => {
  const [accounts,          setAccounts]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [unlocking,         setUnlocking]         = useState(null);
  const [search,            setSearch]            = useState("");
  const [signaturePreview,  setSignaturePreview]  = useState(null);
  const [toast,             setToast]             = useState(null);

  // ── Fetch locked accounts ────────────────
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, locked_at, lock_confirmation_name, lock_signature_data")
        .eq("roles", "user-raport")
        .eq("account_locked", true)
        .order("locked_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      showToast("Gagal memuat data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  // ── Toast helper ─────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Unlock handler ───────────────────────
  const handleUnlock = async (userId, email) => {
    if (!window.confirm(`Buka kunci akun ${email}?\n\nAkun akan bisa diakses kembali oleh pemiliknya.`)) return;

    setUnlocking(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          account_locked:         false,
          locked_at:              null,
          lock_confirmation_name: null,
          lock_signature_data:    null,
          updated_at:             new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      setAccounts((prev) => prev.filter((a) => a.id !== userId));
      showToast(`✅ Akun ${email} berhasil dibuka kuncinya`);
    } catch (err) {
      showToast("Gagal membuka kunci: " + err.message, "error");
    } finally {
      setUnlocking(null);
    }
  };

  // ── Filter ───────────────────────────────
  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.email               || "").toLowerCase().includes(q) ||
      (a.name                || "").toLowerCase().includes(q) ||
      (a.lock_confirmation_name || "").toLowerCase().includes(q)
    );
  });

  // ── Date formatter ───────────────────────
  const fmtDate = (str) => {
    if (!str) return "-";
    return new Date(str).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#faf7f2] p-4 md:p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] text-sm font-medium transition-all flex items-center gap-2 ${
          toast.type === "error"
            ? "bg-red-50 border-red-300 text-red-800"
            : "bg-green-50 border-green-300 text-green-800"
        }`}>
          {toast.type === "error" ? <BiErrorCircle className="text-base" /> : "✅"}
          {toast.msg}
        </div>
      )}

      {/* Signature modal */}
      {signaturePreview && (
        <SignatureModal
          data={signaturePreview}
          onClose={() => setSignaturePreview(null)}
        />
      )}

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#4a90e2] rounded border-2 border-[#357abd] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center">
            <BiShield className="text-white text-lg" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manajemen Kunci Akun</h1>
        </div>
        <p className="text-gray-500 text-sm ml-13 pl-1">
          Kelola akun siswa (user-raport) yang telah dikunci
        </p>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border-2 border-gray-200 rounded shadow-[5px_5px_0px_0px_rgba(0,0,0,0.12)] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center flex-shrink-0">
            <BiLock className="text-xl text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{accounts.length}</p>
            <p className="text-xs text-gray-500">Total Akun Terkunci</p>
          </div>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded shadow-[5px_5px_0px_0px_rgba(0,0,0,0.12)] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center flex-shrink-0">
            <BiLockOpen className="text-xl text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {search ? filtered.length : accounts.length}
            </p>
            <p className="text-xs text-gray-500">Ditampilkan</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border-2 border-gray-200 rounded shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b-2 border-gray-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email..."
              className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded focus:border-[#4a90e2] outline-none text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)] transition-colors"
            />
          </div>
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] transition-all disabled:opacity-60 whitespace-nowrap"
          >
            <BiRefresh className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Table content */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BiLockOpen className="text-6xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {search ? "Tidak ada hasil yang cocok" : "Tidak ada akun yang terkunci"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-sm text-[#4a90e2] hover:underline"
              >
                Hapus filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-10">No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1"><BiUser />Nama</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1"><BiEnvelope />Email</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Nama Konfirmasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1"><BiTime />Tanggal &amp; Jam Dikunci</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tanda Tangan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((acc, idx) => (
                  <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-medium">{idx + 1}</td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#4a90e2]/10 border border-[#4a90e2]/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <BiUser className="text-[#4a90e2] text-xs" />
                        </div>
                        <span className="font-medium text-gray-800">{acc.name || "-"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600">{acc.email}</td>

                    <td className="px-4 py-3.5 text-gray-600">
                      {acc.lock_confirmation_name || (
                        <span className="text-gray-300 text-xs italic">tidak ada</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-gray-600">{fmtDate(acc.locked_at)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {acc.lock_signature_data ? (
                        <button
                          onClick={() => setSignaturePreview({
                            name:        acc.name || acc.email,
                            confirmName: acc.lock_confirmation_name,
                            signature:   acc.lock_signature_data,
                          })}
                          className="px-2.5 py-1 text-xs text-[#4a90e2] border border-[#4a90e2]/40 rounded hover:bg-[#4a90e2]/5 transition-colors font-medium"
                        >
                          Lihat TTD
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs italic">tidak ada</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleUnlock(acc.id, acc.email)}
                        disabled={unlocking === acc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 active:translate-y-px text-white text-xs font-semibold rounded border-2 border-green-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {unlocking === acc.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <BiLockOpen className="text-sm" />
                        )}
                        Buka Kunci
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
            Menampilkan {filtered.length} dari {accounts.length} akun terkunci
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccountLocks;
