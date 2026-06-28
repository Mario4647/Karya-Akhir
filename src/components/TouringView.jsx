// TouringView.jsx
// Halaman View untuk Memantau Perjalanan Orang Lain - Sinkron dengan TouringPage
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiUser, FiDroplet,
  FiCheckCircle, FiAlertCircle, FiNavigation,
  FiShare2, FiEye, FiZap, FiInfo,
  FiArrowUp, FiArrowDown, FiRefreshCw, FiCalendar,
  FiActivity, FiPause, FiWifi, FiWifiOff
} from "react-icons/fi";
import { MdTwoWheeler, MdDirectionsCar, MdDirectionsWalk, MdTrain } from "react-icons/md";

// ─── UTILS ────────────────────────────────────────────────────────────────────

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

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function getTransportIcon(type) {
  const icons = {
    motor: <MdTwoWheeler size={20} />,
    mobil: <MdDirectionsCar size={20} />,
    jalan: <MdDirectionsWalk size={20} />,
    kereta: <MdTrain size={20} />
  };
  return icons[type] || <MdDirectionsCar size={20} />;
}

function getTransportLabel(type) {
  const labels = { motor: "Motor", mobil: "Mobil", jalan: "Jalan Kaki", kereta: "Kereta" };
  return labels[type] || "Mobil";
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  container: { minHeight: "100vh", background: "#0F172A", color: "#F1F5F9", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  containerMobile: { fontSize: "14px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#1E293B", borderBottom: "1px solid #334155", flexWrap: "wrap", gap: "12px" },
  headerMobile: { padding: "12px 16px" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerTitle: { fontSize: "20px", fontWeight: "700", color: "#F1F5F9", margin: 0 },
  headerTitleMobile: { fontSize: "16px" },
  headerRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  statusBadge: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  statusBadgeMobile: { padding: "4px 10px", fontSize: "10px" },
  statusBar: { background: "#1E293B", borderBottom: "1px solid #334155", padding: "8px 16px", position: "relative" },
  statusBarContent: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  statusIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", flexShrink: 0 },
  statusInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  statusText: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", flexWrap: "wrap" },
  statusLocation: { color: "#94A3B8", fontSize: "12px", fontWeight: "400" },
  statusSpeed: { color: "#64748B", fontSize: "11px" },
  statusDetailBtn: { display: "flex", alignItems: "center", gap: "4px", padding: "4px 12px", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#94A3B8", cursor: "pointer", fontSize: "12px", transition: "all 0.2s" },
  statusDetailPopup: { position: "absolute", top: "calc(100% + 8px)", right: "16px", background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px", minWidth: "200px", zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" },
  statusDetailItem: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px", borderBottom: "1px solid #1E293B" },
  statusDetailLabel: { color: "#64748B" },
  mainContent: { display: "flex", flex: 1, height: "calc(100vh - 80px)", overflow: "hidden" },
  mainContentMobile: { flexDirection: "column", height: "auto", minHeight: "calc(100vh - 120px)" },
  mapContainer: { flex: 1, padding: "16px", background: "#0F172A", position: "relative", minHeight: "300px" },
  mapContainerMobile: { padding: "8px", minHeight: "250px", height: "50vh" },
  sidebar: { width: "340px", minWidth: "300px", background: "#0F172A", borderLeft: "1px solid #1E293B", overflowY: "auto", padding: "16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" },
  sidebarMobile: { width: "100%", minWidth: "unset", borderLeft: "none", borderTop: "1px solid #1E293B", padding: "12px", maxHeight: "50vh" },
  infoCard: { background: "#1E293B", borderRadius: "12px", padding: "16px", border: "1px solid #334155" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1E293B" },
  infoLabel: { color: "#64748B", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" },
  infoValue: { color: "#F1F5F9", fontSize: "13px", fontWeight: "600" },
  checkpointList: { display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" },
  checkpointListMobile: { maxHeight: "200px" },
  checkpointItem: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#0F172A", borderRadius: "8px", border: "1px solid #334155", transition: "all 0.3s" },
  checkpointStatus: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  checkpointInfo: { flex: 1, minWidth: 0 },
  checkpointName: { color: "#F1F5F9", fontWeight: "600", fontSize: "13px" },
  checkpointNameMobile: { fontSize: "12px" },
  checkpointTime: { color: "#64748B", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" },
  checkpointTimeMobile: { fontSize: "10px" },
  checkpointBadge: { fontSize: "10px", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" },
  liveIndicator: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)" },
  pulseDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" },
  delayBadge: { display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748B", gap: "12px" },
  loadingContainer: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0F172A" },
  loadingSpinner: { width: "48px", height: "48px", border: "4px solid #1E293B", borderTop: "4px solid #3B82F6", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { color: "#64748B", marginTop: "16px", fontSize: "14px" }
};

// Inject animasi global untuk TouringView
const viewStyleSheet = document.createElement("style");
viewStyleSheet.textContent = `
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
  @media (max-width: 768px) { .leaflet-control-zoom { display: none !important; } }
  .touring-pulse-dot { animation: pulse 1.5s ease-in-out infinite; }
`;
if (!document.head.querySelector('style[data-touring-view]')) {
  viewStyleSheet.setAttribute('data-touring-view', '1');
  document.head.appendChild(viewStyleSheet);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TouringView() {
  const [session, setSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({
    status: "idle", location_name: "Menunggu", speed: 0, last_update: null
  });
  const [showStatusDetail, setShowStatusDetail] = useState(false);
  const [statusLogs, setStatusLogs] = useState([]);

  const sessionCodeRef = useRef(null);
  const subscriptionRef = useRef(null);
  const isMounted = useRef(true);

  // Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── LOAD SESSION ──────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setError("Kode sesi tidak ditemukan");
      setLoading(false);
      return;
    }
    sessionCodeRef.current = code;
    loadSession(code);

    return () => {
      isMounted.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async (code) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("touring_sessions")
        .select("*")
        .eq("session_code", code)
        .single();

      if (sessionError || !sessionData) {
        if (isMounted.current) {
          setError("Sesi tidak ditemukan");
          setLoading(false);
        }
        return;
      }

      if (!isMounted.current) return;

      setSession(sessionData);

      if (sessionData.current_status) {
        setCurrentStatus({
          status: sessionData.current_status,
          location_name: sessionData.current_location_name || "Lokasi tidak diketahui",
          speed: 0,
          last_update: sessionData.last_location_update || new Date()
        });
      }

      const { data: cpData, error: cpError } = await supabase
        .from("touring_checkpoints")
        .select("*")
        .eq("session_id", sessionData.id)
        .eq("is_deleted", false)
        .order("order_index");

      if (!cpError && cpData && isMounted.current) setCheckpoints(cpData);

      const { data: trackData } = await supabase
        .from("touring_location_tracking")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (trackData && trackData.length > 0 && isMounted.current) {
        setCurrentLocation({
          lat: trackData[0].latitude,
          lng: trackData[0].longitude,
          speed: trackData[0].speed || 0,
          heading: trackData[0].heading || 0,
          recorded_at: trackData[0].recorded_at
        });
        setLastUpdate(new Date(trackData[0].recorded_at));
      }

      const { data: notifData } = await supabase
        .from("touring_notifications")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (notifData && isMounted.current) setNotifications(notifData);

      const { data: logsData } = await supabase
        .from("touring_status_logs")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (logsData && isMounted.current) setStatusLogs(logsData);

      subscribeToRealtime(sessionData.id);

      if (isMounted.current) setLoading(false);
    } catch (err) {
      console.error("Error loading session:", err);
      if (isMounted.current) {
        setError("Gagal memuat data sesi");
        setLoading(false);
      }
    }
  };

  // ─── REALTIME SUBSCRIPTION ────────────────────────────────────────────────
  const subscribeToRealtime = (sessionId) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    const channel = supabase
      .channel(`session-view-${sessionId}-${Date.now()}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "touring_location_tracking",
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (!isMounted.current) return;
        const { latitude, longitude, speed, heading, recorded_at } = payload.new;
        setCurrentLocation({ lat: latitude, lng: longitude, speed, heading, recorded_at });
        setLastUpdate(new Date());
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "touring_checkpoints",
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (!isMounted.current) return;
        setCheckpoints(prev => {
          const idx = prev.findIndex(c => c.id === payload.new.id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = { ...payload.new };
          return updated;
        });
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "touring_notifications",
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (!isMounted.current) return;
        setNotifications(prev => [payload.new, ...prev].slice(0, 20));
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "touring_sessions",
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        if (!isMounted.current) return;
        if (payload.new.current_status) {
          setCurrentStatus({
            status: payload.new.current_status,
            location_name: payload.new.current_location_name || "Lokasi tidak diketahui",
            speed: 0,
            last_update: payload.new.last_location_update || new Date()
          });
        }
        setSession(prev => ({ ...prev, ...payload.new }));
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "touring_status_logs",
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (!isMounted.current) return;
        setStatusLogs(prev => [payload.new, ...prev].slice(0, 10));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime subscription active");
        }
      });

    subscriptionRef.current = channel;
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Memuat data perjalanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h2 style={{ color: "#F1F5F9", margin: "16px 0 8px" }}>Sesi Tidak Ditemukan</h2>
        <p style={{ color: "#64748B", textAlign: "center", maxWidth: "400px" }}>
          {error}<br />Pastikan link pemantau yang Anda gunakan benar.
        </p>
      </div>
    );
  }

  const transportIcon = session ? getTransportIcon(session.transport_type) : null;
  const transportLabel = session ? getTransportLabel(session.transport_type) : "";
  const reachedCount = checkpoints.filter(c => c.status === "reached").length;
  const totalCheckpoints = checkpoints.length;
  const isComplete = checkpoints.some(cp => cp.is_final_destination && cp.status === "reached") ||
    session?.status === "completed";

  let nextCheckpoint = null;
  let distanceToNext = null;
  if (currentLocation) {
    const next = checkpoints.find(c => c.status !== "reached");
    if (next) {
      nextCheckpoint = next;
      distanceToNext = getDistanceKm(currentLocation.lat, currentLocation.lng, next.latitude, next.longitude);
    }
  }

  const totalDelay = checkpoints.reduce((sum, cp) => sum + (cp.delay_minutes || 0), 0);

  return (
    <div style={{ ...styles.container, ...(isMobile ? styles.containerMobile : {}) }}>
      {/* Header */}
      <header style={{ ...styles.header, ...(isMobile ? styles.headerMobile : {}) }}>
        <div style={styles.headerLeft}>
          <FiEye size={isMobile ? 20 : 24} color="#3B82F6" />
          <h1 style={{ ...styles.headerTitle, ...(isMobile ? styles.headerTitleMobile : {}) }}>
            Pantau Perjalanan
          </h1>
          <span style={{
            background: "#1D4ED8", color: "#93C5FD", padding: "4px 12px",
            borderRadius: "20px", fontSize: isMobile ? "10px" : "12px",
            fontWeight: "600", letterSpacing: "1px", fontFamily: "monospace"
          }}>#{session?.session_code}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{
            ...styles.statusBadge, ...(isMobile ? styles.statusBadgeMobile : {}),
            background: isComplete ? "#1E293B" : session?.status === "active" ? "#065F46" : "#1E293B",
            color: isComplete ? "#94A3B8" : session?.status === "active" ? "#6EE7B7" : "#94A3B8"
          }}>
            {isComplete ? <FiCheckCircle size={12} /> : session?.status === "active" ? <FiZap size={12} /> : <FiClock size={12} />}
            {isComplete ? "Selesai" : session?.status === "active" ? "Live" : "Menunggu"}
          </span>
          <span style={{
            ...styles.statusBadge, ...(isMobile ? styles.statusBadgeMobile : {}),
            background: "#1E293B", color: "#64748B"
          }}>
            <FiClock size={12} />
            {lastUpdate.toLocaleTimeString("id-ID")}
          </span>
        </div>
      </header>

      {/* Status Bar */}
      {session?.status === "active" && !isComplete && (
        <div style={styles.statusBar}>
          <div style={styles.statusBarContent}>
            <div style={styles.statusIcon}>
              {currentStatus.status === "running" ? <FiActivity size={20} color="#10B981" />
                : currentStatus.status === "stopped" ? <FiPause size={20} color="#F59E0B" />
                : <FiClock size={20} color="#94A3B8" />}
            </div>
            <div style={styles.statusInfo}>
              <div style={styles.statusText}>
                {currentStatus.status === "running" ? <span style={{ color: "#10B981" }}>🟢 Sedang Berjalan</span>
                  : currentStatus.status === "stopped" ? <span style={{ color: "#F59E0B" }}>🟡 Sedang Berhenti</span>
                  : <span style={{ color: "#94A3B8" }}>⏳ Menunggu</span>}
                <span style={styles.statusLocation}>{currentStatus.location_name || "Lokasi tidak diketahui"}</span>
              </div>
              {currentLocation?.speed !== undefined && currentStatus.status === "running" && (
                <span style={styles.statusSpeed}>{(currentLocation.speed * 3.6).toFixed(1)} km/jam</span>
              )}
            </div>
            <button onClick={() => setShowStatusDetail(!showStatusDetail)} style={styles.statusDetailBtn}>
              <FiInfo size={14} /> Detail
            </button>
          </div>

          {showStatusDetail && (
            <div style={styles.statusDetailPopup}>
              <div style={styles.statusDetailItem}>
                <span style={styles.statusDetailLabel}>Status</span>
                <span style={{ color: currentStatus.status === "running" ? "#10B981" : currentStatus.status === "stopped" ? "#F59E0B" : "#94A3B8" }}>
                  {currentStatus.status === "running" ? "🟢 Berjalan" : currentStatus.status === "stopped" ? "🟡 Berhenti" : "⏳ Idle"}
                </span>
              </div>
              <div style={styles.statusDetailItem}>
                <span style={styles.statusDetailLabel}>Lokasi</span>
                <span>{currentStatus.location_name || "-"}</span>
              </div>
              {currentLocation?.speed !== undefined && (
                <div style={styles.statusDetailItem}>
                  <span style={styles.statusDetailLabel}>Kecepatan</span>
                  <span>{(currentLocation.speed * 3.6).toFixed(1)} km/jam</span>
                </div>
              )}
              <div style={styles.statusDetailItem}>
                <span style={styles.statusDetailLabel}>Update</span>
                <span>{currentStatus.last_update ? formatTimeAgo(currentStatus.last_update) : "-"}</span>
              </div>
              <div style={styles.statusDetailItem}>
                <span style={styles.statusDetailLabel}>Progress</span>
                <span>{reachedCount}/{totalCheckpoints} Kota</span>
              </div>
              {totalDelay !== 0 && (
                <div style={styles.statusDetailItem}>
                  <span style={styles.statusDetailLabel}>Total Delay</span>
                  <span style={{ color: totalDelay > 0 ? "#FCA5A5" : "#FDE68A" }}>
                    {totalDelay > 0 ? `+${totalDelay}` : totalDelay} menit
                  </span>
                </div>
              )}
              <div style={styles.statusDetailItem}>
                <span style={styles.statusDetailLabel}>Sinyal GPS</span>
                <span style={{ color: "#10B981" }}><FiWifi size={12} /> Aktif</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div style={{ ...styles.mainContent, ...(isMobile ? styles.mainContentMobile : {}) }}>
        {/* Map */}
        <div style={{ ...styles.mapContainer, ...(isMobile ? styles.mapContainerMobile : {}) }}>
          <ViewMap
            checkpoints={checkpoints}
            currentLocation={currentLocation}
            sessionStatus={session?.status}
            nextCheckpoint={nextCheckpoint}
            isMobile={isMobile}
            currentStatus={currentStatus}
            isComplete={isComplete}
          />
          {session?.status === "active" && currentLocation && !isComplete && (
            <div style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              ...styles.liveIndicator
            }}>
              <div className="touring-pulse-dot" style={styles.pulseDot}></div>
              <span style={{ color: "#6EE7B7", fontSize: "13px", fontWeight: "600" }}>
                LIVE - {lastUpdate.toLocaleTimeString("id-ID")}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}) }}>
          {/* Session Info */}
          <div style={styles.infoCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {transportIcon}
              <span style={{ color: "#F1F5F9", fontWeight: "600", fontSize: "14px" }}>{transportLabel}</span>
              {session?.plate_number && <span style={{ color: "#64748B", fontSize: "12px" }}>{session.plate_number}</span>}
              {isComplete && <span style={{ color: "#10B981", fontSize: "11px", fontWeight: "600" }}>✅ Selesai</span>}
              {session?.late_departure && <span style={{ color: "#F59E0B", fontSize: "11px", fontWeight: "600" }}>⏰ Telat Berangkat</span>}
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}><FiUser size={12} /> Pengemudi</span>
              <span style={styles.infoValue}>{session?.driver_name || "-"}</span>
            </div>
            {session?.fuel_liters && session.transport_type !== "kereta" && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiDroplet size={12} /> Bensin</span>
                <span style={styles.infoValue}>{session.fuel_liters} L</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}><FiMapPin size={12} /> Progress</span>
              <span style={styles.infoValue}>{reachedCount}/{totalCheckpoints} Kota</span>
            </div>
            {distanceToNext !== null && nextCheckpoint && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiNavigation size={12} /> Ke {nextCheckpoint.city_name}</span>
                <span style={styles.infoValue}>
                  {distanceToNext < 1 ? `${(distanceToNext * 1000).toFixed(0)} m` : `${distanceToNext.toFixed(1)} km`}
                </span>
              </div>
            )}
            {totalDelay !== 0 && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiClock size={12} /> Total Delay</span>
                <span style={{ color: totalDelay > 0 ? "#FCA5A5" : "#FDE68A", fontWeight: "600" }}>
                  {totalDelay > 0 ? `+${totalDelay}` : totalDelay} menit
                </span>
              </div>
            )}
          </div>

          {/* Checkpoints */}
          <div style={styles.infoCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>
                <FiMapPin size={14} style={{ marginRight: "6px" }} />Rute Perjalanan
              </span>
              <span style={{ color: "#64748B", fontSize: "11px" }}>{reachedCount > 0 && `${reachedCount}/${totalCheckpoints}`}</span>
            </div>
            <div style={{ ...styles.checkpointList, ...(isMobile ? styles.checkpointListMobile : {}) }}>
              {checkpoints.map((cp) => {
                const isReached = cp.status === "reached";
                const isNext = !isReached && !checkpoints.find(c => c.status !== "reached" && c.order_index < cp.order_index);

                return (
                  <div key={cp.id} style={{
                    ...styles.checkpointItem,
                    borderColor: isReached ? "#065F46" : isNext ? "#1D4ED8" : "#334155",
                    opacity: isReached ? 0.8 : 1
                  }}>
                    <div style={{ ...styles.checkpointStatus, background: isReached ? "#10B981" : isNext ? "#3B82F6" : "#475569" }} />
                    <div style={styles.checkpointInfo}>
                      <div style={{ ...styles.checkpointName, ...(isMobile ? styles.checkpointNameMobile : {}) }}>
                        {cp.city_name}
                        {cp.is_final_destination && <span style={{ color: "#F59E0B", marginLeft: "4px" }}>🏁</span>}
                        {isReached && <FiCheckCircle size={12} color="#10B981" style={{ marginLeft: "6px" }} />}
                        {isNext && <span style={{ color: "#60A5FA", fontSize: "10px", marginLeft: "6px" }}>NEXT</span>}
                      </div>
                      <div style={{ ...styles.checkpointTime, ...(isMobile ? styles.checkpointTimeMobile : {}) }}>
                        <FiCalendar size={10} /> {formatDate(cp.scheduled_date)}
                        <FiClock size={10} /> {formatTime(cp.scheduled_time)}
                        {cp.delay_minutes !== 0 && cp.delay_minutes != null && (
                          <span style={{
                            ...styles.delayBadge,
                            background: cp.delay_minutes > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: cp.delay_minutes > 0 ? "#FCA5A5" : "#FDE68A"
                          }}>
                            {cp.delay_minutes > 0 ? <FiArrowDown size={10} /> : <FiArrowUp size={10} />}
                            {Math.abs(cp.delay_minutes)}mnt
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      ...styles.checkpointBadge,
                      background: isReached ? "rgba(16, 185, 129, 0.2)" : isNext ? "rgba(59, 130, 246, 0.2)" : "rgba(71, 85, 105, 0.2)",
                      color: isReached ? "#6EE7B7" : isNext ? "#93C5FD" : "#64748B"
                    }}>
                      {isReached ? "Tiba" : isNext ? "Selanjutnya" : "Menunggu"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Logs */}
          {statusLogs.length > 0 && (
            <div style={styles.infoCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>
                  <FiActivity size={14} style={{ marginRight: "6px" }} />Riwayat Status
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: isMobile ? "80px" : "120px", overflowY: "auto" }}>
                {statusLogs.slice(0, isMobile ? 3 : 5).map((log, i) => (
                  <div key={log.id || i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", background: "#0F172A", borderRadius: "4px", fontSize: isMobile ? "10px" : "11px" }}>
                    {log.status === "running" ? <FiActivity size={10} color="#10B981" />
                      : log.status === "stopped" ? <FiPause size={10} color="#F59E0B" />
                      : <FiClock size={10} color="#94A3B8" />}
                    <span style={{ color: "#94A3B8", flex: 1 }}>
                      {log.status === "running" ? "🟢 Berjalan" : log.status === "stopped" ? "🟡 Berhenti" : "⏳ Idle"}
                      {log.location_name && ` - ${log.location_name}`}
                    </span>
                    <span style={{ color: "#475569", fontSize: "9px" }}>{formatTimeAgo(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div style={styles.infoCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>
                  <FiInfo size={14} style={{ marginRight: "6px" }} />Notifikasi
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: isMobile ? "80px" : "120px", overflowY: "auto" }}>
                {notifications.slice(0, isMobile ? 3 : 5).map((n, i) => (
                  <div key={n.id || i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", background: "#0F172A", borderRadius: "4px", fontSize: isMobile ? "10px" : "11px" }}>
                    {n.type === "late" ? <FiArrowDown size={10} color="#EF4444" />
                      : n.type === "early" ? <FiArrowUp size={10} color="#F59E0B" />
                      : n.type === "info" ? <FiInfo size={10} color="#3B82F6" />
                      : <FiCheckCircle size={10} color="#10B981" />}
                    <span style={{ color: "#94A3B8", flex: 1 }}>{n.message}</span>
                    <span style={{ color: "#475569", fontSize: "9px" }}>{new Date(n.created_at).toLocaleTimeString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MAP ────────────────────────────────────────────────────────────────

function ViewMap({ checkpoints, currentLocation, sessionStatus, nextCheckpoint, isMobile, currentStatus, isComplete }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || mapInstanceRef.current) return;
    const L = window.L;
    if (!L) { console.warn("Leaflet not loaded"); return; }

    const startLat = currentLocation?.lat || checkpoints[0]?.latitude || -7.7200;
    const startLng = currentLocation?.lng || checkpoints[0]?.longitude || 109.9084;

    const map = L.map(mapRef.current, { zoomControl: !isMobile, attributionControl: true });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.setView([startLat, startLng], isMobile ? 8 : 9);
    initializedRef.current = true;
    renderMarkers(L, map, checkpoints, isMobile);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initializedRef.current = false;
        currentMarkerRef.current = null;
        markersRef.current = [];
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderMarkers = (L, map, cps, mobile) => {
    if (!map) return;
    markersRef.current.forEach(m => { try { m.remove(); } catch (e) {} });
    markersRef.current = [];

    cps.forEach((cp, i) => {
      const isReached = cp.status === "reached";
      const isNext = !isReached && !cps.find(c => c.status !== "reached" && c.order_index < cp.order_index);
      const color = isReached ? "#10B981" : isNext ? "#3B82F6" : "#6B7280";
      const size = mobile ? 28 : 34;
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${mobile ? 10 : 13}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(`<b>${cp.city_name}</b><br>Tanggal: ${cp.scheduled_date || "--"}<br>Jadwal: ${cp.scheduled_time || "--:--"}<br>Status: ${isReached ? "✅ Tiba" : isNext ? "📍 Selanjutnya" : "⏳ Menunggu"}<br>${cp.delay_minutes ? `Delay: ${cp.delay_minutes} menit` : ""}${cp.is_final_destination ? "<br>🏁 Tujuan Akhir" : ""}`)
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (polylineRef.current) { try { polylineRef.current.remove(); } catch (e) {} }
    const latlngs = cps.map(cp => [cp.latitude, cp.longitude]);
    if (latlngs.length > 0) {
      polylineRef.current = L.polyline(latlngs, { color: "#3B82F6", weight: mobile ? 2 : 3, opacity: 0.5, dashArray: "8,4" }).addTo(map);
    }

    // Garis hijau untuk segmen yang sudah dilewati
    const reachedIndex = cps.findLastIndex(c => c.status === "reached");
    if (reachedIndex >= 0 && reachedIndex < cps.length - 1) {
      const nextIndex = reachedIndex + 1;
      try {
        const segment = L.polyline(
          [[cps[reachedIndex].latitude, cps[reachedIndex].longitude], [cps[nextIndex].latitude, cps[nextIndex].longitude]],
          { color: "#10B981", weight: mobile ? 3 : 4, opacity: 0.9 }
        ).addTo(map);
        markersRef.current.push(segment);
      } catch (e) {}
    }
  };

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !initializedRef.current) return;
    renderMarkers(L, mapInstanceRef.current, checkpoints, isMobile);
  }, [checkpoints, isMobile]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !currentLocation || !initializedRef.current) return;

    if (currentMarkerRef.current) {
      const latlng = [currentLocation.lat, currentLocation.lng];
      currentMarkerRef.current.setLatLng(latlng);
      if (sessionStatus === "active" && !isComplete) {
        mapInstanceRef.current.panTo(latlng, { animate: true, duration: 0.5 });
      }
    } else {
      const size = isMobile ? 30 : 40;
      const pulseIcon = L.divIcon({
        html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:${size}px;height:${size}px;background:rgba(59,130,246,0.2);border-radius:50%;animation:ping 1.5s infinite"></div><div style="width:${isMobile ? 14 : 20}px;height:${isMobile ? 14 : 20}px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.6);position:relative;z-index:1"></div></div>`,
        className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      currentMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: pulseIcon })
        .bindPopup("📍 Lokasi Saat Ini")
        .addTo(mapInstanceRef.current);

      if (sessionStatus === "active" && !isComplete) {
        mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], isMobile ? 11 : 13, { animate: true });
      }
    }

    if (currentMarkerRef.current && currentStatus) {
      const statusText = currentStatus.status === "running" ? "🟢 Berjalan" : currentStatus.status === "stopped" ? "🟡 Berhenti" : "⏳ Idle";
      currentMarkerRef.current.setPopupContent(`📍 Lokasi Saat Ini<br>Status: ${statusText}<br>${currentStatus.location_name || ""}`);
    }
  }, [currentLocation, sessionStatus, isMobile, currentStatus, isComplete]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => { try { mapInstanceRef.current.invalidateSize(); } catch (e) {} }, 300);
    }
  }, [isMobile]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
    </div>
  );
}
