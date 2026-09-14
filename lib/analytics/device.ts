export type DeviceInfo = {
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  browserFamily: string;
  osFamily: string;
};

export function classifyDevice(userAgent = ''): DeviceInfo {
  const ua = userAgent.toLowerCase();
  const tablet = /ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(userAgent);
  const mobile = !tablet && /iphone|ipod|android.*mobile|windows phone|opera mini|mobile/i.test(userAgent);

  let browserFamily = 'Other';
  if (/edg\//.test(ua)) browserFamily = 'Edge';
  else if (/opr\//.test(ua) || /opera/.test(ua)) browserFamily = 'Opera';
  else if (/firefox\//.test(ua) || /fxios\//.test(ua)) browserFamily = 'Firefox';
  else if (/crios\//.test(ua) || /chrome\//.test(ua)) browserFamily = 'Chrome';
  else if (/safari\//.test(ua) && /version\//.test(ua)) browserFamily = 'Safari';

  let osFamily = 'Other';
  if (/iphone|ipad|ipod/.test(ua)) osFamily = 'iOS';
  else if (/android/.test(ua)) osFamily = 'Android';
  else if (/windows nt/.test(ua)) osFamily = 'Windows';
  else if (/macintosh|mac os x/.test(ua)) osFamily = 'macOS';
  else if (/linux/.test(ua)) osFamily = 'Linux';

  return {
    deviceType: tablet ? 'Tablet' : mobile ? 'Mobile' : 'Desktop',
    browserFamily,
    osFamily,
  };
}

export function isLikelyBot(userAgent = '') {
  return /bot|crawler|spider|slurp|headlesschrome|lighthouse|facebookexternalhit|preview|validator/i.test(userAgent);
}
