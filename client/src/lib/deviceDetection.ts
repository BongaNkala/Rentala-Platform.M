/**
 * Device Detection Utilities
 * Detects browser, OS, device type, and connection speed information
 */

export interface DeviceInfo {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: "desktop" | "tablet" | "mobile";
  screenResolution: string;
  connectionSpeed?: string;
}

/**
 * Detect browser information
 */
export function detectBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;

  // Chrome
  if (ua.indexOf("Chrome") > -1) {
    const match = ua.match(/Chrome\/([0-9.]+)/);
    return { name: "Chrome", version: match ? match[1] : "Unknown" };
  }

  // Firefox
  if (ua.indexOf("Firefox") > -1) {
    const match = ua.match(/Firefox\/([0-9.]+)/);
    return { name: "Firefox", version: match ? match[1] : "Unknown" };
  }

  // Safari
  if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
    const match = ua.match(/Version\/([0-9.]+)/);
    return { name: "Safari", version: match ? match[1] : "Unknown" };
  }

  // Edge
  if (ua.indexOf("Edg") > -1) {
    const match = ua.match(/Edg\/([0-9.]+)/);
    return { name: "Edge", version: match ? match[1] : "Unknown" };
  }

  // Opera
  if (ua.indexOf("OPR") > -1) {
    const match = ua.match(/OPR\/([0-9.]+)/);
    return { name: "Opera", version: match ? match[1] : "Unknown" };
  }

  return { name: "Unknown", version: "Unknown" };
}

/**
 * Detect OS information
 */
export function detectOS(): { name: string; version: string } {
  const ua = navigator.userAgent;

  // Windows
  if (ua.indexOf("Windows") > -1) {
    const match = ua.match(/Windows NT ([0-9.]+)/);
    const version = match ? match[1] : "Unknown";
    return { name: "Windows", version };
  }

  // macOS
  if (ua.indexOf("Mac") > -1) {
    const match = ua.match(/Mac OS X ([0-9_.]+)/);
    const version = match ? match[1].replace(/_/g, ".") : "Unknown";
    return { name: "macOS", version };
  }

  // iOS
  if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) {
    const match = ua.match(/OS ([0-9_]+)/);
    const version = match ? match[1].replace(/_/g, ".") : "Unknown";
    return { name: "iOS", version };
  }

  // Android
  if (ua.indexOf("Android") > -1) {
    const match = ua.match(/Android ([0-9.]+)/);
    return { name: "Android", version: match ? match[1] : "Unknown" };
  }

  // Linux
  if (ua.indexOf("Linux") > -1) {
    return { name: "Linux", version: "Unknown" };
  }

  return { name: "Unknown", version: "Unknown" };
}

/**
 * Detect device type
 */
export function detectDeviceType(): "desktop" | "tablet" | "mobile" {
  const ua = navigator.userAgent;

  // Mobile
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    // Tablet
    if (
      /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(ua) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    ) {
      return "tablet";
    }
    return "mobile";
  }

  return "desktop";
}

/**
 * Get screen resolution
 */
export function getScreenResolution(): string {
  return `${window.screen.width}x${window.screen.height}`;
}

/**
 * Detect connection speed
 */
export async function detectConnectionSpeed(): Promise<string | undefined> {
  try {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) {
      return undefined;
    }

    const effectiveType = connection.effectiveType;
    return effectiveType; // '4g', '3g', '2g', 'slow-2g'
  } catch {
    return undefined;
  }
}

/**
 * Get all device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const browser = detectBrowser();
  const os = detectOS();
  const deviceType = detectDeviceType();
  const screenResolution = getScreenResolution();
  const connectionSpeed = await detectConnectionSpeed();

  return {
    browserName: browser.name,
    browserVersion: browser.version,
    osName: os.name,
    osVersion: os.version,
    deviceType,
    screenResolution,
    connectionSpeed,
  };
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
