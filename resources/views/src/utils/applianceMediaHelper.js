import { SERVICE_IMAGES } from './bundledImages';

/**
 * Extracts the real video URI from an appliance object if present.
 * Looks for video data URLs, blob URIs, or webm/mp4 URLs across all known media fields.
 */
export function getApplianceVideoUri(appliance) {
  if (!appliance) return null;

  if (appliance.media?.type === 'video' || appliance.media_type === 'video') {
    const directVideo = appliance.media?.url || appliance.media?.uri || appliance.uploadedMediaUri || appliance.video;
    if (typeof directVideo === 'string' && directVideo.trim() && !directVideo.startsWith('auto-verified://')) {
      return directVideo.trim();
    }
  }

  const candidates = [
    appliance.uploadedMediaUri,
    appliance.media?.url,
    appliance.media?.uri,
    appliance.video,
    appliance.videoUrl,
    appliance.video_uri,
    appliance.img,
  ];

  for (const uri of candidates) {
    if (typeof uri === 'string' && uri.trim()) {
      const clean = uri.trim();
      if (clean.startsWith('auto-verified://')) continue;
      if (
        clean.startsWith('data:video/') ||
        clean.startsWith('blob:') ||
        clean.includes('.webm') ||
        clean.includes('.mp4') ||
        clean.includes('video')
      ) {
        return clean;
      }
    }
  }

  return null;
}

/**
 * Resolves a safe, non-video image URL for an appliance (falls back to catalog image).
 */
export function resolveApplianceImage(appliance) {
  if (!appliance) return SERVICE_IMAGES?.homeAppliances || null;

  const direct = appliance.serviceImage || appliance.image || appliance.image_url || appliance.img;
  if (direct && typeof direct === 'string' && !direct.includes('127.0.0.1:3000')) {
    if (
      !direct.startsWith('blob:') &&
      !direct.startsWith('data:video') &&
      !direct.endsWith('.webm') &&
      !direct.endsWith('.mp4')
    ) {
      return direct;
    }
  }

  const text = `${appliance.displayName || ''} ${appliance.name || ''} ${appliance.category || ''} ${appliance.serviceName || ''} ${appliance.type || ''}`.toLowerCase();

  if (text.includes('bath') || text.includes('shower')) return SERVICE_IMAGES?.bath;
  if (text.includes('tap') || text.includes('mixer')) return SERVICE_IMAGES?.tap;
  if (text.includes('toilet') || text.includes('commode')) return SERVICE_IMAGES?.toilet;
  if (text.includes('basin') || text.includes('sink')) return SERVICE_IMAGES?.basin;
  if (text.includes('drain')) return SERVICE_IMAGES?.drainage;
  if (text.includes('leak')) return SERVICE_IMAGES?.leakage;
  if (text.includes('water tank') || text.includes('tank')) return SERVICE_IMAGES?.waterTank;
  if (text.includes('geyser') || text.includes('water heater') || text.includes('heater')) return SERVICE_IMAGES?.geyser;
  if (text.includes('ac') || text.includes('air cond') || text.includes('cooling')) return SERVICE_IMAGES?.ac;
  if (text.includes('micro') || text.includes('oven')) return SERVICE_IMAGES?.microwave;
  if (text.includes('fridge') || text.includes('refrigerat')) return SERVICE_IMAGES?.refrigerator;
  if (text.includes('wash') || text.includes('laundry')) return SERVICE_IMAGES?.washingMachine;
  if (text.includes('tv') || text.includes('television') || text.includes('screen')) return SERVICE_IMAGES?.tv;
  if (text.includes('fan') || text.includes('cooler')) return SERVICE_IMAGES?.fan || SERVICE_IMAGES?.cooler;
  if (text.includes('ro') || text.includes('purifier')) return SERVICE_IMAGES?.waterPurifier || SERVICE_IMAGES?.ro;
  if (text.includes('switch') || text.includes('plug') || text.includes('mcb')) return SERVICE_IMAGES?.switchBoard || SERVICE_IMAGES?.plugsSockets;
  if (text.includes('cctv') || text.includes('camera')) return SERVICE_IMAGES?.cctv;
  if (text.includes('bell') || text.includes('doorbell')) return SERVICE_IMAGES?.doorbell;
  if (text.includes('sofa')) return SERVICE_IMAGES?.sofa || SERVICE_IMAGES?.sofaFabric;
  if (text.includes('bed')) return SERVICE_IMAGES?.bed;
  if (text.includes('chair') || text.includes('table')) return SERVICE_IMAGES?.chair || SERVICE_IMAGES?.table;
  if (text.includes('door')) return SERVICE_IMAGES?.door || SERVICE_IMAGES?.doorRepair;
  if (text.includes('cupboard') || text.includes('cabinet') || text.includes('drawer')) return SERVICE_IMAGES?.cupboard || SERVICE_IMAGES?.drawer;
  if (text.includes('pest') || text.includes('cockroach') || text.includes('termite') || text.includes('bedbug')) return SERVICE_IMAGES?.pestControl;
  if (text.includes('plumb')) return SERVICE_IMAGES?.plumber;
  if (text.includes('electr')) return SERVICE_IMAGES?.electrician;
  if (text.includes('carpent')) return SERVICE_IMAGES?.carpenter;
  if (text.includes('clean')) return SERVICE_IMAGES?.dryCleaning;

  return SERVICE_IMAGES?.homeAppliances || null;
}
