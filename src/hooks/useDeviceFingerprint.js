import { useState, useEffect } from 'react';
import { DeviceUtils } from '../utils/deviceUtils';

export const useDeviceFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [ipAddress, setIpAddress] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Generate fingerprint
        const fp = await DeviceUtils.generateFingerprint();
        setFingerprint(fp);

        // Get device info
        const info = DeviceUtils.getDeviceInfo();
        setDeviceInfo(info);

        // Get IP address
        const ip = await DeviceUtils.getIPAddress();
        setIpAddress(ip);
      } catch (error) {
        console.error('Error initializing device fingerprint:', error);
      }
    };

    initialize();
  }, []);

  return {
    fingerprint,
    deviceInfo,
    ipAddress,
    getFullDeviceData: () => ({
      fingerprint,
      ...deviceInfo,
      ipAddress,
      timestamp: new Date().toISOString(),
    }),
  };
};
