import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

/**
 * Admin Video Player
 * Dedicated to displaying the ORIGINAL video uploaded/recorded by the customer.
 * Uses native fetch() to convert Data URIs to Blobs, calls video.load(),
 * and handles muted-first playback to guarantee zero browser blocking.
 */
export default function AdminVideoPlayer({
  src,
  style,
  label = 'Original Customer Recording',
  autoPlay = false,
  controls = true,
}) {
  const [playableUrl, setPlayableUrl] = useState('');
  const [rawDownloadUrl, setRawDownloadUrl] = useState('');
  const [videoMime, setVideoMime] = useState('video/webm');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [playError, setPlayError] = useState('');
  const videoRef = useRef(null);
  const activeBlobUrlRef = useRef(null);

  const cleanupBlob = () => {
    if (activeBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      } catch (e) {}
      activeBlobUrlRef.current = null;
    }
  };

  useEffect(() => {
    cleanupBlob();
    setIsPlaying(false);
    setIsReady(false);
    setPlayError('');
    setDuration(0);

    if (!src || typeof src !== 'string' || !src.trim()) {
      setPlayableUrl('');
      setRawDownloadUrl('');
      return;
    }

    const trimmed = src.trim();
    setRawDownloadUrl(trimmed);

    // If it is a Data URI, convert to Blob URL via browser's native C++ fetch
    if (trimmed.startsWith('data:video/')) {
      const mimeMatch = trimmed.match(/data:([^;,]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'video/webm';
      setVideoMime(mime);

      const commaIdx = trimmed.indexOf(',');
      if (commaIdx !== -1) {
        const b64Len = trimmed.length - (commaIdx + 1);
        const approxBytes = Math.round((b64Len * 3) / 4);
        setFileSizeBytes(approxBytes);
      }

      let isMounted = true;
      if (typeof fetch === 'function') {
        fetch(trimmed)
          .then((res) => res.blob())
          .then((blob) => {
            if (!isMounted) return;
            if (blob.size > 0) {
              setFileSizeBytes(blob.size);
              const blobUrl = URL.createObjectURL(blob);
              activeBlobUrlRef.current = blobUrl;
              setPlayableUrl(blobUrl);
              setRawDownloadUrl(blobUrl);
            } else {
              setPlayableUrl(trimmed);
            }
          })
          .catch(() => {
            if (!isMounted) return;
            try {
              const base64Data = trimmed.slice(commaIdx + 1);
              const binaryStr = atob(base64Data);
              const len = binaryStr.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: mime });
              const blobUrl = URL.createObjectURL(blob);
              activeBlobUrlRef.current = blobUrl;
              setPlayableUrl(blobUrl);
              setRawDownloadUrl(blobUrl);
            } catch (err) {
              setPlayableUrl(trimmed);
            }
          });

        return () => {
          isMounted = false;
          cleanupBlob();
        };
      } else {
        setPlayableUrl(trimmed);
      }
    } else {
      setPlayableUrl(trimmed);
      if (trimmed.includes('.mp4')) setVideoMime('video/mp4');
      else if (trimmed.includes('.webm')) setVideoMime('video/webm');
    }

    return () => {
      cleanupBlob();
    };
  }, [src]);

  // CRITICAL: Call video.load() when playableUrl updates so the HTML5 media engine re-buffers
  useEffect(() => {
    if (videoRef.current && playableUrl) {
      try {
        videoRef.current.load();
      } catch (e) {}
    }
  }, [playableUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    setPlayError('');

    if (videoRef.current.paused) {
      // Start playback (ensure muted to satisfy browser autoplay security policy)
      videoRef.current.muted = isMuted;
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // If browser strictly demanded mute, enforce muted and play
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((err) => {
              console.warn('[AdminVideoPlayer] Play failed:', err);
              setPlayError('Please click the play triangle on the video player directly.');
            });
          }
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.captionText}>Video viewer available in web browser.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Video Element Viewport */}
      {playableUrl ? (
        <video
          ref={videoRef}
          src={playableUrl}
          controls={controls}
          playsInline
          muted={isMuted}
          autoPlay={autoPlay}
          preload="auto"
          onPlay={() => {
            setIsPlaying(true);
            setPlayError('');
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onCanPlay={() => setIsReady(true)}
          onLoadedData={() => setIsReady(true)}
          onLoadedMetadata={(e) => {
            setIsReady(true);
            if (e?.target?.duration && !Number.isNaN(e.target.duration)) {
              setDuration(Math.round(e.target.duration));
            }
          }}
          style={{
            width: '100%',
            maxHeight: 290,
            borderRadius: 8,
            objectFit: 'contain',
            backgroundColor: '#000000',
            display: 'block',
          }}
        />
      ) : (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Loading video stream…</Text>
        </View>
      )}

      {/* Control & Metadata Bar */}
      <View style={styles.footerRow}>
        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusDot, isReady && styles.statusDotActive]} />
            <Text style={styles.captionTitle}>{label}</Text>
          </View>
          <Text style={styles.metaText}>
            Format: {videoMime}
            {fileSizeBytes > 0 ? ` • Size: ${formatSize(fileSizeBytes)}` : ''}
            {duration > 0 ? ` • Duration: ${duration}s` : ''}
            {isReady ? ' • Ready to Play' : ''}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity onPress={togglePlay} style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>{isPlaying ? '❚❚ Pause' : '▶ Play'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMute} style={[styles.actionBtn, styles.muteBtn]} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>{isMuted ? '🔇 Muted' : '🔊 Sound On'}</Text>
          </TouchableOpacity>

          {rawDownloadUrl ? (
            <a
              href={rawDownloadUrl}
              download="customer_uploaded_recording.webm"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <View style={[styles.actionBtn, styles.downloadBtn]}>
                <Text style={styles.downloadBtnText}>⬇ Download</Text>
              </View>
            </a>
          ) : null}
        </View>
      </View>

      {playError ? (
        <View style={styles.errorNotice}>
          <Text style={styles.errorText}>ℹ {playError}</Text>
        </View>
      ) : null}
    </View>
  );
}

export { AdminVideoPlayer };

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  loadingBox: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 8,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  infoCol: {
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#eab308',
  },
  statusDotActive: {
    backgroundColor: '#22c55e',
  },
  captionTitle: {
    color: '#f8fafc',
    fontSize: 11.5,
    fontWeight: '700',
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  muteBtn: {
    backgroundColor: '#0f172a',
    borderColor: '#475569',
  },
  downloadBtn: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  errorNotice: {
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  errorText: {
    color: '#93c5fd',
    fontSize: 11,
    textAlign: 'center',
  },
  captionText: {
    color: '#94a3b8',
    fontSize: 11,
    padding: 12,
    textAlign: 'center',
  },
});
