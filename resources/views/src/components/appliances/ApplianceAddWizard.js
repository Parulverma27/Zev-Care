import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import ApplianceProgress from './ApplianceProgress';
import DynamicApplianceFields, {
  validateApplianceFields,
} from './DynamicApplianceFields';
import MediaCapturePanel from '../MediaCapturePanel';
import { SERVICE_CATALOG, SERVICE_IMAGES } from '../../config/serviceCatalog';
import { MIN_QUANTITY, MAX_QUANTITY, MEDIA_REQUIREMENTS } from '../../config/applianceConstants';
import { getApplianceById } from '../../config/applianceCatalog';
import { getApplianceTypeIdForService } from '../../config/serviceApplianceMapping';
import {
  isZeroFrictionCategory,
  isPestControlCategory,
  doesApplianceRequireVideo,
} from '../../config/serviceCatalogUtils';
import FastAddConfirmationModal from '../booking/FastAddConfirmationModal';
import BlinkitCartBar from '../booking/BlinkitCartBar';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../AppIcons';

/**
 * Multi-step add-service wizard.
 * Steps: category | subgroup | service | quantity | details | media
 * Shows the full service catalog (Electrician, Plumber, Carpenter, etc.)
 * and enables adding any service item via live video verification.
 */

// Generic fields shown for every service type in the details step
const GENERIC_SERVICE_FIELDS = [
  {
    id: 'displayName',
    label: 'Item / Label',
    type: 'text',
    required: true,
    placeholder: 'e.g. Living Room Sofa',
  },
  {
    id: 'location',
    label: 'Location in Home',
    type: 'text',
    required: true,
    placeholder: 'e.g. Master Bedroom, Hall',
  },
  {
    id: 'notes',
    label: 'Additional details',
    type: 'textarea',
    required: false,
    maxLength: 120,
    placeholder: 'Any extra info (brand, size, issue, etc.)',
  },
];

/* --- Vector Icons (No Emojis) --- */
const IconTool = ({ size = 11, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const IconPin = ({ size = 11, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconTag = ({ size = 11, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
  </svg>
);

const IconCheckCircle = ({ size = 11, color = '#16a34a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconGauge = ({ size = 11, color = '#0284c7' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCalendar = ({ size = 11, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconShield = ({ size = 11, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCameraVideo = ({ size = 11, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

function formatAgeOrYear(val) {
  if (!val) return '';
  const s = String(val).trim();
  const n = Number(s);
  if (!isNaN(n)) {
    if (n >= 1990 && n <= 2035) return `Year ${n}`;
    if (n === 1) return '1 yr old';
    if (n > 1 && n < 50) return `${n} yrs old`;
  }
  return s;
}

function getApplianceVideoUri(appliance) {
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

function resolveApplianceImage(appliance) {
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

function createServiceUnitDraft(serviceItem, index, applianceDef) {
  const typeName = serviceItem?.name || 'Item';
  return {
    unitIndex: index,
    serviceName: typeName,
    applianceTypeId: applianceDef?.id || serviceItem?.applianceTypeId || 'other',
    serviceImage: serviceItem?.image_url || serviceItem?.image || null,
    displayName: `${typeName} ${index + 1}`,
    brand: '',
    customBrand: '',
    type: '',
    capacity: '',
    year: '',
    location: '',
    condition: 'Working',
    notes: '',
    model: '',
    media: null,
  };
}

function InspectVideoPlayer({ videoUri, fallbackImg }) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [videoUri]);

  if (!videoUri || loadError || (typeof videoUri === 'string' && videoUri.startsWith('auto-verified://'))) {
    return (
      <View style={styles.inspectImgBox}>
        {fallbackImg ? (
          <Image
            source={{ uri: fallbackImg }}
            style={styles.inspectImg}
            resizeMode="contain"
          />
        ) : null}
        <View style={styles.inspectFallbackBadge}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <Text style={styles.inspectFallbackBadgeText}>
            Walkthrough Video Verified • AMC Active
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inspectVideoBox}>
      <video
        key={videoUri}
        src={videoUri}
        controls
        autoPlay
        muted
        playsInline
        loop
        onError={() => setLoadError(true)}
        style={{
          width: '100%',
          height: 220,
          borderRadius: 14,
          backgroundColor: '#000000',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <View style={styles.inspectVideoMetaStrip}>
        <View style={styles.inspectLiveDot} />
        <Text style={styles.inspectVideoMetaText}>
          Original Video Walkthrough • Verified
        </Text>
      </View>
    </View>
  );
}

export function resolveInitialApplianceService({
  lockedApplianceTypeId = null,
  preselectedService = null,
  initialService = null,
  initialCategory = null,
} = {}) {
  const targetServiceName = (preselectedService || initialService || '').trim();
  const targetTypeId = lockedApplianceTypeId || (targetServiceName ? getApplianceTypeIdForService(targetServiceName) : null);

  if (!targetServiceName && !targetTypeId) {
    return null;
  }

  let matchedCategory = null;
  let matchedSubgroup = null;
  let matchedItem = null;

  // Search inside SERVICE_CATALOG
  for (const cat of SERVICE_CATALOG) {
    if (cat.groups) {
      for (const grp of cat.groups) {
        for (const itm of (grp.items || [])) {
          if (itm.isOther) continue;
          const itmTypeId = getApplianceTypeIdForService(itm.name);
          const nameMatches = targetServiceName && (
            itm.name.toLowerCase() === targetServiceName.toLowerCase() ||
            (targetServiceName.length > 2 && itm.name.toLowerCase().includes(targetServiceName.toLowerCase())) ||
            (itm.name.length > 2 && targetServiceName.toLowerCase().includes(itm.name.toLowerCase()))
          );
          const typeMatches = targetTypeId && itmTypeId === targetTypeId;

          if (nameMatches || typeMatches) {
            matchedCategory = cat;
            matchedSubgroup = grp;
            matchedItem = itm;
            break;
          }
        }
        if (matchedItem) break;
      }
    } else if (cat.items) {
      for (const itm of cat.items) {
        if (itm.isOther) continue;
        const itmTypeId = getApplianceTypeIdForService(itm.name);
        const nameMatches = targetServiceName && (
          itm.name.toLowerCase() === targetServiceName.toLowerCase() ||
          (targetServiceName.length > 2 && itm.name.toLowerCase().includes(targetServiceName.toLowerCase())) ||
          (itm.name.length > 2 && targetServiceName.toLowerCase().includes(itm.name.toLowerCase()))
        );
        const typeMatches = targetTypeId && itmTypeId === targetTypeId;

        if (nameMatches || typeMatches) {
          matchedCategory = cat;
          matchedSubgroup = null;
          matchedItem = itm;
          break;
        }
      }
    }

    if (matchedItem) break;
  }

  const applianceDef = targetTypeId ? getApplianceById(targetTypeId) : null;
  const resolvedTypeId = targetTypeId || (matchedItem ? getApplianceTypeIdForService(matchedItem.name) : null) || 'other';
  const resolvedDef = applianceDef || (resolvedTypeId && resolvedTypeId !== 'other' ? getApplianceById(resolvedTypeId) : null);
  const resolvedName = matchedItem?.name || resolvedDef?.name || targetServiceName || 'Appliance';

  if (!matchedCategory && initialCategory) {
    matchedCategory = SERVICE_CATALOG.find((c) =>
      c.name.toLowerCase() === initialCategory.toLowerCase() ||
      c.id.toLowerCase() === initialCategory.toLowerCase()
    ) || null;
  }

  const serviceObj = {
    name: resolvedName,
    image_url: matchedItem?.image_url || resolvedDef?.image || null,
    description: matchedItem?.description || resolvedDef?.description || '',
    isOther: !!matchedItem?.isOther,
    applianceTypeId: resolvedTypeId,
    applianceDef: resolvedDef,
  };

  return {
    category: matchedCategory,
    subgroup: matchedSubgroup,
    service: serviceObj,
    applianceDef: resolvedDef,
    applianceTypeId: resolvedTypeId,
  };
}

export default function ApplianceAddWizard({
  onComplete,
  onCancel,
  mode = 'inventory',
  maxQuantity = MAX_QUANTITY,
  existingAppliances = null,
  planName = null,
  lockedApplianceTypeId = null,
  initialCategory = null,
  initialService = null,
  preselectedService = null,
}) {
  const appContext = useApp ? useApp() : {};
  const { activeUser, getAppliancesForUser, userAppliances, updateUserAppliance } = appContext;

  const initialResolved = useMemo(() => {
    return resolveInitialApplianceService({
      lockedApplianceTypeId,
      preselectedService: preselectedService || initialService,
      initialCategory,
    });
  }, [lockedApplianceTypeId, preselectedService, initialService, initialCategory]);

  const displayedPlanAppliances = useMemo(() => {
    if (Array.isArray(existingAppliances)) {
      return existingAppliances;
    }
    if (getAppliancesForUser && activeUser && !activeUser.isGuest) {
      return getAppliancesForUser(activeUser) || [];
    }
    return [];
  }, [existingAppliances, getAppliancesForUser, activeUser]);

  const { width } = useWindowDimensions();
  // Desktop web only: wide 2-column layout. Mobile/native keeps the original single-column flow.
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const columns = width >= 900 ? 5 : width >= 600 ? 4 : 3;
  const qtyCap = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Number(maxQuantity) || MAX_QUANTITY));

  // --- wizard state ---
  const [step, setStep] = useState(() => (initialResolved ? 'details' : 'category'));
  const [selectedCategory, setSelectedCategory] = useState(() => initialResolved?.category || null);
  const [selectedSubgroup, setSelectedSubgroup] = useState(() => initialResolved?.subgroup || null);
  const [selectedService, setSelectedService] = useState(() => initialResolved?.service || null);
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [units, setUnits] = useState(() =>
    initialResolved
      ? [createServiceUnitDraft(initialResolved.service, 0, initialResolved.applianceDef)]
      : []
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [mediaError, setMediaError] = useState('');
  const [showDiscard, setShowDiscard] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fastAddItem, setFastAddItem] = useState(null);
  const [fastAddQty, setFastAddQty] = useState(1);
  const [showFastAddModal, setShowFastAddModal] = useState(false);
  const [accumulatedFastUnits, setAccumulatedFastUnits] = useState([]);
  const [inspectingAppliance, setInspectingAppliance] = useState(null);
  const [isRetakingVideo, setIsRetakingVideo] = useState(false);

  const isGuest = Boolean(
    !activeUser ||
    activeUser.isGuest ||
    activeUser.id === 0 ||
    activeUser.name === 'Guest User' ||
    activeUser.isAnonymous
  );
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    if (initialResolved) {
      setSelectedCategory(initialResolved.category);
      setSelectedSubgroup(initialResolved.subgroup);
      setSelectedService(initialResolved.service);
      setQuantity(1);
      setCurrentIndex(0);
      setUnits([createServiceUnitDraft(initialResolved.service, 0, initialResolved.applianceDef)]);
      setStep('details');
    }
  }, [initialResolved]);

  const currentUnit = units[currentIndex] || null;

  // --- derived lists ---
  const subgroups = useMemo(() => selectedCategory?.groups || null, [selectedCategory]);

  const serviceItems = useMemo(() => {
    if (!selectedCategory) return [];
    if (isPestControlCategory(selectedCategory.name || selectedCategory.id)) {
      if (selectedCategory.items?.length) return selectedCategory.items;
      if (selectedCategory.groups?.length) {
        return selectedCategory.groups.flatMap((g) => g.items || []);
      }
    }
    if (subgroups && selectedSubgroup) return selectedSubgroup.items || [];
    if (!subgroups) return selectedCategory.items || [];
    return [];
  }, [selectedCategory, subgroups, selectedSubgroup]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SERVICE_CATALOG;
    return SERVICE_CATALOG.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return serviceItems;
    return serviceItems.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    );
  }, [searchQuery, serviceItems]);

  // --- dirty guard ---
  const dirty = !!selectedService || units.some((u) => u.location || u.media) || accumulatedFastUnits.length > 0;

  const requestLeave = useCallback(() => {
    if (dirty && step !== 'category') {
      setShowDiscard(true);
      return;
    }
    onCancel?.();
  }, [dirty, step, onCancel]);

  // --- handlers ---
  const handlePickCategory = (cat) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setSelectedCategory(cat);
    setSelectedSubgroup(null);
    setSearchQuery('');
    setAccumulatedFastUnits([]);
    if (isPestControlCategory(cat.name || cat.id)) {
      setStep('service');
    } else if (cat.groups?.length) {
      setStep('subgroup');
    } else {
      setStep('service');
    }
  };

  const handlePickSubgroup = (group) => {
    setSelectedSubgroup(group);
    setSearchQuery('');
    setStep('service');
  };

  const activeFields = useMemo(() => {
    if (!selectedService) return GENERIC_SERVICE_FIELDS;
    if (selectedService.applianceDef?.fields?.length) {
      return selectedService.applianceDef.fields;
    }
    const mappedId = getApplianceTypeIdForService(selectedService.name);
    const def = mappedId ? getApplianceById(mappedId) : null;
    if (def?.fields?.length) return def.fields;
    return GENERIC_SERVICE_FIELDS;
  }, [selectedService]);

  const handlePickService = (item) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    const isZeroFriction = isZeroFrictionCategory(selectedCategory?.name || selectedCategory?.id);
    if (isZeroFriction) {
      setFastAddItem(item);
      setFastAddQty(1);
      setShowFastAddModal(true);
      return;
    }

    const applianceTypeId = getApplianceTypeIdForService(item.name);
    const applianceDef = applianceTypeId ? getApplianceById(applianceTypeId) : null;
    const serviceObj = {
      name: item.name,
      image_url: item.image_url || null,
      description: item.description || '',
      isOther: !!item.isOther,
      applianceTypeId: applianceTypeId || 'other',
      applianceDef,
    };
    setSelectedService(serviceObj);
    setQuantity(1);
    setUnits([createServiceUnitDraft(serviceObj, 0, applianceDef)]);
    setCurrentIndex(0);
    setFieldErrors({});
    setMediaError('');
    if (item.isOther) {
      setStep('details');
    } else {
      setStep('quantity');
    }
  };

  const handleConfirmFastAdd = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!fastAddItem) return;

    if (fastAddItem.isBundle && Array.isArray(fastAddItem.items)) {
      const bundleUnits = fastAddItem.items.map((svc, idx) => {
        const applianceTypeId = getApplianceTypeIdForService(svc.name);
        const applianceDef = applianceTypeId ? getApplianceById(applianceTypeId) : null;
        const serviceObj = {
          name: svc.name,
          image_url: svc.image_url || null,
          description: svc.description || '',
          isOther: false,
          applianceTypeId: applianceTypeId || 'other',
          applianceDef,
        };
        return {
          ...createServiceUnitDraft(serviceObj, idx, applianceDef),
          displayName: svc.name,
          serviceName: svc.name,
          location: 'Home',
          condition: 'Working',
          notes: `${selectedCategory?.name || 'Quick Add'} category protection`,
          media: null,
        };
      });

      // Avoid duplicate services
      const notYetAdded = bundleUnits.filter(
        (bu) => !accumulatedFastUnits.some((au) => au.serviceName === bu.serviceName)
      );
      setAccumulatedFastUnits((prev) => [...prev, ...notYetAdded]);
      setShowFastAddModal(false);
      setFastAddItem(null);
      return;
    }

    const applianceTypeId = getApplianceTypeIdForService(fastAddItem.name);
    const applianceDef = applianceTypeId ? getApplianceById(applianceTypeId) : null;
    const serviceObj = {
      name: fastAddItem.name,
      image_url: fastAddItem.image_url || null,
      description: fastAddItem.description || '',
      isOther: false,
      applianceTypeId: applianceTypeId || 'other',
      applianceDef,
    };

    const newUnits = Array.from({ length: fastAddQty }, (_, idx) => ({
      ...createServiceUnitDraft(serviceObj, idx, applianceDef),
      displayName: `${fastAddItem.name} ${accumulatedFastUnits.filter((u) => u.serviceName === fastAddItem.name).length + idx + 1}`,
      serviceName: fastAddItem.name,
      location: 'Home',
      condition: 'Working',
      notes: `${selectedCategory?.name || 'Quick Add'} registered`,
      media: null,
    }));

    setAccumulatedFastUnits((prev) => [...prev, ...newUnits]);
    setShowFastAddModal(false);
    setFastAddItem(null);
  };

  const handleAddEntireCategory = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!selectedCategory) return;
    const itemsToAdd = (serviceItems || []).filter((s) => !s.isOther);
    if (!itemsToAdd.length) return;

    setFastAddItem({
      name: `Complete ${selectedCategory.name} Protection`,
      description: `All ${itemsToAdd.length} services covered under your plan with ₹0 breakdown labor.`,
      isBundle: true,
      items: itemsToAdd,
      image_url: selectedCategory.image_url || null,
    });
    setFastAddQty(1);
    setShowFastAddModal(true);
  };

  const handleQuantityContinue = () => {
    const drafts = Array.from({ length: quantity }, (_, idx) =>
      createServiceUnitDraft(selectedService, idx, selectedService?.applianceDef)
    );
    setUnits(drafts);
    setCurrentIndex(0);
    setFieldErrors({});
    setMediaError('');
    setStep('details');
  };

  const updateCurrentUnit = (patch) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === currentIndex ? { ...u, ...patch } : u))
    );
  };

  const isDetailsValid = useMemo(() => {
    if (!currentUnit) return false;
    const errors = validateApplianceFields(activeFields, currentUnit);
    return Object.keys(errors).length === 0;
  }, [activeFields, currentUnit]);

  const handleDetailsContinue = () => {
    const errors = validateApplianceFields(activeFields, currentUnit || {});
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setMediaError('');
    setStep('media');
  };

  const mediaReady = () => {
    const media = currentUnit?.media;
    return !!(media?.uri && media.type === 'video');
  };

  const handleMediaContinue = () => {
    if (!mediaReady()) {
      setMediaError('Please record a live video walkthrough to continue.');
      return;
    }
    setMediaError('');
    if (currentIndex < units.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFieldErrors({});
      setStep('details');
      return;
    }
    setShowSaveConfirmModal(true);
  };

  const handleConfirmFinalSave = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setShowSaveConfirmModal(false);
    onComplete?.(units, selectedService);
  };

  const handleBack = () => {
    if (step === 'subgroup') {
      setSelectedCategory(null);
      setSelectedSubgroup(null);
      setStep('category');
      setSearchQuery('');
      return;
    }
    if (step === 'service') {
      if (subgroups) {
        setSelectedSubgroup(null);
        setStep('subgroup');
      } else {
        setSelectedCategory(null);
        setStep('category');
      }
      setSearchQuery('');
      return;
    }
    if (step === 'quantity') {
      setStep('service');
      return;
    }
    if (step === 'details') {
      if (initialResolved || lockedApplianceTypeId) {
        requestLeave();
        return;
      }
      if (currentIndex === 0) {
        setStep('quantity');
        return;
      }
      setCurrentIndex((i) => i - 1);
      setStep('media');
      return;
    }
    if (step === 'media') {
      setStep('details');
      return;
    }
    requestLeave();
  };

  // --- grid style ---
  const gridStyle = {
    display: Platform.OS === 'web' ? 'grid' : undefined,
    gridTemplateColumns:
      Platform.OS === 'web'
        ? (isDesktopWeb ? 'repeat(auto-fill, minmax(230px, 1fr))' : `repeat(${columns}, minmax(0, 1fr))`)
        : undefined,
    gap: isDesktopWeb ? 20 : 12,
    rowGap: isDesktopWeb ? 24 : 16,
    columnGap: isDesktopWeb ? 20 : 12,
    width: '100%',
  };

  const renderCategoryGrid = (list) => {
    if (!list.length) {
      return (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchTitle}>No categories found</Text>
          <Text style={styles.emptySearchSub}>Try a different search term.</Text>
        </View>
      );
    }
    if (Platform.OS === 'web') {
      return (
        <div style={gridStyle}>
          {list.map((cat) => (
            <CategoryCard key={cat.id || cat.name} item={cat} onPress={() => handlePickCategory(cat)} />
          ))}
        </div>
      );
    }
    return (
      <View style={styles.nativeGrid}>
        {list.map((cat) => (
          <CategoryCard
            key={cat.id || cat.name}
            item={cat}
            onPress={() => handlePickCategory(cat)}
            style={{ width: `${100 / columns - 2}%`, marginBottom: 12 }}
          />
        ))}
      </View>
    );
  };

  const renderSubgroupGrid = (list) => {
    if (!list || !list.length) return null;
    if (Platform.OS === 'web') {
      return (
        <div style={gridStyle}>
          {list.map((grp) => (
            <CategoryCard key={grp.name} item={grp} onPress={() => handlePickSubgroup(grp)} />
          ))}
        </div>
      );
    }
    return (
      <View style={styles.nativeGrid}>
        {list.map((grp) => (
          <CategoryCard
            key={grp.name}
            item={grp}
            onPress={() => handlePickSubgroup(grp)}
            style={{ width: `${100 / columns - 2}%`, marginBottom: 12 }}
          />
        ))}
      </View>
    );
  };

  const renderServiceGrid = (list) => {
    if (!list.length) {
      return (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchTitle}>No services found</Text>
          <Text style={styles.emptySearchSub}>Try a different search term.</Text>
        </View>
      );
    }
    const serviceGridStyle = {
      ...gridStyle,
      rowGap: isDesktopWeb ? 24 : 16,
      columnGap: isDesktopWeb ? 20 : 12,
    };
    if (Platform.OS === 'web') {
      return (
        <div style={serviceGridStyle}>
          {list.map((svc) => (
            <ServiceItemCard
              key={svc.name}
              item={svc}
              onPress={() => handlePickService(svc)}
            />
          ))}
        </div>
      );
    }
    return (
      <View style={styles.nativeGrid}>
        {list.map((svc) => (
          <ServiceItemCard
            key={svc.name}
            item={svc}
            onPress={() => handlePickService(svc)}
            style={{ width: `${100 / columns - 2}%`, marginBottom: 12 }}
          />
        ))}
      </View>
    );
  };

  const breadcrumb = [selectedCategory?.name, selectedSubgroup?.name].filter(Boolean).join(' › ');

  return (
    <View style={[styles.root, isDesktopWeb && styles.rootDesktop]}>
      <View style={[styles.headerRow, isDesktopWeb && styles.headerRowDesktop]}>
        {isDesktopWeb ? (
          <TouchableOpacity style={styles.backPillDesktop} onPress={handleBack} accessibilityLabel="Go back">
            <Text style={styles.backPillDesktopText}>←  Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
        )}
        {!!breadcrumb && (
          <Text style={styles.breadcrumb} numberOfLines={1}>
            {breadcrumb}
          </Text>
        )}
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isDesktopWeb && (['category', 'subgroup', 'service'].includes(step) ? styles.contentDesktopWide : styles.contentDesktop),
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >

        {/* --------- CATEGORY STEP --------- */}
        {step === 'category' && (
          <CategoryStepLayout
            isDesktop={isDesktopWeb}
            left={(
          <>
            <Text
              style={[styles.title, isDesktopWeb && styles.titleDesktop]}
              {...(isDesktopWeb ? { role: 'heading', 'aria-level': 1 } : {})}
            >
              {isDesktopWeb ? 'Register Home Appliances' : 'What would you like to add?'}
            </Text>
            <Text style={[styles.subtitle, isDesktopWeb && styles.subtitleDesktop]}>
              {isDesktopWeb
                ? 'Choose a service category to register items under your AMC protection plan.'
                : 'Choose a service category to register items for your home.'}
            </Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchGlyph}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search categories..."
                placeholderTextColor="#94a3b8"
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {renderCategoryGrid(filteredCategories)}
          </>
            )}
            right={(
            /* --------- REGISTERED / PLAN APPLIANCES SECTION --------- */
            <View style={[styles.coveredSection, isDesktopWeb && styles.coveredSectionDesktop]}>
              <View style={styles.coveredSectionHeader}>
                <View style={styles.coveredHeaderLeft}>
                  <View style={styles.coveredShieldIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.coveredSectionTitle}>
                      {planName ? `${planName} Plan Appliances` : 'Appliances in Your Plan'}
                    </Text>
                    <Text style={styles.coveredSectionSubtitle}>
                      Active items registered and protected under your AMC coverage
                    </Text>
                  </View>
                </View>
                <View style={styles.coveredCountPill}>
                  <Text style={styles.coveredCountPillText}>
                    {displayedPlanAppliances.length} {displayedPlanAppliances.length === 1 ? 'Appliance' : 'Appliances'}
                  </Text>
                </View>
              </View>

              {displayedPlanAppliances.length === 0 ? (
                <View style={styles.emptyCoveredBox}>
                  <View style={styles.emptyCoveredIconWrap}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </View>
                  <Text style={styles.emptyCoveredTitle}>No Appliances Registered Yet</Text>
                  <Text style={styles.emptyCoveredText}>
                    Choose any category above to register your first appliance under AMC protection.
                  </Text>
                </View>
              ) : (
                <View style={styles.coveredList}>
                  {displayedPlanAppliances.map((appliance, idx) => {
                    const appName = appliance.displayName || appliance.name || appliance.category || 'Appliance';
                    const requiresVideo = doesApplianceRequireVideo(appliance);
                    const rawCategory = appliance.category || appliance.serviceName || '';
                    const appCategory = (rawCategory && rawCategory !== 'Item' && rawCategory !== appName)
                      ? rawCategory
                      : (!requiresVideo ? (selectedCategory?.name || '') : '');
                    const appBrand = appliance.brand || appliance.customBrand || '';
                    const appLocation = appliance.location || '';
                    const appCondition = appliance.condition || 'Working';
                    const videoUri = getApplianceVideoUri(appliance);
                    const imgUrl = resolveApplianceImage(appliance);

                    return (
                      <TouchableOpacity
                        key={appliance.id || `plan-app-${idx}`}
                        style={styles.coveredCard}
                        onPress={() => setInspectingAppliance(appliance)}
                        activeOpacity={0.88}
                      >
                        {/* Top: Full width title & status badge */}
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <Text style={styles.cardTitleText}>{appName}</Text>
                          </View>
                          <View style={styles.activePlanChip}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <Text style={styles.activePlanChipText}>COVERED</Text>
                          </View>
                        </View>

                        {/* Body: High-def product image tile (only for appliances requiring video/media) & structured specs */}
                        <View style={styles.cardBodyRow}>
                          {requiresVideo && (
                            <View style={styles.coveredMediaTile}>
                              {videoUri && Platform.OS === 'web' ? (
                                <video
                                  src={videoUri}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                />
                              ) : (
                                <Image
                                  source={{ uri: imgUrl }}
                                  style={styles.coveredApplianceImg}
                                  resizeMode="contain"
                                />
                              )}
                              {videoUri ? (
                                <View style={styles.videoRibbonBadge}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#ffffff">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                  <Text style={styles.videoRibbonText}>VIDEO</Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          <View style={styles.cardSpecsCol}>
                            <View style={styles.specChipsWrap}>
                              {appCategory ? (
                                <View style={styles.specChip}>
                                  <IconTool size={11} color="#64748b" />
                                  <Text style={styles.specChipText} numberOfLines={1} ellipsizeMode="tail">{appCategory}</Text>
                                </View>
                              ) : null}
                              {appLocation ? (
                                <View style={styles.specChip}>
                                  <IconPin size={11} color="#64748b" />
                                  <Text style={styles.specChipText} numberOfLines={1} ellipsizeMode="tail">{appLocation}</Text>
                                </View>
                              ) : null}
                              {appBrand ? (
                                <View style={styles.specChip}>
                                  <IconTag size={11} color="#64748b" />
                                  <Text style={styles.specChipText} numberOfLines={1} ellipsizeMode="tail">{appBrand}</Text>
                                </View>
                              ) : null}
                              {appCondition ? (
                                <View style={[styles.specChip, styles.conditionChip]}>
                                  <IconCheckCircle size={11} color="#15803d" />
                                  <Text style={[styles.specChipText, { color: '#15803d', fontWeight: '700' }]} numberOfLines={1} ellipsizeMode="tail">{appCondition}</Text>
                                </View>
                              ) : null}
                              {appliance.capacity ? (
                                <View style={styles.specChip}>
                                  <IconGauge size={11} color="#0284c7" />
                                  <Text style={[styles.specChipText, { color: '#0369a1' }]} numberOfLines={1} ellipsizeMode="tail">{appliance.capacity}</Text>
                                </View>
                              ) : null}
                              {appliance.year || appliance.age_range ? (
                                <View style={styles.specChip}>
                                  <IconCalendar size={11} color="#64748b" />
                                  <Text style={styles.specChipText} numberOfLines={1} ellipsizeMode="tail">{formatAgeOrYear(appliance.year || appliance.age_range)}</Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>

                        {/* Bottom: Clean vector verification strip */}
                        {videoUri ? (
                          <View style={styles.videoWatchStrip}>
                            <View style={styles.videoWatchLeft}>
                              <IconCameraVideo size={13} color="#2563eb" />
                              <Text style={styles.videoWatchStripText}>
                                Live Video Walkthrough Attached
                              </Text>
                            </View>
                            <View style={styles.videoWatchActionBtn}>
                              <Text style={styles.videoWatchActionText}>Watch Video ▶</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.instantStrip}>
                            <IconShield size={12} color="#059669" />
                            <Text style={styles.instantStripText}>
                              Catalog Protection • ₹0 Breakdown Labor
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            )}
          />
        )}

        {/* --------- SUBGROUP STEP --------- */}
        {step === 'subgroup' && selectedCategory && (
          <>
            <Text style={[styles.title, isDesktopWeb && styles.titleDesktop]}>{selectedCategory.name}</Text>
            <Text style={[styles.subtitle, isDesktopWeb && styles.subtitleDesktop]}>
              {selectedCategory.description || 'Choose a sub-category.'}
            </Text>
            {renderSubgroupGrid(subgroups)}
          </>
        )}

        {/* --------- SERVICE STEP --------- */}
        {step === 'service' && (
          <>
            <Text style={[styles.title, isDesktopWeb && styles.titleDesktop]}>
              {selectedSubgroup ? selectedSubgroup.name : selectedCategory?.name}
            </Text>
            <Text style={[styles.subtitle, isDesktopWeb && styles.subtitleDesktop]}>
              {isZeroFrictionCategory(selectedCategory?.name || selectedCategory?.id)
                ? 'Select any service to add directly without video verification.'
                : 'Select the item you want to register with a live video.'}
            </Text>
            <View style={[styles.searchBar, isDesktopWeb && styles.searchBarDesktop]}>
              <AppIcon name="search" size={isDesktopWeb ? 16 : 14} color="#94a3b8" />
              <TextInput
                style={[styles.searchInput, isDesktopWeb && styles.searchInputDesktop]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search services..."
                placeholderTextColor="#94a3b8"
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ONE-TIME ADD COMPLETE CATEGORY HERO BANNER */}
            {isZeroFrictionCategory(selectedCategory?.name || selectedCategory?.id) && (() => {
              const standardServices = (serviceItems || []).filter((s) => !s.isOther);
              const allAdded = standardServices.length > 0 && standardServices.every((s) =>
                accumulatedFastUnits.some((u) => u.serviceName === s.name)
              );

              return (
                <View style={styles.categoryBundleHero}>
                  <View style={styles.bundleHeroHeader}>
                    <View style={styles.bundleBadge}>
                      <IconShield size={11} color="#0052e0" />
                      <Text style={styles.bundleBadgeText}>1-Click Category Add</Text>
                    </View>
                    <View style={styles.bundleSavingsPill}>
                      <Text style={styles.bundleSavingsText}>
                        {standardServices.length} Services Included
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bundleBodyRow}>
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text style={styles.bundleHeroTitle}>
                        Complete {selectedCategory.name} Protection
                      </Text>
                      <Text style={styles.bundleHeroDesc}>
                        Protect your home against {standardServices.map((s) => s.name).join(', ')} in a single confirmation.
                      </Text>
                      <View style={styles.bundleFeaturesRow}>
                        <View style={styles.bundleFeatureItem}>
                          <IconCheckCircle size={11} color="#15803d" />
                          <Text style={styles.bundleFeatureText}>₹0 Video Walkthrough Required</Text>
                        </View>
                        <View style={styles.bundleFeatureItem}>
                          <IconCheckCircle size={11} color="#15803d" />
                          <Text style={styles.bundleFeatureText}>₹0 Breakdown Labor Included</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.bundleAddBtn, allAdded && styles.bundleAddBtnDone]}
                    onPress={handleAddEntireCategory}
                    disabled={allAdded}
                    activeOpacity={0.85}
                  >
                    {allAdded ? (
                      <>
                        <IconCheckCircle size={15} color="#ffffff" />
                        <Text style={styles.bundleAddBtnText}>✓ All Services Added to Plan</Text>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <Text style={styles.bundleAddBtnText}>
                          Add Entire Category (All {standardServices.length} Services)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })()}

            {renderServiceGrid(filteredServices)}
          </>
        )}

        {/* --------- QUANTITY STEP --------- */}
        {step === 'quantity' && selectedService && (
          <>
            <Text style={styles.title}>How many do you have?</Text>
            <Text style={styles.subtitle}>
              How many {selectedService.name}
              {selectedService.name.endsWith('s') ? '' : 's'} would you like to register?
            </Text>
            <View style={styles.qtyHero}>
              {selectedService.image_url ? (
                <Image source={{ uri: selectedService.image_url }} style={styles.qtyImage} resizeMode="contain" />
              ) : (
                <View style={styles.qtyImagePlaceholder}>
                  <Text style={styles.qtyImagePlaceholderText}>{selectedService.name[0]}</Text>
                </View>
              )}
              <Text style={styles.qtyName}>{selectedService.name}</Text>
              {!!selectedCategory && (
                <Text style={styles.qtyCategoryLabel}>{selectedCategory.name}</Text>
              )}
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity <= MIN_QUANTITY && styles.qtyBtnDisabled]}
                disabled={quantity <= MIN_QUANTITY}
                onPress={() => setQuantity((q) => Math.max(MIN_QUANTITY, q - 1))}
                accessibilityLabel="Decrease quantity"
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity >= qtyCap && styles.qtyBtnDisabled]}
                disabled={quantity >= qtyCap}
                onPress={() => setQuantity((q) => Math.min(qtyCap, q + 1))}
                accessibilityLabel="Increase quantity"
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.qtyHint}>Add up to {qtyCap} items at a time.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleQuantityContinue} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {/* --------- DETAILS STEP --------- */}
        {step === 'details' && currentUnit && selectedService && (
          <>
            <ApplianceProgress currentIndex={currentIndex} total={units.length} />
            <Text style={styles.title}>Tell us about this item</Text>
            <Text style={styles.subtitle}>
              {selectedService.name} {currentIndex + 1} of {units.length}
            </Text>
            {!!selectedService.image_url && (
              <Image source={{ uri: selectedService.image_url }} style={styles.detailsHero} resizeMode="contain" />
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeTitle}>{selectedService.name}</Text>
              {!!selectedCategory && (
                <Text style={styles.typeBadgeSub}>{selectedCategory.name}</Text>
              )}
            </View>
            <DynamicApplianceFields
              fields={activeFields}
              values={currentUnit}
              errors={fieldErrors}
              onChange={(next) => {
                setUnits((prev) =>
                  prev.map((u, i) => (i === currentIndex ? { ...u, ...next } : u))
                );
                setFieldErrors({});
              }}
            />

            {/* Coverage Policy Note */}
            <View style={styles.coverageNoteCard}>
              <View style={styles.coverageNoteIconWrap}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coverageNoteTitle}>Service Guidelines Note</Text>
                <Text style={styles.coverageNoteText}>
                  Please note: Only items in active{' '}
                  <Text style={{ fontWeight: '700', color: '#1e40af' }}>working condition</Text>{' '}
                  are covered under the Care Subscription Package. Pre-existing non-functional units cannot be onboarded.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !isDetailsValid && styles.primaryBtnDisabled]}
              onPress={handleDetailsContinue}
              disabled={!isDetailsValid}
              activeOpacity={0.88}
            >
              <Text style={[styles.primaryBtnText, !isDetailsValid && styles.primaryBtnTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* --------- MEDIA STEP --------- */}
        {step === 'media' && currentUnit && selectedService && (
          <>
            <ApplianceProgress currentIndex={currentIndex} total={units.length} />
            <Text style={styles.title}>Show us your item</Text>
            <Text style={styles.subtitle}>
              Record a clear live video walkthrough so we can verify it.
            </Text>
            <View style={styles.summaryCard}>
              {selectedService.image_url ? (
                <Image source={{ uri: selectedService.image_url }} style={styles.summaryImg} resizeMode="contain" />
              ) : (
                <View style={[styles.summaryImg, styles.summaryImgPlaceholder]}>
                  <Text style={styles.summaryImgPlaceholderText}>{selectedService.name[0]}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.summaryName} numberOfLines={1}>
                  {currentUnit.displayName || selectedService.name}
                </Text>
                <Text style={styles.summaryMeta} numberOfLines={2}>
                  {[selectedCategory?.name, selectedSubgroup?.name].filter(Boolean).join(' › ')}
                </Text>
                {!!currentUnit.location && (
                  <Text style={styles.summaryYear}>Location: {currentUnit.location}</Text>
                )}
              </View>
            </View>
            <Text style={styles.unitLabel}>
              {selectedService.name} {currentIndex + 1} of {units.length}
            </Text>
            <MediaCapturePanel
              value={currentUnit.media}
              allowGallery={false}
              maxVideoSeconds={MEDIA_REQUIREMENTS.maxVideoSeconds}
              emptyTitle="Record Live Video"
              emptyDescription="A quick live video walkthrough helps verify your item before service."
              onChange={(media) => {
                updateCurrentUnit({ media });
                setMediaError('');
              }}
            />
            {!!mediaError && <Text style={styles.errorText}>{mediaError}</Text>}
            <TouchableOpacity
              style={[styles.primaryBtn, !mediaReady() && styles.primaryBtnDisabled]}
              onPress={handleMediaContinue}
              disabled={!mediaReady()}
              activeOpacity={mediaReady() ? 0.9 : 1}
            >
              <Text style={[styles.primaryBtnText, !mediaReady() && styles.primaryBtnTextDisabled]}>
                {currentIndex < units.length - 1
                  ? 'Continue to next'
                  : mode === 'booking'
                  ? 'Save & continue booking'
                  : units.length > 1
                  ? 'Save items'
                  : 'Save item'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* --------- SAVE CONFIRMATION MODAL --------- */}
      <Modal visible={showSaveConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 420, maxHeight: '90%', padding: 16 }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <View style={{ alignItems: 'center', gap: 4, paddingTop: 2 }}>
                <View style={styles.confirmIconCircle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052e0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </View>
                <Text style={styles.confirmModalTitle}>Confirm Item Registration</Text>
                <Text style={styles.confirmModalSub}>
                  Please review your {units.length > 1 ? `${units.length} items` : 'item'} details before saving:
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {units.map((u, i) => (
                  <View key={i} style={styles.confirmApplianceCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.confirmApplianceBadge}>
                        <Text style={styles.confirmApplianceBadgeText}>#{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.confirmApplianceName} numberOfLines={1}>
                          {u.displayName || selectedService?.name || 'Item'}
                        </Text>
                        <Text style={styles.confirmApplianceMeta} numberOfLines={1}>
                          {[selectedCategory?.name, selectedService?.name]
                            .filter(Boolean)
                            .join(' • ')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.confirmApplianceDetailsGrid}>
                      {!!u.brand && (
                        <View style={styles.confirmDetailItem}>
                          <Text style={styles.confirmDetailLabel}>Company / Brand</Text>
                          <Text style={styles.confirmDetailValue}>
                            {u.brand === 'Other' && u.customBrand ? u.customBrand : u.brand}
                          </Text>
                        </View>
                      )}
                      {!!u.type && (
                        <View style={styles.confirmDetailItem}>
                          <Text style={styles.confirmDetailLabel}>Type</Text>
                          <Text style={styles.confirmDetailValue}>{u.type}</Text>
                        </View>
                      )}
                      {!!u.capacity && (
                        <View style={styles.confirmDetailItem}>
                          <Text style={styles.confirmDetailLabel}>Capacity</Text>
                          <Text style={styles.confirmDetailValue}>{u.capacity}</Text>
                        </View>
                      )}
                      {!!u.year && (
                        <View style={styles.confirmDetailItem}>
                          <Text style={styles.confirmDetailLabel}>Age / Year</Text>
                          <Text style={styles.confirmDetailValue}>{u.year}</Text>
                        </View>
                      )}
                      {!!u.location && (
                        <View style={styles.confirmDetailItem}>
                          <Text style={styles.confirmDetailLabel}>Location</Text>
                          <Text style={styles.confirmDetailValue}>{u.location}</Text>
                        </View>
                      )}
                      {!!u.notes && (
                        <View style={styles.confirmDetailItem}>
                          <Text style={styles.confirmDetailLabel}>Notes</Text>
                          <Text style={styles.confirmDetailValue} numberOfLines={2}>{u.notes}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.confirmVideoVerifiedRow}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Text style={styles.confirmVideoVerifiedText}>Live Video Walkthrough Attached</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.finalityWarningBox}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <Text style={styles.finalityWarningTitle}>Important Note on Finality</Text>
                </View>
                <Text style={styles.finalityWarningText}>
                  Once saved, this item is permanently registered to your Care Subscription Package and cannot be edited or deleted. If you need to make changes or retake the video, you can do so now before confirming.
                </Text>
              </View>

              <View style={{ gap: 8, paddingTop: 4 }}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 0, paddingHorizontal: 16, paddingVertical: 10.5 }]}
                  onPress={handleConfirmFinalSave}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.primaryBtnText, { fontSize: 13, textAlign: 'center' }]}>
                    {mode === 'booking'
                      ? 'Confirm & Continue'
                      : units.length > 1
                      ? 'Confirm & Save Items'
                      : 'Confirm & Save Item'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reviewEditBtn}
                  onPress={() => setShowSaveConfirmModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reviewEditBtnText}>Go Back & Edit / Retake</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --------- DISCARD MODAL --------- */}
      <Modal visible={showDiscard} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Leave setup?</Text>
            <Text style={styles.modalBody}>Your entered information will be lost.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowDiscard(false)}>
              <Text style={styles.primaryBtnText}>Continue Editing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.discardBtn}
              onPress={() => { setShowDiscard(false); onCancel?.(); }}
            >
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fast Add Confirmation Modal */}
      <FastAddConfirmationModal
        visible={showFastAddModal}
        item={fastAddItem}
        categoryName={selectedCategory?.name}
        quantity={fastAddQty}
        onIncrement={() => setFastAddQty((q) => Math.min(qtyCap, q + 1))}
        onDecrement={() => setFastAddQty((q) => Math.max(1, q - 1))}
        onConfirm={handleConfirmFastAdd}
        onCancel={() => {
          setShowFastAddModal(false);
          setFastAddItem(null);
        }}
      />

      {/* Covered Appliance Details & Video Walkthrough Modal */}
      <Modal visible={Boolean(inspectingAppliance)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.inspectModalContent}>
            <View style={styles.inspectModalHeader}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                <Text style={styles.inspectModalTitle}>
                  {inspectingAppliance?.displayName || inspectingAppliance?.name || 'Appliance Details'}
                </Text>
                <Text style={styles.inspectModalSub}>
                  Protected under {planName ? `${planName} Plan` : 'Active AMC Plan'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setInspectingAppliance(null);
                  setIsRetakingVideo(false);
                }}
                style={styles.modalCloseCircle}
              >
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Media Block: Play Video if exists, else crisp photo or zero-friction badge */}
              {(() => {
                const requiresVideo = doesApplianceRequireVideo(inspectingAppliance);
                if (!requiresVideo) {
                  return (
                    <View style={styles.inspectZeroFrictionBanner}>
                      <View style={styles.inspectZeroFrictionIconWrap}>
                        <IconShield size={22} color="#2563eb" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                        <Text style={styles.inspectZeroFrictionTitle}>
                          Direct AMC Plan Protection
                        </Text>
                        <Text style={styles.inspectZeroFrictionSub}>
                          Standard catalog service • Video walkthrough not required • ₹0 Breakdown labor
                        </Text>
                      </View>
                    </View>
                  );
                }
                if (isRetakingVideo) {
                  return (
                    <View style={{ marginBottom: 16 }}>
                      <MediaCapturePanel
                        value={null}
                        allowGallery={false}
                        maxVideoSeconds={MEDIA_REQUIREMENTS.maxVideoSeconds}
                        emptyTitle="Record Walkthrough Video"
                        emptyDescription="Record a new live video walkthrough to attach to this appliance."
                        onChange={(media) => {
                          if (media?.uri) {
                            const updated = {
                              uploadedMediaUri: media.uri,
                              video: media.uri,
                              videoUrl: media.uri,
                              video_uri: media.uri,
                              img: media.uri,
                              media: { type: 'video', url: media.uri, fileName: 'Appliance_Live_Video.webm' },
                            };
                            updateUserAppliance?.(inspectingAppliance.id, updated);
                            setInspectingAppliance((prev) => ({ ...prev, ...updated }));
                            setIsRetakingVideo(false);
                          }
                        }}
                      />
                      <TouchableOpacity
                        style={styles.cancelRetakeBtn}
                        onPress={() => setIsRetakingVideo(false)}
                      >
                        <Text style={styles.cancelRetakeBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                const videoUri = getApplianceVideoUri(inspectingAppliance);
                const img = resolveApplianceImage(inspectingAppliance);
                return (
                  <View style={{ marginBottom: 16 }}>
                    {videoUri ? (
                      <InspectVideoPlayer videoUri={videoUri} fallbackImg={img} />
                    ) : (
                      <View style={styles.inspectImgBox}>
                        <Image
                          source={{ uri: img }}
                          style={styles.inspectImg}
                          resizeMode="contain"
                        />
                        <View style={styles.inspectFallbackBadge}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <Text style={styles.inspectFallbackBadgeText}>
                            Walkthrough Video Verified • AMC Active
                          </Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.retakeVideoBtn}
                      onPress={() => setIsRetakingVideo(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <Text style={styles.retakeVideoBtnText}>
                        {videoUri ? 'Retake Walkthrough Video' : 'Record Live Walkthrough Video'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* Specification List - Full Width Horizontal Rows */}
              <View style={styles.inspectSpecGrid}>
                <View style={styles.inspectSpecTile}>
                  <Text style={styles.inspectSpecLabel}>Category / Service</Text>
                  <Text style={styles.inspectSpecVal}>
                    {inspectingAppliance?.category || inspectingAppliance?.serviceName || 'Appliance'}
                  </Text>
                </View>
                <View style={styles.inspectSpecTile}>
                  <Text style={styles.inspectSpecLabel}>Brand / Make</Text>
                  <Text style={styles.inspectSpecVal}>
                    {inspectingAppliance?.brand || inspectingAppliance?.customBrand || 'Standard'}
                  </Text>
                </View>
                <View style={styles.inspectSpecTile}>
                  <Text style={styles.inspectSpecLabel}>Home Location</Text>
                  <Text style={styles.inspectSpecVal}>
                    {inspectingAppliance?.location || 'Home'}
                  </Text>
                </View>
                <View style={styles.inspectSpecTile}>
                  <Text style={styles.inspectSpecLabel}>Operating Condition</Text>
                  <Text style={[styles.inspectSpecVal, { color: '#15803d' }]}>
                    {inspectingAppliance?.condition || 'Working'}
                  </Text>
                </View>
                {inspectingAppliance?.capacity ? (
                  <View style={styles.inspectSpecTile}>
                    <Text style={styles.inspectSpecLabel}>Capacity / Specs</Text>
                    <Text style={styles.inspectSpecVal}>{inspectingAppliance.capacity}</Text>
                  </View>
                ) : null}
                {inspectingAppliance?.year || inspectingAppliance?.age_range ? (
                  <View style={styles.inspectSpecTile}>
                    <Text style={styles.inspectSpecLabel}>Purchase Year / Age</Text>
                    <Text style={styles.inspectSpecVal}>
                      {formatAgeOrYear(inspectingAppliance.year || inspectingAppliance.age_range)}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.inspectSpecTile}>
                  <Text style={styles.inspectSpecLabel}>Breakdown Labor</Text>
                  <Text style={[styles.inspectSpecVal, { color: '#2563eb' }]}>
                    ₹0 Free Included
                  </Text>
                </View>
                <View style={styles.inspectSpecTile}>
                  <Text style={styles.inspectSpecLabel}>Coverage Tier</Text>
                  <Text style={styles.inspectSpecVal}>
                    {planName || 'Active AMC Protection'}
                  </Text>
                </View>
              </View>

              {inspectingAppliance?.notes ? (
                <View style={styles.inspectNotesBox}>
                  <Text style={styles.inspectNotesLabel}>ADDITIONAL NOTES</Text>
                  <Text style={styles.inspectNotesVal}>{inspectingAppliance.notes}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.inspectCloseBtn}
                onPress={() => setInspectingAppliance(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.inspectCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Blinkit-Style Cart Bar for Quick Add */}
      {isZeroFrictionCategory(selectedCategory?.name || selectedCategory?.id) && accumulatedFastUnits.length > 0 && (
        <BlinkitCartBar
          count={accumulatedFastUnits.length}
          items={accumulatedFastUnits}
          actionLabel="Add to Plan ›"
          onProceed={() => {
            if (isGuest) {
              setShowGuestModal(true);
              return;
            }
            onComplete?.(accumulatedFastUnits, null);
          }}
        />
      )}

      {/* Guest Lock Modal */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={wizardGuestStyles.overlay}>
          <View style={wizardGuestStyles.card}>
            <TouchableOpacity
              style={wizardGuestStyles.closeBtn}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={wizardGuestStyles.iconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={wizardGuestStyles.title}>Register First</Text>
            <Text style={wizardGuestStyles.sub}>
              Please register or sign in to your account to add appliances or services to your home coverage.
            </Text>

            <TouchableOpacity
              style={wizardGuestStyles.primaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                if (typeof window !== 'undefined') window.location.href = '/user/register';
              }}
              activeOpacity={0.85}
            >
              <Text style={wizardGuestStyles.primaryBtnText}>Register Now →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={wizardGuestStyles.secondaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                if (typeof window !== 'undefined') window.location.href = '/user/login';
              }}
              activeOpacity={0.85}
            >
              <Text style={wizardGuestStyles.secondaryBtnText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --------- Internal sub-components ------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Category step layout. Mobile/native: renders `left` then `right` stacked (original behaviour).
 * Desktop web: 2-column grid with a sticky coverage panel on the right.
 */
function CategoryStepLayout({ isDesktop, left, right }) {
  if (!isDesktop || Platform.OS !== 'web') {
    return (
      <>
        {left}
        {right}
      </>
    );
  }
  return (
    <div style={desktopSplitStyle}>
      <div style={desktopLeftColStyle}>{left}</div>
      <div style={desktopRightColStyle}>{right}</div>
    </div>
  );
}

const desktopSplitStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 420px',
  gap: '32px',
  alignItems: 'start',
  width: '100%',
};

const desktopLeftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minWidth: 0,
  backgroundColor: '#ffffff',
  border: '1.5px solid rgba(226, 232, 240, 0.9)',
  borderRadius: '22px',
  padding: '28px 28px 32px',
  boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(15, 23, 42, 0.02)',
  boxSizing: 'border-box',
};

const desktopRightColStyle = {
  position: 'sticky',
  top: '16px',
  minWidth: 0,
};

function CategoryCard({ item, onPress, style }) {
  return (
    <TouchableOpacity
      dataSet={{ zcCatCard: 'true' }}
      style={[catStyles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={catStyles.imageWrap}>
        {item.image_url || item.image ? (
          <Image
            source={{ uri: item.image_url || item.image }}
            style={catStyles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={catStyles.placeholder}>
            <Text style={catStyles.placeholderText}>{item.name[0]}</Text>
          </View>
        )}
      </View>
      <Text style={catStyles.name} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );
}

function ServiceItemCard({ item, onPress, style }) {
  const isOther = item.isOther || item.name === 'Other';
  return (
    <TouchableOpacity
      dataSet={{ zcSvcCard: 'true' }}
      style={[svcStyles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={svcStyles.imageWrap}>
        {isOther ? (
          <View style={svcStyles.otherIcon}>
            <Text style={svcStyles.otherDots}>•••</Text>
          </View>
        ) : item.image_url ? (
          <Image source={{ uri: item.image_url }} style={svcStyles.image} resizeMode="cover" />
        ) : (
          <View style={svcStyles.placeholder}>
            <Text style={svcStyles.placeholderText}>{item.name[0]}</Text>
          </View>
        )}
      </View>
      <Text style={svcStyles.name} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );
}

export function buildSavedApplianceRecords(units, selectedService, user) {
  return (units || []).map((unit, idx) => {
    const rawVideo =
      unit.media?.uri ||
      unit.media?.url ||
      unit.uploadedMediaUri ||
      unit.video ||
      unit.videoUrl ||
      unit.video_uri ||
      (typeof unit.img === 'string' && (unit.img.startsWith('data:video') || unit.img.startsWith('blob:') || unit.img.includes('.webm') || unit.img.includes('.mp4')) ? unit.img : null);
    const isRealVideo = rawVideo && typeof rawVideo === 'string' && !rawVideo.startsWith('auto-verified') && rawVideo.trim().length > 0;
    const realVideoUri = isRealVideo ? rawVideo.trim() : null;

    const svcName = selectedService?.name || unit.serviceName || unit.category || unit.displayName || 'Item';
    const brandName = unit.brand === 'Other' && unit.customBrand ? unit.customBrand : (unit.brand || '');
    const resolvedImg = resolveApplianceImage({ ...unit, category: svcName }) || selectedService?.image_url || null;

    return {
      id: unit.id || (Date.now() + idx),
      userId: user?.id,
      user_phone: user?.phone || '',
      name: unit.displayName || (unit.name ? unit.name : `${svcName} ${idx + 1}`),
      displayName: unit.displayName || (unit.name ? unit.name : `${svcName} ${idx + 1}`),
      category: svcName,
      applianceTypeId: selectedService?.applianceTypeId || selectedService?.id || unit.applianceTypeId || 'other',
      brand: brandName,
      customBrand: unit.customBrand || '',
      type: unit.type || '',
      capacity: unit.capacity || '',
      year: unit.year || '',
      age_range: unit.year || '',
      condition: unit.condition || 'Working',
      location: unit.location || '',
      notes: unit.notes || '',
      model: unit.model || '',
      img: realVideoUri || resolvedImg,
      serviceImage: resolvedImg,
      uploadedMediaUri: realVideoUri,
      video: realVideoUri,
      videoUrl: realVideoUri,
      video_uri: realVideoUri,
      media: realVideoUri
        ? { type: 'video', url: realVideoUri, uri: realVideoUri, fileName: unit.media?.fileName || 'Appliance_Live_Video.webm' }
        : null,
      mediaStatus: realVideoUri ? 'PENDING_REVIEW' : 'NOT_REQUIRED',
      isCoveredByAmc: true,
      is_covered_by_amc: true,
      createdAt: unit.createdAt || new Date().toISOString(),
      is_immutable: false,
    };
  });
}

// --------- Styles ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const catStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 0,
    alignItems: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          cursor: 'pointer',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        }
      : {}),
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.15,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 26, fontWeight: '800', color: '#64748b' },
  name: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
    paddingHorizontal: 8,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

const svcStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 0,
    alignItems: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          cursor: 'pointer',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        }
      : {}),
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.15,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 26, fontWeight: '800', color: '#64748b' },
  otherIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherDots: { fontSize: 22, color: '#64748b', fontWeight: '800', letterSpacing: 2 },
  name: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
    paddingHorizontal: 8,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 8, height: 48, gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  backChevron: { fontSize: 28, color: '#0a1633', marginTop: -2 },
  breadcrumb: {
    fontSize: 13, fontWeight: '600', color: '#64748b',
    flexShrink: 1, fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 170,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  /* ---- Desktop web only (>=1024px) ---- */
  rootDesktop: {
    backgroundColor: 'transparent',
  },
  headerRowDesktop: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingTop: 20,
    height: 64,
  },
  backPillDesktop: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(8, 120, 248, 0.08)',
  },
  backPillDesktopText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0878f8',
  },
  contentDesktop: {
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 16,
    boxSizing: 'border-box',
  },
  contentDesktopWide: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 80,
    boxSizing: 'border-box',
  },
  titleDesktop: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    margin: 0,
  },
  subtitleDesktop: {
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: -6,
    marginBottom: 4,
  },
  coveredSectionDesktop: {
    marginTop: 0,
    borderRadius: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginTop: -4,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchBarDesktop: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    marginBottom: 4,
  },
  searchInputDesktop: {
    fontSize: 14,
  },
  searchGlyph: { fontSize: 14, color: '#94a3b8' },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  clearSearch: { color: '#94a3b8', fontSize: 14, padding: 4 },
  nativeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  emptySearch: { paddingVertical: 32, alignItems: 'center', gap: 6 },
  emptySearchTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  emptySearchSub: { fontSize: 13, color: '#94a3b8' },
  qtyHero: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  qtyImage: { width: 140, height: 100 },
  qtyImagePlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  qtyImagePlaceholderText: { fontSize: 36, fontWeight: '800', color: '#2563eb' },
  qtyName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  qtyCategoryLabel: { fontSize: 12, color: '#64748b' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 24, paddingVertical: 12,
  },
  qtyBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#eff6ff', borderWidth: 1.5,
    borderColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { fontSize: 24, color: '#2563eb', fontWeight: '700' },
  qtyValue: { fontSize: 32, fontWeight: '800', color: '#0f172a', minWidth: 40, textAlign: 'center' },
  qtyHint: { textAlign: 'center', fontSize: 12, color: '#64748b' },
  detailsHero: { width: '100%', height: 120, alignSelf: 'center' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#eff6ff', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#bfdbfe',
  },
  typeBadgeTitle: { fontSize: 14, fontWeight: '800', color: '#1d4ed8' },
  typeBadgeSub: { fontSize: 12, color: '#64748b', marginLeft: 'auto' },
  summaryCard: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0', padding: 12,
  },
  summaryImg: { width: 64, height: 56 },
  summaryImgPlaceholder: {
    backgroundColor: '#eff6ff', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryImgPlaceholderText: { fontSize: 24, fontWeight: '800', color: '#2563eb' },
  summaryName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  summaryMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  summaryYear: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  unitLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  primaryBtn: {
    backgroundColor: '#0052e0',
    borderRadius: 12,
    paddingVertical: 12.5,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 82, 224, 0.2)',
  },
  primaryBtnDisabled: {
    backgroundColor: '#e2e8f0',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  primaryBtnTextDisabled: { color: '#94a3b8' },
  errorText: { color: '#dc2626', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#ffffff', borderRadius: 20, padding: 22, gap: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalBody: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  discardBtn: { alignItems: 'center', paddingVertical: 10 },
  discardText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  coverageNoteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#eff6ff', borderWidth: 1.2,
    borderColor: '#bfdbfe', borderRadius: 14,
    padding: 12, marginTop: 4, marginBottom: 4,
  },
  coverageNoteIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#dbeafe', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  coverageNoteTitle: { fontSize: 12, fontWeight: '700', color: '#1e40af', marginBottom: 2 },
  coverageNoteText: { fontSize: 11.5, color: '#334155', lineHeight: 16 },
  confirmIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eff6ff', borderWidth: 1.5,
    borderColor: '#bfdbfe', alignItems: 'center',
    justifyContent: 'center', marginBottom: 2,
  },
  confirmModalTitle: {
    fontSize: 16, fontWeight: '800', color: '#0f172a',
    textAlign: 'center', fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.2,
  },
  confirmModalSub: {
    fontSize: 11.5, color: '#64748b', textAlign: 'center',
    lineHeight: 16, fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmApplianceCard: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0', padding: 10, gap: 7,
  },
  confirmApplianceBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#0052e0', alignItems: 'center', justifyContent: 'center',
  },
  confirmApplianceBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  confirmApplianceName: {
    fontSize: 13, fontWeight: '700', color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmApplianceMeta: {
    fontSize: 11, color: '#64748b', marginTop: 1,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmApplianceDetailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 5,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  confirmDetailItem: { minWidth: '45%', flex: 1, gap: 1 },
  confirmDetailLabel: {
    fontSize: 9.5, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3,
  },
  confirmDetailValue: { fontSize: 11.5, color: '#0f172a', fontWeight: '600', lineHeight: 15 },
  confirmVideoVerifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 4.5,
    borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 2,
  },
  confirmVideoVerifiedText: {
    fontSize: 10.5, color: '#15803d', fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  finalityWarningBox: {
    backgroundColor: '#fffbeb', borderWidth: 1.2,
    borderColor: '#fde68a', borderRadius: 10, padding: 10, gap: 4,
  },
  finalityWarningTitle: {
    fontSize: 11.5, fontWeight: '700', color: '#92400e',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  finalityWarningText: {
    fontSize: 10.5, color: '#78350f', lineHeight: 14.5,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  reviewEditBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9.5, paddingHorizontal: 16,
    borderRadius: 10, backgroundColor: '#f1f5f9',
  },
  reviewEditBtnText: {
    color: '#475569', fontSize: 12, fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', sans-serif", textAlign: 'center',
  },
  /* Covered / Plan Appliances Section Styles */
  coveredSection: {
    marginTop: 28,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
  },
  coveredSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
    gap: 10,
    flexWrap: 'wrap',
  },
  coveredHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    minWidth: 180,
  },
  coveredShieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexShrink: 0,
  },
  coveredSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    lineHeight: 22,
  },
  coveredSectionSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    lineHeight: 16,
  },
  coveredCountPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignSelf: 'flex-start',
  },
  coveredCountPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  coveredList: {
    gap: 12,
  },
  coveredCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 14,
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    gap: 10,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  activePlanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 5,
    flexShrink: 0,
    alignSelf: 'center',
  },
  activePlanChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.3,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coveredMediaTile: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
    padding: 0,
  },
  coveredApplianceImg: {
    width: '100%',
    height: '100%',
    padding: 4,
  },
  videoRibbonBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2.5,
  },
  videoRibbonText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: 0.5,
  },
  cardSpecsCol: {
    flex: 1,
    minWidth: 0,
  },
  specChipsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
    maxWidth: '100%',
  },
  conditionChip: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  specChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    flexShrink: 1,
  },
  videoWatchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  videoWatchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  videoWatchStripText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  videoWatchActionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoWatchActionText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  instantStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  instantStripText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  /* Category Package Hero Banner */
  categoryBundleHero: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
    gap: 10,
  },
  bundleHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  bundleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bundleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0052e0',
    letterSpacing: 0.2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bundleSavingsPill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  bundleSavingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bundleBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bundleHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bundleHeroDesc: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bundleFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  bundleFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bundleFeatureText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bundleAddBtn: {
    backgroundColor: '#0052e0',
    borderRadius: 12,
    paddingVertical: 11.5,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 3px 10px rgba(0, 82, 224, 0.2)',
    cursor: 'pointer',
  },
  bundleAddBtnDone: {
    backgroundColor: '#16a34a',
    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.2)',
  },
  bundleAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  emptyCoveredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyCoveredIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCoveredTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  emptyCoveredText: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    lineHeight: 16,
  },
  /* Inspection Modal Styles */
  inspectModalContent: {
    width: '92%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
  },
  inspectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  inspectModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectModalSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectVideoBox: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  inspectVideoMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  inspectLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  inspectVideoMetaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectZeroFrictionBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  inspectZeroFrictionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)',
    flexShrink: 0,
  },
  inspectZeroFrictionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectZeroFrictionSub: {
    fontSize: 11.5,
    color: '#3b82f6',
    lineHeight: 16,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectImgBox: {
    height: 140,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
  },
  inspectImg: {
    width: '100%',
    height: 100,
  },
  inspectImgNote: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 6,
  },
  inspectFallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
  },
  inspectFallbackBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectSpecGrid: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  inspectSpecTile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  inspectSpecLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inspectSpecVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    flexShrink: 1,
  },
  inspectNotesBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  inspectNotesLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#b45309',
  },
  inspectNotesVal: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 16,
  },
  inspectCloseBtn: {
    backgroundColor: '#0052e0',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  inspectCloseBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  retakeVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  retakeVideoBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  cancelRetakeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  cancelRetakeBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

const wizardGuestStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  sub: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  secondaryBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
});
