export function getDistanceMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) {
    const earthRadiusMeters = 6371000;
  
    const toRadians = (value: number) => (value * Math.PI) / 180;
  
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return earthRadiusMeters * c;
  }
  
  export function getIndiaDateKey(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }