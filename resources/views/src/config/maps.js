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

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};
