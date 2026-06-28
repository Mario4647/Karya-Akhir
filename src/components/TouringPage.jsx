// TouringPage.jsx
// Halaman Utama Touring Tracker - Dengan Semua Fitur Real-Time
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiAlertCircle, FiCheckCircle,
  FiSettings, FiShare2, FiPlus, FiTrash2, FiEdit2, FiSave,
  FiNavigation, FiUser, FiDroplet, FiArrowUp, FiArrowDown,
  FiRefreshCw, FiEye, FiX, FiChevronUp, FiChevronDown,
  FiZap, FiMenu, FiMap, FiBell, FiList, FiPlay, FiSquare,
  FiHash, FiGlobe, FiMinus, FiInfo, FiLink, FiEyeOff,
  FiCalendar, FiClock as FiClockIcon, FiUsers, FiMoreVertical,
  FiPower, FiAlertTriangle, FiFileText, FiDownload, FiPrinter,
  FiHome, FiTrendingUp
} from "react-icons/fi";
import { MdTwoWheeler, MdDirectionsCar, MdDirectionsWalk, MdTrain } from "react-icons/md";

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

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { 
    day: "numeric", 
    month: "short", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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
    motor: <MdTwoWheeler size={16} />,
    mobil: <MdDirectionsCar size={16} />,
    jalan: <MdDirectionsWalk size={16} />,
    kereta: <MdTrain size={16} />
  };
  return icons[type] || <MdDirectionsCar size={16} />;
}

function getTransportLabel(type) {
  const labels = { motor: "Motor", mobil: "Mobil", jalan: "Jalan Kaki", kereta: "Kereta" };
  return labels[type] || "Mobil";
}

function getStopReason(lat, lng) {
  // Daftar lokasi SPBU (aproximasi)
  const spbuLocations = [
    { lat: -7.7956, lng: 110.3695, name: "SPBU Yogyakarta" },
    { lat: -7.7200, lng: 109.9084, name: "SPBU Kutoarjo" },
    { lat: -7.7059, lng: 110.6077, name: "SPBU Klaten" },
  ];
  
  for (const spbu of spbuLocations) {
    const dist = getDistanceKm(lat, lng, spbu.lat, spbu.lng);
    if (dist < 0.5) {
      return { reason: "Pengisian BBM", location: spbu.name };
    }
  }
  return null;
}

const TRANSPORT_OPTIONS = [
  { value: "motor", label: "Motor", icon: <MdTwoWheeler size={20} /> },
  { value: "mobil", label: "Mobil", icon: <MdDirectionsCar size={20} /> },
  { value: "kereta", label: "Kereta", icon: <MdTrain size={20} /> },
  { value: "jalan", label: "Jalan Kaki", icon: <MdDirectionsWalk size={20} /> }
];

const DEFAULT_CHECKPOINTS = [
  { 
    city_name: "Kutoarjo", 
    latitude: -7.7200, 
    longitude: 109.9084, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "07:00",
    is_final_destination: false
  },
  { 
    city_name: "Yogyakarta", 
    latitude: -7.7956, 
    longitude: 110.3695, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "08:30",
    is_final_destination: false
  },
  { 
    city_name: "Klaten", 
    latitude: -7.7059, 
    longitude: 110.6077, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "09:30",
    is_final_destination: false
  },
  { 
    city_name: "Wonogiri", 
    latitude: -7.8126, 
    longitude: 110.9228, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "11:00",
    is_final_destination: false
  },
  { 
    city_name: "Purwantoro", 
    latitude: -7.8717, 
    longitude: 111.3321, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "12:30",
    is_final_destination: false
  },
  { 
    city_name: "Ponorogo", 
    latitude: -7.8683, 
    longitude: 111.4617, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "14:00",
    is_final_destination: false
  },
  { 
    city_name: "Trenggalek", 
    latitude: -8.0501, 
    longitude: 111.7082, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "15:30",
    is_final_destination: false
  },
  { 
    city_name: "Tulungagung", 
    latitude: -8.0661, 
    longitude: 111.9044, 
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "17:00",
    is_final_destination: true
  },
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
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [transport, setTransport] = useState({ 
    transport_type: "motor", 
    plate_number: "", 
    driver_name: "", 
    fuel_liters: 5 
  });
  const [currentLocation, setCurrentLocation] = useState({ lat: -7.7200, lng: 109.9084 });
  const [sessionStatus, setSessionStatus] = useState("pending");
  const [isTracking, setIsTracking] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(true);
  const [editingCheckpoint, setEditingCheckpoint] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);
  const [showSessionList, setShowSessionList] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [lateDeparture, setLateDeparture] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [statusMessage, setStatusMessage] = useState({ text: "Belum Mulai", location: "", isMoving: false });
  const [stops, setStops] = useState([]);
  const [isStopped, setIsStopped] = useState(false);
  const [stopStartTime, setStopStartTime] = useState(null);
  const [currentStopId, setCurrentStopId] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [hasReport, setHasReport] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const watchIdRef = useRef(null);
  const notificationIdRef = useRef(0);
  const sessionIdRef = useRef(null);
  const isMounted = useRef(true);
  const loadAttempted = useRef(false);
  const autoStartIntervalRef = useRef(null);
  const backgroundIntervalRef = useRef(null);
  const movementCheckIntervalRef = useRef(null);
  const locationHistoryRef = useRef([]);
  const totalDistanceRef = useRef(0);
  const isTrackingRef = useRef(false);
  const lastLocationRef = useRef(null);
  const stopCheckTimerRef = useRef(null);
  const isCompletedRef = useRef(false);

  // ─── RESPONSIVE ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── FUNGSI ──────────────────────────────────────────────────────────────────

  // Load semua session
  const loadAllSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("touring_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (isMounted.current) {
        setSessions(data || []);
        
        const savedSession = localStorage.getItem("touring_session");
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            const existing = data?.find(s => s.id === parsed.id);
            if (existing) {
              setSelectedSessionId(existing.id);
              await loadSessionData(existing.id);
              return;
            }
          } catch (e) {}
        }
        
        if (data && data.length > 0) {
          setSelectedSessionId(data[0].id);
          await loadSessionData(data[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setError("Gagal memuat daftar perjalanan");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load data session tertentu dengan semua data terkait
  const loadSessionData = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      
      // Load session
      const { data, error } = await supabase
        .from("touring_sessions")
        .select("*, touring_checkpoints(*)")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      if (!isMounted.current) return;

      // Cek apakah session sudah selesai
      const isCompleted = data.status === "completed" || 
        data.touring_checkpoints?.some(cp => cp.is_final_destination && cp.status === "reached");
      
      setIsCompleted(isCompleted);
      isCompletedRef.current = isCompleted;

      setSession(data);
      setSessionCode(data.session_code);
      setSessionStatus(data.status || "pending");
      setLateDeparture(data.late_departure || false);
      setTotalDistance(data.total_distance_km || 0);
      totalDistanceRef.current = data.total_distance_km || 0;
      setHasReport(data.report_generated || false);
      
      setTransport({
        transport_type: data.transport_type || "motor",
        plate_number: data.plate_number || "",
        driver_name: data.driver_name || "",
        fuel_liters: data.fuel_liters || 5
      });
      
      // Load checkpoints dari database, bukan default
      if (data.touring_checkpoints && data.touring_checkpoints.length > 0) {
        const sorted = data.touring_checkpoints.sort((a, b) => a.order_index - b.order_index);
        setCheckpoints(sorted);
      } else {
        // Jika tidak ada checkpoints, buat default
        const today = new Date().toISOString().split('T')[0];
        const defaultCps = DEFAULT_CHECKPOINTS.map((cp, i) => ({
          ...cp,
          id: undefined,
          session_id: sessionId,
          order_index: i,
          scheduled_date: cp.scheduled_date || today,
          status: "pending"
        }));
        setCheckpoints(defaultCps);
        // Simpan ke database
        await saveCheckpointsToDb(sessionId, defaultCps);
      }
      
      sessionIdRef.current = data.id;
      setSelectedSessionId(data.id);
      localStorage.setItem("touring_session", JSON.stringify({ id: data.id, code: data.session_code }));

      // Load notifications
      const { data: notifData } = await supabase
        .from("touring_notifications")
        .select("*")
        .eq("session_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (notifData) {
        setNotifications(notifData);
      }

      // Load stops
      const { data: stopsData } = await supabase
        .from("touring_stops")
        .select("*")
        .eq("session_id", data.id)
        .order("stopped_at", { ascending: false });

      if (stopsData) {
        setStops(stopsData);
      }

      // Load latest tracking
      const { data: trackData } = await supabase
        .from("touring_location_tracking")
        .select("*")
        .eq("session_id", data.id)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (trackData && trackData.length > 0) {
        setCurrentLocation({
          lat: trackData[0].latitude,
          lng: trackData[0].longitude
        });
        lastLocationRef.current = {
          lat: trackData[0].latitude,
          lng: trackData[0].longitude
        };
      }

      // Jangan auto-start jika sudah completed
      if (data.status === "active" && !isCompleted) {
        setIsTracking(true);
        isTrackingRef.current = true;
        startBackgroundTracking(data.id);
        startMovementDetection();
      } else if (isCompleted) {
        // Jika sudah selesai, pastikan tracking mati
        stopTracking();
      }

      // Start auto-start checker hanya jika belum selesai
      if (!isCompleted) {
        startAutoStartChecker(data.id);
      }

      // Update status message
      updateStatusMessage(data.status);

    } catch (error) {
      console.error("Error loading session data:", error);
      setError("Gagal memuat data perjalanan");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Simpan checkpoints ke database
  const saveCheckpointsToDb = useCallback(async (sessionId, cps) => {
    try {
      const checkpointsData = cps.map((cp, i) => ({
        session_id: sessionId,
        order_index: i,
        city_name: cp.city_name,
        latitude: cp.latitude,
        longitude: cp.longitude,
        scheduled_date: cp.scheduled_date || new Date().toISOString().split('T')[0],
        scheduled_time: cp.scheduled_time || "12:00",
        scheduled_datetime: cp.scheduled_date && cp.scheduled_time 
          ? new Date(`${cp.scheduled_date}T${cp.scheduled_time}:00`).toISOString()
          : null,
        status: cp.status || "pending",
        is_final_destination: cp.is_final_destination || false,
        delay_minutes: cp.delay_minutes || 0
      }));

      const { error } = await supabase
        .from("touring_checkpoints")
        .insert(checkpointsData);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving checkpoints:", error);
    }
  }, []);

  // Buat session baru
  const createNewSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsCreatingNew(true);
      
      const code = generateSessionCode();
      const today = new Date().toISOString().split('T')[0];
      const { data: newSession, error: createError } = await supabase
        .from("touring_sessions")
        .insert({
          session_code: code,
          title: `Touring ${new Date().toLocaleDateString("id-ID")}`,
          transport_type: "motor",
          status: "pending",
          late_departure: false,
          total_distance_km: 0,
          report_generated: false
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
        scheduled_date: cp.scheduled_date || today,
        scheduled_time: cp.scheduled_time,
        scheduled_datetime: new Date(`${cp.scheduled_date || today}T${cp.scheduled_time}:00`).toISOString(),
        status: "pending",
        is_final_destination: cp.is_final_destination || false
      }));

      const { error: cpError } = await supabase
        .from("touring_checkpoints")
        .insert(checkpointsData);

      if (cpError) throw cpError;

      // Refresh session list
      const { data: sessionsData } = await supabase
        .from("touring_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData);
      }

      setSelectedSessionId(newSession.id);
      sessionIdRef.current = newSession.id;
      localStorage.setItem("touring_session", JSON.stringify({ id: newSession.id, code: newSession.session_code }));
      
      await loadSessionData(newSession.id);

    } catch (error) {
      console.error("Error creating session:", error);
      setError("Gagal membuat perjalanan baru");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsCreatingNew(false);
      }
    }
  }, [loadSessionData]);

  // Hapus session
  const deleteSession = useCallback(async (sessionId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus perjalanan ini?")) return;
    
    try {
      const { error } = await supabase
        .from("touring_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (selectedSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          setSelectedSessionId(remaining[0].id);
          await loadSessionData(remaining[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Gagal menghapus perjalanan");
    }
  }, [selectedSessionId, sessions, loadSessionData, createNewSession]);

  // Simpan perubahan ke database
  const saveToDatabase = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from("touring_sessions")
        .update({
          transport_type: transport.transport_type,
          plate_number: transport.plate_number,
          driver_name: transport.driver_name,
          fuel_liters: transport.fuel_liters,
          status: sessionStatus,
          late_departure: lateDeparture,
          total_distance_km: totalDistanceRef.current,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionIdRef.current);

      for (const cp of checkpoints) {
        if (cp.id) {
          const scheduledDatetime = cp.scheduled_date && cp.scheduled_time 
            ? new Date(`${cp.scheduled_date}T${cp.scheduled_time}:00`).toISOString()
            : null;
          
          await supabase
            .from("touring_checkpoints")
            .update({
              city_name: cp.city_name,
              latitude: cp.latitude,
              longitude: cp.longitude,
              scheduled_date: cp.scheduled_date,
              scheduled_time: cp.scheduled_time,
              scheduled_datetime: scheduledDatetime,
              order_index: checkpoints.indexOf(cp),
              status: cp.status || "pending",
              delay_minutes: cp.delay_minutes || 0,
              is_final_destination: cp.is_final_destination || false
            })
            .eq("id", cp.id)
            .eq("session_id", sessionIdRef.current);
        }
      }

      const { data: sessionsData } = await supabase
        .from("touring_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData);
      }

    } catch (error) {
      console.error("Error saving to database:", error);
    }
  }, [checkpoints, transport, sessionStatus, lateDeparture]);

  // ─── UPDATE STATUS MESSAGE ──────────────────────────────────────────────

  const updateStatusMessage = useCallback((status, location = null, isMoving = null) => {
    let text = "";
    let loc = location || "";
    let moving = false;

    if (status === "active" && !isCompletedRef.current) {
      if (isMoving !== null) {
        moving = isMoving;
        text = isMoving ? "🟢 Sedang Berjalan" : "🔴 Sedang Berhenti";
      } else {
        const lastTrack = locationHistoryRef.current[locationHistoryRef.current.length - 1];
        if (lastTrack) {
          const now = Date.now();
          const timeDiff = (now - lastTrack.timestamp) / 1000;
          moving = timeDiff < 10;
          text = moving ? "🟢 Sedang Berjalan" : "🔴 Sedang Berhenti";
        } else {
          text = "🟢 Sedang Berjalan";
          moving = true;
        }
      }
    } else if (status === "completed" || isCompletedRef.current) {
      text = "✅ Perjalanan Selesai";
      moving = false;
    } else {
      text = "⏳ Belum Mulai";
      moving = false;
    }

    if (location) {
      loc = location;
    } else if (currentLocation && !isCompletedRef.current) {
      let nearest = "";
      let minDist = Infinity;
      for (const cp of checkpoints) {
        const dist = getDistanceKm(currentLocation.lat, currentLocation.lng, cp.latitude, cp.longitude);
        if (dist < minDist) {
          minDist = dist;
          nearest = cp.city_name;
        }
      }
      loc = minDist < 10 ? nearest : `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
    }

    setStatusMessage({ text, location: loc, isMoving: moving });
    setIsStopped(!moving && status === "active" && !isCompletedRef.current);
  }, [currentLocation, checkpoints]);

  // ─── MOVEMENT DETECTION ──────────────────────────────────────────────────

  const startMovementDetection = useCallback(() => {
    if (movementCheckIntervalRef.current) {
      clearInterval(movementCheckIntervalRef.current);
    }

    movementCheckIntervalRef.current = setInterval(() => {
      if (!isTrackingRef.current || !sessionIdRef.current || isCompletedRef.current) return;

      const lastTrack = locationHistoryRef.current[locationHistoryRef.current.length - 1];
      if (!lastTrack) return;

      const now = Date.now();
      const timeDiff = (now - lastTrack.timestamp) / 1000;
      const isMoving = timeDiff < 15;

      const currentMoving = statusMessage.isMoving;
      if (isMoving !== currentMoving && sessionStatus === "active" && !isCompletedRef.current) {
        updateStatusMessage("active", null, isMoving);
        
        if (!isMoving) {
          recordStop(lastTrack.lat, lastTrack.lng);
        } else {
          resumeFromStop();
        }
      }

      updateStatusMessage("active", null, isMoving);

    }, 5000);
  }, [statusMessage, sessionStatus, updateStatusMessage]);

  // ─── RECORD STOP ─────────────────────────────────────────────────────────

  const recordStop = useCallback(async (lat, lng) => {
    if (currentStopId || isCompletedRef.current) return;

    try {
      const stopInfo = getStopReason(lat, lng);
      const reason = stopInfo ? stopInfo.reason : "Istirahat";
      const locationName = stopInfo ? stopInfo.location : "Lokasi saat ini";

      const { data: stopData, error } = await supabase
        .from("touring_stops")
        .insert({
          session_id: sessionIdRef.current,
          latitude: lat,
          longitude: lng,
          stop_reason: reason,
          location_name: locationName,
          stopped_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && stopData) {
        setCurrentStopId(stopData.id);
        setStopStartTime(new Date());
        setStops(prev => [stopData, ...prev]);
        addNotification("info", `🛑 Berhenti: ${reason} di ${locationName}`, 0);
      }
    } catch (error) {
      console.error("Error recording stop:", error);
    }
  }, [currentStopId]);

  // ─── RESUME FROM STOP ────────────────────────────────────────────────────

  const resumeFromStop = useCallback(async () => {
    if (!currentStopId || isCompletedRef.current) return;

    try {
      const now = new Date();
      const duration = stopStartTime ? Math.floor((now - stopStartTime) / 60000) : 0;

      await supabase
        .from("touring_stops")
        .update({
          resumed_at: now.toISOString(),
          duration_minutes: duration
        })
        .eq("id", currentStopId);

      setCurrentStopId(null);
      setStopStartTime(null);
      
      setStops(prev => prev.map(s => 
        s.id === currentStopId 
          ? { ...s, resumed_at: now.toISOString(), duration_minutes: duration }
          : s
      ));

      addNotification("info", `🚀 Melanjutkan perjalanan setelah ${duration} menit`, 0);
    } catch (error) {
      console.error("Error resuming from stop:", error);
    }
  }, [currentStopId, stopStartTime]);

  // ─── BACKGROUND TRACKING ──────────────────────────────────────────────────

  const startBackgroundTracking = useCallback((sessionId) => {
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
    }

    backgroundIntervalRef.current = setInterval(() => {
      if (!sessionId || !isTrackingRef.current || isCompletedRef.current) return;
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, speed, heading } = position.coords;
          const now = Date.now();
          
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          if (lastLocationRef.current) {
            const dist = getDistanceKm(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng,
              latitude,
              longitude
            );
            if (dist > 0.01) {
              totalDistanceRef.current += dist;
              setTotalDistance(totalDistanceRef.current);
            }
          }
          lastLocationRef.current = { lat: latitude, lng: longitude };

          locationHistoryRef.current.push({
            lat: latitude,
            lng: longitude,
            timestamp: now
          });
          if (locationHistoryRef.current.length > 100) {
            locationHistoryRef.current.shift();
          }

          await supabase
            .from("touring_location_tracking")
            .insert({
              session_id: sessionId,
              latitude,
              longitude,
              speed: speed || 0,
              heading: heading || 0
            });

          await supabase
            .from("touring_sessions")
            .update({ total_distance_km: totalDistanceRef.current })
            .eq("id", sessionId);

          if (!isCompletedRef.current) {
            checkForCheckpoint(latitude, longitude);
            updateStatusMessage("active", null, true);
          }
          
          if (isMounted.current) {
            setTotalDistance(totalDistanceRef.current);
          }
        },
        (error) => {
          console.error("Background geolocation error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }, 5000);
  }, [updateStatusMessage]);

  const stopBackgroundTracking = useCallback(() => {
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
      backgroundIntervalRef.current = null;
    }
    if (movementCheckIntervalRef.current) {
      clearInterval(movementCheckIntervalRef.current);
      movementCheckIntervalRef.current = null;
    }
    isTrackingRef.current = false;
  }, []);

  // ─── AUTO START CHECKER ──────────────────────────────────────────────────

  const startAutoStartChecker = useCallback((sessionId) => {
    if (autoStartIntervalRef.current) {
      clearInterval(autoStartIntervalRef.current);
    }

    autoStartIntervalRef.current = setInterval(async () => {
      // Jangan auto-start jika sudah selesai
      if (!sessionId || lateDeparture || sessionStatus === "active" || 
          sessionStatus === "completed" || isCompletedRef.current) return;

      try {
        const { data: cpData } = await supabase
          .from("touring_checkpoints")
          .select("*")
          .eq("session_id", sessionId)
          .eq("order_index", 0)
          .single();

        if (!cpData || !cpData.scheduled_date || !cpData.scheduled_time) return;

        const scheduledDateTime = new Date(`${cpData.scheduled_date}T${cpData.scheduled_time}:00`);
        const now = new Date();
        
        if (now >= scheduledDateTime) {
          // Cek apakah sudah mencapai final destination
          const { data: finalCp } = await supabase
            .from("touring_checkpoints")
            .select("*")
            .eq("session_id", sessionId)
            .eq("is_final_destination", true)
            .single();

          if (finalCp && finalCp.status === "reached") {
            await supabase
              .from("touring_sessions")
              .update({ 
                status: "completed",
                completed_at: new Date().toISOString()
              })
              .eq("id", sessionId);
            setSessionStatus("completed");
            isCompletedRef.current = true;
            setIsCompleted(true);
            stopTracking();
            return;
          }

          // Auto start
          const { data: sessionData } = await supabase
            .from("touring_sessions")
            .update({ 
              status: "active",
              auto_started: true
            })
            .eq("id", sessionId)
            .select()
            .single();

          if (sessionData) {
            setSessionStatus("active");
            setIsTracking(true);
            isTrackingRef.current = true;
            startBackgroundTracking(sessionId);
            startMovementDetection();
            addNotification("info", "🚀 Perjalanan dimulai otomatis sesuai jadwal", 0);
            updateStatusMessage("active");
          }
        }
      } catch (error) {
        console.error("Auto-start checker error:", error);
      }
    }, 30000);
  }, [lateDeparture, sessionStatus, startBackgroundTracking, updateStatusMessage]);

  // ─── TRACKING FUNCTIONS ──────────────────────────────────────────────────

  const startTracking = useCallback(() => {
    // Cegah jika sudah selesai
    if (isCompletedRef.current) {
      alert("Perjalanan ini sudah selesai. Tidak dapat memulai ulang.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation. Pastikan GPS aktif.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {
        alert("Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.");
      },
      { enableHighAccuracy: true }
    );

    setIsTracking(true);
    isTrackingRef.current = true;
    setSessionStatus("active");
    setLateDeparture(false);
    totalDistanceRef.current = 0;
    setTotalDistance(0);
    locationHistoryRef.current = [];
    isCompletedRef.current = false;
    setIsCompleted(false);

    supabase
      .from("touring_sessions")
      .update({ 
        status: "active",
        late_departure: false,
        auto_started: false,
        total_distance_km: 0
      })
      .eq("id", sessionIdRef.current)
      .then(() => saveToDatabase());

    startBackgroundTracking(sessionIdRef.current);
    startMovementDetection();
    updateStatusMessage("active");

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const now = Date.now();
        
        if (isCompletedRef.current) return;
        
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        if (lastLocationRef.current) {
          const dist = getDistanceKm(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            latitude,
            longitude
          );
          if (dist > 0.01) {
            totalDistanceRef.current += dist;
            setTotalDistance(totalDistanceRef.current);
          }
        }
        lastLocationRef.current = { lat: latitude, lng: longitude };

        locationHistoryRef.current.push({
          lat: latitude,
          lng: longitude,
          timestamp: now
        });
        if (locationHistoryRef.current.length > 100) {
          locationHistoryRef.current.shift();
        }

        await supabase
          .from("touring_location_tracking")
          .insert({
            session_id: sessionIdRef.current,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0
          });

        await supabase
          .from("touring_sessions")
          .update({ total_distance_km: totalDistanceRef.current })
          .eq("id", sessionIdRef.current);

        if (!isCompletedRef.current) {
          checkForCheckpoint(latitude, longitude);
          updateStatusMessage("active", null, true);
        }
        setTotalDistance(totalDistanceRef.current);
      },
      (error) => {
        console.error("Watch position error:", error);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    addNotification("info", "🚀 Perjalanan dimulai!", 0);
  }, [saveToDatabase, startBackgroundTracking, updateStatusMessage]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (currentStopId) {
      await resumeFromStop();
    }
    
    stopBackgroundTracking();
    setIsTracking(false);
    isTrackingRef.current = false;
    setSessionStatus("completed");
    isCompletedRef.current = true;
    setIsCompleted(true);

    await supabase
      .from("touring_sessions")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString(),
        total_distance_km: totalDistanceRef.current
      })
      .eq("id", sessionIdRef.current);

    saveToDatabase();
    updateStatusMessage("completed");
    addNotification("info", `✅ Perjalanan selesai! Total jarak: ${totalDistanceRef.current.toFixed(1)} km`, 0);
    
    // Generate report otomatis
    await generateReport();
  }, [saveToDatabase, stopBackgroundTracking, updateStatusMessage, currentStopId, resumeFromStop]);

  // ─── CHECK CHECKPOINT ──────────────────────────────────────────────────

  const checkForCheckpoint = useCallback((lat, lng) => {
    if (isCompletedRef.current) return;
    
    const threshold = 0.5;
    const now = new Date();

    checkpoints.forEach((cp, index) => {
      if (cp.status === "reached") return;
      
      const dist = getDistanceKm(lat, lng, cp.latitude, cp.longitude);
      if (dist < threshold) {
        const updated = [...checkpoints];
        updated[index] = { 
          ...cp, 
          status: "reached", 
          actual_arrival_time: now.toISOString() 
        };
        setCheckpoints(updated);

        if (cp.scheduled_time && cp.scheduled_date) {
          const scheduledDateTime = new Date(`${cp.scheduled_date}T${cp.scheduled_time}:00`);
          const delayMinutes = Math.floor((now - scheduledDateTime) / 60000);
          updated[index].delay_minutes = delayMinutes;
          setCheckpoints(updated);

          if (delayMinutes > 5) {
            addNotification("late", `⏰ Telat ${delayMinutes} menit di ${cp.city_name}`, delayMinutes);
          } else if (delayMinutes < -5) {
            addNotification("early", `⏰ Lebih awal ${Math.abs(delayMinutes)} menit di ${cp.city_name}`, delayMinutes);
          } else {
            addNotification("arrived", `✅ Tiba tepat waktu di ${cp.city_name}`, 0);
          }
        }

        saveToDatabase();

        if (cp.is_final_destination) {
          stopTracking();
          addNotification("info", `🎉 Perjalanan selesai! Tiba di tujuan akhir: ${cp.city_name}`, 0);
        }
      }
    });
  }, [checkpoints, saveToDatabase, stopTracking]);

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────

  const addNotification = useCallback((type, message, minutes) => {
    const id = notificationIdRef.current++;
    setNotifications(prev => [{ 
      id, 
      type, 
      message, 
      minutes, 
      created_at: new Date().toISOString() 
    }, ...prev].slice(0, 50));

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

  // ─── MANUAL DELAY ──────────────────────────────────────────────────────

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
      ? `⏰ Telat ${minutes} menit di ${cp.city_name} (manual)` 
      : `⏰ Lebih awal ${minutes} menit di ${cp.city_name} (manual)`;
    addNotification(type, message, minutes);
    saveToDatabase();
  }, [checkpoints, addNotification, saveToDatabase]);

  // ─── LATE DEPARTURE ──────────────────────────────────────────────────

  const handleLateDeparture = useCallback(() => {
    if (isCompletedRef.current) {
      alert("Perjalanan sudah selesai.");
      return;
    }
    setLateDeparture(true);
    supabase
      .from("touring_sessions")
      .update({ late_departure: true })
      .eq("id", sessionIdRef.current)
      .then(() => {
        addNotification("info", "⚠️ Berangkat telat, auto-start dinonaktifkan", 0);
      });
  }, [addNotification]);

  // ─── EDIT CHECKPOINT ──────────────────────────────────────────────────

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

  // ─── CHECKPOINT CRUD ──────────────────────────────────────────────────

  const addCheckpoint = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const newCp = { 
      city_name: "Kota Baru", 
      latitude: -7.5, 
      longitude: 110.0, 
      scheduled_date: today,
      scheduled_time: "12:00", 
      status: "pending",
      is_final_destination: false
    };
    const updated = [...checkpoints, newCp];
    setCheckpoints(updated);
    // Langsung simpan ke database dengan id baru
    saveToDatabase();
  }, [checkpoints, saveToDatabase]);

  const removeCheckpoint = useCallback((index) => {
    if (checkpoints[index].status === "reached") {
      if (!window.confirm("Kota ini sudah dicapai. Yakin ingin menghapus?")) return;
    }
    const updated = checkpoints.filter((_, i) => i !== index);
    setCheckpoints(updated);
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

  // ─── SHARE ────────────────────────────────────────────────────────────

  const shareLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?view=${sessionCode}`;
    return url;
  }, [sessionCode]);

  const copyLink = useCallback(async () => {
    const url = shareLink();
    await navigator.clipboard.writeText(url);
    alert("Link pemantau berhasil disalin!");
  }, [shareLink]);

  // ─── GENERATE REPORT ──────────────────────────────────────────────────

  const generateReport = useCallback(async () => {
    if (!sessionIdRef.current) return;
    
    setIsGeneratingReport(true);
    
    try {
      const { data: sessionData } = await supabase
        .from("touring_sessions")
        .select("*")
        .eq("id", sessionIdRef.current)
        .single();

      const { data: cpData } = await supabase
        .from("touring_checkpoints")
        .select("*")
        .eq("session_id", sessionIdRef.current)
        .order("order_index");

      const { data: notifData } = await supabase
        .from("touring_notifications")
        .select("*")
        .eq("session_id", sessionIdRef.current)
        .order("created_at");

      const { data: stopsData } = await supabase
        .from("touring_stops")
        .select("*")
        .eq("session_id", sessionIdRef.current)
        .order("stopped_at");

      const totalCheckpoints = cpData?.length || 0;
      const reachedCheckpoints = cpData?.filter(c => c.status === "reached").length || 0;
      const totalDelays = notifData?.filter(n => n.type === "late").length || 0;
      const totalEarly = notifData?.filter(n => n.type === "early").length || 0;
      const totalOnTime = notifData?.filter(n => n.type === "arrived").length || 0;
      const totalStops = stopsData?.length || 0;
      const totalDistance = sessionData?.total_distance_km || 0;

      let totalDuration = 0;
      if (sessionData?.created_at && sessionData?.completed_at) {
        totalDuration = Math.floor((new Date(sessionData.completed_at) - new Date(sessionData.created_at)) / 60000);
      }

      const report = {
        session: sessionData,
        checkpoints: cpData,
        notifications: notifData,
        stops: stopsData,
        summary: {
          totalCheckpoints,
          reachedCheckpoints,
          totalDelays,
          totalEarly,
          totalOnTime,
          totalStops,
          totalDistance: totalDistance.toFixed(2),
          totalDuration,
          transportType: sessionData?.transport_type,
          driverName: sessionData?.driver_name,
          plateNumber: sessionData?.plate_number,
          fuelLiters: sessionData?.fuel_liters,
          status: sessionData?.status,
          startedAt: sessionData?.created_at,
          completedAt: sessionData?.completed_at,
          sessionCode: sessionData?.session_code
        }
      };

      await supabase
        .from("touring_reports")
        .insert({
          session_id: sessionIdRef.current,
          report_data: report,
          generated_at: new Date().toISOString()
        });

      await supabase
        .from("touring_sessions")
        .update({ report_generated: true })
        .eq("id", sessionIdRef.current);

      setHasReport(true);
      setReportData(report);
      setShowReportModal(true);
      
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Gagal membuat laporan perjalanan");
    } finally {
      setIsGeneratingReport(false);
    }
  }, []);

  // ─── LOAD REPORT ─────────────────────────────────────────────────────

  const loadReport = useCallback(async () => {
    if (!sessionIdRef.current) return;
    
    try {
      const { data } = await supabase
        .from("touring_reports")
        .select("*")
        .eq("session_id", sessionIdRef.current)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setReportData(data.report_data);
        setShowReportModal(true);
      } else {
        alert("Belum ada laporan untuk perjalanan ini.");
      }
    } catch (error) {
      console.error("Error loading report:", error);
      alert("Gagal memuat laporan");
    }
  }, []);

  // ─── INIT ──────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    loadAllSessions();

    const params = new URLSearchParams(window.location.search);
    const viewCode = params.get("view");
    if (viewCode) {
      window.location.href = `/touring-view?code=${viewCode}`;
    }

    return () => {
      isMounted.current = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      stopBackgroundTracking();
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
      }
      if (movementCheckIntervalRef.current) {
        clearInterval(movementCheckIntervalRef.current);
      }
    };
  }, [loadAllSessions, stopBackgroundTracking]);

  // ─── RENDER ────────────────────────────────────────────────────────────

  if (isLoading && sessions.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Memuat perjalanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3 style={{ color: "#F1F5F9", marginTop: "16px" }}>Terjadi Kesalahan</h3>
        <p style={{ color: "#94A3B8", maxWidth: "400px", textAlign: "center" }}>{error}</p>
        <button 
          onClick={() => {
            loadAttempted.current = false;
            loadAllSessions();
          }} 
          style={{ ...btnPrimary, marginTop: "16px" }}
        >
          <FiRefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    );
  }

  const isSessionComplete = isCompleted || sessionStatus === "completed" || 
    checkpoints.some(cp => cp.is_final_destination && cp.status === "reached");

  return (
    <div style={{ ...styles.container, ...(isMobile ? styles.containerMobile : {}) }}>
      {/* Header - sama seperti sebelumnya, lanjutkan... */}
      {/* ... kode header sama seperti sebelumnya ... */}
      
      {/* Main Content - sama seperti sebelumnya */}
      {/* ... kode main content sama seperti sebelumnya ... */}
      
      {/* Notification Panel */}
      {/* ... kode notification panel sama seperti sebelumnya ... */}
      
      {/* Delay Modal */}
      {/* ... kode delay modal sama seperti sebelumnya ... */}
      
      {/* Share Panel */}
      {/* ... kode share panel sama seperti sebelumnya ... */}
      
      {/* Report Modal */}
      {showReportModal && reportData && (
        <ReportModal
          report={reportData}
          onClose={() => setShowReportModal(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────

function TouringMap({ checkpoints, currentLocation, sessionStatus, onReportDelay, onMarkReached, isTracking, isMobile, totalDistance, statusMessage, stops }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || mapInstanceRef.current) return;
    
    const initMap = () => {
      const L = window.L;
      if (!L) {
        console.warn("Leaflet not loaded");
        return;
      }

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
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        initMap();
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

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
      const color = cp.status === "reached" ? "#10B981" : cp.status === "active" ? "#3B82F6" : "#6B7280";
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
          ${cp.status === "reached" ? "✅ Tiba" : "⏳ Menunggu"}<br>
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
      opacity: 0.6, 
      dashArray: "8,4" 
    }).addTo(map);
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
    const isMoving = statusMessage?.isMoving !== false;
    const color = isMoving ? "#3B82F6" : "#EF4444";
    
    const pulseIcon = L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:${size}px;height:${size}px;background:${color}33;border-radius:50%;animation:ping 1.5s infinite"></div>
        <div style="width:${isMobile ? 14 : 20}px;height:${isMobile ? 14 : 20}px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 0 12px ${color}99;position:relative;z-index:1;transition:background 0.5s"></div>
        ${!isMoving ? `<div style="position:absolute;top:-8px;right:-8px;background:#EF4444;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;border:2px solid white;">⏸</div>` : ''}
      </div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });

    currentMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: pulseIcon })
      .bindPopup(`
        <b>📍 Lokasi Saat Ini</b><br>
        Status: ${statusMessage?.text || 'Sedang Berjalan'}<br>
        Lokasi: ${statusMessage?.location || '-'}<br>
        Total Jarak: ${totalDistance?.toFixed(1) || 0} km
        ${stops?.length > 0 ? `<br>Berhenti: ${stops.length} kali` : ''}
      `)
      .addTo(mapInstanceRef.current);

    if (isTracking) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], isMobile ? 11 : 13, { animate: true });
    }
  }, [currentLocation, isTracking, isMobile, statusMessage, totalDistance, stops]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
    </div>
  );
}

// ─── DELAY MODAL ──────────────────────────────────────────────────────────────

function DelayModal({ checkpoint, onClose, onSubmit, isMobile }) {
  const [type, setType] = useState("late");
  const [minutes, setMinutes] = useState(10);

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, ...(isMobile ? styles.modalContentMobile : {}) }}>
        <div style={styles.modalHeader}>
          <h3 style={{ ...styles.modalTitle, ...(isMobile ? styles.modalTitleMobile : {}) }}>
            <FiBell size={18} color="#3B82F6" /> Lapor Keterlambatan/Awal
          </h3>
          <button onClick={onClose} style={iconBtn}><FiX size={18} /></button>
        </div>
        <p style={styles.modalSubtitle}>Checkpoint: <strong style={{ color: "#94A3B8" }}>{checkpoint?.city_name}</strong></p>

        <div style={{ ...styles.modalTypeButtons, ...(isMobile ? styles.modalTypeButtonsMobile : {}) }}>
          <button
            onClick={() => setType("late")}
            style={{
              ...styles.modalTypeBtn,
              ...(isMobile ? styles.modalTypeBtnMobile : {}),
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
              ...(isMobile ? styles.modalTypeBtnMobile : {}),
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
          <div style={{ ...styles.modalMinutesControl, ...(isMobile ? styles.modalMinutesControlMobile : {}) }}>
            <button onClick={() => setMinutes(m => Math.max(1, m - 5))} style={iconBtn}><FiMinus size={16} /></button>
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(parseInt(e.target.value) || 0)}
              style={{ ...inputStyle, textAlign: "center", width: isMobile ? "60px" : "80px", fontSize: isMobile ? "16px" : "20px", fontWeight: "700" }}
              min={1}
            />
            <button onClick={() => setMinutes(m => m + 5)} style={iconBtn}><FiPlus size={16} /></button>
          </div>
        </div>

        <div style={{ ...styles.modalActions, ...(isMobile ? styles.modalActionsMobile : {}) }}>
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

function SharePanel({ sessionCode, onClose, onCopy, shareUrl, isMobile }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: isMobile ? "95%" : "420px", ...(isMobile ? styles.modalContentMobile : {}) }}>
        <div style={styles.modalHeader}>
          <h3 style={{ ...styles.modalTitle, ...(isMobile ? styles.modalTitleMobile : {}) }}>
            <FiShare2 size={18} color="#3B82F6" /> Bagikan Lokasi
          </h3>
          <button onClick={onClose} style={iconBtn}><FiX size={18} /></button>
        </div>

        <div style={{ ...styles.shareCodeBox, ...(isMobile ? styles.shareCodeBoxMobile : {}) }}>
          <div style={styles.shareCodeLabel}>KODE SESI</div>
          <div style={{ ...styles.shareCode, ...(isMobile ? styles.shareCodeMobile : {}) }}>{sessionCode}</div>
        </div>

        <div style={{ ...styles.shareUrlBox, ...(isMobile ? styles.shareUrlBoxMobile : {}) }}>
          <div style={styles.shareCodeLabel}>LINK PEMANTAU</div>
          <div style={{ ...styles.shareUrl, ...(isMobile ? styles.shareUrlMobile : {}) }}>{shareUrl}</div>
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

// ─── REPORT MODAL ─────────────────────────────────────────────────────────────

function ReportModal({ report, onClose, isMobile }) {
  const summary = report?.summary || {};
  const checkpoints = report?.checkpoints || [];
  const notifications = report?.notifications || [];
  const stops = report?.stops || [];

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: isMobile ? "95%" : "700px", maxHeight: "90vh", overflowY: "auto", ...(isMobile ? styles.modalContentMobile : {}) }}>
        <div style={styles.modalHeader}>
          <h3 style={{ ...styles.modalTitle, ...(isMobile ? styles.modalTitleMobile : {}) }}>
            <FiFileText size={18} color="#8B5CF6" /> Laporan Perjalanan
          </h3>
          <div>
            <button 
              onClick={() => window.print()} 
              style={{ ...iconBtn, marginRight: "8px" }}
            >
              <FiPrinter size={14} />
            </button>
            <button onClick={onClose} style={iconBtn}><FiX size={18} /></button>
          </div>
        </div>

        <div style={styles.reportContent}>
          <div style={styles.reportHeader}>
            <h2 style={styles.reportTitle}>📋 Laporan Perjalanan</h2>
            <p style={styles.reportSubtitle}>
              Kode Sesi: <strong>{summary.sessionCode || report?.session?.session_code}</strong>
            </p>
            <p style={styles.reportSubtitle}>
              Tanggal: {formatDateTime(summary.startedAt || report?.session?.created_at)}
            </p>
          </div>

          <div style={styles.reportSection}>
            <h4 style={styles.reportSectionTitle}>📊 Ringkasan</h4>
            <div style={styles.reportGrid}>
              <div style={styles.reportItem}>
                <span style={styles.reportLabel}>Total Jarak</span>
                <span style={styles.reportValue}>{summary.totalDistance || 0} km</span>
              </div>
              <div style={styles.reportItem}>
                <span style={styles.reportLabel}>Durasi</span>
                <span style={styles.reportValue}>
                  {summary.totalDuration ? `${Math.floor(summary.totalDuration / 60)} jam ${summary.totalDuration % 60} menit` : '-'}
                </span>
              </div>
              <div style={styles.reportItem}>
                <span style={styles.reportLabel}>Kota Dikunjungi</span>
                <span style={styles.reportValue}>{summary.reachedCheckpoints || 0}/{summary.totalCheckpoints || 0}</span>
              </div>
              <div style={styles.reportItem}>
                <span style={styles.reportLabel}>Total Berhenti</span>
                <span style={styles.reportValue}>{summary.totalStops || 0} kali</span>
              </div>
              <div style={styles.reportItem}>
                <span style={styles.reportLabel}>Moda Transportasi</span>
                <span style={styles.reportValue}>{getTransportLabel(summary.transportType)}</span>
              </div>
              <div style={styles.reportItem}>
                <span style={styles.reportLabel}>Pengemudi</span>
                <span style={styles.reportValue}>{summary.driverName || '-'}</span>
              </div>
            </div>
          </div>

          <div style={styles.reportSection}>
            <h4 style={styles.reportSectionTitle}>🔔 Notifikasi Perjalanan</h4>
            <div style={styles.reportStats}>
              <span style={{ ...styles.reportStat, background: "#7F1D1D", color: "#FCA5A5" }}>
                Telat: {summary.totalDelays || 0}
              </span>
              <span style={{ ...styles.reportStat, background: "#78350F", color: "#FDE68A" }}>
                Awal: {summary.totalEarly || 0}
              </span>
              <span style={{ ...styles.reportStat, background: "#064E3B", color: "#6EE7B7" }}>
                Tepat: {summary.totalOnTime || 0}
              </span>
            </div>
            <div style={styles.reportNotificationList}>
              {notifications.slice(0, 10).map((n, i) => (
                <div key={i} style={styles.reportNotificationItem}>
                  <span style={{ 
                    color: n.type === "late" ? "#EF4444" : n.type === "early" ? "#F59E0B" : "#10B981",
                    marginRight: "8px"
                  }}>
                    {n.type === "late" ? "🔴" : n.type === "early" ? "🟡" : "🟢"}
                  </span>
                  <span style={{ flex: 1 }}>{n.message}</span>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>
                    {new Date(n.created_at).toLocaleTimeString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.reportSection}>
            <h4 style={styles.reportSectionTitle}>📍 Rute Perjalanan</h4>
            <div style={styles.reportCheckpointList}>
              {checkpoints.map((cp, i) => (
                <div key={i} style={styles.reportCheckpointItem}>
                  <span style={styles.reportCheckpointNumber}>{i + 1}</span>
                  <div style={styles.reportCheckpointInfo}>
                    <span style={styles.reportCheckpointName}>{cp.city_name}</span>
                    <span style={styles.reportCheckpointTime}>
                      {formatDate(cp.scheduled_date)} {formatTime(cp.scheduled_time)}
                      {cp.status === "reached" && " ✅"}
                      {cp.delay_minutes !== 0 && cp.delay_minutes != null && (
                        <span style={{ 
                          color: cp.delay_minutes > 0 ? "#FCA5A5" : "#FDE68A",
                          marginLeft: "8px"
                        }}>
                          {cp.delay_minutes > 0 ? "🔴" : "🟡"} {Math.abs(cp.delay_minutes)}mnt
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stops.length > 0 && (
            <div style={styles.reportSection}>
              <h4 style={styles.reportSectionTitle}>🛑 Riwayat Berhenti</h4>
              <div style={styles.reportStopList}>
                {stops.map((stop, i) => (
                  <div key={i} style={styles.reportStopItem}>
                    <span style={styles.reportStopNumber}>{i + 1}</span>
                    <div style={styles.reportStopInfo}>
                      <span style={styles.reportStopReason}>{stop.stop_reason || "Istirahat"}</span>
                      <span style={styles.reportStopLocation}>{stop.location_name || "Lokasi"}</span>
                      <span style={styles.reportStopTime}>
                        {formatDateTime(stop.stopped_at)}
                        {stop.duration_minutes > 0 && ` (${stop.duration_minutes} menit)`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.reportFooter}>
            <p style={{ color: "#64748B", fontSize: "12px", textAlign: "center" }}>
              Laporan dibuat otomatis oleh Touring Tracker
            </p>
          </div>
        </div>
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
    padding: "8px 12px",
    gap: "4px"
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
  headerRightMobile: {
    gap: "4px"
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
  detailBtn: {
    background: "none",
    border: "none",
    color: "#3B82F6",
    cursor: "pointer",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "2px"
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
  mainContent: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 70px)",
    overflow: "hidden"
  },
  mainContentMobile: {
    flexDirection: "column",
    height: "auto",
    minHeight: "calc(100vh - 100px)"
  },
  sessionSidebar: {
    width: "260px",
    minWidth: "230px",
    background: "#0F172A",
    borderRight: "1px solid #1E293B",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0
  },
  sessionSidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid #1E293B"
  },
  sessionSidebarTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#94A3B8",
    fontSize: "12px",
    fontWeight: "600",
    margin: 0
  },
  sessionList: {
    flex: 1,
    overflowY: "auto",
    padding: "6px"
  },
  sessionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    marginBottom: "4px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  sessionItemLeft: {
    flex: 1,
    minWidth: 0
  },
  sessionCode: {
    color: "#F1F5F9",
    fontWeight: "700",
    fontSize: "11px",
    fontFamily: "monospace",
    letterSpacing: "0.5px"
  },
  sessionMeta: {
    display: "flex",
    gap: "6px",
    marginTop: "2px",
    flexWrap: "wrap"
  },
  sessionMetaItem: {
    color: "#64748B",
    fontSize: "9px",
    display: "flex",
    alignItems: "center",
    gap: "2px"
  },
  sessionItemRight: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0
  },
  sessionStatusBadge: {
    fontSize: "8px",
    padding: "2px 6px",
    borderRadius: "10px",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  emptySession: {
    textAlign: "center",
    padding: "24px 12px",
    color: "#64748B",
    fontSize: "12px"
  },
  sidebar: {
    width: "320px",
    minWidth: "280px",
    background: "#0F172A",
    borderRight: "1px solid #1E293B",
    overflowY: "auto",
    padding: "12px",
    flexShrink: 0
  },
  sidebarMobile: {
    width: "100%",
    minWidth: "unset",
    borderRight: "none",
    borderBottom: "1px solid #1E293B",
    padding: "10px",
    maxHeight: "50vh"
  },
  sidebarContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  section: {
    background: "#1E293B",
    borderRadius: "10px",
    padding: "12px",
    border: "1px solid #334155"
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#94A3B8",
    margin: "0 0 10px 0"
  },
  sessionInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  sessionInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px"
  },
  sessionInfoLabel: {
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  sessionInfoValue: {
    color: "#F1F5F9",
    fontWeight: "600"
  },
  transportGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "4px",
    marginBottom: "8px"
  },
  transportGridMobile: {
    gridTemplateColumns: "1fr 1fr",
    gap: "3px"
  },
  transportBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    padding: "8px",
    borderRadius: "6px",
    border: "2px solid #334155",
    background: "#1E293B",
    color: "#64748B",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  transportBtnMobile: {
    padding: "6px",
    fontSize: "8px"
  },
  checkpointList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxHeight: "200px",
    overflowY: "auto"
  },
  checkpointListMobile: {
    maxHeight: "150px"
  },
  checkpointItem: {
    background: "#0F172A",
    borderRadius: "6px",
    padding: "6px",
    border: "1px solid #334155"
  },
  checkpointRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  checkpointNumber: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#3B82F6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0
  },
  checkpointNumberMobile: {
    width: "20px",
    height: "20px",
    fontSize: "8px"
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
  checkpointActions: {
    display: "flex",
    gap: "2px",
    flexShrink: 0
  },
  checkpointActionsMobile: {
    gap: "1px"
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  editActions: {
    display: "flex",
    gap: "4px",
    justifyContent: "flex-end"
  },
  mapContainer: {
    flex: 1,
    padding: "12px",
    background: "#0F172A",
    minHeight: "300px"
  },
  mapContainerMobile: {
    padding: "6px",
    minHeight: "200px",
    height: "40vh"
  },
  notificationPanel: {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    zIndex: 9999,
    maxWidth: "360px"
  },
  notificationPanelMobile: {
    bottom: "8px",
    right: "8px",
    left: "8px",
    maxWidth: "unset",
    width: "auto"
  },
  notificationItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "#1E293B",
    borderLeft: "3px solid #3B82F6",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    animation: "slideIn 0.3s ease"
  },
  notificationItemMobile: {
    padding: "8px 10px",
    fontSize: "11px",
    gap: "6px"
  },
  notificationMessage: {
    flex: 1,
    color: "#F1F5F9",
    fontSize: "12px"
  },
  notificationClose: {
    background: "none",
    border: "none",
    color: "#64748B",
    cursor: "pointer",
    padding: "2px"
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
    borderRadius: "14px",
    padding: "20px",
    width: "380px",
    maxWidth: "95%"
  },
  modalContentMobile: {
    padding: "14px",
    width: "95%",
    margin: "8px"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  modalTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#F1F5F9",
    fontSize: "16px",
    fontWeight: "700",
    margin: 0
  },
  modalTitleMobile: {
    fontSize: "14px"
  },
  modalSubtitle: {
    color: "#64748B",
    fontSize: "12px",
    marginBottom: "16px"
  },
  modalTypeButtons: {
    display: "flex",
    gap: "6px",
    marginBottom: "12px"
  },
  modalTypeButtonsMobile: {
    gap: "4px"
  },
  modalTypeBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "8px",
    borderRadius: "6px",
    border: "2px solid",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  modalTypeBtnMobile: {
    padding: "6px",
    fontSize: "11px",
    gap: "3px"
  },
  modalMinutes: {
    marginBottom: "16px"
  },
  modalLabel: {
    display: "block",
    color: "#94A3B8",
    fontSize: "11px",
    marginBottom: "6px"
  },
  modalMinutesControl: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  modalMinutesControlMobile: {
    gap: "6px"
  },
  modalActions: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end"
  },
  modalActionsMobile: {
    gap: "4px"
  },
  shareCodeBox: {
    background: "#1E293B",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px"
  },
  shareCodeBoxMobile: {
    padding: "10px"
  },
  shareCodeLabel: {
    color: "#64748B",
    fontSize: "10px",
    marginBottom: "2px"
  },
  shareCode: {
    color: "#60A5FA",
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "4px",
    fontFamily: "monospace"
  },
  shareCodeMobile: {
    fontSize: "18px",
    letterSpacing: "3px"
  },
  shareUrlBox: {
    background: "#1E293B",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "12px"
  },
  shareUrlBoxMobile: {
    padding: "8px"
  },
  shareUrl: {
    color: "#94A3B8",
    fontSize: "11px",
    wordBreak: "break-all"
  },
  shareUrlMobile: {
    fontSize: "10px"
  },
  shareInfo: {
    color: "#475569",
    fontSize: "10px",
    textAlign: "center",
    marginTop: "8px",
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
    width: "40px",
    height: "40px",
    border: "4px solid #1E293B",
    borderTop: "4px solid #3B82F6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#64748B",
    marginTop: "12px",
    fontSize: "13px"
  },
  mobileMenu: {
    background: "#1E293B",
    padding: "10px 14px",
    borderBottom: "1px solid #334155",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  mobileMenuItem: {
    background: "none",
    border: "none",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s"
  },
  mobileSessionList: {
    background: "#0F172A",
    borderBottom: "1px solid #1E293B",
    padding: "6px 10px"
  },
  mobileSessionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  mobileSessionItems: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap"
  },
  mobileSessionItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderRadius: "4px",
    background: "#1E293B",
    cursor: "pointer",
    fontSize: "11px"
  },
  mobileSessionCode: {
    color: "#F1F5F9",
    fontWeight: "600",
    fontFamily: "monospace"
  },
  reportContent: {
    padding: "4px 0"
  },
  reportHeader: {
    textAlign: "center",
    padding: "12px 0",
    borderBottom: "1px solid #1E293B",
    marginBottom: "16px"
  },
  reportTitle: {
    color: "#F1F5F9",
    fontSize: "18px",
    margin: 0
  },
  reportSubtitle: {
    color: "#94A3B8",
    fontSize: "12px",
    margin: "4px 0"
  },
  reportSection: {
    marginBottom: "16px",
    padding: "12px",
    background: "#1E293B",
    borderRadius: "8px",
    border: "1px solid #334155"
  },
  reportSectionTitle: {
    color: "#94A3B8",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 0 10px 0"
  },
  reportGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  reportItem: {
    display: "flex",
    flexDirection: "column",
    padding: "6px",
    background: "#0F172A",
    borderRadius: "4px"
  },
  reportLabel: {
    color: "#64748B",
    fontSize: "10px"
  },
  reportValue: {
    color: "#F1F5F9",
    fontSize: "13px",
    fontWeight: "600"
  },
  reportStats: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "10px"
  },
  reportStat: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600"
  },
  reportNotificationList: {
    maxHeight: "150px",
    overflowY: "auto"
  },
  reportNotificationItem: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    background: "#0F172A",
    borderRadius: "4px",
    marginBottom: "4px",
    fontSize: "11px"
  },
  reportCheckpointList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  reportCheckpointItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    background: "#0F172A",
    borderRadius: "4px"
  },
  reportCheckpointNumber: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#3B82F6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0
  },
  reportCheckpointInfo: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  reportCheckpointName: {
    color: "#F1F5F9",
    fontSize: "12px",
    fontWeight: "600"
  },
  reportCheckpointTime: {
    color: "#94A3B8",
    fontSize: "11px"
  },
  reportStopList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  reportStopItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    background: "#0F172A",
    borderRadius: "4px"
  },
  reportStopNumber: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#F59E0B",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0
  },
  reportStopInfo: {
    flex: 1
  },
  reportStopReason: {
    color: "#F1F5F9",
    fontSize: "12px",
    fontWeight: "600"
  },
  reportStopLocation: {
    color: "#94A3B8",
    fontSize: "11px",
    marginLeft: "8px"
  },
  reportStopTime: {
    color: "#64748B",
    fontSize: "10px",
    display: "block"
  },
  reportFooter: {
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #1E293B"
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
  @media (max-width: 768px) {
    .leaflet-control-zoom {
      display: none !important;
    }
  }
  @media print {
    .modalOverlay {
      position: static !important;
      background: white !important;
      backdrop-filter: none !important;
    }
    .modalContent {
      box-shadow: none !important;
      border: 1px solid #ddd !important;
    }
    button {
      display: none !important;
    }
  }
`;
document.head.appendChild(styleSheet);
