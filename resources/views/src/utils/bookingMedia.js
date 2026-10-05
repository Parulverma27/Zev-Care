/**
 * Normalize MediaCapturePanel values ↔ serializable booking issueMedia.
 * Only string URIs — never Blob/File/MediaStream in localStorage.
 */

export function emptyIssueMedia() {
  return { photos: [], videos: [] };
}

/** Convert panel value { type, uri } into issueMedia shape (single current item + existing). */
export function applyPanelValueToIssueMedia(issueMedia, panelValue) {
  const base = {
    photos: [...(issueMedia?.photos || [])],
    videos: [...(issueMedia?.videos || [])],
  };
  if (!panelValue?.uri || typeof panelValue.uri !== 'string') {
    return base;
  }
  const entry = {
    uri: panelValue.uri,
    fileName: panelValue.fileName || '',
    type: panelValue.type,
  };
  if (panelValue.type === 'video') {
    base.videos = [entry];
  } else {
    if (base.photos.length >= 5) base.photos = base.photos.slice(0, 4);
    base.photos = [...base.photos, entry].slice(-5);
  }
  return base;
}

export function setPrimaryPanelValue(issueMedia) {
  const photos = issueMedia?.photos || [];
  const videos = issueMedia?.videos || [];
  if (photos.length) {
    const p = photos[photos.length - 1];
    return { type: 'photo', uri: p.uri, fileName: p.fileName };
  }
  if (videos.length) {
    const v = videos[0];
    return { type: 'video', uri: v.uri, fileName: v.fileName };
  }
  return null;
}

export function removeMediaItem(issueMedia, kind, index) {
  const next = {
    photos: [...(issueMedia?.photos || [])],
    videos: [...(issueMedia?.videos || [])],
  };
  if (kind === 'photo') next.photos.splice(index, 1);
  if (kind === 'video') next.videos.splice(index, 1);
  return next;
}

export function issueMediaToLegacyUrl(issueMedia) {
  const photos = issueMedia?.photos || [];
  const videos = issueMedia?.videos || [];
  if (photos[0]?.uri) return photos[0].uri;
  if (videos[0]?.uri) return videos[0].uri;
  return '';
}

export function countIssueMedia(issueMedia) {
  return {
    photoCount: (issueMedia?.photos || []).length,
    videoCount: (issueMedia?.videos || []).length,
  };
}

export function legacyUrlToIssueMedia(url, hintType) {
  if (!url || typeof url !== 'string') return emptyIssueMedia();
  const isVideo = hintType === 'video' || /\.(webm|mp4|mov)/i.test(url) || url.includes('video');
  if (isVideo) return { photos: [], videos: [{ uri: url, fileName: '', type: 'video' }] };
  return { photos: [{ uri: url, fileName: '', type: 'photo' }], videos: [] };
}
