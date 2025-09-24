import { NextApiRequest } from 'next';
import { ClientInfo } from '../types/auth.types';

export function getClientInfo(req: NextApiRequest): ClientInfo {
  // Get IP address with proper forwarded headers handling
  const getClientIP = (req: NextApiRequest): string | undefined => {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    
    if (forwarded) {
      return Array.isArray(forwarded) 
        ? forwarded[0] 
        : forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }
    
    return req.socket.remoteAddress;
  };

  return {
    deviceInfo: req.headers['user-agent'] || 'Unknown Device',
    ipAddress: getClientIP(req)
  };
}

export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  // Simple user agent parsing - you might want to use a library like 'ua-parser-js'
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  // Device detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}