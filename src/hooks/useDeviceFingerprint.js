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
        // 1. Collect device data
        const deviceData = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages ? navigator.languages.join(',') : navigator.language,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
          deviceMemory: navigator.deviceMemory || 'unknown',
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          sessionStorage: typeof sessionStorage !== 'undefined',
          localStorage: typeof localStorage !== 'undefined',
          indexedDB: !!window.indexedDB,
          cookies: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || 'unspecified',
          plugins: navigator.plugins ? navigator.plugins.length : 0,
        };

        // 2. Create fingerprint from data
        const dataString = JSON.stringify(deviceData);
        const fp = btoa(dataString).substring(0, 50); // Simple fingerprint
        setFingerprint(fp);

        // 3. Parse device info
        const getBrowserInfo = () => {
          const ua = navigator.userAgent;
          let browser = 'Unknown';
          
          if (ua.includes('Firefox')) browser = 'Firefox';
          else if (ua.includes('Chrome')) browser = 'Chrome';
          else if (ua.includes('Safari')) browser = 'Safari';
          else if (ua.includes('Edge')) browser = 'Edge';
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
          else if (ua.includes('iOS')) os = 'iOS';
          
          return os;
        };

        // 4. Get IP (using free service)
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          setIpAddress(ipData.ip);
        } catch (ipError) {
          setIpAddress('Unable to detect');
        }

        // 5. Set device info
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
        
        // 6. Log fingerprint for debugging
        console.log('Generated Fingerprint:', fp);
        console.log('Device Info:', deviceInfo);
        console.log('IP Address:', ipAddress);

      } catch (error) {
        console.error('Error generating fingerprint:', error);
        
        // Fallback fingerprint
        const fallbackFp = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setFingerprint(fallbackFp);
        setDeviceInfo({ userAgent: navigator.userAgent });
        setIpAddress('fallback-ip');
        setIsReady(true);
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
