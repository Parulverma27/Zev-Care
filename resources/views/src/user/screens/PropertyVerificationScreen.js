import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import { SERVICE_IMAGES } from '../../utils/bundledImages';
import ApplianceAddWizard, { buildSavedApplianceRecords } from '../../components/appliances/ApplianceAddWizard';
import DynamicApplianceFields, {
  validateApplianceFields,
  resolveBrandName,
} from '../../components/appliances/DynamicApplianceFields';
import { getApplianceById } from '../../config/applianceCatalog';

function getRealApplianceImageUrl(appliance) {
  if (!appliance) return SERVICE_IMAGES.ac;
  
  // Display exact user uploaded photo if captured
  if (appliance.uploadedMediaUri && !appliance.uploadedMediaUri.includes('127.0.0.1:3000')) {
    return appliance.uploadedMediaUri;
  }
  if (appliance.media && appliance.media.url && !appliance.media.url.includes('127.0.0.1:3000')) {
    return appliance.media.url;
  }
  if (appliance.img && typeof appliance.img === 'string' && (appliance.img.startsWith('data:') || appliance.img.startsWith('blob:'))) {
    return appliance.img;
  }
  if (appliance.img && typeof appliance.img === 'string' && appliance.img.startsWith('http') && !appliance.img.includes('127.0.0.1:3000')) {
    return appliance.img;
  }

  const name = (appliance.name || appliance.category || '').toLowerCase();
  
  if (name.includes('ac') || name.includes('air') || name.includes('cooling')) {
    return SERVICE_IMAGES.ac;
  }
  if (name.includes('fridge') || name.includes('refrigerator') || name.includes('freezer')) {
    return SERVICE_IMAGES.refrigerator;
  }
  if (name.includes('wash') || name.includes('machine') || name.includes('laundry')) {
    return SERVICE_IMAGES.washingMachine;
  }
  if (name.includes('tv') || name.includes('television') || name.includes('screen') || name.includes('display')) {
    return SERVICE_IMAGES.tv;
  }
  if (name.includes('micro') || name.includes('oven') || name.includes('stove')) {
    return SERVICE_IMAGES.microwave;
  }
  if (name.includes('fan') || name.includes('cooler') || name.includes('vent')) {
    return SERVICE_IMAGES.fan || SERVICE_IMAGES.fans;
  }
  if (name.includes('water') || name.includes('purifier') || name.includes('ro')) {
    return SERVICE_IMAGES.waterPurifier || SERVICE_IMAGES.ro;
  }
  if (name.includes('geyser') || name.includes('water heater')) {
    return SERVICE_IMAGES.geyser;
  }
  if (name.includes('cctv') || name.includes('camera')) {
    return SERVICE_IMAGES.cctv;
  }
  if (name.includes('doorbell')) {
    return SERVICE_IMAGES.doorbell;
  }
  if (name.includes('chimney') || name.includes('kitchen')) {
    return SERVICE_IMAGES.chimney || SERVICE_IMAGES.kitchenAppliances;
  }
  if (name.includes('sofa') || name.includes('bed') || name.includes('chair') || name.includes('table') || name.includes('furniture')) {
    return SERVICE_IMAGES.furniture;
  }

  return SERVICE_IMAGES.homeAppliances;
}

const renderApplianceMediaPreview = (appliance, style) => {
  if (!appliance) return null;

  // Check for user uploaded media
  const rawUri = appliance.uploadedMediaUri || appliance.media?.url || appliance.img;
  const isMockUri = !rawUri || (typeof rawUri === 'string' && rawUri.includes('127.0.0.1:3000'));
  
  // Real valid user uploaded photo or video URL
  const userMediaUri = !isMockUri ? rawUri : null;

  // Determine if media is a real video stream
  const isVideo = userMediaUri && typeof userMediaUri === 'string' && (
    userMediaUri.startsWith('data:video/') ||
    userMediaUri.endsWith('.webm') ||
    userMediaUri.endsWith('.mp4') ||
    (appliance.media?.type === 'video' && (userMediaUri.startsWith('blob:') || userMediaUri.startsWith('data:video/')))
  );

  // 1. If real user video recorded or uploaded
  if (userMediaUri && isVideo) {
    return (
      <View style={[style, { overflow: 'hidden', backgroundColor: '#0f172a', position: 'relative', alignItems: 'center', justifyContent: 'center' }]}>
        <video 
          src={userMediaUri} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          muted 
          loop 
          autoPlay 
          playsInline
        />
        <View style={{ position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#0052e0" stroke="#0052e0" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </View>
      </View>
    );
  }

  // 2. If real user image photo uploaded (data:image/, blob:, custom photo URL)
  if (userMediaUri && typeof userMediaUri === 'string' && (userMediaUri.startsWith('data:image/') || userMediaUri.startsWith('blob:') || userMediaUri.startsWith('http'))) {
    return (
      <Image 
        source={{ uri: userMediaUri }} 
        style={style} 
        resizeMode="cover" 
      />
    );
  }

  // 3. Fallback to crisp high-definition real appliance image matched to category/name
  const realImgUrl = getRealApplianceImageUrl(appliance);
  return (
    <Image 
      source={{ uri: realImgUrl }} 
      style={style} 
      resizeMode="cover" 
    />
  );
};

export default function PropertyVerificationScreen({ onNavigate }) {
  const {
    activeUser,
    setActiveUser,
    verifyPropertyVideo,
    categories,
    getAppliancesForUser,
    addUserAppliance,
    removeUserAppliance,
    updateUserAppliance,
    subCategories,
    bookings,
    wallet,
  } = useApp();
  const navigate = useNavigate();

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (activeUser.isGuest && !activeUser.phone) ||
    (!activeUser.phone && !activeUser.guestId)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    isAnonymous
  );

  const addedAppliances = isGuest ? [] : (getAppliancesForUser(activeUser?.id) || []);
  
  const [view, setView] = useState('LIST'); // Landing page is LIST overview
  const [latestAdded, setLatestAdded] = useState(null); // Tracks the dynamically created appliance
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showLocModal, setShowLocModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [address, setAddress] = useState(activeUser?.property?.address || activeUser?.address || '');

  useEffect(() => {
    if (activeUser) {
      setAddress(activeUser.property?.address || activeUser.address || '');
    }
  }, [activeUser]);

  // Edit Appliance Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplianceId, setEditingApplianceId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editValues, setEditValues] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editingTypeId, setEditingTypeId] = useState('');

  // Delete Appliance Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAppliance, setDeletingAppliance] = useState(null);

  const handlePromptDelete = (appliance) => {
    setDeletingAppliance(appliance);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingAppliance) {
      removeUserAppliance(deletingAppliance.id);
    }
    setShowDeleteModal(false);
    setDeletingAppliance(null);
  };

  const handleOpenEdit = (appliance) => {
    setEditingApplianceId(appliance.id);
    setEditingTypeId(appliance.applianceTypeId || '');
    setEditName(appliance.name || '');
    setEditLocation(appliance.location || '');
    setEditValues({
      displayName: appliance.name || appliance.displayName || '',
      brand: appliance.brand || '',
      customBrand: '',
      type: appliance.type || '',
      capacity: appliance.capacity || '',
      year: appliance.year || '',
      location: appliance.location || '',
      condition: appliance.condition || 'Working',
      notes: appliance.notes || '',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingApplianceId) return;
    const catalog = getApplianceById(editingTypeId);
    if (catalog?.fields?.length) {
      const errors = validateApplianceFields(catalog.fields, editValues);
      setEditErrors(errors);
      if (Object.keys(errors).length > 0) return;
      const brand = resolveBrandName(editValues);
      const nameVal = (editValues.displayName || '').trim() || 'Appliance';
      updateUserAppliance(editingApplianceId, {
        name: nameVal,
        displayName: nameVal,
        brand,
        type: editValues.type || '',
        capacity: editValues.capacity || '',
        year: editValues.year || '',
        location: editValues.location || '',
        condition: editValues.condition || '',
        notes: editValues.notes || '',
        category: catalog.name,
      });
      if (latestAdded?.id === editingApplianceId) {
        setLatestAdded((prev) => ({
          ...prev,
          name: nameVal,
          brand,
          location: editValues.location,
          condition: editValues.condition,
          capacity: editValues.capacity,
        }));
      }
    } else {
      const nameVal = editName.trim() || (editValues.displayName || '').trim() || 'Appliance';
      const locVal = editLocation.trim() || editValues.location || 'Living Room';
      updateUserAppliance(editingApplianceId, {
        name: nameVal,
        location: locVal,
        brand: editValues.brand || '',
        condition: editValues.condition || '',
        capacity: editValues.capacity || '',
      });
      if (latestAdded?.id === editingApplianceId) {
        setLatestAdded((prev) => ({ ...prev, name: nameVal, location: locVal }));
      }
    }

    setShowEditModal(false);
    setEditingApplianceId(null);
  };

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState(null); // { type: 'photo' | 'video', uri: string, fileName? }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Live Notifications generated directly from real database state
  const liveNotifications = (() => {
    const list = [];

    // 1. Live Bookings Notifications
    if (Array.isArray(bookings) && bookings.length > 0) {
      bookings.forEach((b, idx) => {
        list.push({
          id: `b-${b.id || idx}`,
          text: `Service #${b.booking_id || b.id || (idx + 101)} (${b.service_name || b.category_name || 'Home Care'}): ${b.status || 'Scheduled'}.`,
          time: b.date || b.created_at || `${(idx + 1) * 15} mins ago`,
        });
      });
    }

    // 2. Live Wallet Transactions Notifications
    if (wallet && Array.isArray(wallet.transactions) && wallet.transactions.length > 0) {
      wallet.transactions.forEach((tx, idx) => {
        const isCredit = tx.type === 'CREDIT' || (tx.amount && Number(tx.amount) > 0);
        list.push({
          id: `tx-${tx.id || idx}`,
          text: `${isCredit ? 'Wallet Credited' : 'Payment Processed'}: ₹${Math.abs(Number(tx.amount || 0)).toLocaleString('en-IN')} - ${tx.description || tx.reference_id || 'Wallet activity'}.`,
          time: tx.date || tx.time || `${(idx + 1)} hour ago`,
        });
      });
    }

    // 3. User Active Subscription Plan
    if (activeUser) {
      const planName = activeUser.subscription_plan || 'Gold';
      const balanceStr = Number(activeUser.wallet_balance ?? wallet?.balance ?? 0).toLocaleString('en-IN');
      list.push({
        id: 'plan-active',
        text: `${planName} plan activated. ₹${balanceStr} credit added to your wallet.`,
        time: '1 hour ago',
      });
    }

    if (list.length <= 1) {
      const assignedBooking = bookings?.find(b => b.provider_name && (b.user_id === activeUser?.id || b.user_phone === activeUser?.phone));
      if (assignedBooking?.provider_name) {
        list.push({
          id: 'sys-tech',
          text: `Technician ${assignedBooking.provider_name} has accepted your request.`,
          time: '2 hours ago',
        });
      }
    }

    return list;
  })();

  const notifications = liveNotifications;

  const startCamera = async () => {
    try {
      setCameraPermissionDenied(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCapturedMedia(null);
      setIsRecording(false);
    } catch (e) {
      console.warn("Camera error:", e);
      setCameraActive(false);
      if (e.name === 'NotAllowedError' || e.name === 'NotFoundError' || e.message.includes('Permission denied')) {
        setCameraPermissionDenied(true);
      }
    }
  };

  const handleSaveAppliance = () => {
    if (!activeUser) return;
    const nameToSave = applianceName.trim() || 'Master Bedroom AC';
    const locToSave = applianceLocation.trim() || 'Living Room';
    const userMediaUri = capturedMedia?.uri || null;

    const finalAppliance = {
      id: Date.now(),
      userId: activeUser.id,
      name: nameToSave,
      category: selectedAppliance?.name || 'Home Appliance',
      img: userMediaUri || getRealApplianceImageUrl({ name: nameToSave }),
      uploadedMediaUri: userMediaUri,
      location: locToSave,
      media: capturedMedia
        ? {
            type: capturedMedia.type,
            url: capturedMedia.uri,
            fileName:
              capturedMedia.fileName ||
              (capturedMedia.type === 'photo' ? 'Photo_Capture.jpg' : 'Video_Walkthrough.webm'),
          }
        : null,
      mediaStatus: capturedMedia ? 'PENDING_REVIEW' : 'SKIPPED',
      createdAt: new Date().toISOString(),
    };
    addUserAppliance(finalAppliance);
    setLatestAdded(finalAppliance);
    setCapturedMedia(null);
    setView('SUCCESS');
  };

  const stopCamera = () => {
    if (isRecording) {
      stopRecording();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedMedia({ type: 'photo', uri: dataUrl });
        stopCamera();
      } catch (e) {
        console.warn("Error capturing photo:", e);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera();
    }
    if (!streamRef.current || typeof MediaRecorder === 'undefined') return;

    try {
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ type: 'video', uri: url, fileName: 'Video_Walkthrough.webm' });
        stopCamera();
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 19) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.warn('Recording error:', e);
      setIsRecording(false);
    }
  };

  const handleTakePhotoPress = async () => {
    if (!cameraActive) {
      await startCamera();
      return;
    }
    if (!isRecording) {
      capturePhoto();
    }
  };

  const handleRecordVideoPress = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    await startRecording();
  };

  useEffect(() => {
    if (view !== 'UPLOAD') {
      stopCamera();
      setCapturedMedia(null);
      setIsRecording(false);
      setRecordingSeconds(0);
    }
    return () => {
      stopCamera();
    };
  }, [view]);

  // FIX: Attach stream to video tag after it mounts (when cameraActive becomes true)
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const fileInputRef = useRef(null);

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Only live video files are allowed. Photos are not permitted.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedMedia({
        type: 'video',
        uri: reader.result,
        fileName: file.name,
      });
      stopCamera();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRetakeMedia = () => {
    setCapturedMedia(null);
    setCameraPermissionDenied(false);
    stopCamera();
  };

  // Selected appliance context for details form
  const [selectedAppliance, setSelectedAppliance] = useState(null);

  // Form Fields matching ss 1
  const [applianceName, setApplianceName] = useState('');
  const [applianceType, setApplianceType] = useState('');
  const [applianceCapacity, setApplianceCapacity] = useState('');
  const [applianceYear, setApplianceYear] = useState('2024');
  const [applianceLocation, setApplianceLocation] = useState('Master Bedroom');
  const [applianceCondition, setApplianceCondition] = useState('Working');
  const [applianceDetails, setApplianceDetails] = useState('');

  // Brand selection fields
  const [selectedBrand, setSelectedBrand] = useState('Samsung'); // defaults to Samsung matching ss 1
  const [customBrandName, setCustomBrandName] = useState('');

  // Header Interaction States initialized at top level component scope

  // Dropdown option togglers
  const [activeDropdown, setActiveDropdown] = useState(null); // 'type' | 'year' | 'condition' | null



  // Brand rendering logic to render premium brand logos
  const BRANDS = [
    { name: 'LG', renderLogo: () => (
      <View style={styles.brandLogoRow}>
        <View style={[styles.lgCircle, { backgroundColor: '#a50034' }]}>
          <Text style={styles.lgText}>L</Text>
        </View>
        <Text style={[styles.brandTextBold, { color: '#a50034', marginLeft: 4, fontSize: 13 }]}>LG</Text>
      </View>
    )},
    { name: 'Samsung', renderLogo: () => (
      <Text style={[styles.brandTextBold, { color: '#06377b', letterSpacing: 0.2, fontSize: 11 }]}>SAMSUNG</Text>
    )},
    { name: 'Voltas', renderLogo: () => (
      <Text style={[styles.brandTextItalic, { color: '#005ea6', fontWeight: '600', fontSize: 13 }]}>VOLTAS</Text>
    )},
    { name: 'Daikin', renderLogo: () => (
      <View style={styles.brandLogoRow}>
        <View style={styles.daikinTriangle} />
        <Text style={[styles.brandTextBold, { color: '#009fe3', marginLeft: 4, fontSize: 11 }]}>DAIKIN</Text>
      </View>
    )},
    { name: 'Whirlpool', renderLogo: () => (
      <Text style={[styles.brandTextScript, { color: '#000000', fontSize: 12 }]}>Whirlpool</Text>
    )},
    { name: 'IFB', renderLogo: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.brandTextBold, { color: '#27272a', fontSize: 12, lineHeight: 12 }]}>IFB</Text>
        <Text style={{ fontSize: 6, color: '#ef4444', fontWeight: '700', marginTop: 1 }}>Set yourself free</Text>
      </View>
    )},
    { name: 'Panasonic', renderLogo: () => (
      <Text style={[styles.brandTextBold, { color: '#004098', fontSize: 11 }]}>Panasonic</Text>
    )},
    { name: 'Haier', renderLogo: () => (
      <Text style={[styles.brandTextBold, { color: '#0055a5', letterSpacing: -0.5, fontSize: 13 }]}>Haier</Text>
    )},
    { name: 'Godrej', renderLogo: () => (
      <Text style={[styles.brandTextScript, { color: '#e6007e', fontSize: 14 }]}>Godrej</Text>
    )},
    { name: 'Blue Star', renderLogo: () => (
      <View style={styles.bluestarBadge}>
        <Text style={styles.bluestarStar}>★</Text>
        <Text style={styles.bluestarText}>BLUE STAR</Text>
      </View>
    )},
    { name: 'Bosch', renderLogo: () => (
      <View style={styles.brandLogoRow}>
        <View style={styles.boschCircle} />
        <Text style={[styles.brandTextBold, { color: '#27272a', marginLeft: 4, fontSize: 11 }]}>BOSCH</Text>
      </View>
    )},
    { name: 'O General', renderLogo: () => (
      <View style={styles.brandLogoRow}>
        <Text style={[styles.brandTextBold, { color: '#e30016', fontSize: 10 }]}>O GENERAL</Text>
      </View>
    )}
  ];

  // Filtered Brands based on Search
  const filteredBrands = BRANDS.filter(b => 
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  const openAddAppliance = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setLatestAdded(null);
    setCapturedMedia(null);
    setCameraPermissionDenied(false);
    setView('WIZARD');
  };

  const handleWizardComplete = (units, applianceType) => {
    if (!activeUser) return;
    const records = buildSavedApplianceRecords(units, applianceType, activeUser);
    records.forEach((rec) => addUserAppliance(rec));
    setLatestAdded(records[records.length - 1] || null);
    setView('SUCCESS');
  };

  const handleCategorySelect = (cat) => {
    setSelectedAppliance(cat);
    if (!applianceName.trim() || applianceName === selectedAppliance?.name) {
      setApplianceName(cat.name === 'Other' ? '' : cat.name);
    }
  };

  const handleSaveDetails = () => {
    setView('BRAND');
    setBrandSearchQuery('');
    setCustomBrandName('');
    setSelectedBrand('Samsung'); // defaults to Samsung matching ss 1
  };

  const handleSaveBrand = () => {
    setView('UPLOAD');
  };

  const handleRemoveAppliance = (id) => {
    removeUserAppliance(id);
  };

  const handleSubmit = () => {
    verifyPropertyVideo(activeUser.id, 'PENDING');
    if (navigate) navigate('/user/home');
    else if (onNavigate) onNavigate('/user/home');
  };

  const handleBack = () => {
    if (view === 'WIZARD') {
      return; // wizard handles its own back
    }
    if (view === 'UPLOAD') {
      stopCamera();
      setCapturedMedia(null);
      setView('LIST');
    } else if (view === 'BRAND') {
      setView('DETAILS');
    } else if (view === 'DETAILS') {
      setView('LIST');
    } else {
      if (navigate) navigate('/user/home');
      else if (onNavigate) onNavigate('/user/home');
    }
  };

  const getApplianceImageUri = (appliance) => {
    if (!appliance?.img || appliance.img === 'other') {
      return 'http://127.0.0.1:3000/2a2755bc-a299-4f28-ada6-69f87b1a84c7.png';
    }
    if (appliance.img.startsWith('http')) return appliance.img;
    return `http://127.0.0.1:3000/${appliance.img}`;
  };

  return (
    <View style={styles.container}>
      {view === 'WIZARD' ? (
        <ApplianceAddWizard
          onCancel={() => setView('LIST')}
          onComplete={handleWizardComplete}
        />
      ) : (
      <>
      {/* Conditional Header based on View State */}
      <View style={[styles.headerRow, view !== 'LIST' && { borderBottomWidth: 0, height: 48 }]}>
        {view !== 'SUCCESS' ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <svg pointerEvents="none" style={{ pointerEvents: 'none' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a1633" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
              Appliance added
            </Text>
          </View>
        )}

        {view === 'LIST' && (
          <>
            {/* Clickable Header Center to switch locations */}
            <TouchableOpacity
              style={styles.headerCenter}
              onPress={() => {
                if (isGuest) {
                  setShowGuestModal(true);
                  return;
                }
                setShowLocModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.headerTitleMain}>
                {isGuest ? 'My Home' : (activeUser?.property?.name || 'My Home')} ▾
              </Text>
              <Text style={styles.headerSubtitleMain} numberOfLines={1}>
                {isGuest ? 'Add home address' : (activeUser?.property?.address || activeUser?.address || activeUser?.saved_addresses?.[0]?.address || 'Add home address')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bellBtn} onPress={() => setShowNotifModal(true)} activeOpacity={0.7}>
              <svg pointerEvents="none" style={{ pointerEvents: 'none' }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a1633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </TouchableOpacity>
          </>
        )}
      </View>

      {view === 'LIST' ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.titleText}>Your Appliances</Text>
            <Text style={styles.subtitleText}>
              Add the appliances you want Zevota Care to look after.
            </Text>
          </View>

          {/* Hero image for My Appliances */}
          <Image
            source={{ uri: SERVICE_IMAGES.myAppliancesHero || SERVICE_IMAGES.homeAppliances }}
            style={styles.heroImg}
            resizeMode="cover"
          />

          {addedAppliances.length === 0 ? (
            /* Dashed placeholder card */
            <View style={styles.dashedPlaceholderCard}>
              <View style={styles.dashedIconBox}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="12" y2="13" />
                  <line x1="8" y1="17" x2="10" y2="17" />
                  <circle cx="16" cy="16" r="3" />
                  <line x1="18.5" y1="18.5" x2="21.5" y2="21.5" />
                </svg>
              </View>
              <Text style={styles.dashedTitle}>No appliances added yet</Text>
              <Text style={styles.dashedDesc}>Let's add your first appliance.</Text>
            </View>
          ) : (
            /* List of added appliances matching ss 2 exactly */
            <View style={styles.appliancesListContainer}>
              <Text style={styles.listSectionHeader}>Added Appliances ({addedAppliances.length})</Text>
              {addedAppliances.map((appliance) => {
                const imageSource = getApplianceImageUri(appliance);

                return (
                  <View key={appliance.id} style={styles.applianceListItem}>
                    <View style={styles.itemLeftRow}>
                      {renderApplianceMediaPreview(appliance, styles.listItemImg)}
                      <View style={{ flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                        <Text style={styles.listItemName} numberOfLines={1}>{appliance.name}</Text>
                        <Text style={styles.listItemSub} numberOfLines={1}>
                          {[appliance.brand, appliance.capacity, appliance.type].filter(Boolean).join(' • ')
                            || `${appliance.category || 'Appliance'}`}
                        </Text>
                        <Text style={styles.listItemMeta} numberOfLines={1}>
                          {[appliance.location, appliance.condition ? `Condition: ${appliance.condition}` : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action button "+ Add Appliance" */}
          <TouchableOpacity style={styles.primaryBtn} onPress={openAddAppliance}>
            <Text style={styles.primaryBtnText}>+ Add Appliance</Text>
          </TouchableOpacity>

          {/* Subtext info row */}
          <View style={styles.infoRow}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <Text style={styles.infoRowText}>You can add multiple appliances</Text>
          </View>

          {/* Bottom Info Card */}
          <View style={styles.statusBannerCard}>
            <View style={styles.bannerIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 11 11 13 15 9" />
              </svg>
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Why add each appliance separately?</Text>
              <Text style={styles.bannerDesc}>
                Adding each appliance helps us keep accurate records, diagnose issues faster and provide the right service for every appliance.
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : view === 'DETAILS' ? (
        /* Details Form View matching Screenshot 1 */
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
          <View style={styles.titleSection}>
            <Text style={styles.titleText}>Tell us about your appliance</Text>
            <Text style={styles.subtitleText}>Fill in the details so we can serve you better.</Text>
          </View>

          {/* Selected Appliance Picture Banner */}
          {selectedAppliance && selectedAppliance.name !== 'Other' && (
            <Image
              source={{ uri: selectedAppliance.image_url }}
              style={styles.detailsHeroImg}
              resizeMode="contain"
            />
          )}

          {/* Selected Category mini badge */}
          <View style={styles.detailsMiniBadge}>
            <View style={styles.detailsMiniIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </View>
            <View style={styles.detailsMiniTextCol}>
              <Text style={styles.detailsMiniTitle}>{selectedAppliance?.name}</Text>
              <Text style={styles.detailsMiniSub}>{applianceType || 'Standard Model'}</Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={[styles.formContainer, { zIndex: activeDropdown ? 1000 : 1 }]}>
            {/* 1. Appliance Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Appliance Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={applianceName}
                onChangeText={setApplianceName}
                placeholder="e.g. Master Bedroom AC"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 2. Type Dropdown */}
            <View style={[styles.fieldGroup, { zIndex: activeDropdown === 'type' ? 1000 : 1 }]}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.dropdownInputWrapper}>
                <TouchableOpacity 
                  style={styles.fieldInputDropdown} 
                  onPress={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.fieldInputDropdownText, !applianceType && styles.placeholderText]}>
                    {applianceType || 'Select Type'}
                  </Text>
                  <View style={styles.dropdownIconOverlay}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </View>
                </TouchableOpacity>

                {activeDropdown === 'type' && (
                  <View style={styles.dropdownMenu}>
                    {((subCategories || []).filter(sub => sub.category_name === selectedAppliance?.name).map(sub => sub.name).length > 0 
                      ? (subCategories || []).filter(sub => sub.category_name === selectedAppliance?.name).map(sub => sub.name) 
                      : ['Standard Model']).map((opt) => (
                      <TouchableOpacity 
                        key={opt} 
                        style={styles.dropdownOption} 
                        onPress={() => {
                          setApplianceType(opt);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 3. Capacity */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Capacity</Text>
              <TextInput
                style={styles.fieldInput}
                value={applianceCapacity}
                onChangeText={setApplianceCapacity}
                placeholder="e.g. 1.5 Ton / 350 Litre"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 4. Age of Appliance Dropdown */}
            <View style={[styles.fieldGroup, { zIndex: activeDropdown === 'year' ? 1000 : 1 }]}>
              <Text style={styles.fieldLabel}>Age of the Appliance</Text>
              <View style={styles.dropdownInputWrapper}>
                <TouchableOpacity 
                  style={styles.fieldInputDropdown} 
                  onPress={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.fieldInputDropdownText, !applianceYear && styles.placeholderText]}>
                    {applianceYear || 'Select Age / Year'}
                  </Text>
                  <View style={styles.dropdownIconOverlay}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </View>
                </TouchableOpacity>

                {activeDropdown === 'year' && (
                  <View style={styles.dropdownMenu}>
                    {['Under 1 year (New)', '1 - 2 years old', '2 - 3 years old', '3 - 5 years old', '5+ years old', '2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((opt) => (
                      <TouchableOpacity 
                        key={opt} 
                        style={styles.dropdownOption} 
                        onPress={() => {
                          setApplianceYear(opt);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 5. Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.fieldInput}
                value={applianceLocation}
                onChangeText={setApplianceLocation}
                placeholder="e.g. Master Bedroom"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* 6. Additional details */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Additional details (optional)</Text>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textareaInput}
                  value={applianceDetails}
                  onChangeText={(val) => { if (val.length <= 120) setApplianceDetails(val); }}
                  placeholder="e.g. Model number, color, any notes..."
                  placeholderTextColor="#94a3b8"
                  multiline={true}
                />
                <Text style={styles.charCount}>{applianceDetails.length}/120</Text>
              </View>
            </View>
          </View>

          {/* Professional Policy Note */}
          <View style={styles.coverageNoteCard}>
            <View style={styles.coverageNoteIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coverageNoteTitle}>Coverage Policy Note</Text>
              <Text style={styles.coverageNoteText}>
                Please note: Only appliances in active <Text style={{ fontWeight: '700', color: '#1e40af' }}>working condition</Text> are covered under the Care Subscription Package. Pre-existing non-functional units cannot be onboarded.
              </Text>
            </View>
          </View>

          {/* Continue button */}
          <TouchableOpacity style={styles.formContinueBtn} onPress={handleSaveDetails} activeOpacity={0.8}>
            <Text style={styles.formContinueBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : view === 'BRAND' ? (
        /* Brand Selection View matching Screenshot 1 */
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 30, paddingTop: 0 }]}>
          <View style={styles.brandTitleSection}>
            <Text style={styles.brandTitleText}>
              {"Which company makes\nyour appliance?"}
            </Text>
            <Text style={styles.brandSubtitleText}>Select the manufacturer for more accurate service.</Text>
          </View>

          {/* Company Search Bar */}
          <View style={styles.searchBarContainer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <TextInput
              style={styles.searchBarInput}
              value={brandSearchQuery}
              onChangeText={setBrandSearchQuery}
              placeholder="Search company"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* 3-Column Brands Grid matching ss 1 */}
          <View style={styles.applianceGrid}>
            {filteredBrands.map((brand) => {
              const isSelected = selectedBrand === brand.name;
              
              // Always use the user plant AC image asset for all cards matching Screenshot 1
              const companyACImg = 'http://127.0.0.1:3000/2a2755bc-a299-4f28-ada6-69f87b1a84c7.png';

              return (
                <TouchableOpacity
                  key={brand.name}
                  style={[styles.brandCard, isSelected && styles.brandCardSelected]}
                  onPress={() => setSelectedBrand(brand.name)}
                  activeOpacity={0.85}
                >
                  {/* Brand logo at the top */}
                  <View style={styles.brandLogoContainer}>
                    {brand.renderLogo()}
                  </View>

                  {/* Appliance picture at the bottom */}
                  <Image source={{ uri: companyACImg }} style={styles.brandApplianceImg} resizeMode="contain" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Can't find your company banner */}
          <View style={styles.manualEntryBanner}>
            <View style={styles.manualBannerLeft}>
              <View style={styles.manualIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0052e0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                </svg>
              </View>
              <View style={styles.manualBannerTexts}>
                <Text style={styles.manualBannerTitle}>Can't find your company?</Text>
                <Text style={styles.manualBannerDesc}>Choose Other and add company name.</Text>
              </View>
            </View>
          </View>

          {/* Other (Add company name) Input Field */}
          <TouchableOpacity 
            style={[styles.otherBrandRow, selectedBrand === 'Other' && styles.otherBrandRowSelected]}
            onPress={() => setSelectedBrand('Other')}
            activeOpacity={0.8}
          >
            <View style={styles.radioOutline}>
              {selectedBrand === 'Other' && <View style={styles.radioInner} />}
            </View>
            <TextInput
              style={styles.otherBrandInput}
              value={customBrandName}
              onChangeText={(val) => {
                setCustomBrandName(val);
                setSelectedBrand('Other');
              }}
              placeholder="Other (Add company name)"
              placeholderTextColor="#64748b"
              outlineStyle="none"
            />
          </TouchableOpacity>

          {/* Continue button */}
          <TouchableOpacity style={styles.formContinueBtn} onPress={handleSaveBrand} activeOpacity={0.8}>
            <Text style={styles.formContinueBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : view === 'UPLOAD' ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
          <View style={styles.titleSection}>
            <Text style={styles.titleText}>Show us your appliance</Text>
            <Text style={styles.subtitleText}>A quick photo or video helps us identify its condition before service.</Text>
          </View>

          {/* Dedicated Manual Appliance Input Field Section */}
          <View style={styles.manualApplianceInputBox}>
            <Text style={styles.manualInputSectionLabel}>Enter appliance details manually:</Text>
            
            {/* Appliance Name / Model Field */}
            <View style={styles.manualInputFieldWrapper}>
              <View style={styles.manualInputIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </View>
              <View style={styles.manualInputTextCol}>
                <Text style={styles.manualInputLabelText}>Appliance Name / Type</Text>
                <TextInput
                  style={styles.manualTextInput}
                  value={applianceName}
                  onChangeText={setApplianceName}
                  placeholder="e.g. Master Bedroom AC, LG Refrigerator, Smart TV"
                  placeholderTextColor="#94a3b8"
                  outlineStyle="none"
                />
              </View>
            </View>

            {/* Room / Location Field */}
            <View style={styles.manualInputFieldWrapper}>
              <View style={styles.manualInputIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </View>
              <View style={styles.manualInputTextCol}>
                <Text style={styles.manualInputLabelText}>Room / Location</Text>
                <TextInput
                  style={styles.manualTextInput}
                  value={applianceLocation}
                  onChangeText={setApplianceLocation}
                  placeholder="e.g. Living Room, Master Bedroom, Kitchen"
                  placeholderTextColor="#94a3b8"
                  outlineStyle="none"
                />
              </View>
            </View>
          </View>

          {/* Hidden video-only input if needed */}
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleGallerySelect}
            />
          )}

          {/* Dashed upload area */}
          <View style={styles.dashedMediaUploadArea}>
            {capturedMedia && capturedMedia.type === 'video' ? (
              Platform.OS === 'web' ? (
                <video
                  src={capturedMedia.uri}
                  controls
                  style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }}
                />
              ) : (
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16 }}>
                  <Text style={styles.cameraLabelText}>Live Video attached</Text>
                </View>
              )
            ) : cameraActive && Platform.OS === 'web' ? (
              <View style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {isRecording ? (
                  <View style={styles.recordingOverlay}>
                    <View style={styles.blinkingDot} />
                    <Text style={styles.recordingText}>
                      REC 00:{String(recordingSeconds).padStart(2, '0')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cameraLiveBadge}>
                    <Text style={styles.cameraLiveBadgeText}>LIVE CAMERA</Text>
                  </View>
                )}
              </View>
            ) : cameraPermissionDenied ? (
              <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24, paddingHorizontal: 16 }}>
                <AppIcon name="lock" size={32} color="#64748b" />
                <Text style={styles.dashedAreaTitle}>Camera Access Required</Text>
                <Text style={[styles.dashedAreaDesc, { textAlign: 'center', lineHeight: 20 }]}>
                  Please allow camera access in your browser to record a live video. Photos are not permitted.
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20, paddingHorizontal: 16 }}>
                <View style={styles.uploadAreaCircle}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </View>
                <Text style={styles.dashedAreaTitle}>Record Live Video</Text>
                <Text style={[styles.dashedAreaDesc, { textAlign: 'center' }]}>
                  Show the complete appliance, model label and visible condition in a quick video.
                </Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>Live Video (10–20s)</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action button */}
          <View style={styles.uploadActionRow}>
            <TouchableOpacity
              style={[styles.uploadActionBtn, isRecording && styles.uploadActionBtnRecording]}
              onPress={handleRecordVideoPress}
              activeOpacity={0.85}
            >
              <View style={styles.uploadActionIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isRecording ? "#dc2626" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </View>
              <Text style={styles.uploadActionText}>
                {isRecording ? `Stop (${recordingSeconds}s)` : 'Record Live Video'}
              </Text>
            </TouchableOpacity>
          </View>

          {capturedMedia && (
            <TouchableOpacity style={styles.retakeLink} onPress={handleRetakeMedia} activeOpacity={0.7}>
              <Text style={styles.retakeLinkText}>↺ Retake Live Video</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.skipBtnLink} onPress={handleSaveAppliance} activeOpacity={0.7}>
            <Text style={styles.skipBtnLinkText}>Skip for now</Text>
          </TouchableOpacity>

          <View style={styles.secureStorageBanner}>
            <View style={styles.shieldIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </View>
            <Text style={styles.secureBannerText}>
              Your media is securely stored and used only for service verification.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveApplianceBtn, !capturedMedia && styles.saveApplianceBtnDisabled]} 
            onPress={handleSaveAppliance} 
            disabled={!capturedMedia}
            activeOpacity={!capturedMedia ? 1 : 0.85}
          >
            <Text style={[styles.saveApplianceBtnText, !capturedMedia && styles.saveApplianceBtnTextDisabled]}>
              Save Appliance
            </Text>
          </TouchableOpacity>
          {!capturedMedia && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <Text style={{ fontSize: 11.5, color: '#64748b', fontWeight: '500', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                Please record a video, take a photo, or upload a file to save
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Premium Luxury Appliance Added Success Screen */
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
          {/* Newly Added Appliance Showcase Card */}
          {(() => {
            const showcaseItem = latestAdded || addedAppliances[addedAppliances.length - 1] || {
              name: applianceName || 'Master Bedroom AC',
              category: selectedAppliance?.name || 'Home Appliance',
              location: applianceLocation || 'Living Room',
            };
            const imageSource = getRealApplianceImageUrl(showcaseItem);

            return (
              <View style={styles.luxuryShowcaseCard}>
                <View style={styles.luxuryCardHeaderRow}>
                  <View style={styles.luxuryCategoryBadge}>
                    <Text style={styles.luxuryCategoryText}>{showcaseItem.category || 'Home Appliance'}</Text>
                  </View>
                  <View style={styles.luxuryVerifiedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <Text style={styles.luxuryVerifiedText}>Added successfully</Text>
                  </View>
                </View>

                {/* High-definition real appliance image or uploaded photo/video preview */}
                <View style={styles.luxuryImgWrapper}>
                  {renderApplianceMediaPreview(showcaseItem, styles.luxuryShowcaseImg)}
                </View>

                <View style={styles.luxuryCardBody}>
                  <Text style={styles.luxuryApplianceTitle}>{showcaseItem.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <Text style={styles.luxuryApplianceSub}>{showcaseItem.location || 'Living Room'}</Text>
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Registered Appliances Section Header */}
          <View style={styles.registeredSectionHeader}>
            <Text style={styles.successListHeader}>Your Appliances ({addedAppliances.length})</Text>
          </View>

          {/* Your Appliances Cards Grid */}
          <View style={styles.successListContainer}>
            {addedAppliances.map((appliance) => {
              return (
                <View key={appliance.id} style={styles.luxuryListItem}>
                  {renderApplianceMediaPreview(appliance, styles.luxuryListItemImg)}
                  <View style={styles.luxuryListItemTexts}>
                    <Text style={styles.luxuryListItemCategory}>{(appliance.category || 'Appliance').toUpperCase()}</Text>
                    <Text style={styles.luxuryListItemName}>{appliance.name}</Text>
                    <Text style={styles.luxuryListItemLoc}>{appliance.location}</Text>
                    <View style={styles.activeIndicatorRow}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>ACTIVE</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bottom buttons */}
          <TouchableOpacity style={styles.addAnotherBtn} onPress={openAddAppliance} activeOpacity={0.8}>
            <Text style={styles.addAnotherBtnText}>+ Add Another Appliance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Confirm Delete Modal */}
      <Modal visible={showDeleteModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', textAlign: 'center', paddingVertical: 24, gap: 16 }]}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </View>

            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0a1633', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                Remove Appliance?
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18, fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                Are you sure you want to remove <Text style={{ fontWeight: '700', color: '#0f172a' }}>"{deletingAppliance?.name || 'this appliance'}"</Text> from your covered home devices?
              </Text>
            </View>

            <View style={{ width: '100%', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <TouchableOpacity 
                style={{ width: '100%', height: 46, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }} 
                onPress={handleConfirmDelete} 
                activeOpacity={0.85}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  Yes, Remove Appliance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ width: '100%', height: 44, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }} 
                onPress={() => { setShowDeleteModal(false); setDeletingAppliance(null); }} 
                activeOpacity={0.7}
              >
                <Text style={{ color: '#475569', fontSize: 14, fontWeight: '600', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Appliance Modal */}
      <Modal visible={showEditModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Appliance Details</Text>
              <Text style={styles.modalSub}>Update information for this appliance:</Text>

              {getApplianceById(editingTypeId)?.fields?.length ? (
                <DynamicApplianceFields
                  fields={getApplianceById(editingTypeId).fields}
                  values={editValues}
                  errors={editErrors}
                  onChange={(next) => {
                    setEditValues(next);
                    setEditErrors({});
                  }}
                />
              ) : (
                <View style={{ gap: 12, marginVertical: 12 }}>
                  <View style={styles.manualInputFieldWrapper}>
                    <View style={styles.manualInputTextCol}>
                      <Text style={styles.manualInputLabelText}>Appliance Name / Type</Text>
                      <TextInput
                        style={styles.manualTextInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="e.g. Master Bedroom AC"
                        placeholderTextColor="#94a3b8"
                        outlineStyle="none"
                      />
                    </View>
                  </View>
                  <View style={styles.manualInputFieldWrapper}>
                    <View style={styles.manualInputTextCol}>
                      <Text style={styles.manualInputLabelText}>Room / Location</Text>
                      <TextInput
                        style={styles.manualTextInput}
                        value={editLocation}
                        onChangeText={setEditLocation}
                        placeholder="e.g. Living Room, Kitchen"
                        placeholderTextColor="#94a3b8"
                        outlineStyle="none"
                      />
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={handleSaveEdit} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowEditModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Selector Modal */}
      <Modal visible={showLocModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Home / Location</Text>
            <Text style={styles.modalSub}>Select your active home address:</Text>
            {(activeUser?.saved_addresses || []).length > 0 ? (
              (activeUser?.saved_addresses || []).map((addrObj) => (
                <TouchableOpacity
                  key={addrObj.id}
                  style={[styles.modalItem, (activeUser?.address === addrObj.address || address === addrObj.address) && styles.modalItemActive]}
                  onPress={() => {
                    setAddress(addrObj.address);
                    if (setActiveUser && activeUser) {
                      setActiveUser({
                        ...activeUser,
                        address: addrObj.address,
                        property: activeUser.property ? { ...activeUser.property, address: addrObj.address } : activeUser.property
                      });
                    }
                    setShowLocModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <AppIcon name="map-pin" size={14} color="#2563eb" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>{addrObj.tag || 'Home'}</Text>
                    <Text style={[styles.modalItemText, (activeUser?.address === addrObj.address || address === addrObj.address) && styles.modalItemTextActive]} numberOfLines={2}>
                      {addrObj.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>
                  {activeUser?.property?.address || activeUser?.address || 'No saved addresses found.'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowLocModal(false)} activeOpacity={0.7}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <Text style={styles.modalSub}>Recent updates on your home appliances & plans:</Text>
            {notifications.map((notif) => (
              <View key={notif.id} style={styles.notifItem}>
                <Text style={styles.notifText}>{notif.text}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowNotifModal(false)} activeOpacity={0.7}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Registration Required Modal for Guests */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 24, gap: 14, position: 'relative' }]}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => setShowGuestModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.guestIconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
              {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
            </Text>
            <Text style={[styles.modalSub, { textAlign: 'center', lineHeight: 20 }]}>
              {isAnonymous
                ? 'Please register your account first to add, manage, and protect your appliances.'
                : 'Please complete your profile to add, manage, and protect your registered appliances.'}
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, { width: '100%', marginTop: 8 }]}
              onPress={() => {
                setShowGuestModal(false);
                if (navigate) navigate('/user/register');
                else if (onNavigate) onNavigate('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.guestOutlineBtn, { width: '100%' }]}
              onPress={() => {
                setShowGuestModal(false);
                if (navigate) navigate('/user/login');
                else if (onNavigate) onNavigate('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  
  /* Header Styles */
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  backBtn: { padding: 8 },
  headerCenter: { alignItems: 'center', flex: 1, marginHorizontal: 8 },
  headerTitleMain: { fontSize: 16, fontWeight: '700', color: '#0a1633', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  headerSubtitleMain: { fontSize: 11, color: '#64748b', marginTop: 1, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  bellBtn: { padding: 8 },

  content: { padding: 18, gap: 16, boxSizing: 'border-box' },
  addContent: { padding: 16, paddingBottom: 32, gap: 14, boxSizing: 'border-box' },
  addTitleSection: { gap: 6, marginTop: 0, marginBottom: 2 },
  addTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0a1633',
    lineHeight: 30,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  addSubtitleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 20,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Title section */
  titleSection: { gap: 6, marginTop: 2 },
  titleText: { fontSize: 22, fontWeight: '700', color: '#0a1633', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  subtitleText: { fontSize: 13, color: '#64748b', lineHeight: 18, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  brandTitleSection: { gap: 6, marginTop: 4 },
  brandTitleText: { fontSize: 24, fontWeight: '700', color: '#0f172a', lineHeight: 28, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  brandSubtitleText: { fontSize: 13.5, color: '#475569', lineHeight: 18, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  /* Hero image */
  heroImg: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 4,
  },

  /* Dashed placeholder container card */
  dashedPlaceholderCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  dashedIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#edf2fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dashedTitle: { fontSize: 15, fontWeight: '600', color: '#334155', textAlign: 'center', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  dashedDesc: { fontSize: 12.5, color: '#64748b', textAlign: 'center', lineHeight: 18, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  /* Solid Blue button matching "+ Add Appliance" */
  primaryBtn: { 
    backgroundColor: '#0052e0', 
    paddingVertical: 13, 
    borderRadius: 12, 
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 82, 224, 0.15)',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  /* Info row */
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  infoRowText: { fontSize: 12, color: '#475569', fontWeight: '400', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  /* Bottom status banner */
  statusBannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#edf2fc',
    borderWidth: 1,
    borderColor: '#dbecfe',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  bannerIcon: { alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  bannerContent: { flexDirection: 'column', gap: 4, flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '600', color: '#1e3a8a', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  bannerDesc: { fontSize: 12, color: '#3b82f6', lineHeight: 17, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  /* Submit continue button */
  continueBtn: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    paddingVertical: 13, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 8
  },
  continueBtnText: { color: '#475569', fontWeight: '600', fontSize: 14, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '92%',
    maxWidth: 380,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  modalItemActive: {
    backgroundColor: '#edf2fc',
    borderColor: '#0052e0',
  },
  modalItemPin: {
    fontSize: 14,
  },
  modalItemText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  modalItemTextActive: {
    color: '#0052e0',
    fontWeight: '600',
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginTop: 8,
  },
  modalCloseBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Notification Styles */
  notifItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  notifText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  notifTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Search Bar Styles */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 40,
    marginTop: 2,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: '#0a1633',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Appliance Grid Styles */
  applianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridCard: {
    width: '31%',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#edf2f7',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    marginBottom: 10,
  },
  gridImgWrapper: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: 'transparent',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridCardImg: {
    width: '100%',
    height: '100%',
  },
  gridCardText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#002574',
    textAlign: 'center',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    marginTop: 6,
    width: '94%',
  },

  /* Manual Entry Banner matching ss 1 styling closely */
  manualEntryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  manualBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  manualIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBannerTexts: {
    flexDirection: 'column',
    gap: 1,
    flex: 1,
  },
  manualBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002574',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  manualBannerDesc: {
    fontSize: 10.5,
    color: '#475569',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  manualBannerArrow: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },

  /* Added Appliances List Styles */
  appliancesListContainer: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  listSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    marginBottom: 4,
  },
  applianceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#edf2f7',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  itemLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  listItemImg: {
    width: 44,
    height: 44,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  listItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  listItemSub: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  listItemMeta: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  deleteBtn: {
    padding: 6,
  },

  /* Details Screen Form Styles */
  detailsHeroImg: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  detailsMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2fc',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  detailsMiniIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsMiniTextCol: {
    flexDirection: 'column',
    gap: 2,
  },
  detailsMiniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  detailsMiniSub: {
    fontSize: 11.5,
    color: '#475569',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  formContainer: {
    flexDirection: 'column',
    gap: 14,
    position: 'relative',
    zIndex: 10,
  },
  fieldGroup: {
    flexDirection: 'column',
    gap: 6,
    position: 'relative',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  fieldInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0a1633',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  dropdownInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    zIndex: 100,
  },
  dropdownIconOverlay: {
    position: 'absolute',
    right: 14,
    pointerEvents: 'none',
  },
  textareaWrapper: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 12,
    minHeight: 100,
  },
  textareaInput: {
    fontSize: 14,
    color: '#0a1633',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    height: 60,
    verticalAlign: 'top',
  },
  charCount: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  formContinueBtn: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  formContinueBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14.5,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Selectable Dropdown styles */
  fieldInputDropdown: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  fieldInputDropdownText: {
    fontSize: 14,
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  placeholderText: {
    color: '#94a3b8',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    zIndex: 9999,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  dropdownOptionText: {
    fontSize: 13.5,
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Brand Screen Custom Styles matching ss 1 */
  brandCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    marginBottom: 8,
    height: 94,
  },
  brandCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  brandLogoContainer: {
    height: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandApplianceImg: {
    width: 64,
    height: 38,
    marginTop: 4,
  },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center' },
  lgCircle: { width: 12, height: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  lgText: { color: '#ffffff', fontSize: 7, fontWeight: '700' },
  brandTextBold: { fontSize: 11, fontWeight: '600', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  brandTextItalic: { fontSize: 11, fontWeight: '850', fontStyle: 'italic', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  brandTextScript: { fontSize: 11.5, fontWeight: '700', fontFamily: "cursive, 'Outfit', 'Inter', sans-serif" },
  daikinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    borderRightWidth: 4,
    borderRightColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: '#009fe3',
  },
  bluestarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002f6c',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    gap: 2,
  },
  bluestarStar: { color: '#ffffff', fontSize: 6 },
  bluestarText: { color: '#ffffff', fontSize: 6, fontWeight: '600' },
  boschCircle: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#27272a' },

  /* Other Brand Input Field Row matching ss 1 */
  otherBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 2,
    gap: 10,
  },
  otherBrandRowSelected: {
    borderColor: '#0052e0',
  },
  radioOutline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0052e0',
  },
  otherBrandInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },

  /* Media Upload Page Styles matching ss 1 */
  applianceSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  summaryCardImg: {
    width: 50,
    height: 36,
  },
  summaryCardTexts: {
    flexDirection: 'column',
    gap: 2,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  summaryCardDesc: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  summaryNameInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  summaryLocationInput: {
    fontSize: 11.5,
    color: '#64748b',
    padding: 0,
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  stepProgressRow: { alignItems: 'center', gap: 8, marginBottom: 4 },
  stepDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2e8f0' },
  stepDotDone: { backgroundColor: '#2563eb' },
  stepDotActive: { backgroundColor: '#2563eb', width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 36, height: 2, backgroundColor: '#2563eb' },
  stepLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  categoryChipsScroll: { marginVertical: 4 },
  categoryChipsRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  categoryChipText: { fontSize: 11.5, fontWeight: '600', color: '#475569', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  categoryChipTextSelected: { color: '#2563eb' },
  uploadActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  uploadActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 4,
  },
  uploadActionBtnRecording: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  uploadActionIcon: { fontSize: 18 },
  uploadActionText: { fontSize: 10, fontWeight: '700', color: '#0f172a', textAlign: 'center', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  retakeLink: { alignItems: 'center', paddingVertical: 4 },
  retakeLinkText: { fontSize: 12, color: '#2563eb', fontWeight: '600', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  recommendedBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  recommendedBadgeText: { fontSize: 10.5, color: '#64748b', fontWeight: '500', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  summaryCardSub: {
    fontSize: 10.5,
    color: '#64748b',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  dashedMediaUploadArea: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  uploadAreaCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dashedAreaTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  dashedAreaDesc: {
    fontSize: 11.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  recommendedPill: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  recommendedPillText: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  uploadActionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 8,
  },
  uploadActionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
  },
  uploadActionBtnRecording: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  uploadActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    textAlign: 'center',
    lineHeight: 16,
  },
  mediaButtonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  mediaBtnCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  mediaBtnIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaBtnCardText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  skipBtnLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  skipBtnLinkText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  secureStorageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  shieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 15,
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  coverageNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    width: '100%',
    boxSizing: 'border-box',
  },
  coverageNoteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  coverageNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  coverageNoteText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  saveApplianceBtn: {
    backgroundColor: '#0052e0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0 4px 14px rgba(0, 82, 224, 0.25)',
  },
  saveApplianceBtnDisabled: {
    backgroundColor: '#cbd5e1',
    boxShadow: 'none',
    opacity: 0.7,
  },
  saveApplianceBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  saveApplianceBtnTextDisabled: {
    color: '#64748b',
  },
  successHeaderArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
    width: '100%',
  },
  checkmarkOuterCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
  },
  checkmarkInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedApplianceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
    alignItems: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
    marginHorizontal: 4,
  },
  addedCardImg: {
    width: '90%',
    height: 120,
    marginBottom: 12,
  },
  addedCardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1.2,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginBottom: 12,
  },
  addedCardLogoBox: {
    minWidth: 38,
    paddingHorizontal: 8,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
  },
  addedCardTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  addedCardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
    fontFamily: 'Inter, sans-serif',
    marginTop: 1,
  },
  addedSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  addedSuccessBadgeCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedSuccessBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
    fontFamily: 'Inter, sans-serif',
  },
  successListHeader: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#002574',
    fontFamily: 'Inter, sans-serif',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  successListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  successListItem: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  successListItemImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  successListItemTexts: {
    flex: 1,
    flexDirection: 'column',
    gap: 1.5,
  },
  successListItemBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    fontFamily: 'Inter, sans-serif',
  },
  successListItemName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  successListItemLoc: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'Inter, sans-serif',
  },
  activeIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  successEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    position: 'absolute',
    right: 12,
    top: 12,
  },
  addAnotherBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0a4cc9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  addAnotherBtnText: {
    color: '#0a4cc9',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  doneBtn: {
    backgroundColor: '#0a4cc9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    boxShadow: '0 4px 14px rgba(10, 76, 201, 0.2)',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  cameraLabelOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cameraLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },
  viewfinderBrackets: {
    position: 'absolute',
    inset: 0,
  },
  bracketCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ffffff',
    opacity: 0.8,
  },
  recordingOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  blinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  recordingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 0.5,
  },
  cameraLiveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cameraLiveBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 0.5,
  },

  /* Dedicated Manual Appliance Input Field Styles */
  manualApplianceInputBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    marginVertical: 4,
  },
  manualInputSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  manualInputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  manualInputIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#edf2fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualInputTextCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  manualInputLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  manualTextInput: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    outlineStyle: 'none',
    padding: 0,
  },

  /* Executive Luxury Showcase Card Styles */
  luxuryShowcaseCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    boxShadow: '0 10px 30px rgba(0, 82, 224, 0.08)',
    marginBottom: 8,
  },
  luxuryCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  luxuryCategoryBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  luxuryCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0052e0',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  luxuryVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  luxuryVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  luxuryImgWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luxuryShowcaseImg: {
    width: '100%',
    height: '100%',
  },
  luxuryCardBody: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 2,
  },
  luxuryApplianceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    letterSpacing: -0.2,
  },
  luxuryApplianceSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  registeredSectionHeader: {
    marginTop: 6,
    marginBottom: 2,
  },
  luxuryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 12,
    gap: 14,
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
  },
  luxuryListItemImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  luxuryListItemTexts: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  luxuryListItemCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0052e0',
    letterSpacing: 0.5,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  luxuryListItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a1633',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  luxuryListItemLoc: {
    fontSize: 11.5,
    color: '#64748b',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  luxuryRemoveBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luxuryEditBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
  },
});
