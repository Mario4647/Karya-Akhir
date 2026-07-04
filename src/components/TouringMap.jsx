// TouringMap.jsx
import { useState, useEffect, useRef, useCallback } from "react";

export default function TouringMap({ checkpoints, currentLocation, sessionStatus, onReportDelay, onMarkReached, isTracking, isMobile, totalDistance, statusMessage, stops }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  // Inisialisasi map
  useEffect(() => {
    // Cek apakah Leaflet sudah tersedia
    if (window.L) {
      initMap();
      return;
    }

    // Load Leaflet
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      // Tambahkan CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      setTimeout(initMap, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Leaflet');
    };
    document.head.appendChild(script);

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
    if (!L || !mapRef.current) return;

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
    
    // Render markers setelah map siap
    renderMarkers(L, map);
  };

  const renderMarkers = (L, map) => {
    if (!map || !L) return;
    
    // Hapus marker lama
    markersRef.current.forEach(m => {
      try { m.remove(); } catch (e) {}
    });
    markersRef.current = [];

    checkpoints.forEach((cp, i) => {
      const color = cp.status === "reached" ? "#10B981" : cp.status === "active" ? "#3B82F6" : "#6B7280";
      const size = isMobile ? 28 : 34;
      
      const popupContent = `
        <div style="font-family: Arial, sans-serif; padding: 4px;">
          <b style="font-size: ${isMobile ? '12px' : '14px'};">${i + 1}. ${cp.city_name}</b><br>
          <span style="font-size: ${isMobile ? '10px' : '12px'}; color: #666;">
            📅 ${cp.scheduled_date || "--"}<br>
            ⏰ ${cp.scheduled_time || "--:--"}<br>
            ${cp.status === "reached" ? "✅ Tiba" : "⏳ Menunggu"}<br>
            ${cp.delay_minutes ? `⏱️ Delay: ${cp.delay_minutes} menit` : ""}
            ${cp.is_final_destination ? "<br>🏁 Tujuan Akhir" : ""}
          </span>
        </div>
      `;
      
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${isMobile ? 10 : 13}px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
      
      const marker = L.marker([cp.latitude, cp.longitude], { icon })
        .bindPopup(popupContent)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Polyline
    if (polylineRef.current) {
      try { polylineRef.current.remove(); } catch (e) {}
      polylineRef.current = null;
    }
    if (checkpoints.length > 1) {
      const latlngs = checkpoints.map(cp => [cp.latitude, cp.longitude]);
      polylineRef.current = L.polyline(latlngs, { 
        color: "#3B82F6", 
        weight: isMobile ? 2 : 3, 
        opacity: 0.6, 
        dashArray: "8,4" 
      }).addTo(map);
    }
  };

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !initializedRef.current) {
      // Jika map belum siap, coba inisialisasi
      if (mapRef.current && !mapInstanceRef.current) {
        initMap();
      }
      return;
    }
    renderMarkers(L, mapInstanceRef.current);
  }, [checkpoints, isMobile]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current || !currentLocation || !initializedRef.current) return;

    if (currentMarkerRef.current) {
      try { currentMarkerRef.current.remove(); } catch (e) {}
      currentMarkerRef.current = null;
    }

    const size = isMobile ? 30 : 40;
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
        <div style="width:${isMobile ? 14 : 20}px;height:${isMobile ? 14 : 20}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 12px ${color}99;position:relative;z-index:1;transition:background 0.5s"></div>
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

    if (isTracking && sessionStatus === "active") {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], isMobile ? 11 : 13, { animate: true });
    }
  }, [currentLocation, isTracking, isMobile, statusMessage, totalDistance, stops, sessionStatus]);

  // Force invalidate size on resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          try { mapInstanceRef.current.invalidateSize(); } catch (e) {}
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
