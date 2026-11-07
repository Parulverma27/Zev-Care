/**
 * Google Maps Integration Configuration & Utility Methods
 */

export const GOOGLE_MAPS_API_KEY = 'AIzaSyBXe2rzucyPoB-lR4Oe8c5DY0ORp7Sq1iU';

export const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps;
};

export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve(window.google.maps);
      return;
    }
    if (typeof document === 'undefined') {
      reject(new Error('Window / document is undefined.'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Google Maps loading timed out'));
    }, 2500);

    const safeResolve = (maps) => {
      clearTimeout(timer);
      resolve(maps);
    };

    const safeReject = (err) => {
      clearTimeout(timer);
      reject(err);
    };

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      if (isGoogleMapsLoaded()) {
        safeResolve(window.google.maps);
        return;
      }
      if (existingScript.getAttribute('data-loaded') === 'true' || existingScript.readyState === 'complete') {
        safeReject(new Error('Google Maps script already executed without valid maps object'));
        return;
      }
      existingScript.addEventListener('load', () => {
        existingScript.setAttribute('data-loaded', 'true');
        if (window.google?.maps) safeResolve(window.google.maps);
        else safeReject(new Error('Google Maps script loaded without window.google.maps'));
      });
      existingScript.addEventListener('error', (err) => safeReject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&language=en`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      if (window.google?.maps) safeResolve(window.google.maps);
      else safeReject(new Error('Google Maps loaded without window.google.maps'));
    };
    script.onerror = (err) => safeReject(err);
    document.head.appendChild(script);
  });
};
