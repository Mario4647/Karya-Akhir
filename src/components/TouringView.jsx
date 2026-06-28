// TouringView.jsx
// Halaman View untuk Memantau Perjalanan Orang Lain
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiUser, FiDroplet,
  FiCheckCircle, FiAlertCircle, FiNavigation,
  FiShare2, FiEye, FiEyeOff, FiZap, FiInfo,
  FiArrowUp, FiArrowDown, FiRefreshCw, FiCalendar,
  FiTrain
} from "react-icons/fi";
import { MdTwoWheeler, MdDirectionsCar, MdDirectionsWalk } from "react-icons/md";

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

function getTransportIcon(type) {
  const icons = {
    motor: <MdTwoWheeler size={20} />,
    mobil: <MdDirectionsCar size={20} />,
    jalan: <MdDirectionsWalk size={20} />,
    kereta: <FiTrain size={20} />
  };
  return icons[type] || <MdDirectionsCar size={20} />;
}

function getTransportLabel(type) {
  const labels = { motor: "Motor", mobil: "Mobil", jalan: "Jalan Kaki", kereta: "Kereta" };
  return labels[type] || "Mobil";
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
  mapContainer: {
    flex: 1,
    padding: "16px",
    background: "#0F172A",
    position: "relative"
  },
  sidebar: {
    width: "340px",
    minWidth: "300px",
    background: "#0F172A",
    borderLeft: "1px solid #1E293B",
    overflowY: "auto",
    padding: "16px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  infoCard: {
    background: "#1E293B",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #334155"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #1E293B"
  },
  infoLabel: {
    color: "#64748B",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  infoValue: {
    color: "#F1F5F9",
    fontSize: "13px",
    fontWeight: "600"
  },
  checkpointList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "300px",
    overflowY: "auto"
  },
  checkpointItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: "#0F172A",
    borderRadius: "8px",
    border: "1px solid #334155",
    transition: "all 0.3s"
  },
  checkpointStatus: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
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
    gap: "4px",
    flexWrap: "wrap"
  },
  checkpointBadge: {
    fontSize: "10px",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "600"
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(16, 185, 129, 0.15)",
    borderRadius: "8px",
    border: "1px solid rgba(16, 185, 129, 0.3)"
  },
  pulseDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#10B981",
    animation: "pulse 1.5s ease-in-out infinite"
  },
  delayBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "600"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#64748B",
    gap: "12px"
  },
  // Responsive mobile
  containerMobile: {
    fontSize: "14px"
  },
  headerMobile: {
    padding: "12px 16px"
  },
  headerTitleMobile: {
    fontSize: "16px"
  },
  statusBadgeMobile: {
    padding: "4px 10px",
    fontSize: "10px"
  },
  mainContentMobile: {
    flexDirection: "column",
    height: "auto",
    minHeight: "calc(100vh - 120px)"
  },
  sidebarMobile: {
    width: "100%",
    minWidth: "unset",
    borderLeft: "none",
    borderTop: "1px solid #1E293B",
    padding: "12px",
    maxHeight: "50vh"
  },
  mapContainerMobile: {
    padding: "8px",
    minHeight: "250px",
    height: "50vh"
  },
  checkpointListMobile: {
    maxHeight: "200px"
  },
  notificationPanelMobile: {
    bottom: "12px",
    right: "12px",
    left: "12px",
    maxWidth: "unset",
    width: "auto"
  },
  notificationItemMobile: {
    padding: "10px 12px",
    fontSize: "12px",
    gap: "8px"
  }
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TouringView() {
  const [session, setSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const sessionCodeRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── LOAD SESSION ──────────────────────────────────────────────────────────

  useEffect(() => {
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
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  const loadSession = async (code) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("touring_sessions")
        .select("*")
        .eq("session_code", code)
        .single();

      if (sessionError || !sessionData) {
        setError("Sesi tidak ditemukan");
        setLoading(false);
        return;
      }

      setSession(sessionData);

      const { data: cpData, error: cpError } = await supabase
        .from("touring_checkpoints")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("order_index");

      if (!cpError && cpData) {
        setCheckpoints(cpData);
      }

      const { data: trackData } = await supabase
        .from("touring_location_tracking")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (trackData && trackData.length > 0) {
        setCurrentLocation({
          lat: trackData[0].latitude,
          lng: trackData[0].longitude,
          speed: trackData[0].speed,
          heading: trackData[0].heading,
          recorded_at: trackData[0].recorded_at
        });
      }

      const { data: notifData } = await supabase
        .from("touring_notifications")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (notifData) {
        setNotifications(notifData);
      }

      subscribeToRealtime(sessionData.id);
      setLoading(false);
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Gagal memuat data sesi");
      setLoading(false);
    }
  };

  // ─── REALTIME SUBSCRIPTION ────────────────────────────────────────────────

  const subscribeToRealtime = (sessionId) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "touring_location_tracking",
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const { latitude, longitude, speed, heading, recorded_at } = payload.new;
          setCurrentLocation({ lat: latitude, lng: longitude, speed, heading, recorded_at });
          setLastUpdate(new Date());
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "touring_checkpoints",
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setCheckpoints(prev => {
            const idx = prev.findIndex(c => c.id === payload.new.id);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...payload.new };
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "touring_notifications",
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.emptyState, height: "100vh" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid #1E293B",
            borderTop: "4px solid #3B82F6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ color: "#64748B" }}>Memuat data perjalanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.emptyState, height: "100vh" }}>
          <FiAlertCircle size={48} color="#EF4444" />
          <h2 style={{ color: "#F1F5F9", margin: 0 }}>Sesi Tidak Ditemukan</h2>
          <p style={{ color: "#64748B", textAlign: "center", maxWidth: "400px" }}>
            {error}<br />
            Pastikan link pemantau yang Anda gunakan benar.
          </p>
        </div>
      </div>
    );
  }

  const transportIcon = session ? getTransportIcon(session.transport_type) : null;
  const transportLabel = session ? getTransportLabel(session.transport_type) : "";
  const reachedCount = checkpoints.filter(c => c.status === "reached").length;
  const totalCheckpoints = checkpoints.length;
  const isComplete = checkpoints.some(cp => cp.is_final_destination && cp.status === "reached");

  let nextCheckpoint = null;
  let distanceToNext = null;
  if (currentLocation) {
    const next = checkpoints.find(c => c.status !== "reached");
    if (next) {
      nextCheckpoint = next;
      distanceToNext = getDistanceKm(
        currentLocation.lat,
        currentLocation.lng,
        next.latitude,
        next.longitude
      );
    }
  }

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
            background: "#1D4ED8",
            color: "#93C5FD",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: isMobile ? "10px" : "12px",
            fontWeight: "600",
            letterSpacing: "1px",
            fontFamily: "monospace"
          }}>#{session?.session_code}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{
            ...styles.statusBadge,
            ...(isMobile ? styles.statusBadgeMobile : {}),
            background: isComplete ? "#1E293B" : session?.status === "active" ? "#065F46" : "#1E293B",
            color: isComplete ? "#94A3B8" : session?.status === "active" ? "#6EE7B7" : "#94A3B8"
          }}>
            {isComplete ? <FiCheckCircle size={12} /> : session?.status === "active" ? <FiZap size={12} /> : <FiClock size={12} />}
            {isComplete ? "Selesai" : session?.status === "active" ? "Live" : "Menunggu"}
          </span>
          <span style={{
            ...styles.statusBadge,
            ...(isMobile ? styles.statusBadgeMobile : {}),
            background: "#1E293B",
            color: "#64748B"
          }}>
            <FiClock size={12} />
            {lastUpdate.toLocaleTimeString("id-ID")}
          </span>
        </div>
      </header>

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
          />
          {session?.status === "active" && currentLocation && (
            <div style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              ...styles.liveIndicator
            }}>
              <div style={styles.pulseDot}></div>
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
              <span style={{ color: "#F1F5F9", fontWeight: "600", fontSize: "14px" }}>
                {transportLabel}
              </span>
              {session?.plate_number && (
                <span style={{ color: "#64748B", fontSize: "12px" }}>
                  {session.plate_number}
                </span>
              )}
              {isComplete && (
                <span style={{ color: "#10B981", fontSize: "11px", fontWeight: "600" }}>
                  ✅ Selesai
                </span>
              )}
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
              <span style={styles.infoValue}>
                {reachedCount}/{totalCheckpoints} Kota
              </span>
            </div>
            {distanceToNext !== null && nextCheckpoint && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiNavigation size={12} /> Ke {nextCheckpoint.city_name}</span>
                <span style={styles.infoValue}>
                  {distanceToNext < 1 ? `${(distanceToNext * 1000).toFixed(0)} m` : `${distanceToNext.toFixed(1)} km`}
                </span>
              </div>
            )}
          </div>

          {/* Checkpoints */}
          <div style={styles.infoCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>
                <FiMapPin size={14} style={{ marginRight: "6px" }} />
                Rute Perjalanan
              </span>
              <span style={{ color: "#64748B", fontSize: "11px" }}>
                {reachedCount > 0 && `${reachedCount}/${totalCheckpoints}`}
              </span>
            </div>
            <div style={{ ...styles.checkpointList, ...(isMobile ? styles.checkpointListMobile : {}) }}>
              {checkpoints.map((cp) => {
                const isReached = cp.status === "reached";
                const isNext = cp.status !== "reached" && !checkpoints.find(c => c.status !== "reached" && c.order_index < cp.order_index);
                
                return (
                  <div key={cp.id} style={{
                    ...styles.checkpointItem,
                    borderColor: isReached ? "#065F46" : isNext ? "#1D4ED8" : "#334155",
                    opacity: isReached ? 0.8 : 1
                  }}>
                    <div style={{
                      ...styles.checkpointStatus,
                      background: isReached ? "#10B981" : isNext ? "#3B82F6" : "#475569"
                    }} />
                    <div style={styles.checkpointInfo}>
                      <div style={styles.checkpointName}>
                        {cp.city_name}
                        {cp.is_final_destination && <span style={{ color: "#F59E0B", marginLeft: "4px" }}>🏁</span>}
                        {isReached && <FiCheckCircle size={12} color="#10B981" style={{ marginLeft: "6px" }} />}
                        {isNext && <span style={{ color: "#60A5FA", fontSize: "10px", marginLeft: "6px" }}>NEXT</span>}
                      </div>
                      <div style={styles.checkpointTime}>
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

          {/* Notifications */}
          {notifications.length > 0 && (
            <div style={styles.infoCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>
                  <FiInfo size={14} style={{ marginRight: "6px" }} />
                  Notifikasi
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: isMobile ? "80px" : "120px", overflowY: "auto" }}>
                {notifications.slice(0, isMobile ? 3 : 5).map((n, i) => (
                  <div key={n.id || i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 10px",
                    background: "#0F172A",
                    borderRadius: "6px",
                    fontSize: isMobile ? "11px" : "12px"
                  }}>
                    {n.type === "late" ? <FiArrowDown size={12} color="#EF4444" /> :
                     n.type === "early" ? <FiArrowUp size={12} color="#F59E0B" /> :
                     n.type === "info" ? <FiInfo size={12} color="#3B82F6" /> :
                     <FiCheckCircle size={12} color="#10B981" />}
                    <span style={{ color: "#94A3B8", flex: 1 }}>{n.message}</span>
                    <span style={{ color: "#475569", fontSize: "10px" }}>
                      {new Date(n.created_at).toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .leaflet-control-zoom {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── VIEW MAP ────────────────────────────────────────────────────────────────

function ViewMap({ checkpoints, currentLocation, sessionStatus, nextCheckpoint, isMobile }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || mapInstanceRef.current) return;
    const L = window.L;
    if (!L) return;

    const startLat = currentLocation?.lat || checkpoints[0]?.latitude || -7.7200;
    const startLng = currentLocation?.lng || checkpoints[0]?.longitude || 109.9084;

    const map = L.map(mapRef.current, { 
      zoomControl: !isMobile,
      attributionControl: true 
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.setView([startLat, startLng], isMobile ? 8 : 9);
    initializedRef.current = true;
    renderMarkers(L, map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [isMobile]);

  const renderMarkers = (L, map) => {
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    checkpoints.forEach((cp, i) => {
      const isReached = cp.status === "reached";
      const isNext = cp.status !== "reached" && !checkpoints.find(c => c.status !== "reached" && c.order_index < cp.order_index);
      
      const color = isReached ? "#10B981" : isNext ? "#3B82F6" : "#6B7280";
      const size = isMobile ? 28 : 34;
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${isMobile ? 10 : 13}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(`
          <b>${cp.city_name}</b><br>
          Tanggal: ${cp.scheduled_date || "--"}<br>
          Jadwal: ${cp.scheduled_time || "--:--"}<br>
          Status: ${isReached ? "✅ Tiba" : isNext ? "📍 Selanjutnya" : "⏳ Menunggu"}<br>
          ${cp.delay_minutes ? `Delay: ${cp.delay_minutes} menit` : ""}
          ${cp.is_final_destination ? "<br>🏁 Tujuan Akhir" : ""}
        `)
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (polylineRef.current) polylineRef.current.remove();
    const latlngs = checkpoints.map(cp => [cp.latitude, cp.longitude]);
    polylineRef.current = L.polyline(latlngs, { 
      color: "#3B82F6", 
      weight: isMobile ? 2 : 3, 
      opacity: 0.5, 
      dashArray: "8,4" 
    }).addTo(map);

    const reachedIndex = checkpoints.findIndex(c => c.status === "reached");
    if (reachedIndex >= 0 && reachedIndex < checkpoints.length - 1) {
      const nextIndex = reachedIndex + 1;
      const segment = L.polyline(
        [
          [checkpoints[reachedIndex].latitude, checkpoints[reachedIndex].longitude],
          [checkpoints[nextIndex].latitude, checkpoints[nextIndex].longitude]
        ],
        { color: "#10B981", weight: isMobile ? 3 : 4, opacity: 0.9 }
      ).addTo(map);
      markersRef.current.push(segment);
    }
  };

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !initializedRef.current) return;
    renderMarkers(L, mapInstanceRef.current);
  }, [checkpoints, isMobile]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !currentLocation || !initializedRef.current) return;

    if (currentMarkerRef.current) currentMarkerRef.current.remove();

    const size = isMobile ? 30 : 40;
    const pulseIcon = L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:${size}px;height:${size}px;background:rgba(59,130,246,0.2);border-radius:50%;animation:ping 1.5s infinite"></div>
        <div style="width:${isMobile ? 14 : 20}px;height:${isMobile ? 14 : 20}px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.6);position:relative;z-index:1"></div>
      </div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });

    currentMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: pulseIcon })
      .bindPopup("📍 Lokasi Saat Ini")
      .addTo(mapInstanceRef.current);

    if (sessionStatus === "active") {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], isMobile ? 11 : 13, { animate: true });
    }
  }, [currentLocation, sessionStatus, isMobile]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
    </div>
  );
}
