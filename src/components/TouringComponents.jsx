import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiAlertCircle, FiCheckCircle,
  FiSettings, FiShare2, FiPlus, FiTrash2, FiEdit2, FiSave,
  FiNavigation, FiUser, FiDroplet, FiArrowUp, FiArrowDown,
  FiRefreshCw, FiEye, FiX, FiChevronUp, FiChevronDown,
  FiZap, FiMenu, FiMap, FiBell, FiList, FiPlay, FiSquare,
  FiHash, FiGlobe, FiMinus, FiInfo
} from "react-icons/fi";
import { MdTwoWheeler, MdDirectionsCar, MdDirectionsWalk } from "react-icons/md";
 
// ─── UTILS ────────────────────────────────────────────────────────────────────
 
export function generateSessionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
 
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
 
export function formatTime(hhmm) {
  if (!hhmm) return "--:--";
  return hhmm;
}
 
export function getStatusColor(status) {
  const map = { pending: "#6B7280", active: "#3B82F6", reached: "#10B981", late: "#EF4444", early: "#F59E0B" };
  return map[status] || "#6B7280";
}
 
// Default kota touring
export const DEFAULT_CHECKPOINTS = [
  { city_name: "Kutoarjo", latitude: -7.7200, longitude: 109.9084, scheduled_time: "07:00" },
  { city_name: "Yogyakarta", latitude: -7.7956, longitude: 110.3695, scheduled_time: "08:30" },
  { city_name: "Klaten", latitude: -7.7059, longitude: 110.6077, scheduled_time: "09:30" },
  { city_name: "Wonogiri", latitude: -7.8126, longitude: 110.9228, scheduled_time: "11:00" },
  { city_name: "Purwantoro", latitude: -7.8717, longitude: 111.3321, scheduled_time: "12:30" },
  { city_name: "Ponorogo", latitude: -7.8683, longitude: 111.4617, scheduled_time: "14:00" },
  { city_name: "Trenggalek", latitude: -8.0501, longitude: 111.7082, scheduled_time: "15:30" },
  { city_name: "Tulungagung", latitude: -8.0661, longitude: 111.9044, scheduled_time: "17:00" },
];
 
// ─── LEAFLET MAP COMPONENT ─────────────────────────────────────────────────────
 
export function TouringMap({ checkpoints, currentLocation, isViewer = false, sessionStatus }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const polylineRef = useRef(null);
 
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const L = window.L;
    if (!L) return;
 
    const startLat = checkpoints[0]?.latitude || -7.7200;
    const startLng = checkpoints[0]?.longitude || 109.9084;
 
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true });
    mapInstanceRef.current = map;
 
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
 
    map.setView([startLat, startLng], 9);
    renderCheckpointMarkers(L, map);
 
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);
 
  const renderCheckpointMarkers = (L, map) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
 
    checkpoints.forEach((cp, i) => {
      const color = cp.status === "reached" ? "#10B981" : cp.status === "active" ? "#3B82F6" : "#6B7280";
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(`<b>${cp.city_name}</b><br>Jadwal: ${cp.scheduled_time || "--:--"}${cp.delay_minutes ? `<br>Delay: ${cp.delay_minutes} menit` : ""}`)
        .addTo(map);
      markersRef.current.push(marker);
    });
 
    // Draw route polyline
    if (polylineRef.current) polylineRef.current.remove();
    const latlngs = checkpoints.map(cp => [cp.latitude, cp.longitude]);
    polylineRef.current = L.polyline(latlngs, { color: "#3B82F6", weight: 3, opacity: 0.7, dashArray: "8,4" }).addTo(map);
  };
 
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;
    renderCheckpointMarkers(L, mapInstanceRef.current);
  }, [checkpoints]);
 
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !currentLocation) return;
 
    if (currentMarkerRef.current) currentMarkerRef.current.remove();
 
    const pulseIcon = L.divIcon({
      html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:40px;height:40px;background:rgba(59,130,246,0.2);border-radius:50%;animation:ping 1.5s infinite"></div>
        <div style="width:20px;height:20px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.6);position:relative;z-index:1"></div>
      </div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
 
    currentMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: pulseIcon })
      .bindPopup("📍 Lokasi Anda Sekarang")
      .addTo(mapInstanceRef.current);
 
    if (sessionStatus === "active") {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 13, { animate: true });
    }
  }, [currentLocation]);
 
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
    </div>
  );
}
 
// ─── CHECKPOINT EDITOR ─────────────────────────────────────────────────────────
 
export function CheckpointEditor({ checkpoints, onChange }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
 
  const startEdit = (cp, idx) => {
    setEditing(idx);
    setForm({ ...cp });
  };
 
  const saveEdit = () => {
    const updated = checkpoints.map((cp, i) => (i === editing ? { ...cp, ...form } : cp));
    onChange(updated);
    setEditing(null);
  };
 
  const addCity = () => {
    onChange([...checkpoints, { city_name: "Kota Baru", latitude: -7.5, longitude: 110.0, scheduled_time: "12:00", status: "pending" }]);
  };
 
  const removeCity = (idx) => {
    onChange(checkpoints.filter((_, i) => i !== idx));
  };
 
  const moveCity = (idx, dir) => {
    const arr = [...checkpoints];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    onChange(arr);
  };
 
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {checkpoints.map((cp, i) => (
        <div key={i} style={{ background: "#1E293B", borderRadius: "10px", padding: "12px", border: "1px solid #334155" }}>
          {editing === i ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Nama Kota</label>
                  <input value={form.city_name || ""} onChange={e => setForm({ ...form, city_name: e.target.value })}
                    style={inputStyle} placeholder="Nama kota" />
                </div>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Jadwal Tiba</label>
                  <input type="time" value={form.scheduled_time || ""} onChange={e => setForm({ ...form, scheduled_time: e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Latitude</label>
                  <input type="number" step="0.0001" value={form.latitude || ""} onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "11px", display: "block", marginBottom: "4px" }}>Longitude</label>
                  <input type="number" step="0.0001" value={form.longitude || ""} onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                    style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button onClick={() => setEditing(null)} style={btnSecondary}><FiX size={14} /></button>
                <button onClick={saveEdit} style={btnPrimary}><FiSave size={14} /> Simpan</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#3B82F6", color: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F1F5F9", fontWeight: "600", fontSize: "14px" }}>{cp.city_name}</div>
                <div style={{ color: "#64748B", fontSize: "11px" }}>
                  <FiClock size={10} style={{ marginRight: "3px" }} />{cp.scheduled_time || "--:--"} &nbsp;|&nbsp; {cp.latitude?.toFixed(4)}, {cp.longitude?.toFixed(4)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => moveCity(i, -1)} style={iconBtn} title="Naik"><FiChevronUp size={14} /></button>
                <button onClick={() => moveCity(i, 1)} style={iconBtn} title="Turun"><FiChevronDown size={14} /></button>
                <button onClick={() => startEdit(cp, i)} style={iconBtn} title="Edit"><FiEdit2 size={14} /></button>
                <button onClick={() => removeCity(i)} style={{ ...iconBtn, color: "#EF4444" }} title="Hapus"><FiTrash2 size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={addCity} style={{ ...btnPrimary, marginTop: "4px", justifyContent: "center" }}>
        <FiPlus size={14} /> Tambah Kota
      </button>
    </div>
  );
}
 
// ─── NOTIFICATION PANEL ────────────────────────────────────────────────────────
 
export function NotificationPanel({ notifications, onClose }) {
  return (
    <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, width: "320px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {notifications.map((n, i) => (
        <div key={n.id || i} style={{
          background: n.type === "late" ? "#7F1D1D" : n.type === "early" ? "#78350F" : "#064E3B",
          border: `1px solid ${n.type === "late" ? "#EF4444" : n.type === "early" ? "#F59E0B" : "#10B981"}`,
          borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "slideIn 0.3s ease"
        }}>
          {n.type === "late" ? <FiArrowDown size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: "2px" }} /> :
            n.type === "early" ? <FiArrowUp size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} /> :
              <FiCheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: "2px" }} />}
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{n.message}</div>
            <div style={{ color: "#94A3B8", fontSize: "11px", marginTop: "2px" }}>{n.created_at ? new Date(n.created_at).toLocaleTimeString("id-ID") : ""}</div>
          </div>
          <button onClick={() => onClose(n.id || i)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: "0" }}><FiX size={14} /></button>
        </div>
      ))}
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}
 
// ─── DELAY MODAL ───────────────────────────────────────────────────────────────
 
export function DelayModal({ checkpoint, onSubmit, onClose }) {
  const [type, setType] = useState("late");
  const [minutes, setMinutes] = useState(10);
 
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000 }}>
      <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "16px", padding: "24px", width: "340px" }}>
        <div style={{ color: "#F1F5F9", fontWeight: "700", fontSize: "18px", marginBottom: "8px" }}>
          <FiBell size={18} style={{ marginRight: "8px", color: "#3B82F6" }} />
          Lapor Keterlambatan / Lebih Awal
        </div>
        <div style={{ color: "#64748B", fontSize: "13px", marginBottom: "20px" }}>
          Checkpoint: <b style={{ color: "#94A3B8" }}>{checkpoint?.city_name}</b>
        </div>
 
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setType("late")}
            style={{ ...toggleBtn, background: type === "late" ? "#7F1D1D" : "#1E293B", borderColor: type === "late" ? "#EF4444" : "#334155", color: type === "late" ? "#FCA5A5" : "#64748B" }}>
            <FiArrowDown size={14} /> Telat
          </button>
          <button onClick={() => setType("early")}
            style={{ ...toggleBtn, background: type === "early" ? "#78350F" : "#1E293B", borderColor: type === "early" ? "#F59E0B" : "#334155", color: type === "early" ? "#FDE68A" : "#64748B" }}>
            <FiArrowUp size={14} /> Awal
          </button>
        </div>
 
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "8px" }}>Jumlah Menit</label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setMinutes(m => Math.max(1, m - 5))} style={iconBtn}><FiMinus size={16} /></button>
            <input type="number" value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)}
              style={{ ...inputStyle, textAlign: "center", width: "80px", fontSize: "20px", fontWeight: "700" }} min={1} />
            <button onClick={() => setMinutes(m => m + 5)} style={iconBtn}><FiPlus size={16} /></button>
          </div>
        </div>
 
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary}><FiX size={14} /> Batal</button>
          <button onClick={() => onSubmit(type, minutes)} style={type === "late" ? { ...btnPrimary, background: "#DC2626" } : { ...btnPrimary, background: "#D97706" }}>
            <FiSave size={14} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── TRANSPORT FORM ────────────────────────────────────────────────────────────
 
export function TransportForm({ data, onChange }) {
  const transports = [
    { value: "motor", label: "Motor", icon: <MdTwoWheeler size={20} /> },
    { value: "mobil", label: "Mobil", icon: <MdDirectionsCar size={20} /> },
    { value: "jalan", label: "Jalan Kaki", icon: <MdDirectionsWalk size={20} /> },
  ];
 
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "8px" }}>Moda Transportasi</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {transports.map(t => (
            <button key={t.value} onClick={() => onChange({ ...data, transport_type: t.value })}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "12px", borderRadius: "10px", border: `2px solid ${data.transport_type === t.value ? "#3B82F6" : "#334155"}`, background: data.transport_type === t.value ? "rgba(59,130,246,0.15)" : "#1E293B", color: data.transport_type === t.value ? "#60A5FA" : "#64748B", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>
 
      {data.transport_type !== "jalan" && (
        <>
          <div>
            <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}><FiHash size={11} style={{ marginRight: "4px" }} />Nomor Plat</label>
            <input value={data.plate_number || ""} onChange={e => onChange({ ...data, plate_number: e.target.value })}
              style={inputStyle} placeholder="cth: AB 1234 CD" />
          </div>
          <div>
            <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}><FiDroplet size={11} style={{ marginRight: "4px" }} />Jumlah Bensin (Liter)</label>
            <input type="number" step="0.5" value={data.fuel_liters || ""} onChange={e => onChange({ ...data, fuel_liters: parseFloat(e.target.value) })}
              style={inputStyle} placeholder="cth: 5.5" />
          </div>
        </>
      )}
 
      <div>
        <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}><FiUser size={11} style={{ marginRight: "4px" }} />Nama Pengemudi / Pemimpin</label>
        <input value={data.driver_name || ""} onChange={e => onChange({ ...data, driver_name: e.target.value })}
          style={inputStyle} placeholder="Nama lengkap" />
      </div>
    </div>
  );
}
 
// ─── CHECKPOINT STATUS LIST ────────────────────────────────────────────────────
 
export function CheckpointStatusList({ checkpoints, currentLocation, isInteractive = false, onMarkReached, onReportDelay }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {checkpoints.map((cp, i) => {
        const dist = currentLocation ? getDistanceKm(currentLocation.lat, currentLocation.lng, cp.latitude, cp.longitude) : null;
        const color = cp.status === "reached" ? "#10B981" : cp.status === "active" ? "#3B82F6" : "#475569";
 
        return (
          <div key={cp.id || i} style={{ background: "#1E293B", borderRadius: "10px", padding: "12px", border: `1px solid ${cp.status === "reached" ? "#065F46" : cp.status === "active" ? "#1D4ED8" : "#334155"}`, transition: "all 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {cp.status === "reached" ? <FiCheckCircle size={16} color="white" /> : <span style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F1F5F9", fontWeight: "600", fontSize: "14px" }}>{cp.city_name}</div>
                <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                  <span style={{ color: "#64748B", fontSize: "11px" }}><FiClock size={10} /> {cp.scheduled_time}</span>
                  {dist !== null && <span style={{ color: "#64748B", fontSize: "11px" }}><FiMapPin size={10} /> {dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`}</span>}
                  {cp.delay_minutes !== 0 && cp.delay_minutes != null && (
                    <span style={{ color: cp.delay_minutes > 0 ? "#FCA5A5" : "#FDE68A", fontSize: "11px" }}>
                      {cp.delay_minutes > 0 ? <FiArrowDown size={10} /> : <FiArrowUp size={10} />}
                      {Math.abs(cp.delay_minutes)} mnt
                    </span>
                  )}
                </div>
              </div>
              {isInteractive && cp.status !== "reached" && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => onReportDelay(cp)} style={{ ...iconBtn, fontSize: "10px", padding: "4px 8px", borderRadius: "6px" }} title="Lapor Telat/Awal">
                    <FiBell size={12} />
                  </button>
                  <button onClick={() => onMarkReached(cp, i)} style={{ ...iconBtn, color: "#10B981", fontSize: "10px", padding: "4px 8px", borderRadius: "6px" }} title="Tandai Tiba">
                    <FiCheckCircle size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
 
// ─── SHARE PANEL ───────────────────────────────────────────────────────────────
 
export function SharePanel({ sessionCode, onClose }) {
  const viewUrl = `${window.location.origin}${window.location.pathname}?view=${sessionCode}`;
  const [copied, setCopied] = useState(false);
 
  const copy = async () => {
    await navigator.clipboard.writeText(viewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
 
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000 }}>
      <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "16px", padding: "28px", width: "400px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ color: "#F1F5F9", fontWeight: "700", fontSize: "18px" }}><FiShare2 size={18} style={{ marginRight: "8px", color: "#3B82F6" }} />Bagikan Lokasi</div>
          <button onClick={onClose} style={{ ...iconBtn }}><FiX size={18} /></button>
        </div>
 
        <div style={{ background: "#1E293B", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ color: "#64748B", fontSize: "11px", marginBottom: "8px" }}>KODE SESI</div>
          <div style={{ color: "#60A5FA", fontSize: "28px", fontWeight: "800", letterSpacing: "6px", fontFamily: "monospace" }}>{sessionCode}</div>
        </div>
 
        <div style={{ background: "#1E293B", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
          <div style={{ color: "#64748B", fontSize: "11px", marginBottom: "6px" }}>LINK PEMANTAU</div>
          <div style={{ color: "#94A3B8", fontSize: "12px", wordBreak: "break-all" }}>{viewUrl}</div>
        </div>
 
        <button onClick={copy} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>
          {copied ? <><FiCheckCircle size={14} /> Tersalin!</> : <><FiShare2 size={14} /> Salin Link Pemantau</>}
        </button>
        <div style={{ color: "#475569", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
          <FiInfo size={10} style={{ marginRight: "4px" }} />
          Bagikan link ini kepada orang yang ingin memantau perjalanan Anda
        </div>
      </div>
    </div>
  );
}
 
// ─── STYLES ───────────────────────────────────────────────────────────────────
 
const inputStyle = {
  background: "#0F172A", border: "1px solid #334155", borderRadius: "8px",
  color: "#F1F5F9", padding: "8px 12px", fontSize: "13px", width: "100%",
  outline: "none", boxSizing: "border-box"
};
 
export const btnPrimary = {
  display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
  background: "#3B82F6", color: "white", border: "none", borderRadius: "8px",
  cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s"
};
 
const btnSecondary = {
  display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
  background: "#1E293B", color: "#94A3B8", border: "1px solid #334155", borderRadius: "8px",
  cursor: "pointer", fontSize: "13px", fontWeight: "600"
};
 
const iconBtn = {
  background: "#1E293B", border: "1px solid #334155", borderRadius: "6px",
  color: "#94A3B8", cursor: "pointer", padding: "6px 8px", display: "flex",
  alignItems: "center", gap: "4px", fontSize: "12px"
};
 
const toggleBtn = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  padding: "10px", borderRadius: "8px", border: "2px solid", cursor: "pointer",
  fontSize: "13px", fontWeight: "600", transition: "all 0.2s"
};
 
export { inputStyle, btnSecondary, iconBtn };
