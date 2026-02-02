// src/hooks/useDeviceFingerprint.js
import { useState, useEffect } from 'react';

export const useDeviceFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [ipAddress, setIpAddress] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        // Collect basic device information
        const deviceData = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages ? navigator.languages.join(',') : navigator.language,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cookies: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || 'unspecified',
          plugins: navigator.plugins ? navigator.plugins.length : 0,
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
          maxTouchPoints: navigator.maxTouchPoints || 0,
        };

        // Generate fingerprint from collected data
        const dataString = JSON.stringify(deviceData);
        const fp = btoa(dataString).substring(0, 64); // Use first 64 chars as fingerprint
        setFingerprint(fp);

        // Parse browser info
        const getBrowserInfo = () => {
          const ua = navigator.userAgent;
          let browser = 'Unknown';
          
          if (ua.includes('Firefox')) browser = 'Firefox';
          else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
          else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
          else if (ua.includes('Edg')) browser = 'Edge';
          else if (ua.includes('Opera')) browser = 'Opera';
          
          return browser;
        };

        const getOSInfo = () => {
          const ua = navigator.userAgent;
          let os = 'Unknown';
          
          if (ua.includes('Windows')) os = 'Windows';
          else if (ua.includes('Mac')) os = 'macOS';
          else if (ua.includes('Linux')) os = 'Linux';
          else if (ua.includes('Android')) os = 'Android';
          else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
          
          return os;
        };

        // Try to get IP address
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          if (response.ok) {
            const data = await response.json();
            setIpAddress(data.ip);
          } else {
            setIpAddress('Unable to detect');
          }
        } catch (ipError) {
          console.log('IP detection failed, using fallback');
          setIpAddress('127.0.0.1');
        }

        // Set device info
        setDeviceInfo({
          userAgent: deviceData.userAgent,
          browser: getBrowserInfo(),
          os: getOSInfo(),
          platform: deviceData.platform,
          screenResolution: deviceData.screenResolution,
          languages: deviceData.languages,
          timezone: deviceData.timezone,
          cookieEnabled: deviceData.cookies,
        });

        setIsReady(true);
        
        console.log('✅ Device fingerprint generated:', fp.substring(0, 20) + '...');
        console.log('📱 Device info:', {
          browser: getBrowserInfo(),
          os: getOSInfo(),
          platform: deviceData.platform
        });

      } catch (error) {
        console.error('❌ Error generating fingerprint:', error);
        
        // Fallback fingerprint
        const fallbackFp = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setFingerprint(fallbackFp);
        setDeviceInfo({ 
          userAgent: navigator.userAgent,
          browser: 'Unknown',
          os: 'Unknown'
        });
        setIpAddress('fallback-ip');
        setIsReady(true);
        
        console.log('⚠️ Using fallback fingerprint:', fallbackFp);
      }
    };

    generateFingerprint();
  }, []);

  return {
    fingerprint,
    deviceInfo,
    ipAddress,
    isReady,
    getFullDeviceData: () => ({
      fingerprint,
      ...deviceInfo,
      ipAddress,
      timestamp: new Date().toISOString(),
    }),
  };
};
