// TouringView.jsx
// Halaman View untuk Memantau Perjalanan
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiUser, FiDroplet,
  FiCheckCircle, FiAlertCircle, FiNavigation,
  FiShare2, FiEye, FiZap, FiInfo,
  FiArrowUp, FiArrowDown, FiCalendar
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
  container: {
    minHeight: "100vh",
    background: "#0F172A",
    color: "#F1F5F9",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  },
  containerMobile: {
    fontSize: "14px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "#1E293B",
    borderBottom: "1px solid #334155",
    flexWrap: "wrap",
    gap: "8px"
  },
  headerMobile: {
    padding: "8px 12px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#F1F5F9",
    margin: 0
  },
  headerTitleMobile: {
    fontSize: "14px"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "600"
  },
  statusBadgeMobile: {
    padding: "2px 8px",
    fontSize: "9px"
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#0F172A",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid #334155",
    flexWrap: "wrap"
  },
  statusText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#F1F5F9"
  },
  statusLocation: {
    fontSize: "10px",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  mainContent: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 65px)",
    overflow: "hidden"
  },
  mainContentMobile: {
    flexDirection: "column",
    height: "auto",
    minHeight: "calc(100vh - 90px)"
  },
  mapContainer: {
    flex: 1,
    padding: "12px",
    background: "#0F172A",
    position: "relative",
    minHeight: "300px"
  },
  mapContainerMobile: {
    padding: "6px",
    minHeight: "250px",
    height: "50vh"
  },
  sidebar: {
    width: "320px",
    minWidth: "280px",
    background: "#0F172A",
    borderLeft: "1px solid #1E293B",
    overflowY: "auto",
    padding: "12px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  sidebarMobile: {
    width: "100%",
    minWidth: "unset",
    borderLeft: "none",
    borderTop: "1px solid #1E293B",
    padding: "10px",
    maxHeight: "50vh"
  },
  infoCard: {
    background: "#1E293B",
    borderRadius: "10px",
    padding: "12px",
    border: "1px solid #334155"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    borderBottom: "1px solid #1E293B",
    fontSize: "11px"
  },
  infoLabel: {
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  infoValue: {
    color: "#F1F5F9",
    fontWeight: "600"
  },
  checkpointList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxHeight: "250px",
    overflowY: "auto"
  },
  checkpointListMobile: {
    maxHeight: "180px"
  },
  checkpointItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    background: "#0F172A",
    borderRadius: "6px",
    border: "1px solid #334155",
    transition: "all 0.3s"
  },
  checkpointStatus: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0
  },
  checkpointInfo: {
    flex: 1,
    minWidth: 0
  },
  checkpointName: {
    color: "#F1F5F9",
    fontWeight: "600",
    fontSize: "12px"
  },
  checkpointNameMobile: {
    fontSize: "11px"
  },
  checkpointTime: {
    color: "#64748B",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    flexWrap: "wrap"
  },
  checkpointTimeMobile: {
    fontSize: "9px"
  },
  checkpointBadge: {
    fontSize: "9px",
    padding: "2px 8px",
    borderRadius: "10px",
    fontWeight: "600"
  },
  delayBadge: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "10px",
    fontWeight: "600"
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    background: "rgba(16, 185, 129, 0.15)",
    borderRadius: "6px",
    border: "1px solid rgba(16, 185, 129, 0.3)"
  },
  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10B981",
    animation: "pulse 1.5s ease-in-out infinite"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#64748B",
    gap: "10px"
  },
  notificationPanelMobile: {
    bottom: "8px",
    right: "8px",
    left: "8px",
    maxWidth: "unset",
    width: "auto"
  },
  notificationItemMobile: {
    padding: "8px 10px",
    fontSize: "11px",
    gap: "6px"
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
  const [statusMessage, setStatusMessage] = useState({ text: "Menunggu", location: "", isMoving: false });
  const [totalDistance, setTotalDistance] = useState(0);
  const [stops, setStops] = useState([]);

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
      setTotalDistance(sessionData.total_distance_km || 0);

      // Load checkpoints dari database
      const { data: cpData, error: cpError } = await supabase
        .from("touring_checkpoints")
        .select("*")
        .eq("session_id", sessionData.id)
        .eq("is_deleted", false)
        .order("order_index");

      // Jika tidak ada checkpoint, coba dari checkpoints_data
      let finalCpData = [];
      if (!cpError && cpData && cpData.length > 0) {
        finalCpData = cpData;
      } else if (sessionData.checkpoints_data && sessionData.checkpoints_data.length > 0) {
        finalCpData = sessionData.checkpoints_data;
      }
      
      setCheckpoints(finalCpData);

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
        .limit(30);

      if (notifData) {
        setNotifications(notifData);
      }

      const { data: stopsData } = await supabase
        .from("touring_stops")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("stopped_at", { ascending: false });

      if (stopsData) {
        setStops(stopsData);
      }

      // Update status message
      updateStatusMessage(sessionData.status);

      subscribeToRealtime(sessionData.id);
      setLoading(false);
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Gagal memuat data sesi");
      setLoading(false);
    }
  };

  // ─── UPDATE STATUS ───────────────────────────────────────────────────────

  const updateStatusMessage = (status, location = null) => {
    let text = "";
    let loc = location || "";
    let moving = false;

    if (status === "active") {
      text = "🟢 Sedang Berjalan";
      moving = true;
    } else if (status === "completed") {
      text = "✅ Perjalanan Selesai";
      moving = false;
    } else {
      text = "⏳ Menunggu";
      moving = false;
    }

    setStatusMessage({ text, location: loc, isMoving: moving });
  };

  // ─── REALTIME SUBSCRIPTION ────────────────────────────────────────────────

  const subscribeToRealtime = (sessionId) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`session-view-${sessionId}`)
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
          
          if (session?.status === "active") {
            const isMoving = speed > 0.5 || (Date.now() - new Date(recorded_at).getTime()) < 10000;
            const text = isMoving ? "🟢 Sedang Berjalan" : "🔴 Sedang Berhenti";
            setStatusMessage(prev => ({ ...prev, text, isMoving }));
          }
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
          setNotifications(prev => [payload.new, ...prev].slice(0, 30));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "touring_sessions",
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new.total_distance_km !== undefined) {
            setTotalDistance(payload.new.total_distance_km);
          }
          if (payload.new.status !== undefined) {
            updateStatusMessage(payload.new.status);
          }
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
            width: "40px",
            height: "40px",
            border: "4px solid #1E293B",
            borderTop: "4px solid #3B82F6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Memuat data perjalanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.emptyState, height: "100vh" }}>
          <FiAlertCircle size={48} color="#EF4444" />
          <h2 style={{ color: "#F1F5F9", margin: 0, fontSize: "18px" }}>Sesi Tidak Ditemukan</h2>
          <p style={{ color: "#64748B", textAlign: "center", maxWidth: "400px", fontSize: "13px" }}>
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
          <FiEye size={isMobile ? 18 : 22} color="#3B82F6" />
          <h1 style={{ ...styles.headerTitle, ...(isMobile ? styles.headerTitleMobile : {}) }}>
            Pantau Perjalanan
          </h1>
          <span style={{
            background: "#1D4ED8",
            color: "#93C5FD",
            padding: "2px 10px",
            borderRadius: "16px",
            fontSize: isMobile ? "9px" : "11px",
            fontWeight: "600",
            letterSpacing: "1px",
            fontFamily: "monospace"
          }}>#{session?.session_code}</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statusContainer}>
            <span style={styles.statusText}>{statusMessage.text}</span>
            {statusMessage.location && (
              <span style={styles.statusLocation}>
                <FiMapPin size={9} /> {statusMessage.location}
              </span>
            )}
          </div>
          <span style={{
            ...styles.statusBadge,
            ...(isMobile ? styles.statusBadgeMobile : {}),
            background: isComplete ? "#1E293B" : session?.status === "active" ? "#065F46" : "#1E293B",
            color: isComplete ? "#94A3B8" : session?.status === "active" ? "#6EE7B7" : "#94A3B8"
          }}>
            {isComplete ? <FiCheckCircle size={10} /> : session?.status === "active" ? <FiZap size={10} /> : <FiClock size={10} />}
            {isComplete ? "Selesai" : session?.status === "active" ? "Live" : "Menunggu"}
          </span>
          <span style={{
            ...styles.statusBadge,
            ...(isMobile ? styles.statusBadgeMobile : {}),
            background: "#1E293B",
            color: "#64748B"
          }}>
            <FiClock size={10} />
            {lastUpdate.toLocaleTimeString("id-ID")}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ ...styles.mainContent, ...(isMobile ? styles.mainContentMobile : {}) }}>
        {/* Map - PASTI MUNCUL */}
        <div style={{ ...styles.mapContainer, ...(isMobile ? styles.mapContainerMobile : {}) }}>
          <ViewMap
            checkpoints={checkpoints}
            currentLocation={currentLocation}
            sessionStatus={session?.status}
            nextCheckpoint={nextCheckpoint}
            isMobile={isMobile}
            statusMessage={statusMessage}
            totalDistance={totalDistance}
            stops={stops}
          />
          {session?.status === "active" && currentLocation && (
            <div style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              ...styles.liveIndicator
            }}>
              <div style={styles.pulseDot}></div>
              <span style={{ color: "#6EE7B7", fontSize: "12px", fontWeight: "600" }}>
                LIVE - {lastUpdate.toLocaleTimeString("id-ID")}
              </span>
              {totalDistance > 0 && (
                <span style={{ color: "#94A3B8", fontSize: "11px", marginLeft: "8px" }}>
                  {totalDistance.toFixed(1)} km
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}) }}>
          {/* Session Info */}
          <div style={styles.infoCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
              {transportIcon}
              <span style={{ color: "#F1F5F9", fontWeight: "600", fontSize: "13px" }}>
                {transportLabel}
              </span>
              {session?.plate_number && (
                <span style={{ color: "#64748B", fontSize: "11px" }}>
                  {session.plate_number}
                </span>
              )}
              {isComplete && (
                <span style={{ color: "#10B981", fontSize: "10px", fontWeight: "600" }}>
                  ✅ Selesai
                </span>
              )}
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}><FiUser size={11} /> Pengemudi</span>
              <span style={styles.infoValue}>{session?.driver_name || "-"}</span>
            </div>
            {session?.fuel_liters && session.transport_type !== "kereta" && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiDroplet size={11} /> Bensin</span>
                <span style={styles.infoValue}>{session.fuel_liters} L</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}><FiMapPin size={11} /> Progress</span>
              <span style={styles.infoValue}>
                {reachedCount}/{totalCheckpoints} Kota
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}><FiMapPin size={11} /> Total Jarak</span>
              <span style={styles.infoValue}>{totalDistance.toFixed(1)} km</span>
            </div>
            {stops.length > 0 && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiClock size={11} /> Total Berhenti</span>
                <span style={styles.infoValue}>{stops.length} kali</span>
              </div>
            )}
            {distanceToNext !== null && nextCheckpoint && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}><FiNavigation size={11} /> Ke {nextCheckpoint.city_name}</span>
                <span style={styles.infoValue}>
                  {distanceToNext < 1 ? `${(distanceToNext * 1000).toFixed(0)} m` : `${distanceToNext.toFixed(1)} km`}
                </span>
              </div>
            )}
          </div>

          {/* Checkpoints */}
          <div style={styles.infoCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ color: "#94A3B8", fontSize: "12px", fontWeight: "600" }}>
                <FiMapPin size={12} style={{ marginRight: "4px" }} />
                Rute Perjalanan
              </span>
              <span style={{ color: "#64748B", fontSize: "10px" }}>
                {reachedCount > 0 && `${reachedCount}/${totalCheckpoints}`}
              </span>
            </div>
            <div style={{ ...styles.checkpointList, ...(isMobile ? styles.checkpointListMobile : {}) }}>
              {checkpoints.map((cp) => {
                const isReached = cp.status === "reached";
                const isNext = cp.status !== "reached" && !checkpoints.find(c => c.status !== "reached" && c.order_index < cp.order_index);
                
                return (
                  <div key={cp.id || cp.order_index} style={{
                    ...styles.checkpointItem,
                    borderColor: isReached ? "#065F46" : isNext ? "#1D4ED8" : "#334155",
                    opacity: isReached ? 0.8 : 1
                  }}>
                    <div style={{
                      ...styles.checkpointStatus,
                      background: isReached ? "#10B981" : isNext ? "#3B82F6" : "#475569"
                    }} />
                    <div style={styles.checkpointInfo}>
                      <div style={{ ...styles.checkpointName, ...(isMobile ? styles.checkpointNameMobile : {}) }}>
                        {cp.city_name}
                        {cp.is_final_destination && <span style={{ color: "#F59E0B", marginLeft: "4px" }}>🏁</span>}
                        {isReached && <FiCheckCircle size={10} color="#10B981" style={{ marginLeft: "4px" }} />}
                        {isNext && <span style={{ color: "#60A5FA", fontSize: "9px", marginLeft: "4px" }}>NEXT</span>}
                      </div>
                      <div style={{ ...styles.checkpointTime, ...(isMobile ? styles.checkpointTimeMobile : {}) }}>
                        <FiCalendar size={9} /> {formatDate(cp.scheduled_date)}
                        <FiClock size={9} /> {formatTime(cp.scheduled_time)}
                        {cp.delay_minutes !== 0 && cp.delay_minutes != null && (
                          <span style={{
                            ...styles.delayBadge,
                            background: cp.delay_minutes > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: cp.delay_minutes > 0 ? "#FCA5A5" : "#FDE68A"
                          }}>
                            {cp.delay_minutes > 0 ? <FiArrowDown size={8} /> : <FiArrowUp size={8} />}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: "#94A3B8", fontSize: "12px", fontWeight: "600" }}>
                  <FiInfo size={12} style={{ marginRight: "4px" }} />
                  Notifikasi
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: isMobile ? "80px" : "120px", overflowY: "auto" }}>
                {notifications.slice(0, isMobile ? 3 : 5).map((n, i) => (
                  <div key={n.id || i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    background: "#0F172A",
                    borderRadius: "4px",
                    fontSize: isMobile ? "10px" : "11px"
                  }}>
                    {n.type === "late" ? <FiArrowDown size={10} color="#EF4444" /> :
                     n.type === "early" ? <FiArrowUp size={10} color="#F59E0B" /> :
                     n.type === "info" ? <FiInfo size={10} color="#3B82F6" /> :
                     <FiCheckCircle size={10} color="#10B981" />}
                    <span style={{ color: "#94A3B8", flex: 1 }}>{n.message}</span>
                    <span style={{ color: "#475569", fontSize: "9px" }}>
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
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @media (max-width: 768px) {
          .leaflet-control-zoom {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── VIEW MAP ────────────────────────────────────────────────────────────────

function ViewMap({ checkpoints, currentLocation, sessionStatus, nextCheckpoint, isMobile, statusMessage, totalDistance, stops }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || mapInstanceRef.current) return;
    
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        setTimeout(initMap, 300);
      };
      document.head.appendChild(script);
      return;
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  const initMap = () => {
    const L = window.L;
    if (!L) return;

    const startLat = currentLocation?.lat || (checkpoints[0]?.latitude || -7.7200);
    const startLng = currentLocation?.lng || (checkpoints[0]?.longitude || 109.9084);

    const map = L.map(mapRef.current, { 
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: true,
      zoomAnimation: true
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.setView([startLat, startLng], isMobile ? 8 : 9);
    initializedRef.current = true;
    
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    renderMarkers(L, map);
  };

  const renderMarkers = (L, map) => {
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    checkpoints.forEach((cp, i) => {
      const isReached = cp.status === "reached";
      const isNext = cp.status !== "reached" && !checkpoints.find(c => c.status !== "reached" && c.order_index < cp.order_index);
      
      const color = isReached ? "#10B981" : isNext ? "#3B82F6" : "#6B7280";
      const size = isMobile ? 26 : 32;
      
      const popupContent = `
        <div style="font-family: Arial, sans-serif; padding: 4px;">
          <b style="font-size: ${isMobile ? '12px' : '14px'};">${i + 1}. ${cp.city_name}</b><br>
          <span style="font-size: ${isMobile ? '10px' : '12px'}; color: #666;">
            📅 ${cp.scheduled_date || "--"}<br>
            ⏰ ${cp.scheduled_time || "--:--"}<br>
            Status: ${isReached ? "✅ Tiba" : isNext ? "📍 Selanjutnya" : "⏳ Menunggu"}<br>
            ${cp.delay_minutes ? `⏱️ Delay: ${cp.delay_minutes} menit` : ""}
            ${cp.is_final_destination ? "<br>🏁 Tujuan Akhir" : ""}
          </span>
        </div>
      `;
      
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${isMobile ? 9 : 12}px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
      
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(popupContent)
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (polylineRef.current) polylineRef.current.remove();
    if (checkpoints.length > 1) {
      const latlngs = checkpoints.map(cp => [cp.latitude, cp.longitude]);
      polylineRef.current = L.polyline(latlngs, { 
        color: "#3B82F6", 
        weight: isMobile ? 2 : 3, 
        opacity: 0.5, 
        dashArray: "8,4" 
      }).addTo(map);
    }

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

    const size = isMobile ? 28 : 36;
    const isMoving = statusMessage?.isMoving !== false && sessionStatus !== "completed";
    const color = isMoving ? "#3B82F6" : sessionStatus === "completed" ? "#10B981" : "#EF4444";
    
    const popupContent = `
      <div style="font-family: Arial, sans-serif; padding: 4px;">
        <b style="font-size: ${isMobile ? '12px' : '14px'};">📍 Lokasi Saat Ini</b><br>
        <span style="font-size: ${isMobile ? '10px' : '12px'}; color: #666;">
          Status: ${statusMessage?.text || 'Sedang Berjalan'}<br>
          Lokasi: ${statusMessage?.location || '-'}<br>
          Total Jarak: ${totalDistance?.toFixed(1) || 0} km
          ${stops?.length > 0 ? `<br>Berhenti: ${stops.length} kali` : ''}
        </span>
      </div>
    `;
    
    const pulseIcon = L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:${size}px;height:${size}px;background:${color}33;border-radius:50%;animation:ping 1.5s infinite"></div>
        <div style="width:${isMobile ? 12 : 18}px;height:${isMobile ? 12 : 18}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 12px ${color}99;position:relative;z-index:1;transition:background 0.5s"></div>
        ${!isMoving && sessionStatus === "active" ? `<div style="position:absolute;top:-6px;right:-6px;background:#EF4444;border-radius:50%;width:12px;height:12px;display:flex;align-items:center;justify-content:center;font-size:7px;color:white;border:2px solid white;">⏸</div>` : ''}
        ${sessionStatus === "completed" ? `<div style="position:absolute;top:-6px;right:-6px;background:#10B981;border-radius:50%;width:12px;height:12px;display:flex;align-items:center;justify-content:center;font-size:7px;color:white;border:2px solid white;">✓</div>` : ''}
      </div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });

    currentMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: pulseIcon })
      .bindPopup(popupContent)
      .addTo(mapInstanceRef.current);

    if (sessionStatus === "active") {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], isMobile ? 11 : 13, { animate: true });
    }
    
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  }, [currentLocation, sessionStatus, isMobile, statusMessage, totalDistance, stops]);

  // Force invalidate size on resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 300);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "250px" }}>
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
        }
        .leaflet-popup-content {
          margin: 8px 10px !important;
        }
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          min-height: 250px !important;
        }
        @media (max-width: 768px) {
          .leaflet-control-zoom {
            display: flex !important;
          }
        }
      `}</style>
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "250px", borderRadius: "10px" }} />
    </div>
  );
}
