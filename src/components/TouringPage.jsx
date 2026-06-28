// TouringPage.jsx
// Halaman Utama Touring Tracker - Versi Stabil
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  FiMapPin, FiClock, FiTruck, FiAlertCircle, FiCheckCircle,
  FiSettings, FiShare2, FiPlus, FiTrash2, FiEdit2, FiSave,
  FiNavigation, FiUser, FiDroplet, FiArrowUp, FiArrowDown,
  FiRefreshCw, FiEye, FiX, FiChevronUp, FiChevronDown,
  FiZap, FiMenu, FiMap, FiBell, FiList, FiPlay, FiSquare,
  FiCalendar, FiInfo, FiLink, FiAlertTriangle, FiActivity, 
  FiPause, FiWifi, FiMinus
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

const TRANSPORT_OPTIONS = [
  { value: "motor", label: "Motor", icon: <MdTwoWheeler size={20} /> },
  { value: "mobil", label: "Mobil", icon: <MdDirectionsCar size={20} /> },
  { value: "kereta", label: "Kereta", icon: <MdTrain size={20} /> },
  { value: "jalan", label: "Jalan Kaki", icon: <MdDirectionsWalk size={20} /> }
];

const DEFAULT_CHECKPOINTS = [
  { city_name: "Kutoarjo", latitude: -7.7200, longitude: 109.9084, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "07:00", is_final_destination: false },
  { city_name: "Yogyakarta", latitude: -7.7956, longitude: 110.3695, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "08:30", is_final_destination: false },
  { city_name: "Klaten", latitude: -7.7059, longitude: 110.6077, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "09:30", is_final_destination: false },
  { city_name: "Wonogiri", latitude: -7.8126, longitude: 110.9228, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "11:00", is_final_destination: false },
  { city_name: "Purwantoro", latitude: -7.8717, longitude: 111.3321, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "12:30", is_final_destination: false },
  { city_name: "Ponorogo", latitude: -7.8683, longitude: 111.4617, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "14:00", is_final_destination: false },
  { city_name: "Trenggalek", latitude: -8.0501, longitude: 111.7082, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "15:30", is_final_destination: false },
  { city_name: "Tulungagung", latitude: -8.0661, longitude: 111.9044, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: "17:00", is_final_destination: true },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  container: { minHeight: "100vh", background: "#0F172A", color: "#F1F5F9", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  containerMobile: { fontSize: "14px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#1E293B", borderBottom: "1px solid #334155", flexWrap: "wrap", gap: "12px" },
  headerMobile: { padding: "12px 16px", gap: "8px" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerTitle: { fontSize: "20px", fontWeight: "700", color: "#F1F5F9", margin: 0 },
  headerTitleMobile: { fontSize: "16px" },
  headerRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  headerRightMobile: { gap: "6px" },
  statusBadge: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  statusBadgeMobile: { padding: "4px 10px", fontSize: "10px" },
  statusBar: { background: "#1E293B", borderBottom: "1px solid #334155", padding: "8px 16px", position: "relative" },
  statusBarContent: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  statusIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", flexShrink: 0 },
  statusInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  statusText: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", flexWrap: "wrap" },
  statusLocation: { color: "#94A3B8", fontSize: "12px", fontWeight: "400" },
  statusSpeed: { color: "#64748B", fontSize: "11px" },
  statusDetailBtn: { display: "flex", alignItems: "center", gap: "4px", padding: "4px 12px", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#94A3B8", cursor: "pointer", fontSize: "12px" },
  statusDetailPopup: { position: "absolute", top: "calc(100% + 8px)", right: "16px", background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px", minWidth: "200px", zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" },
  statusDetailItem: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px", borderBottom: "1px solid #1E293B" },
  statusDetailLabel: { color: "#64748B" },
  mainContent: { display: "flex", flex: 1, height: "calc(100vh - 120px)", overflow: "hidden" },
  mainContentMobile: { flexDirection: "column", height: "auto", minHeight: "calc(100vh - 160px)" },
  sessionSidebar: { width: "280px", minWidth: "250px", background: "#0F172A", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", flexShrink: 0 },
  sessionSidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #1E293B" },
  sessionSidebarTitle: { display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "14px", fontWeight: "600", margin: 0 },
  sessionList: { flex: 1, overflowY: "auto", padding: "8px" },
  sessionItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "6px", cursor: "pointer", transition: "all 0.2s" },
  sessionItemLeft: { flex: 1, minWidth: 0 },
  sessionCode: { color: "#F1F5F9", fontWeight: "700", fontSize: "13px", fontFamily: "monospace", letterSpacing: "0.5px" },
  sessionMeta: { display: "flex", gap: "8px", marginTop: "2px", flexWrap: "wrap" },
  sessionMetaItem: { color: "#64748B", fontSize: "10px", display: "flex", alignItems: "center", gap: "3px" },
  sessionItemRight: { display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 },
  sessionStatusBadge: { fontSize: "9px", padding: "2px 8px", borderRadius: "12px", fontWeight: "600", textTransform: "uppercase" },
  emptySession: { textAlign: "center", padding: "32px 16px", color: "#64748B" },
  sidebar: { width: "340px", minWidth: "300px", background: "#0F172A", borderRight: "1px solid #1E293B", overflowY: "auto", padding: "16px", flexShrink: 0 },
  sidebarMobile: { width: "100%", minWidth: "unset", borderRight: "none", borderBottom: "1px solid #1E293B", padding: "12px", maxHeight: "60vh" },
  sidebarContent: { display: "flex", flexDirection: "column", gap: "20px" },
  section: { background: "#1E293B", borderRadius: "12px", padding: "16px", border: "1px solid #334155" },
  sectionTitle: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#94A3B8", margin: "0 0 12px 0" },
  sessionInfo: { display: "flex", flexDirection: "column", gap: "6px" },
  sessionInfoRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sessionInfoLabel: { color: "#64748B", fontSize: "12px" },
  sessionInfoValue: { color: "#F1F5F9", fontSize: "12px", fontWeight: "600" },
  transportGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "12px" },
  transportGridMobile: { gridTemplateColumns: "1fr 1fr", gap: "4px" },
  transportBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px", borderRadius: "8px", border: "2px solid #334155", background: "#1E293B", color: "#64748B", cursor: "pointer", fontSize: "11px", fontWeight: "600", transition: "all 0.2s" },
  transportBtnMobile: { padding: "8px", fontSize: "10px" },
  checkpointList: { display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" },
  checkpointListMobile: { maxHeight: "200px" },
  checkpointItem: { background: "#0F172A", borderRadius: "8px", padding: "8px", border: "1px solid #334155" },
  checkpointRow: { display: "flex", alignItems: "center", gap: "10px" },
  checkpointNumber: { width: "28px", height: "28px", borderRadius: "50%", background: "#3B82F6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 },
  checkpointNumberMobile: { width: "24px", height: "24px", fontSize: "10px" },
  checkpointInfo: { flex: 1, minWidth: 0 },
  checkpointName: { color: "#F1F5F9", fontWeight: "600", fontSize: "13px" },
  checkpointNameMobile: { fontSize: "12px" },
  checkpointTime: { color: "#64748B", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" },
  checkpointTimeMobile: { fontSize: "10px" },
  checkpointActions: { display: "flex", gap: "2px", flexShrink: 0 },
  checkpointActionsMobile: { gap: "1px" },
  editForm: { display: "flex", flexDirection: "column", gap: "6px" },
  editActions: { display: "flex", gap: "6px", justifyContent: "flex-end" },
  mapContainer: { flex: 1, padding: "16px", background: "#0F172A", minHeight: "300px" },
  mapContainerMobile: { padding: "8px", minHeight: "250px", height: "50vh" },
  notificationPanel: { position: "fixed", bottom: "24px", right: "24px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 9999, maxWidth: "380px" },
  notificationPanelMobile: { bottom: "12px", right: "12px", left: "12px", maxWidth: "unset", width: "auto" },
  notificationItem: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#1E293B", borderLeft: "4px solid #3B82F6", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", animation: "slideIn 0.3s ease" },
  notificationItemMobile: { padding: "10px 12px", fontSize: "12px", gap: "8px" },
  notificationMessage: { flex: 1, color: "#F1F5F9", fontSize: "13px" },
  notificationClose: { background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: "4px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(4px)" },
  modalContent: { background: "#0F172A", border: "1px solid #1E293B", borderRadius: "16px", padding: "24px", width: "380px", maxWidth: "95%" },
  modalContentMobile: { padding: "16px", width: "95%", margin: "10px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  modalTitle: { display: "flex", alignItems: "center", gap: "8px", color: "#F1F5F9", fontSize: "18px", fontWeight: "700", margin: 0 },
  modalTitleMobile: { fontSize: "16px" },
  modalSubtitle: { color: "#64748B", fontSize: "13px", marginBottom: "20px" },
  modalTypeButtons: { display: "flex", gap: "8px", marginBottom: "16px" },
  modalTypeButtonsMobile: { gap: "4px" },
  modalTypeBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "8px", border: "2px solid", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" },
  modalTypeBtnMobile: { padding: "8px", fontSize: "12px", gap: "4px" },
  modalMinutes: { marginBottom: "20px" },
  modalLabel: { display: "block", color: "#94A3B8", fontSize: "12px", marginBottom: "8px" },
  modalMinutesControl: { display: "flex", alignItems: "center", gap: "12px" },
  modalMinutesControlMobile: { gap: "8px" },
  modalActions: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  modalActionsMobile: { gap: "4px" },
  shareCodeBox: { background: "#1E293B", borderRadius: "10px", padding: "16px", marginBottom: "16px" },
  shareCodeBoxMobile: { padding: "12px" },
  shareCodeLabel: { color: "#64748B", fontSize: "11px", marginBottom: "4px" },
  shareCode: { color: "#60A5FA", fontSize: "28px", fontWeight: "800", letterSpacing: "6px", fontFamily: "monospace" },
  shareCodeMobile: { fontSize: "22px", letterSpacing: "4px" },
  shareUrlBox: { background: "#1E293B", borderRadius: "10px", padding: "12px", marginBottom: "16px" },
  shareUrl: { color: "#94A3B8", fontSize: "12px", wordBreak: "break-all" },
  shareUrlMobile: { fontSize: "11px" },
  shareInfo: { color: "#475569", fontSize: "11px", textAlign: "center", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" },
  loadingContainer: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0F172A" },
  loadingSpinner: { width: "48px", height: "48px", border: "4px solid #1E293B", borderTop: "4px solid #3B82F6", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { color: "#64748B", marginTop: "16px", fontSize: "14px" },
  mobileMenu: { background: "#1E293B", padding: "12px 16px", borderBottom: "1px solid #334155", display: "flex", gap: "12px", flexWrap: "wrap" },
  mobileMenuItem: { background: "none", border: "none", color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  mobileSessionList: { background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "8px 12px" },
  mobileSessionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  mobileSessionItems: { display: "flex", gap: "6px", flexWrap: "wrap" },
  mobileSessionItem: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "6px", background: "#1E293B", cursor: "pointer", fontSize: "12px" },
  mobileSessionCode: { color: "#F1F5F9", fontWeight: "600", fontFamily: "monospace" }
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TouringPage() {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);
  const [transport, setTransport] = useState({ transport_type: "motor", plate_number: "", driver_name: "", fuel_liters: 5 });
  const [currentLocation, setCurrentLocation] = useState(null);
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
  const [lateDeparture, setLateDeparture] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({ status: "idle", location_name: "Belum mulai", speed: 0, last_update: null });
  const [showStatusDetail, setShowStatusDetail] = useState(false);
  
  const watchIdRef = useRef(null);
  const notificationIdRef = useRef(0);
  const sessionIdRef = useRef(null);
  const isMounted = useRef(true);
  const backgroundIntervalRef = useRef(null);

  // ─── RESPONSIVE ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── LOAD SESSIONS ─────────────────────────────────────────────────────────

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
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  const loadSessionData = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("touring_sessions")
        .select("*, touring_checkpoints(*)")
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      if (!isMounted.current) return;

      setSession(data);
      setSessionCode(data.session_code);
      setSessionStatus(data.status || "pending");
      setLateDeparture(data.late_departure || false);
      setTransport({
        transport_type: data.transport_type || "motor",
        plate_number: data.plate_number || "",
        driver_name: data.driver_name || "",
        fuel_liters: data.fuel_liters || 5
      });
      
      if (data.touring_checkpoints && data.touring_checkpoints.length > 0) {
        const sorted = data.touring_checkpoints
          .filter(cp => !cp.is_deleted)
          .sort((a, b) => a.order_index - b.order_index);
        if (sorted.length > 0) setCheckpoints(sorted);
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
        .limit(20);
      if (notifData) setNotifications(notifData);

      // Load latest tracking
      const { data: trackData } = await supabase
        .from("touring_location_tracking")
        .select("*")
        .eq("session_id", data.id)
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (trackData && trackData.length > 0) {
        setCurrentLocation({ lat: trackData[0].latitude, lng: trackData[0].longitude, speed: trackData[0].speed || 0 });
      }

      // Load status
      if (data.current_status) {
        setCurrentStatus({
          status: data.current_status,
          location_name: data.current_location_name || "Lokasi tidak diketahui",
          speed: 0,
          last_update: data.last_location_update || new Date()
        });
      }

      // Check if already tracking
      if (data.status === "active") {
        setIsTracking(true);
        startBackgroundTracking(data.id);
      }

    } catch (error) {
      console.error("Error loading session data:", error);
      setError("Gagal memuat data perjalanan");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  const createNewSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
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
          is_running: false,
          current_status: "idle"
        })
        .select()
        .single();

      if (createError) throw createError;

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
        is_final_destination: cp.is_final_destination || false,
        is_deleted: false
      }));

      const { error: cpError } = await supabase.from("touring_checkpoints").insert(checkpointsData);
      if (cpError) throw cpError;

      const { data: sessionsData } = await supabase.from("touring_sessions").select("*").order("created_at", { ascending: false });
      if (sessionsData) setSessions(sessionsData);

      setSelectedSessionId(newSession.id);
      sessionIdRef.current = newSession.id;
      localStorage.setItem("touring_session", JSON.stringify({ id: newSession.id, code: newSession.session_code }));
      await loadSessionData(newSession.id);

    } catch (error) {
      console.error("Error creating session:", error);
      setError("Gagal membuat perjalanan baru");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [loadSessionData]);

  const deleteSession = useCallback(async (sessionId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus perjalanan ini?")) return;
    try {
      await supabase.from("touring_sessions").delete().eq("id", sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          setSelectedSessionId(remaining[0].id);
          loadSessionData(remaining[0].id);
        } else {
          createNewSession();
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Gagal menghapus perjalanan");
    }
  }, [selectedSessionId, sessions, loadSessionData, createNewSession]);

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
          updated_at: new Date().toISOString(),
          current_status: currentStatus.status,
          current_location_name: currentStatus.location_name,
          last_location_update: new Date().toISOString()
        })
        .eq("id", sessionIdRef.current);

      for (const cp of checkpoints) {
        if (cp.id) {
          await supabase
            .from("touring_checkpoints")
            .update({
              city_name: cp.city_name,
              latitude: cp.latitude,
              longitude: cp.longitude,
              scheduled_date: cp.scheduled_date,
              scheduled_time: cp.scheduled_time,
              order_index: checkpoints.indexOf(cp),
              status: cp.status || "pending",
              delay_minutes: cp.delay_minutes || 0,
              is_final_destination: cp.is_final_destination || false,
              is_deleted: cp.is_deleted || false
            })
            .eq("id", cp.id)
            .eq("session_id", sessionIdRef.current);
        }
      }

      const { data: sessionsData } = await supabase.from("touring_sessions").select("*").order("created_at", { ascending: false });
      if (sessionsData) setSessions(sessionsData);

    } catch (error) {
      console.error("Error saving to database:", error);
    }
  }, [checkpoints, transport, sessionStatus, lateDeparture, currentStatus]);

  // ─── BACKGROUND TRACKING ──────────────────────────────────────────────────

  const startBackgroundTracking = useCallback((sessionId) => {
    if (!sessionId) return;
    if (backgroundIntervalRef.current) clearInterval(backgroundIntervalRef.current);

    backgroundIntervalRef.current = setInterval(() => {
      if (!sessionId || !navigator.geolocation) return;
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, speed } = position.coords;
          const currentSpeed = speed || 0;
          setCurrentLocation({ lat: latitude, lng: longitude, speed: currentSpeed });

          await supabase.from("touring_location_tracking").insert({
            session_id: sessionId, latitude, longitude, speed: currentSpeed, heading: position.coords.heading || 0
          });

          // Update status
          let newStatus = currentSpeed < 0.3 ? "stopped" : "running";
          let locationName = currentSpeed < 0.3 ? "Berhenti" : "Sedang berjalan";
          
          // Cek checkpoint terdekat
          let nearestCp = null;
          let nearestDist = Infinity;
          for (const cp of checkpoints) {
            if (cp.is_deleted || cp.status === "reached") continue;
            const dist = getDistanceKm(lat, lng, cp.latitude, cp.longitude);
            if (dist < nearestDist) { nearestDist = dist; nearestCp = cp; }
          }
          if (nearestCp && nearestDist < 10) {
            locationName = currentSpeed < 0.3 ? `Berhenti di ${nearestCp.city_name}` : `Menuju ${nearestCp.city_name} (${nearestDist.toFixed(1)} km)`;
          }

          setCurrentStatus({ status: newStatus, location_name: locationName, speed: currentSpeed, last_update: new Date() });

          await supabase.from("touring_sessions").update({
            current_status: newStatus, current_location_name: locationName, is_running: true, last_location_update: new Date().toISOString()
          }).eq("id", sessionId);

          // Check checkpoint
          checkForCheckpoint(latitude, longitude);
        },
        (error) => console.error("GPS error:", error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }, 5000);
  }, [checkpoints]);

  const stopBackgroundTracking = useCallback(() => {
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
      backgroundIntervalRef.current = null;
    }
  }, []);

  // ─── CHECK CHECKPOINT ──────────────────────────────────────────────────

  const checkForCheckpoint = useCallback((lat, lng) => {
    const threshold = 0.5;
    const now = new Date();

    checkpoints.forEach((cp, index) => {
      if (cp.status === "reached" || cp.is_deleted) return;
      const dist = getDistanceKm(lat, lng, cp.latitude, cp.longitude);
      if (dist < threshold) {
        const updated = [...checkpoints];
        updated[index] = { ...cp, status: "reached", actual_arrival_time: now.toISOString() };
        setCheckpoints(updated);

        if (cp.scheduled_time && cp.scheduled_date) {
          const scheduledDateTime = new Date(`${cp.scheduled_date}T${cp.scheduled_time}:00`);
          const delayMinutes = Math.floor((now - scheduledDateTime) / 60000);
          updated[index].delay_minutes = delayMinutes;
          setCheckpoints(updated);

          if (delayMinutes > 5) {
            addNotification("late", `Telat ${delayMinutes} menit di ${cp.city_name}`, delayMinutes);
          } else if (delayMinutes < -5) {
            addNotification("early", `Lebih awal ${Math.abs(delayMinutes)} menit di ${cp.city_name}`, delayMinutes);
          } else {
            addNotification("arrived", `Tiba tepat waktu di ${cp.city_name}`, 0);
          }
        }

        saveToDatabase();

        if (cp.is_final_destination) {
          stopTracking();
          addNotification("info", `🎉 Perjalanan selesai! Tiba di tujuan akhir: ${cp.city_name}`, 0);
        }
      }
    });
  }, [checkpoints, saveToDatabase]);

  // ─── TRACKING FUNCTIONS ──────────────────────────────────────────────────

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation");
      return;
    }

    setIsTracking(true);
    setSessionStatus("active");
    setLateDeparture(false);

    supabase.from("touring_sessions").update({ 
      status: "active", late_departure: false, auto_started: false, is_running: true, current_status: "running"
    }).eq("id", sessionIdRef.current).then(() => saveToDatabase());

    startBackgroundTracking(sessionIdRef.current);
    addNotification("info", "🚀 Perjalanan dimulai", 0);
  }, [saveToDatabase, startBackgroundTracking, addNotification]);

  const stopTracking = useCallback(async () => {
    stopBackgroundTracking();
    setIsTracking(false);
    setSessionStatus("completed");

    await supabase.from("touring_sessions").update({ 
      status: "completed", completed_at: new Date().toISOString(), is_running: false, current_status: "idle"
    }).eq("id", sessionIdRef.current);

    saveToDatabase();
    addNotification("info", "🏁 Perjalanan telah selesai", 0);
  }, [saveToDatabase, stopBackgroundTracking, addNotification]);

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────

  const addNotification = useCallback((type, message, minutes) => {
    const id = notificationIdRef.current++;
    setNotifications(prev => [{ id, type, message, minutes, created_at: new Date().toISOString() }, ...prev].slice(0, 10));
    if (sessionIdRef.current) {
      supabase.from("touring_notifications").insert({
        session_id: sessionIdRef.current, checkpoint_id: selectedCheckpoint?.id || null, type, minutes, message
      }).then(() => {});
    }
  }, [selectedCheckpoint]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ─── MANUAL DELAY ──────────────────────────────────────────────────────

  const handleManualDelay = useCallback((cp, type, minutes) => {
    const updated = checkpoints.map(c => {
      if (c.id === cp.id) return { ...c, delay_minutes: type === "late" ? minutes : -minutes };
      return c;
    });
    setCheckpoints(updated);
    setShowDelayModal(false);
    setSelectedCheckpoint(null);
    const message = type === "late" ? `Telat ${minutes} menit di ${cp.city_name} (manual)` : `Lebih awal ${minutes} menit di ${cp.city_name} (manual)`;
    addNotification(type, message, minutes);
    saveToDatabase();
  }, [checkpoints, addNotification, saveToDatabase]);

  // ─── LATE DEPARTURE ──────────────────────────────────────────────────

  const handleLateDeparture = useCallback(() => {
    setLateDeparture(true);
    if (sessionIdRef.current) {
      supabase.from("touring_sessions").update({ late_departure: true }).eq("id", sessionIdRef.current)
        .then(() => addNotification("info", "⚠️ Berangkat telat, auto-start dinonaktifkan", 0));
    }
  }, [addNotification]);

  // ─── CHECKPOINT CRUD ──────────────────────────────────────────────────

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

  const addCheckpoint = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setCheckpoints([...checkpoints, { 
      city_name: "Kota Baru", latitude: -7.5, longitude: 110.0, 
      scheduled_date: today, scheduled_time: "12:00", status: "pending",
      is_final_destination: false, is_deleted: false 
    }]);
    saveToDatabase();
  }, [checkpoints, saveToDatabase]);

  const removeCheckpoint = useCallback((index) => {
    const updated = [...checkpoints];
    updated[index] = { ...updated[index], is_deleted: true };
    setCheckpoints(updated.filter(cp => !cp.is_deleted));
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
    return `${window.location.origin}${window.location.pathname}?view=${sessionCode}`;
  }, [sessionCode]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareLink());
    alert("Link pemantau berhasil disalin!");
  }, [shareLink]);

  // ─── INIT ──────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    loadAllSessions();

    const params = new URLSearchParams(window.location.search);
    if (params.get("view")) {
      window.location.href = `/touring-view?code=${params.get("view")}`;
    }

    return () => {
      isMounted.current = false;
      stopBackgroundTracking();
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
        <button onClick={loadAllSessions} style={{ ...btnPrimary, marginTop: "16px" }}>
          <FiRefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    );
  }

  const isSessionComplete = sessionStatus === "completed" || checkpoints.some(cp => cp.is_final_destination && cp.status === "reached");

  // ─── RENDER ────────────────────────────────────────────────────────────

  return (
    <div style={{ ...styles.container, ...(isMobile ? styles.containerMobile : {}) }}>
      {/* Header */}
      <header style={{ ...styles.header, ...(isMobile ? styles.headerMobile : {}) }}>
        <div style={styles.headerLeft}>
          <FiMapPin size={isMobile ? 20 : 24} color="#3B82F6" />
          <h1 style={{ ...styles.headerTitle, ...(isMobile ? styles.headerTitleMobile : {}) }}>Touring Tracker</h1>
          {!isMobile && (
            <button onClick={() => setShowSessionList(!showSessionList)} style={{ ...iconBtn, padding: "4px 10px", background: showSessionList ? "#1D4ED8" : "#1E293B", color: showSessionList ? "#93C5FD" : "#94A3B8" }}>
              <FiList size={14} />
            </button>
          )}
        </div>
        <div style={{ ...styles.headerRight, ...(isMobile ? styles.headerRightMobile : {}) }}>
          <span style={{ ...styles.statusBadge, ...(isMobile ? styles.statusBadgeMobile : {}), background: isSessionComplete ? "#1E293B" : sessionStatus === "active" ? "#065F46" : "#1E293B", color: isSessionComplete ? "#94A3B8" : sessionStatus === "active" ? "#6EE7B7" : "#94A3B8" }}>
            {isSessionComplete ? <FiCheckCircle size={12} /> : sessionStatus === "active" ? <FiZap size={12} /> : <FiClock size={12} />}
            {isSessionComplete ? "Selesai" : sessionStatus === "active" ? "Berjalan" : "Belum Mulai"}
          </span>
          {!isMobile && (
            <>
              <button onClick={() => setShowSharePanel(true)} style={btnPrimary}><FiShare2 size={14} /> Bagikan</button>
              <button onClick={() => setShowSettings(!showSettings)} style={{ ...iconBtn, padding: "8px 12px" }}><FiSettings size={16} /></button>
            </>
          )}
          {isMobile && (
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} style={{ ...iconBtn, padding: "8px 12px" }}><FiMenu size={20} /></button>
          )}
        </div>
      </header>

      {/* Status Bar */}
      {sessionStatus === "active" && !isSessionComplete && (
        <div style={styles.statusBar}>
          <div style={styles.statusBarContent}>
            <div style={styles.statusIcon}>
              {currentStatus.status === "running" ? <FiActivity size={20} color="#10B981" /> :
               currentStatus.status === "stopped" ? <FiPause size={20} color="#F59E0B" /> : <FiClock size={20} color="#94A3B8" />}
            </div>
            <div style={styles.statusInfo}>
              <div style={styles.statusText}>
                {currentStatus.status === "running" ? <span style={{ color: "#10B981" }}>🟢 Sedang Berjalan</span> :
                 currentStatus.status === "stopped" ? <span style={{ color: "#F59E0B" }}>🟡 Sedang Berhenti</span> :
                 <span style={{ color: "#94A3B8" }}>⏳ Menunggu</span>}
                <span style={styles.statusLocation}>{currentStatus.location_name || "Lokasi tidak diketahui"}</span>
              </div>
            </div>
            <button onClick={() => setShowStatusDetail(!showStatusDetail)} style={styles.statusDetailBtn}>
              <FiInfo size={14} /> Detail
            </button>
          </div>
          {showStatusDetail && (
            <div style={styles.statusDetailPopup}>
              <div style={styles.statusDetailItem}><span style={styles.statusDetailLabel}>Status</span><span>{currentStatus.status === "running" ? "🟢 Berjalan" : currentStatus.status === "stopped" ? "🟡 Berhenti" : "⏳ Idle"}</span></div>
              <div style={styles.statusDetailItem}><span style={styles.statusDetailLabel}>Lokasi</span><span>{currentStatus.location_name || "-"}</span></div>
              <div style={styles.statusDetailItem}><span style={styles.statusDetailLabel}>Update</span><span>{currentStatus.last_update ? formatTimeAgo(currentStatus.last_update) : "-"}</span></div>
              <div style={styles.statusDetailItem}><span style={styles.statusDetailLabel}>Sinyal GPS</span><span style={{ color: "#10B981" }}><FiWifi size={12} /> Aktif</span></div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu */}
      {isMobile && showMobileMenu && (
        <div style={styles.mobileMenu}>
          <button onClick={() => { setShowMobileMenu(false); setShowSessionList(!showSessionList); }} style={styles.mobileMenuItem}><FiList size={16} /> Daftar Perjalanan</button>
          <button onClick={() => { setShowMobileMenu(false); setShowSharePanel(true); }} style={styles.mobileMenuItem}><FiShare2 size={16} /> Bagikan</button>
          <button onClick={() => { setShowMobileMenu(false); setShowSettings(!showSettings); }} style={styles.mobileMenuItem}><FiSettings size={16} /> Pengaturan</button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ ...styles.mainContent, ...(isMobile ? styles.mainContentMobile : {}) }}>
        {/* Session List */}
        {showSessionList && !isMobile && (
          <aside style={styles.sessionSidebar}>
            <div style={styles.sessionSidebarHeader}>
              <h3 style={styles.sessionSidebarTitle}><FiList size={16} /> Daftar Perjalanan</h3>
              <button onClick={createNewSession} style={{ ...btnPrimary, padding: "6px 12px", fontSize: "12px" }}><FiPlus size={14} /> Baru</button>
            </div>
            <div style={styles.sessionList}>
              {sessions.map(s => (
                <div key={s.id} onClick={() => { setSelectedSessionId(s.id); loadSessionData(s.id); }} style={{ ...styles.sessionItem, background: selectedSessionId === s.id ? "#1D4ED8" : "#1E293B", borderColor: selectedSessionId === s.id ? "#3B82F6" : "#334155" }}>
                  <div style={styles.sessionItemLeft}>
                    <div style={styles.sessionCode}>{s.session_code}</div>
                    <div style={styles.sessionMeta}>
                      <span style={styles.sessionMetaItem}><FiCalendar size={10} /> {formatDate(s.created_at)}</span>
                      <span style={styles.sessionMetaItem}>{getTransportIcon(s.transport_type)} {getTransportLabel(s.transport_type)}</span>
                    </div>
                  </div>
                  <div style={styles.sessionItemRight}>
                    <span style={{ ...styles.sessionStatusBadge, background: s.status === "active" ? "#065F46" : "#1E293B", color: s.status === "active" ? "#6EE7B7" : "#94A3B8" }}>{s.status === "active" ? "Active" : s.status === "completed" ? "Selesai" : "Pending"}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} style={{ ...iconBtn, padding: "2px 6px", color: "#EF4444", border: "none" }}><FiTrash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div style={styles.emptySession}><p>Belum ada perjalanan</p><button onClick={createNewSession} style={{ ...btnPrimary, marginTop: "8px" }}><FiPlus size={14} /> Buat Perjalanan Baru</button></div>
              )}
            </div>
          </aside>
        )}

        {/* Mobile Session List */}
        {isMobile && showSessionList && (
          <div style={styles.mobileSessionList}>
            <div style={styles.mobileSessionHeader}>
              <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: "600" }}><FiList size={14} style={{ marginRight: "8px" }} /> Daftar Perjalanan</span>
              <button onClick={createNewSession} style={{ ...btnPrimary, padding: "4px 12px", fontSize: "11px" }}><FiPlus size={12} /> Baru</button>
            </div>
            <div style={styles.mobileSessionItems}>
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} onClick={() => { setSelectedSessionId(s.id); loadSessionData(s.id); setShowSessionList(false); }} style={{ ...styles.mobileSessionItem, background: selectedSessionId === s.id ? "#1D4ED8" : "#1E293B" }}>
                  <span style={styles.mobileSessionCode}>{s.session_code}</span>
                  <span style={{ ...styles.sessionStatusBadge, background: s.status === "active" ? "#065F46" : "#1E293B", color: s.status === "active" ? "#6EE7B7" : "#94A3B8" }}>{s.status === "active" ? "Active" : "Pending"}</span>
                </div>
              ))}
              {sessions.length > 5 && <div style={{ color: "#64748B", fontSize: "12px", textAlign: "center", padding: "8px" }}>+{sessions.length - 5} lainnya</div>}
            </div>
          </div>
        )}

        {/* Settings Sidebar */}
        {showSettings && (
          <aside style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}) }}>
            <div style={styles.sidebarContent}>
              {/* Session Info */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}><FiInfo size={14} /> Informasi Sesi</h3>
                <div style={styles.sessionInfo}>
                  <div style={styles.sessionInfoRow}><span style={styles.sessionInfoLabel}>Kode</span><span style={styles.sessionInfoValue}>{sessionCode}</span></div>
                  <div style={styles.sessionInfoRow}><span style={styles.sessionInfoLabel}>Dibuat</span><span style={styles.sessionInfoValue}>{formatTimeAgo(session?.created_at)}</span></div>
                  <div style={styles.sessionInfoRow}><span style={styles.sessionInfoLabel}>Status</span><span style={{ ...styles.sessionInfoValue, color: isSessionComplete ? "#94A3B8" : sessionStatus === "active" ? "#6EE7B7" : "#94A3B8" }}>{isSessionComplete ? "✅ Selesai" : sessionStatus === "active" ? "🟢 Berjalan" : "⏳ Belum Mulai"}</span></div>
                  {lateDeparture && <div style={{ ...styles.sessionInfoRow, color: "#F59E0B" }}><span style={styles.sessionInfoLabel}><FiAlertTriangle size={12} /> Status</span><span style={{ color: "#F59E0B", fontSize: "12px" }}>⏰ Berangkat Telat</span></div>}
                </div>
              </div>

              {/* Transport Form */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}><FiTruck size={14} /> Transportasi</h3>
                <div style={{ ...styles.transportGrid, ...(isMobile ? styles.transportGridMobile : {}) }}>
                  {TRANSPORT_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setTransport({ ...transport, transport_type: t.value })} style={{ ...styles.transportBtn, ...(isMobile ? styles.transportBtnMobile : {}), borderColor: transport.transport_type === t.value ? "#3B82F6" : "#334155", background: transport.transport_type === t.value ? "rgba(59,130,246,0.15)" : "#1E293B", color: transport.transport_type === t.value ? "#60A5FA" : "#64748B" }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
                {transport.transport_type !== "jalan" && transport.transport_type !== "kereta" && (
                  <>
                    <input value={transport.plate_number} onChange={e => setTransport({ ...transport, plate_number: e.target.value })} style={inputStyle} placeholder="Nomor Plat" />
                    <input type="number" step="0.5" value={transport.fuel_liters} onChange={e => setTransport({ ...transport, fuel_liters: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="Jumlah Bensin (Liter)" />
                  </>
                )}
                {transport.transport_type === "kereta" && <input value="Kereta" disabled style={{ ...inputStyle, opacity: 0.5 }} placeholder="Kereta tidak memerlukan plat" />}
                <input value={transport.driver_name} onChange={e => setTransport({ ...transport, driver_name: e.target.value })} style={inputStyle} placeholder="Nama Pengemudi/Penumpang" />
                <button onClick={saveToDatabase} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}><FiSave size={14} /> Simpan Data</button>
              </div>

              {/* Checkpoints Editor */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}><FiMap size={14} /> Rute & Jadwal</h3>
                <div style={{ ...styles.checkpointList, ...(isMobile ? styles.checkpointListMobile : {}) }}>
                  {checkpoints.map((cp, i) => (
                    <div key={i} style={styles.checkpointItem}>
                      {editingCheckpoint === i ? (
                        <div style={styles.editForm}>
                          <input value={editForm.city_name || ""} onChange={e => setEditForm({ ...editForm, city_name: e.target.value })} style={inputStyle} placeholder="Nama Kota" />
                          <input type="date" value={editForm.scheduled_date || ""} onChange={e => setEditForm({ ...editForm, scheduled_date: e.target.value })} style={inputStyle} />
                          <input type="time" value={editForm.scheduled_time || ""} onChange={e => setEditForm({ ...editForm, scheduled_time: e.target.value })} style={inputStyle} />
                          <input type="number" step="0.0001" value={editForm.latitude || ""} onChange={e => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="Latitude" />
                          <input type="number" step="0.0001" value={editForm.longitude || ""} onChange={e => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="Longitude" />
                          <label style={{ color: "#94A3B8", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="checkbox" checked={editForm.is_final_destination || false} onChange={e => setEditForm({ ...editForm, is_final_destination: e.target.checked })} />
                            Tujuan Akhir
                          </label>
                          <div style={styles.editActions}>
                            <button onClick={() => setEditingCheckpoint(null)} style={btnSecondary}>Batal</button>
                            <button onClick={saveEditCheckpoint} style={btnPrimary}>Simpan</button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.checkpointRow}>
                          <div style={{ ...styles.checkpointNumber, ...(isMobile ? styles.checkpointNumberMobile : {}) }}>{i + 1}</div>
                          <div style={styles.checkpointInfo}>
                            <div style={{ ...styles.checkpointName, ...(isMobile ? styles.checkpointNameMobile : {}) }}>
                              {cp.city_name}
                              {cp.is_final_destination && <span style={{ color: "#F59E0B", fontSize: "10px", marginLeft: "6px" }}>🏁</span>}
                              {cp.status === "reached" && <FiCheckCircle size={12} color="#10B981" style={{ marginLeft: "4px" }} />}
                            </div>
                            <div style={{ ...styles.checkpointTime, ...(isMobile ? styles.checkpointTimeMobile : {}) }}>
                              <FiCalendar size={10} /> {formatDate(cp.scheduled_date)} <FiClock size={10} /> {formatTime(cp.scheduled_time)}
                              {cp.delay_minutes !== 0 && cp.delay_minutes != null && (
                                <span style={{ color: cp.delay_minutes > 0 ? "#FCA5A5" : "#FDE68A", marginLeft: "8px" }}>
                                  {cp.delay_minutes > 0 ? <FiArrowDown size={10} /> : <FiArrowUp size={10} />}
                                  {Math.abs(cp.delay_minutes)}mnt
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ ...styles.checkpointActions, ...(isMobile ? styles.checkpointActionsMobile : {}) }}>
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
                <button onClick={addCheckpoint} style={{ ...btnSecondary, width: "100%", justifyContent: "center" }}><FiPlus size={14} /> Tambah Kota</button>
              </div>

              {/* Control Buttons */}
              <div style={styles.section}>
                {!isSessionComplete ? (
                  !isTracking ? (
                    <>
                      <button onClick={startTracking} style={{ ...btnPrimary, width: "100%", justifyContent: "center", background: "#10B981" }}><FiPlay size={14} /> Mulai Perjalanan</button>
                      <button onClick={handleLateDeparture} style={{ ...btnSecondary, width: "100%", justifyContent: "center", marginTop: "8px", borderColor: "#F59E0B", color: "#F59E0B" }}><FiAlertTriangle size={14} /> Telat Berangkat</button>
                      {lateDeparture && <div style={{ color: "#F59E0B", fontSize: "12px", textAlign: "center", marginTop: "8px" }}>⚠️ Auto-start dinonaktifkan karena berangkat telat</div>}
                    </>
                  ) : (
                    <button onClick={stopTracking} style={{ ...btnPrimary, width: "100%", justifyContent: "center", background: "#EF4444" }}><FiSquare size={14} /> Selesaikan Perjalanan</button>
                  )
                ) : (
                  <div style={{ textAlign: "center", color: "#6EE7B7", padding: "12px" }}><FiCheckCircle size={24} style={{ display: "block", margin: "0 auto 8px" }} />Perjalanan Selesai! 🎉</div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Map Area */}
        <div style={{ ...styles.mapContainer, ...(isMobile ? styles.mapContainerMobile : {}) }}>
          <TouringMap
            checkpoints={checkpoints}
            currentLocation={currentLocation}
            sessionStatus={sessionStatus}
            onReportDelay={(cp) => { setSelectedCheckpoint(cp); setShowDelayModal(true); }}
            onMarkReached={(cp) => {
              const updated = checkpoints.map(c => {
                if (c.id === cp.id) return { ...c, status: "reached", actual_arrival_time: new Date().toISOString() };
                return c;
              });
              setCheckpoints(updated);
              saveToDatabase();
            }}
            isTracking={isTracking}
            isMobile={isMobile}
            currentStatus={currentStatus}
          />
        </div>
      </div>

      {/* Notification Panel */}
      {notifications.length > 0 && (
        <div style={{ ...styles.notificationPanel, ...(isMobile ? styles.notificationPanelMobile : {}) }}>
          {notifications.map(n => (
            <div key={n.id} style={{ ...styles.notificationItem, ...(isMobile ? styles.notificationItemMobile : {}), borderColor: n.type === "late" ? "#EF4444" : n.type === "early" ? "#F59E0B" : n.type === "info" ? "#3B82F6" : "#10B981" }}>
              {n.type === "late" ? <FiArrowDown color="#EF4444" /> : n.type === "early" ? <FiArrowUp color="#F59E0B" /> : n.type === "info" ? <FiInfo color="#3B82F6" /> : <FiCheckCircle color="#10B981" />}
              <span style={styles.notificationMessage}>{n.message}</span>
              <button onClick={() => removeNotification(n.id)} style={styles.notificationClose}><FiX size={12} /></button>
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
          isMobile={isMobile}
        />
      )}

      {/* Share Panel */}
      {showSharePanel && (
        <SharePanel
          sessionCode={sessionCode}
          onClose={() => setShowSharePanel(false)}
          onCopy={copyLink}
          shareUrl={shareLink()}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────

function TouringMap({ checkpoints, currentLocation, sessionStatus, onReportDelay, onMarkReached, isTracking, isMobile, currentStatus }) {
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

    const startLat = checkpoints[0]?.latitude || -7.7200;
    const startLng = checkpoints[0]?.longitude || 109.9084;

    const map = L.map(mapRef.current, { zoomControl: !isMobile, attributionControl: true });
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
      if (cp.is_deleted) return;
      const color = cp.status === "reached" ? "#10B981" : "#6B7280";
      const size = isMobile ? 28 : 34;
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${isMobile ? 10 : 13}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(`<b>${cp.city_name}</b><br>Jadwal: ${cp.scheduled_time || "--:--"}${cp.delay_minutes ? `<br>Delay: ${cp.delay_minutes} menit` : ""}${cp.is_final_destination ? "<br>🏁 Tujuan Akhir" : ""}`)
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (polylineRef.current) polylineRef.current.remove();
    const latlngs = checkpoints.filter(cp => !cp.is_deleted).map(cp => [cp.latitude, cp.longitude]);
    polylineRef.current = L.polyline(latlngs, { color: "#3B82F6", weight: isMobile ? 2 : 3, opacity: 0.6, dashArray: "8,4" }).addTo(map);
  };

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !initializedRef.current) return;
    renderMarkers(L, mapInstanceRef.current);
  }, [checkpoints, isMobile]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !currentLocation || !initializedRef.current) return;

    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
      if (isTracking) mapInstanceRef.current.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 0.5 });
    } else {
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
        .bindPopup("📍 Lokasi Anda Sekarang")
        .addTo(mapInstanceRef.current);
      if (isTracking) mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], isMobile ? 11 : 13, { animate: true });
    }

    if (currentMarkerRef.current && currentStatus) {
      const statusText = currentStatus.status === "running" ? "🟢 Berjalan" : currentStatus.status === "stopped" ? "🟡 Berhenti" : "⏳ Idle";
      currentMarkerRef.current.setPopupContent(`📍 Lokasi Anda Sekarang<br>Status: ${statusText}<br>${currentStatus.location_name || ""}`);
    }
  }, [currentLocation, isTracking, isMobile, currentStatus]);

  useEffect(() => {
    if (mapInstanceRef.current) setTimeout(() => mapInstanceRef.current.invalidateSize(), 300);
  }, [isMobile]);

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
          <h3 style={{ ...styles.modalTitle, ...(isMobile ? styles.modalTitleMobile : {}) }}><FiBell size={18} color="#3B82F6" /> Lapor Keterlambatan/Awal</h3>
          <button onClick={onClose} style={iconBtn}><FiX size={18} /></button>
        </div>
        <p style={styles.modalSubtitle}>Checkpoint: <strong style={{ color: "#94A3B8" }}>{checkpoint?.city_name}</strong></p>
        <div style={{ ...styles.modalTypeButtons, ...(isMobile ? styles.modalTypeButtonsMobile : {}) }}>
          <button onClick={() => setType("late")} style={{ ...styles.modalTypeBtn, ...(isMobile ? styles.modalTypeBtnMobile : {}), background: type === "late" ? "#7F1D1D" : "#1E293B", borderColor: type === "late" ? "#EF4444" : "#334155", color: type === "late" ? "#FCA5A5" : "#64748B" }}><FiArrowDown size={14} /> Telat</button>
          <button onClick={() => setType("early")} style={{ ...styles.modalTypeBtn, ...(isMobile ? styles.modalTypeBtnMobile : {}), background: type === "early" ? "#78350F" : "#1E293B", borderColor: type === "early" ? "#F59E0B" : "#334155", color: type === "early" ? "#FDE68A" : "#64748B" }}><FiArrowUp size={14} /> Awal</button>
        </div>
        <div style={styles.modalMinutes}>
          <label style={styles.modalLabel}>Jumlah Menit</label>
          <div style={{ ...styles.modalMinutesControl, ...(isMobile ? styles.modalMinutesControlMobile : {}) }}>
            <button onClick={() => setMinutes(m => Math.max(1, m - 5))} style={iconBtn}><FiMinus size={16} /></button>
            <input type="number" value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: "center", width: isMobile ? "60px" : "80px", fontSize: isMobile ? "16px" : "20px", fontWeight: "700" }} min={1} />
            <button onClick={() => setMinutes(m => m + 5)} style={iconBtn}><FiPlus size={16} /></button>
          </div>
        </div>
        <div style={{ ...styles.modalActions, ...(isMobile ? styles.modalActionsMobile : {}) }}>
          <button onClick={onClose} style={btnSecondary}>Batal</button>
          <button onClick={() => onSubmit(type, minutes)} style={type === "late" ? { ...btnPrimary, background: "#DC2626" } : { ...btnPrimary, background: "#D97706" }}><FiSave size={14} /> Simpan</button>
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
          <h3 style={{ ...styles.modalTitle, ...(isMobile ? styles.modalTitleMobile : {}) }}><FiShare2 size={18} color="#3B82F6" /> Bagikan Lokasi</h3>
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
        <button onClick={onCopy} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}><FiLink size={14} /> Salin Link Pemantau</button>
        <p style={styles.shareInfo}><FiInfo size={12} /> Bagikan link ini kepada orang yang ingin memantau perjalanan Anda secara real-time</p>
      </div>
    </div>
  );
}

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

// Tambahkan animasi
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @media (max-width: 768px) { .leaflet-control-zoom { display: none !important; } }
`;
document.head.appendChild(styleSheet);
