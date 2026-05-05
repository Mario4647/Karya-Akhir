import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import {
  BiLock, BiUser, BiPencil, BiCheckCircle,
  BiTrash, BiErrorCircle, BiShield
} from 'react-icons/bi';

// ────────────────────────────────────────────
// Signature Canvas
// ────────────────────────────────────────────
const SignaturePad = ({ onSignatureChange }) => {
  const canvasRef     = useRef(null);
  const containerRef  = useRef(null);
  const isDrawingRef  = useRef(false);
  const lastPosRef    = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Inisialisasi ukuran canvas sesuai container
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width  = container.clientWidth;
    canvas.height = 150;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current   = getPos(e);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();

    lastPosRef.current = pos;
    setHasSignature(true);
  }, []);

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    onSignatureChange(canvasRef.current.toDataURL("image/png"));
  }, [onSignatureChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div>
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-gray-300 rounded cursor-crosshair bg-slate-50 shadow-inner"
          style={{ touchAction: "none", display: "block", height: "150px" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">Gambar tanda tangan Anda di dalam kotak</p>
        {hasSignature && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
          >
            <BiTrash />
            Hapus
          </button>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// Main Popup
// ────────────────────────────────────────────
const AccountLockPopup = ({ userId, onLocked }) => {
  const [name,         setName]         = useState("");
  const [signature,    setSignature]    = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const handleSignatureChange = (data) => {
    setSignature(data);
    setHasSignature(!!data);
    if (error) setError("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Nama lengkap tidak boleh kosong");
      return;
    }
    if (!hasSignature) {
      setError("Tanda tangan tidak boleh kosong, silahkan gambar tanda tangan Anda");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          account_locked:           true,
          locked_at:                new Date().toISOString(),
          lock_confirmation_name:   name.trim(),
          lock_signature_data:      signature,
          updated_at:               new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      onLocked();
    } catch (err) {
      console.error("Error locking account:", err);
      setError("Terjadi kesalahan sistem. Silahkan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded border-2 border-gray-200 shadow-[14px_14px_0px_0px_rgba(0,0,0,0.3)] overflow-y-auto max-h-[95vh]">

        {/* Header */}
        <div className="bg-[#4a90e2] px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <BiLock className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Konfirmasi Penguncian Akun</h2>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                Status akun anda akan terkunci untuk melindungi data anda di website ini.
                Silahkan konfirmasi dibawah ini dengan mengisi nama dan tanda tangan.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Warning box */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded p-4 shadow-[3px_3px_0px_0px_rgba(245,158,11,0.15)]">
            <div className="flex gap-2">
              <BiShield className="text-amber-500 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm leading-relaxed">
                Dengan mengklik <strong>"Setuju Kunci"</strong>, akun Anda akan dikunci dan Anda
                tidak akan dapat mengakses halaman lain. Tindakan ini dicatat sebagai
                persetujuan pengamanan data Anda.
              </p>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <BiUser className="inline mr-1.5 text-gray-500" />
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] text-sm"
            />
          </div>

          {/* Signature pad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <BiPencil className="inline mr-1.5 text-gray-500" />
              Tanda Tangan <span className="text-red-500">*</span>
            </label>
            <SignaturePad onSignatureChange={handleSignatureChange} />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded text-red-700 text-sm flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.1)]">
              <BiErrorCircle className="text-base flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-red-500 hover:bg-red-600 active:translate-y-0.5 text-white font-bold rounded border-2 border-red-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Memproses...
              </>
            ) : (
              <>
                <BiLock className="text-lg" />
                Setuju Kunci
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AccountLockPopup;
