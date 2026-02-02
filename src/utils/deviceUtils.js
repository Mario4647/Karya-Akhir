import FingerprintJS from '@fingerprintjs/fingerprintjs';

export class DeviceUtils {
  static async generateFingerprint() {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      return result.visitorId;
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      // Fallback to a simpler fingerprint
      return this.generateFallbackFingerprint();
    }
  }

  static generateFallbackFingerprint() {
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenRes: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return btoa(JSON.stringify(data));
  }

  static getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let platform = 'Unknown';

    // Detect Browser
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Detect Platform
    if (/iPhone|iPad|iPod/.test(userAgent)) platform = 'iOS';
    else if (/Android/.test(userAgent)) platform = 'Android';
    else if (/Windows/.test(userAgent)) platform = 'Windows';
    else if (/Mac/.test(userAgent)) platform = 'macOS';
    else if (/Linux/.test(userAgent)) platform = 'Linux';

    return {
      userAgent,
      browser,
      os,
      platform,
      screenResolution: `${screen.width}x${screen.height}`,
      languages: navigator.languages?.join(', ') || navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      javaEnabled: navigator.javaEnabled ? 'Yes' : 'No',
      pdfEnabled: navigator.pdfViewerEnabled ? 'Yes' : 'No',
      doNotTrack: navigator.doNotTrack || 'Not specified',
    };
  }

  static async getIPAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'Unknown';
    }
  }
}
