// TouringPage.jsx
// Halaman Utama Touring Tracker - Atur dan Jalankan Sistem
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiAlertCircle, FiCheckCircle,
  FiSettings, FiShare2, FiPlus, FiTrash2, FiEdit2, FiSave,
  FiNavigation, FiUser, FiDroplet, FiArrowUp, FiArrowDown,
  FiRefreshCw, FiEye, FiX, FiChevronUp, FiChevronDown,
  FiZap, FiMenu, FiMap, FiBell, FiList, FiPlay, FiSquare,
  FiHash, FiGlobe, FiMinus, FiInfo, FiLink, FiEyeOff
} from "react-icons/fi";
import { MdTwoWheeler, MdDirectionsCar, MdDirectionsWalk } from "react-icons/md";

// ─── UTILS ────────────────────────────────────────────────────────────────────

function generateSessionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
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

function formatTime(hhmm) {
  if (!hhmm) return "--:--";
  return hhmm;
}

const DEFAULT_CHECKPOINTS = [
  { city_name: "Kutoarjo", latitude: -7.7200, longitude: 109.9084, scheduled_time: "07:00" },
  { city_name: "Yogyakarta", latitude: -7.7956, longitude: 110.3695, scheduled_time: "08:30" },
  { city_name: "Klaten", latitude: -7.7059, longitude: 110.6077, scheduled_time: "09:30" },
  { city_name: "Wonogiri", latitude: -7.8126, longitude: 110.9228, scheduled_time: "11:00" },
  { city_name: "Purwantoro", latitude: -7.8717, longitude: 111.3321, scheduled_time: "12:30" },
  { city_name: "Ponorogo", latitude: -7.8683, longitude: 111.4617, scheduled_time: "14:00" },
  { city_name: "Trenggalek", latitude: -8.0501, longitude: 111.7082, scheduled_time: "15:30" },
  { city_name: "Tulungagung", latitude: -8.0661, longitude: 111.9044, scheduled_time: "17:00" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const inputStyle = {
  background: "#0F172A",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#F1F5F9",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};

const btnPrimary = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 20px",
  background: "#3B82F6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
  transition: "all 0.2s"
};

const btnSecondary = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 20px",
  background: "#1E293B",
  color: "#94A3B8",
  border: "1px solid #334155",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
  transition: "all 0.2s"
};

const iconBtn = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "6px",
  color: "#94A3B8",
  cursor: "pointer",
  padding: "6px 8px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "12px",
  transition: "all 0.2s"
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TouringPage() {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);
  const [transport, setTransport] = useState({ transport_type: "motor", plate_number: "", driver_name: "", fuel_liters: 5 });
  const [currentLocation, setCurrentLocation] = useState({ lat: -7.7200, lng: 109.9084 });
  const [sessionStatus, setSessionStatus] = useState("pending");
  const [isTracking, setIsTracking] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [showSettings, setShowSettings] = useState(true);
  const [editingCheckpoint, setEditingCheckpoint] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [manualDelay, setManualDelay] = useState({ type: "late", minutes: 10 });
  
  const watchIdRef = useRef(null);
  const notificationIdRef = useRef(0);
  const sessionIdRef = useRef(null);

  // ─── FUNGSI ──────────────────────────────────────────────────────────────────

  // Load atau buat session
  const loadOrCreateSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Cek session aktif di localStorage
      const savedSession = localStorage.getItem("touring_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const { data, error } = await supabase
          .from("touring_sessions")
          .select("*, touring_checkpoints(*)")
          .eq("id", parsed.id)
          .single();
        
        if (!error && data) {
          setSession(data);
          setSessionCode(data.session_code);
          setSessionStatus(data.status);
          setTransport({
            transport_type: data.transport_type,
            plate_number: data.plate_number || "",
            driver_name: data.driver_name || "",
            fuel_liters: data.fuel_liters || 5
          });
          if (data.touring_checkpoints) {
            const sorted = data.touring_checkpoints.sort((a, b) => a.order_index - b.order_index);
            setCheckpoints(sorted);
          }
          sessionIdRef.current = data.id;
          setIsLoading(false);
          return;
        }
      }

      // Buat session baru
      const code = generateSessionCode();
      const { data: newSession, error: createError } = await supabase
        .from("touring_sessions")
        .insert({
          session_code: code,
          title: "Touring Session",
          transport_type: transport.transport_type,
          plate_number: transport.plate_number,
          driver_name: transport.driver_name,
          fuel_liters: transport.fuel_liters,
          status: "pending"
        })
        .select()
        .single();

      if (createError) throw createError;

      // Insert checkpoints
      const checkpointsData = DEFAULT_CHECKPOINTS.map((cp, i) => ({
        session_id: newSession.id,
        order_index: i,
        city_name: cp.city_name,
        latitude: cp.latitude,
        longitude: cp.longitude,
        scheduled_time: cp.scheduled_time,
        status: "pending"
      }));

      const { error: cpError } = await supabase
        .from("touring_checkpoints")
        .insert(checkpointsData);

      if (cpError) throw cpError;

      setSession(newSession);
      setSessionCode(code);
      sessionIdRef.current = newSession.id;
      localStorage.setItem("touring_session", JSON.stringify({ id: newSession.id, code }));
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [transport]);

  // Simpan perubahan ke database
  const saveToDatabase = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      // Update session
      await supabase
        .from("touring_sessions")
        .update({
          transport_type: transport.transport_type,
          plate_number: transport.plate_number,
          driver_name: transport.driver_name,
          fuel_liters: transport.fuel_liters,
          status: sessionStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionIdRef.current);

      // Update checkpoints
      for (const cp of checkpoints) {
        await supabase
          .from("touring_checkpoints")
          .update({
            city_name: cp.city_name,
            latitude: cp.latitude,
            longitude: cp.longitude,
            scheduled_time: cp.scheduled_time,
            order_index: checkpoints.indexOf(cp),
            status: cp.status || "pending",
            delay_minutes: cp.delay_minutes || 0
          })
          .eq("id", cp.id)
          .eq("session_id", sessionIdRef.current);
      }
    } catch (error) {
      console.error("Error saving to database:", error);
    }
  }, [checkpoints, transport, sessionStatus]);

  // Tracking lokasi
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation");
      return;
    }

    setIsTracking(true);
    setSessionStatus("active");

    // Update status di database
    supabase
      .from("touring_sessions")
      .update({ status: "active" })
      .eq("id", sessionIdRef.current)
      .then(() => saveToDatabase());

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Simpan tracking ke database
        await supabase
          .from("touring_location_tracking")
          .insert({
            session_id: sessionIdRef.current,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0
          });

        // Cek checkpoint terdekat
        checkForCheckpoint(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [saveToDatabase, checkpoints]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setSessionStatus("pending");
    
    supabase
      .from("touring_sessions")
      .update({ status: "pending" })
      .eq("id", sessionIdRef.current)
      .then(() => saveToDatabase());
  }, [saveToDatabase]);

  // Cek checkpoint
  const checkForCheckpoint = useCallback((lat, lng) => {
    const threshold = 0.5; // 500 meter
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    checkpoints.forEach((cp, index) => {
      if (cp.status === "reached") return;
      
      const dist = getDistanceKm(lat, lng, cp.latitude, cp.longitude);
      if (dist < threshold) {
        // Tandai reached
        const updated = [...checkpoints];
        updated[index] = { ...cp, status: "reached", actual_arrival_time: now.toISOString() };
        setCheckpoints(updated);

        // Hitung delay
        if (cp.scheduled_time) {
          const [h, m] = cp.scheduled_time.split(":").map(Number);
          const scheduledMinutes = h * 60 + m;
          const delay = currentMinutes - scheduledMinutes;
          updated[index].delay_minutes = delay;
          setCheckpoints(updated);

          // Kirim notifikasi
          if (delay > 5) {
            addNotification("late", `Telat ${delay} menit di ${cp.city_name}`, delay);
          } else if (delay < -5) {
            addNotification("early", `Lebih awal ${Math.abs(delay)} menit di ${cp.city_name}`, delay);
          } else {
            addNotification("arrived", `Tiba tepat waktu di ${cp.city_name}`, 0);
          }
        }

        saveToDatabase();
      }
    });
  }, [checkpoints, saveToDatabase]);

  // Notifikasi
  const addNotification = useCallback((type, message, minutes) => {
    const id = notificationIdRef.current++;
    setNotifications(prev => [{ id, type, message, minutes, created_at: new Date().toISOString() }, ...prev].slice(0, 10));

    // Simpan ke database
    supabase
      .from("touring_notifications")
      .insert({
        session_id: sessionIdRef.current,
        checkpoint_id: selectedCheckpoint?.id || null,
        type,
        minutes,
        message
      })
      .then(() => {});
  }, [selectedCheckpoint]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Manual delay/early
  const handleManualDelay = useCallback((cp, type, minutes) => {
    const updated = checkpoints.map(c => {
      if (c.id === cp.id) {
        return { ...c, delay_minutes: type === "late" ? minutes : -minutes };
      }
      return c;
    });
    setCheckpoints(updated);
    setShowDelayModal(false);
    setSelectedCheckpoint(null);
    
    const message = type === "late" 
      ? `Telat ${minutes} menit di ${cp.city_name} (manual)` 
      : `Lebih awal ${minutes} menit di ${cp.city_name} (manual)`;
    addNotification(type, message, minutes);
    saveToDatabase();
  }, [checkpoints, addNotification, saveToDatabase]);

  // Edit checkpoint
  const startEditCheckpoint = useCallback((cp, index) => {
    setEditingCheckpoint(index);
    setEditForm({ ...cp });
  }, []);

  const saveEditCheckpoint = useCallback(() => {
    const updated = [...checkpoints];
    updated[editingCheckpoint] = { ...editForm };
    setCheckpoints(updated);
    setEditingCheckpoint(null);
    setEditForm({});
    saveToDatabase();
  }, [editingCheckpoint, editForm, checkpoints, saveToDatabase]);

  // Tambah/hapus/move checkpoint
  const addCheckpoint = useCallback(() => {
    const newCp = { 
      city_name: "Kota Baru", 
      latitude: -7.5, 
      longitude: 110.0, 
      scheduled_time: "12:00", 
      status: "pending" 
    };
    setCheckpoints([...checkpoints, newCp]);
    saveToDatabase();
  }, [checkpoints, saveToDatabase]);

  const removeCheckpoint = useCallback((index) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
    saveToDatabase();
  }, [checkpoints, saveToDatabase]);

  const moveCheckpoint = useCallback((index, direction) => {
    const arr = [...checkpoints];
    const swap = index + direction;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    setCheckpoints(arr);
    saveToDatabase();
  }, [checkpoints, saveToDatabase]);

  // Share panel
  const shareLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?view=${sessionCode}`;
    return url;
  }, [sessionCode]);

  const copyLink = useCallback(async () => {
    const url = shareLink();
    await navigator.clipboard.writeText(url);
    alert("Link pemantau berhasil disalin!");
  }, [shareLink]);

  // ─── INIT ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadOrCreateSession();
  }, [loadOrCreateSession]);

  useEffect(() => {
    // Cek view mode dari URL
    const params = new URLSearchParams(window.location.search);
    const viewCode = params.get("view");
    if (viewCode) {
      // Redirect ke halaman view
      window.location.href = `/touring-view?code=${viewCode}`;
    }
  }, []);

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Memuat session...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <FiMapPin size={24} color="#3B82F6" />
          <h1 style={styles.headerTitle}>Touring Tracker</h1>
          <span style={styles.sessionBadge}>#{sessionCode}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.statusBadge, background: sessionStatus === "active" ? "#065F46" : "#1E293B", color: sessionStatus === "active" ? "#6EE7B7" : "#94A3B8" }}>
            {sessionStatus === "active" ? <FiZap size={12} /> : <FiClock size={12} />}
            {sessionStatus === "active" ? "Sedang Berjalan" : "Belum Mulai"}
          </span>
          <button onClick={() => setShowSharePanel(true)} style={btnPrimary}>
            <FiShare2 size={14} /> Bagikan
          </button>
          <button onClick={() => setShowSettings(!showSettings)} style={{ ...iconBtn, padding: "8px 12px" }}>
            <FiSettings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Sidebar Settings */}
        {showSettings && (
          <aside style={styles.sidebar}>
            <div style={styles.sidebarContent}>
              {/* Transport Form */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}><FiTruck size={14} /> Transportasi</h3>
                <div style={styles.transportGrid}>
                  {[
                    { value: "motor", label: "Motor", icon: <MdTwoWheeler size={20} /> },
                    { value: "mobil", label: "Mobil", icon: <MdDirectionsCar size={20} /> },
                    { value: "jalan", label: "Jalan Kaki", icon: <MdDirectionsWalk size={20} /> }
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTransport({ ...transport, transport_type: t.value })}
                      style={{
                        ...styles.transportBtn,
                        borderColor: transport.transport_type === t.value ? "#3B82F6" : "#334155",
                        background: transport.transport_type === t.value ? "rgba(59,130,246,0.15)" : "#1E293B",
                        color: transport.transport_type === t.value ? "#60A5FA" : "#64748B"
                      }}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
                {transport.transport_type !== "jalan" && (
                  <>
                    <input
                      value={transport.plate_number}
                      onChange={e => setTransport({ ...transport, plate_number: e.target.value })}
                      style={inputStyle}
                      placeholder="Nomor Plat"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={transport.fuel_liters}
                      onChange={e => setTransport({ ...transport, fuel_liters: parseFloat(e.target.value) })}
                      style={inputStyle}
                      placeholder="Jumlah Bensin (Liter)"
                    />
                  </>
                )}
                <input
                  value={transport.driver_name}
                  onChange={e => setTransport({ ...transport, driver_name: e.target.value })}
                  style={inputStyle}
                  placeholder="Nama Pengemudi"
                />
                <button onClick={saveToDatabase} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>
                  <FiSave size={14} /> Simpan Data
                </button>
              </div>

              {/* Checkpoints Editor */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}><FiMap size={14} /> Rute & Jadwal</h3>
                <div style={styles.checkpointList}>
                  {checkpoints.map((cp, i) => (
                    <div key={i} style={styles.checkpointItem}>
                      {editingCheckpoint === i ? (
                        <div style={styles.editForm}>
                          <input
                            value={editForm.city_name || ""}
                            onChange={e => setEditForm({ ...editForm, city_name: e.target.value })}
                            style={inputStyle}
                            placeholder="Nama Kota"
                          />
                          <input
                            type="time"
                            value={editForm.scheduled_time || ""}
                            onChange={e => setEditForm({ ...editForm, scheduled_time: e.target.value })}
                            style={inputStyle}
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.latitude || ""}
                            onChange={e => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) })}
                            style={inputStyle}
                            placeholder="Latitude"
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.longitude || ""}
                            onChange={e => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) })}
                            style={inputStyle}
                            placeholder="Longitude"
                          />
                          <div style={styles.editActions}>
                            <button onClick={() => setEditingCheckpoint(null)} style={btnSecondary}>Batal</button>
                            <button onClick={saveEditCheckpoint} style={btnPrimary}>Simpan</button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.checkpointRow}>
                          <div style={styles.checkpointNumber}>{i + 1}</div>
                          <div style={styles.checkpointInfo}>
                            <div style={styles.checkpointName}>{cp.city_name}</div>
                            <div style={styles.checkpointTime}>
                              <FiClock size={10} /> {formatTime(cp.scheduled_time)}
                              {cp.delay_minutes !== 0 && cp.delay_minutes != null && (
                                <span style={{ color: cp.delay_minutes > 0 ? "#FCA5A5" : "#FDE68A", marginLeft: "8px" }}>
                                  {cp.delay_minutes > 0 ? <FiArrowDown size={10} /> : <FiArrowUp size={10} />}
                                  {Math.abs(cp.delay_minutes)}mnt
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={styles.checkpointActions}>
                            <button onClick={() => moveCheckpoint(i, -1)} style={iconBtn}><FiChevronUp size={12} /></button>
                            <button onClick={() => moveCheckpoint(i, 1)} style={iconBtn}><FiChevronDown size={12} /></button>
                            <button onClick={() => startEditCheckpoint(cp, i)} style={iconBtn}><FiEdit2 size={12} /></button>
                            <button onClick={() => removeCheckpoint(i)} style={{ ...iconBtn, color: "#EF4444" }}><FiTrash2 size={12} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addCheckpoint} style={{ ...btnSecondary, width: "100%", justifyContent: "center" }}>
                  <FiPlus size={14} /> Tambah Kota
                </button>
              </div>

              {/* Control Buttons */}
              <div style={styles.section}>
                {!isTracking ? (
                  <button onClick={startTracking} style={{ ...btnPrimary, width: "100%", justifyContent: "center", background: "#10B981" }}>
                    <FiPlay size={14} /> Mulai Perjalanan
                  </button>
                ) : (
                  <button onClick={stopTracking} style={{ ...btnPrimary, width: "100%", justifyContent: "center", background: "#EF4444" }}>
                    <FiSquare size={14} /> Hentikan Perjalanan
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Map Area */}
        <div style={styles.mapContainer}>
          <TouringMap
            checkpoints={checkpoints}
            currentLocation={currentLocation}
            sessionStatus={sessionStatus}
            onReportDelay={(cp) => {
              setSelectedCheckpoint(cp);
              setShowDelayModal(true);
            }}
            onMarkReached={(cp) => {
              const updated = checkpoints.map(c => {
                if (c.id === cp.id) {
                  return { ...c, status: "reached", actual_arrival_time: new Date().toISOString() };
                }
                return c;
              });
              setCheckpoints(updated);
              saveToDatabase();
            }}
            isTracking={isTracking}
          />
        </div>
      </div>

      {/* Notification Panel */}
      {notifications.length > 0 && (
        <div style={styles.notificationPanel}>
          {notifications.map(n => (
            <div key={n.id} style={{
              ...styles.notificationItem,
              borderColor: n.type === "late" ? "#EF4444" : n.type === "early" ? "#F59E0B" : "#10B981"
            }}>
              {n.type === "late" ? <FiArrowDown color="#EF4444" /> :
               n.type === "early" ? <FiArrowUp color="#F59E0B" /> :
               <FiCheckCircle color="#10B981" />}
              <span style={styles.notificationMessage}>{n.message}</span>
              <button onClick={() => removeNotification(n.id)} style={styles.notificationClose}>
                <FiX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delay Modal */}
      {showDelayModal && selectedCheckpoint && (
        <DelayModal
          checkpoint={selectedCheckpoint}
          onClose={() => { setShowDelayModal(false); setSelectedCheckpoint(null); }}
          onSubmit={(type, minutes) => handleManualDelay(selectedCheckpoint, type, minutes)}
        />
      )}

      {/* Share Panel */}
      {showSharePanel && (
        <SharePanel
          sessionCode={sessionCode}
          onClose={() => setShowSharePanel(false)}
          onCopy={copyLink}
          shareUrl={shareLink()}
        />
      )}
    </div>
  );
}

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────

function TouringMap({ checkpoints, currentLocation, sessionStatus, onReportDelay, onMarkReached, isTracking }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);

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
    renderMarkers(L, map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const renderMarkers = (L, map) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    checkpoints.forEach((cp, i) => {
      const color = cp.status === "reached" ? "#10B981" : cp.status === "active" ? "#3B82F6" : "#6B7280";
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(`
          <b>${cp.city_name}</b><br>
          Jadwal: ${cp.scheduled_time || "--:--"}<br>
          ${cp.delay_minutes ? `Delay: ${cp.delay_minutes} menit` : ""}
          ${onReportDelay ? `<br><button onclick="window.reportDelay('${cp.id}')">Lapor Telat</button>` : ""}
        `)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Draw route
    if (polylineRef.current) polylineRef.current.remove();
    const latlngs = checkpoints.map(cp => [cp.latitude, cp.longitude]);
    polylineRef.current = L.polyline(latlngs, { 
      color: "#3B82F6", 
      weight: 3, 
      opacity: 0.6, 
      dashArray: "8,4" 
    }).addTo(map);
  };

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;
    renderMarkers(L, mapInstanceRef.current);
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

    if (isTracking) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 13, { animate: true });
    }
  }, [currentLocation, isTracking]);

  // Register window function for popup
  useEffect(() => {
    window.reportDelay = (id) => {
      const cp = checkpoints.find(c => c.id === id);
      if (cp && onReportDelay) onReportDelay(cp);
    };
    return () => { delete window.reportDelay; };
  }, [checkpoints, onReportDelay]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
    </div>
  );
}

// ─── DELAY MODAL ──────────────────────────────────────────────────────────────

function DelayModal({ checkpoint, onClose, onSubmit }) {
  const [type, setType] = useState("late");
  const [minutes, setMinutes] = useState(10);

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}><FiBell size={18} color="#3B82F6" /> Lapor Keterlambatan/Awal</h3>
          <button onClick={onClose} style={iconBtn}><FiX size={18} /></button>
        </div>
        <p style={styles.modalSubtitle}>Checkpoint: <strong style={{ color: "#94A3B8" }}>{checkpoint?.city_name}</strong></p>

        <div style={styles.modalTypeButtons}>
          <button
            onClick={() => setType("late")}
            style={{
              ...styles.modalTypeBtn,
              background: type === "late" ? "#7F1D1D" : "#1E293B",
              borderColor: type === "late" ? "#EF4444" : "#334155",
              color: type === "late" ? "#FCA5A5" : "#64748B"
            }}
          >
            <FiArrowDown size={14} /> Telat
          </button>
          <button
            onClick={() => setType("early")}
            style={{
              ...styles.modalTypeBtn,
              background: type === "early" ? "#78350F" : "#1E293B",
              borderColor: type === "early" ? "#F59E0B" : "#334155",
              color: type === "early" ? "#FDE68A" : "#64748B"
            }}
          >
            <FiArrowUp size={14} /> Awal
          </button>
        </div>

        <div style={styles.modalMinutes}>
          <label style={styles.modalLabel}>Jumlah Menit</label>
          <div style={styles.modalMinutesControl}>
            <button onClick={() => setMinutes(m => Math.max(1, m - 5))} style={iconBtn}><FiMinus size={16} /></button>
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(parseInt(e.target.value) || 0)}
              style={{ ...inputStyle, textAlign: "center", width: "80px", fontSize: "20px", fontWeight: "700" }}
              min={1}
            />
            <button onClick={() => setMinutes(m => m + 5)} style={iconBtn}><FiPlus size={16} /></button>
          </div>
        </div>

        <div style={styles.modalActions}>
          <button onClick={onClose} style={btnSecondary}>Batal</button>
          <button
            onClick={() => onSubmit(type, minutes)}
            style={type === "late" ? { ...btnPrimary, background: "#DC2626" } : { ...btnPrimary, background: "#D97706" }}
          >
            <FiSave size={14} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SHARE PANEL ──────────────────────────────────────────────────────────────

function SharePanel({ sessionCode, onClose, onCopy, shareUrl }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: "420px" }}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}><FiShare2 size={18} color="#3B82F6" /> Bagikan Lokasi</h3>
          <button onClick={onClose} style={iconBtn}><FiX size={18} /></button>
        </div>

        <div style={styles.shareCodeBox}>
          <div style={styles.shareCodeLabel}>KODE SESI</div>
          <div style={styles.shareCode}>{sessionCode}</div>
        </div>

        <div style={styles.shareUrlBox}>
          <div style={styles.shareCodeLabel}>LINK PEMANTAU</div>
          <div style={styles.shareUrl}>{shareUrl}</div>
        </div>

        <button onClick={onCopy} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>
          <FiLink size={14} /> Salin Link Pemantau
        </button>
        <p style={styles.shareInfo}>
          <FiInfo size={12} /> Bagikan link ini kepada orang yang ingin memantau perjalanan Anda secara real-time
        </p>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0F172A",
    color: "#F1F5F9",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "#1E293B",
    borderBottom: "1px solid #334155",
    flexWrap: "wrap",
    gap: "12px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#F1F5F9",
    margin: 0
  },
  sessionBadge: {
    background: "#1D4ED8",
    color: "#93C5FD",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "1px",
    fontFamily: "monospace"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  mainContent: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 80px)",
    overflow: "hidden"
  },
  sidebar: {
    width: "360px",
    minWidth: "320px",
    background: "#0F172A",
    borderRight: "1px solid #1E293B",
    overflowY: "auto",
    padding: "16px",
    flexShrink: 0
  },
  sidebarContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  section: {
    background: "#1E293B",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #334155"
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#94A3B8",
    margin: "0 0 12px 0"
  },
  transportGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px",
    marginBottom: "12px"
  },
  transportBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid #334155",
    background: "#1E293B",
    color: "#64748B",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  checkpointList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "300px",
    overflowY: "auto"
  },
  checkpointItem: {
    background: "#0F172A",
    borderRadius: "8px",
    padding: "8px",
    border: "1px solid #334155"
  },
  checkpointRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  checkpointNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#3B82F6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0
  },
  checkpointInfo: {
    flex: 1
  },
  checkpointName: {
    color: "#F1F5F9",
    fontWeight: "600",
    fontSize: "13px"
  },
  checkpointTime: {
    color: "#64748B",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  checkpointActions: {
    display: "flex",
    gap: "2px"
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  editActions: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end"
  },
  mapContainer: {
    flex: 1,
    padding: "16px",
    background: "#0F172A"
  },
  notificationPanel: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 9999,
    maxWidth: "380px"
  },
  notificationItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#1E293B",
    borderLeft: "4px solid #3B82F6",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    animation: "slideIn 0.3s ease"
  },
  notificationMessage: {
    flex: 1,
    color: "#F1F5F9",
    fontSize: "13px"
  },
  notificationClose: {
    background: "none",
    border: "none",
    color: "#64748B",
    cursor: "pointer",
    padding: "4px"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9000,
    backdropFilter: "blur(4px)"
  },
  modalContent: {
    background: "#0F172A",
    border: "1px solid #1E293B",
    borderRadius: "16px",
    padding: "24px",
    width: "380px",
    maxWidth: "95%"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  modalTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#F1F5F9",
    fontSize: "18px",
    fontWeight: "700",
    margin: 0
  },
  modalSubtitle: {
    color: "#64748B",
    fontSize: "13px",
    marginBottom: "20px"
  },
  modalTypeButtons: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px"
  },
  modalTypeBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  modalMinutes: {
    marginBottom: "20px"
  },
  modalLabel: {
    display: "block",
    color: "#94A3B8",
    fontSize: "12px",
    marginBottom: "8px"
  },
  modalMinutesControl: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  modalActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end"
  },
  shareCodeBox: {
    background: "#1E293B",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "16px"
  },
  shareCodeLabel: {
    color: "#64748B",
    fontSize: "11px",
    marginBottom: "4px"
  },
  shareCode: {
    color: "#60A5FA",
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "6px",
    fontFamily: "monospace"
  },
  shareUrlBox: {
    background: "#1E293B",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "16px"
  },
  shareUrl: {
    color: "#94A3B8",
    fontSize: "12px",
    wordBreak: "break-all"
  },
  shareInfo: {
    color: "#475569",
    fontSize: "11px",
    textAlign: "center",
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px"
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#0F172A"
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #1E293B",
    borderTop: "4px solid #3B82F6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#64748B",
    marginTop: "16px",
    fontSize: "14px"
  }
};

// Tambahkan animasi
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
