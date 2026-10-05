// In-Memory Banned IP Cache and Threat Geolocation Resolver
const bannedIPs = new Map(); // ip -> { reason, bannedAt, expiresAt }

// Pre-seeded realistic global threat coordinates for visual SOC mapping demo
const sampleGeoLocations = [
  { name: 'Frankfurt, Germany', lat: 50.1109, lng: 8.6821 },
  { name: 'Bucharest, Romania', lat: 44.4268, lng: 26.1025 },
  { name: 'Saint Petersburg, Russia', lat: 59.9343, lng: 30.3351 },
  { name: 'Shenzhen, China', lat: 22.5431, lng: 114.0579 },
  { name: 'Sao Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  { name: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Ashburn, VA, USA', lat: 39.0438, lng: -77.4874 },
  { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780 },
  { name: 'Tel Aviv, Israel', lat: 32.0853, lng: 34.7818 },
  { name: 'Kyiv, Ukraine', lat: 50.4501, lng: 30.5234 }
];

export const isIPBanned = (ip) => {
  const cleanIp = ip?.replace('::ffff:', '') || '127.0.0.1';
  if (bannedIPs.has(cleanIp)) {
    const banInfo = bannedIPs.get(cleanIp);
    if (Date.now() > banInfo.expiresAt) {
      bannedIPs.delete(cleanIp);
      return false;
    }
    return true;
  }
  return false;
};

export const banIP = (ip, reason, durationMs = 24 * 60 * 60 * 1000) => {
  const cleanIp = ip?.replace('::ffff:', '') || '127.0.0.1';
  bannedIPs.set(cleanIp, {
    reason,
    bannedAt: new Date().toISOString(),
    expiresAt: Date.now() + durationMs
  });
};

export const getBannedIPsList = () => {
  return Array.from(bannedIPs.entries()).map(([ip, data]) => ({
    ip,
    ...data
  }));
};

export const resolveThreatGeo = (ip) => {
  // Deterministic or pseudo-random geo mapping based on IP hash
  let hash = 0;
  const str = ip || 'unknown';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % sampleGeoLocations.length;
  return sampleGeoLocations[index];
};
