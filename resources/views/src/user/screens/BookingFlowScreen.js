import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  categoryHasGroups,
  countServicesInCategory,
  getInitialStepForCategory,
  getServiceTypes,
  getSubGroups,
  isPestControlCategory,
} from '../../config/serviceCatalogUtils';
import { resolveCategoryImageUri, resolveServiceItemImageUri } from '../../utils/imageUtils';
import MediaCapturePanel from '../../components/MediaCapturePanel';
import ApplianceAddWizard, {
  buildSavedApplianceRecords,
} from '../../components/appliances/ApplianceAddWizard';
import AppliancePaymentPromptModal from '../../components/appliances/AppliancePaymentPromptModal';
import { AppIcon } from '../../components/AppIcons';
import BookingApplianceSelectStep from '../../components/booking/BookingApplianceSelectStep';
import BookingIssueStep from '../../components/booking/BookingIssueStep';
import BookingIssueOtherStep from '../../components/booking/BookingIssueOtherStep';
import BookingScheduleStep from '../../components/booking/BookingScheduleStep';
import BookingLocationStep from '../../components/booking/BookingLocationStep';
import BookingConfirmation from '../../components/booking/BookingConfirmation';
import BookingProgress from '../../components/booking/BookingProgress';
import LiveSupportOptionCard from '../../components/booking/LiveSupportOptionCard';
import {
  getApplianceTypeIdForService,
  isApplianceLinkedService,
  getApplianceDisplayName,
  filterAppliancesByType,
} from '../../config/serviceApplianceMapping';
import { getIssuesForApplianceType, getIssuesForService } from '../../config/applianceIssues';
import { APPLIANCE_REGISTRATION_FEE } from '../../config/applianceConstants';
import { emptyIssueMedia, issueMediaToLegacyUrl, countIssueMedia, applyPanelValueToIssueMedia } from '../../utils/bookingMedia';

/**
 * Steps:
 * 1 | SUB_GROUP | SERVICE_TYPE | OTHER_DETAIL (catalog)
 * APPLIANCE_SELECT | APPLIANCE_ADD | ISSUE | ISSUE_OTHER | DETAILS_SUMMARY
 * SCHEDULE | LOCATION | REVIEW | CONFIRMED
 * Legacy non-appliance: after SERVICE_TYPE → SCHEDULE (then LOCATION → REVIEW) with optional ISSUE via description
 */
export default function BookingFlowScreen({ onNavigate }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

  const {
    createBooking,
    activeUser,
    updateProfile,
    categories,
    subCategories,
    services,
    validateServiceLocation,
    getAppliancesForUser,
    addUserAppliance,
    updateUserAppliance,
    userAppliances: allUserAppliances,
  } = useApp();
  const navigate = useNavigate();
  const locationState = useLocation();
  const preSelectedCategory = locationState?.state?.preSelectedCategory;
  const preSelectedSubCategory = locationState?.state?.preSelectedSubCategory;
  const preSelectedService = locationState?.state?.preSelectedService;
  const bookingMode = locationState?.state?.bookingMode;
  const isConsultation = bookingMode === 'consultation';
  const isComplaint = bookingMode === 'complaint';

  const [step, setStep] = useState(1);
  const [skippedCategoryStep, setSkippedCategoryStep] = useState(false);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [service, setService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customIssueText, setCustomIssueText] = useState('');
  const [catalogOtherMedia, setCatalogOtherMedia] = useState(null);
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Appliance booking draft
  const [applianceTypeId, setApplianceTypeId] = useState(null);
  const [selectedAppliance, setSelectedAppliance] = useState(null);
  const [isNewAppliance, setIsNewAppliance] = useState(false);
  const [applianceRegistrationFee, setApplianceRegistrationFee] = useState(0);
  const [issueId, setIssueId] = useState(null);
  const [issueLabel, setIssueLabel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueMedia, setIssueMedia] = useState(emptyIssueMedia());
  const [otherError, setOtherError] = useState('');

  // Appliance upfront fee payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPromptTarget, setPaymentPromptTarget] = useState(null);

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledDateLabel, setScheduledDateLabel] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const defaultSavedAddress = (activeUser?.saved_addresses || []).find((a) => a.isDefault) || (activeUser?.saved_addresses || [])[0];
  const [address, setAddress] = useState(() => {
    if (defaultSavedAddress?.address) return defaultSavedAddress.address;
    if (activeUser?.address) return activeUser.address;
    try {
      const saved = sessionStorage.getItem('zevota_prelogin_location');
      if (saved && saved.trim() && !/[\u0900-\u097F]/.test(saved)) return saved.trim();
    } catch (e) {}
    return '';
  });
  const [selectedAddressId, setSelectedAddressId] = useState(defaultSavedAddress?.id || null);
  const [latitude, setLatitude] = useState(defaultSavedAddress?.latitude || null);
  const [longitude, setLongitude] = useState(defaultSavedAddress?.longitude || null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [formError, setFormError] = useState('');

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

  const planName = activeUser?.subscription_plan || 'None';
  const hasActiveAmc = !isGuest && activeUser?.subscription_status === 'ACTIVE' && planName !== 'None' && planName !== 'None / Inactive';

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalContext, setGuestModalContext] = useState({
    title: '',
    message: '',
  });

  const promptGuestRegistration = (customMsg, customTitle) => {
    setGuestModalContext({
      title: customTitle || (isAnonymous ? 'Register First' : (!hasActiveAmc && !isGuest ? 'AMC Plan Required' : 'Complete Your Profile First')),
      message:
        customMsg ||
        (isAnonymous
          ? `Please register your account first to add ${displayName || 'appliances'} and continue with your service booking.`
          : (!hasActiveAmc && !isGuest
            ? 'An active AMC Plan is required to cover appliances and raise ₹0 labor breakdown complaints. Please subscribe to an AMC plan.'
            : `Please complete your profile to add ${displayName || 'appliances'} and continue with your service booking.`)),
    });
    setShowGuestModal(true);
  };

  useEffect(() => {
    if (isConsultation && isAnonymous) {
      promptGuestRegistration(
        'Please register or log in to book a free My Mechanic consultation.'
      );
      if (preSelectedCategory) setCategory(preSelectedCategory);
      if (preSelectedService) setService(preSelectedService);
      return;
    }

    if (preSelectedService) {
      const catName = preSelectedCategory || '';
      const subCatName = preSelectedSubCategory || '';
      if (catName) setCategory(catName);
      if (subCatName) setSubCategory(subCatName);
      setService(preSelectedService);
      setSkippedCategoryStep(true);

      if (isConsultation) {
        // "My Mechanic" ₹0 free on-site diagnosis & inspection - allowed for logged in users
        const typeId = isApplianceLinkedService(preSelectedService)
          ? getApplianceTypeIdForService(preSelectedService)
          : null;
        setApplianceTypeId(typeId);
        setSelectedAppliance({
          id: `consultation-${Date.now()}`,
          name: preSelectedService,
          applianceTypeId: typeId,
          type: preSelectedService,
          isConsultation: true,
          isCoveredByAmc: true,
        });
        setApplianceRegistrationFee(0);
        clearIssueState();
        setStep('ISSUE');
      } else if (isApplianceLinkedService(preSelectedService)) {
        if (isComplaint && !hasActiveAmc) {
          promptGuestRegistration('An active AMC plan is required to raise complaints on appliances. Please explore AMC plans to cover your home.');
          return;
        }
        const typeId = getApplianceTypeIdForService(preSelectedService);
        resetApplianceDraftForType(typeId);
        setStep('APPLIANCE_SELECT');
      } else {
        resetApplianceDraftForType(null);
        setCustomIssueText('');
        setCatalogOtherMedia(null);
        setIssueLabel(`Require assistance for ${preSelectedService}`);
        if (isComplaint && !hasActiveAmc) {
          promptGuestRegistration(`An active AMC plan is required to raise complaints. Please subscribe to an AMC plan.`);
        } else {
          setStep('OTHER_DETAIL');
        }
      }
    } else if (preSelectedCategory) {
      setCategory(preSelectedCategory);
      if (preSelectedSubCategory) {
        setSubCategory(preSelectedSubCategory);
        setStep('SERVICE_TYPE');
      } else {
        setStep(getInitialStepForCategory(preSelectedCategory));
      }
      setSkippedCategoryStep(true);
    } else if (isComplaint) {
      if (navigate) navigate('/user/complains', { replace: true });
      else if (onNavigate) onNavigate('/user/complains');
    }
  }, [preSelectedCategory, preSelectedSubCategory, preSelectedService, isGuest, isComplaint]);

  const userAppliances = useMemo(
    () => (getAppliancesForUser ? getAppliancesForUser(activeUser) : []),
    [getAppliancesForUser, activeUser, allUserAppliances]
  );

  const matchedAppliances = useMemo(
    () => filterAppliancesByType(userAppliances, applianceTypeId),
    [userAppliances, applianceTypeId]
  );

  const displayName = getApplianceDisplayName(applianceTypeId);
  const effectiveDisplayName =
    (isApplianceLinkedService(service) && selectedAppliance?.name) ||
    (applianceTypeId ? getApplianceDisplayName(applianceTypeId) : service) ||
    'service';
  const issues = useMemo(
    () => getIssuesForService(service, applianceTypeId, category),
    [service, applianceTypeId, category]
  );

  const serviceTypes = useMemo(() => {
    const groupName = categoryHasGroups(category, subCategories) ? subCategory : null;
    return getServiceTypes(category, groupName, services);
  }, [category, subCategory, subCategories, services]);

  const filteredServiceTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return serviceTypes;
    return serviceTypes.filter((item) =>
      `${item.name} ${item.description || ''}`.toLowerCase().includes(q)
    );
  }, [serviceTypes, searchQuery]);

  const subGroups = useMemo(() => getSubGroups(category, subCategories), [category, subCategories]);
  const savedAddresses = activeUser?.saved_addresses || [];

  // Automatically select default saved address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultSaved = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (defaultSaved) {
        setSelectedAddressId(defaultSaved.id);
        setAddress(defaultSaved.address);
        if (defaultSaved.latitude) setLatitude(defaultSaved.latitude);
        if (defaultSaved.longitude) setLongitude(defaultSaved.longitude);
      }
    }
  }, [savedAddresses, selectedAddressId]);

  const locationValidation = validateServiceLocation
    ? validateServiceLocation(address)
    : { isSupported: true, message: 'OK' };

  const goHome = () => {
    if (navigate) navigate('/user/home');
    else if (onNavigate) onNavigate('/user/home');
  };

  const goBack = () => {
    if (isComplaint) {
      if (navigate) navigate('/user/complains', { replace: true });
      else if (onNavigate) onNavigate('/user/complains');
      return;
    }
    if (isConsultation) {
      if (navigate) navigate('/user/consultation', { replace: true });
      else if (onNavigate) onNavigate('/user/consultation');
      return;
    }
    if (window?.history?.state && window.history.state.idx > 0) {
      if (navigate) navigate(-1);
      else if (onNavigate) onNavigate(-1);
    } else {
      goHome();
    }
  };

  const goLiveSupport = () => {
    if (navigate) navigate('/user/support');
    else if (onNavigate) onNavigate('/user/support');
  };

  const clearIssueState = () => {
    setIssueId(null);
    setIssueLabel('');
    setIssueDescription('');
    setIssueMedia(emptyIssueMedia());
    setOtherError('');
  };

  const selectExistingAppliance = (appliance) => {
    const changed = String(selectedAppliance?.id) !== String(appliance?.id);
    setSelectedAppliance({
      ...appliance,
      isCoveredByAmc: true,
    });
    setIsNewAppliance(false);
    setApplianceRegistrationFee(0);
    if (changed) clearIssueState();
  };

  const confirmExistingAppliance = () => {
    if (!selectedAppliance) return;
    // An appliance already registered in the user's account is covered at ₹0 fee!
    clearIssueState();
    setStep('ISSUE');
  };

  const resetApplianceDraftForType = (typeId) => {
    setApplianceTypeId(typeId);
    setSelectedAppliance(null);
    setIsNewAppliance(false);
    setApplianceRegistrationFee(0);
    clearIssueState();
  };

  const afterServicePicked = (serviceName) => {
    setService(serviceName);
    if (isConsultation) {
      const typeId = isApplianceLinkedService(serviceName)
        ? getApplianceTypeIdForService(serviceName)
        : null;
      setApplianceTypeId(typeId);
      setSelectedAppliance({
        id: `consultation-${Date.now()}`,
        name: serviceName,
        applianceTypeId: typeId,
        type: serviceName,
        isConsultation: true,
        isCoveredByAmc: true,
      });
      setApplianceRegistrationFee(0);
      clearIssueState();
      setStep('ISSUE');
      return;
    }
    if (isApplianceLinkedService(serviceName)) {
      const typeId = getApplianceTypeIdForService(serviceName);
      resetApplianceDraftForType(typeId);
      setStep('APPLIANCE_SELECT');
      return;
    }
    if (isGuest) {
      promptGuestRegistration(`You haven't registered yet. Please register your account to book ${serviceName} service.`);
      return;
    }
    resetApplianceDraftForType(null);
    clearIssueState();
    setStep('ISSUE');
  };

  const selectCategoryAndNext = (catName) => {
    if (isConsultation ? isAnonymous : isGuest) {
      promptGuestRegistration(`You haven't registered yet. Please register your account to book ${catName || 'home services'}.`);
      return;
    }
    setCategory(catName);
    setSubCategory('');
    setService('');
    setSkippedCategoryStep(false);
    setStep(getInitialStepForCategory(catName));
  };

  const selectSubGroupAndNext = (groupName) => {
    if (isConsultation ? isAnonymous : isGuest) {
      promptGuestRegistration(`You haven't registered yet. Please register your account to book ${groupName || 'home services'}.`);
      return;
    }
    setSubCategory(groupName);
    setService('');
    setSearchQuery('');
    setShowOtherInput(false);
    setStep('SERVICE_TYPE');
  };

  const selectServiceTypeAndNext = (item) => {
    if (isConsultation ? isAnonymous : isGuest) {
      promptGuestRegistration(`You haven't registered yet. Please register your account to book ${item?.name || category || 'services'}.`);
      return;
    }

    if (item.isOther || item.name === 'Other') {
      setShowOtherInput((prev) => !prev);
      setOtherError('');
      return;
    }

    setShowOtherInput(false);
    if (!categoryHasGroups(category)) setSubCategory(item.name);
    afterServicePicked(item.name);
  };

  const handleBack = () => {
    setFormError('');
    if (step === 'CONFIRMED') {
      goHome();
      return;
    }
    if (step === 'OTHER_DETAIL') {
      setStep('SERVICE_TYPE');
      return;
    }
    if (step === 'APPLIANCE_ADD') {
      setStep('APPLIANCE_SELECT');
      return;
    }
    if (step === 'APPLIANCE_SELECT') {
      if (skippedCategoryStep || isComplaint || isConsultation) {
        goBack();
      } else if (category && categoryHasGroups(category)) {
        setStep('SUB_GROUP');
      } else if (category) {
        setStep('SERVICE_TYPE');
      } else {
        goBack();
      }
      return;
    }
    if (step === 'ISSUE') {
      if (isConsultation) {
        if (skippedCategoryStep) {
          goBack();
        } else if (category && categoryHasGroups(category)) {
          setStep('SERVICE_TYPE');
        } else if (category) {
          setStep('SERVICE_TYPE');
        } else {
          goBack();
        }
        return;
      }
      if (isApplianceLinkedService(service)) {
        setStep('APPLIANCE_SELECT');
      } else if (category && categoryHasGroups(category)) {
        setStep('SERVICE_TYPE');
      } else if (category) {
        setStep('SERVICE_TYPE');
      } else if (isComplaint) {
        goBack();
      } else {
        setStep(1);
      }
      return;
    }
    if (step === 'ISSUE_OTHER') {
      setStep('ISSUE');
      return;
    }
    if (step === 'DETAILS_SUMMARY') {
      if (issueId === 'other') setStep('ISSUE_OTHER');
      else setStep('ISSUE');
      return;
    }
    if (step === 'SCHEDULE') {
      if (isConsultation) {
        setStep('ISSUE');
        return;
      }
      setStep('DETAILS_SUMMARY');
      return;
    }
    if (step === 'LOCATION') {
      setStep('SCHEDULE');
      return;
    }
    if (step === 'REVIEW') {
      setStep('LOCATION');
      return;
    }
    if (step === 'SERVICE_TYPE') {
      if (categoryHasGroups(category)) setStep('SUB_GROUP');
      else if (skippedCategoryStep || isComplaint || isConsultation) goBack();
      else setStep(1);
      return;
    }
    if (step === 'SUB_GROUP') {
      if (skippedCategoryStep || isComplaint || isConsultation) goBack();
      else setStep(1);
      return;
    }
    goBack();
  };

  const handleWizardComplete = (units, applianceType) => {
    const records = buildSavedApplianceRecords(units, applianceType, activeUser);
    const first = records[0];
    if (!isConsultation) {
      setPaymentPromptTarget({
        type: 'NEW_APPLIANCE',
        records,
        appliance: first,
        name: first?.name || applianceType?.name || displayName || 'New Appliance',
      });
      setShowPaymentModal(true);
      return;
    }
    records.forEach((r) => addUserAppliance(r));
    setSelectedAppliance(first);
    setIsNewAppliance(true);
    setApplianceRegistrationFee(0);
    clearIssueState();
    setStep('ISSUE');
  };

  const handleAppliancePaymentSuccess = (paymentResult) => {
    setShowPaymentModal(false);
    const payId = paymentResult?.paymentId || `pay_${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (paymentPromptTarget?.type === 'NEW_APPLIANCE') {
      const records = (paymentPromptTarget.records || []).map((rec) => ({
        ...rec,
        isCoveredByAmc: true,
        fee_paid: 500,
        paymentId: payId,
        paymentDate: nowIso,
      }));
      records.forEach((r) => addUserAppliance(r));
      const first = records[0] || paymentPromptTarget.appliance;
      setSelectedAppliance(first);
      setIsNewAppliance(true);
      setApplianceRegistrationFee(0);
      clearIssueState();
      setStep('ISSUE');
    } else if (paymentPromptTarget?.type === 'EXISTING_APPLIANCE') {
      const app = paymentPromptTarget.appliance;
      if (app?.id) {
        updateUserAppliance(app.id, {
          isCoveredByAmc: true,
          fee_paid: 500,
          paymentId: payId,
          paymentDate: nowIso,
        });
        setSelectedAppliance({
          ...app,
          isCoveredByAmc: true,
          fee_paid: 500,
          paymentId: payId,
          paymentDate: nowIso,
        });
      }
      setIsNewAppliance(false);
      setApplianceRegistrationFee(0);
      clearIssueState();
      setStep('ISSUE');
    }
    setPaymentPromptTarget(null);
  };

  const handleIssueSelect = (item) => {
    if (item.isOther || item.id === 'other') {
      setIssueId('other');
      setIssueLabel('Other');
      setStep('ISSUE_OTHER');
      return;
    }
    setIssueId(item.id);
    setIssueLabel(item.label);
  };

  const handleOtherContinue = () => {
    const desc = (issueDescription || '').trim();
    if (desc.length < 8) {
      setOtherError('Please describe the problem reason in more detail (at least 8 characters).');
      return;
    }
    const hasVideo = (issueMedia?.videos || []).length > 0;
    if (!hasVideo) {
      setOtherError('A live video recording of the issue is compulsory to proceed.');
      return;
    }
    setOtherError('');
    setStep(isConsultation ? 'SCHEDULE' : 'DETAILS_SUMMARY');
  };

  const handleFetchGps = () => {
    setGpsError('');
    if (typeof window !== 'undefined' && !navigator?.geolocation) {
      setGpsError('Geolocation is not supported.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setAddress((prev) => {
          if (prev && prev.trim()) return prev;
          return `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        });
        setSelectedAddressId(null);
      },
      () => {
        setLocatingGps(false);
        setGpsError('Unable to detect GPS. Enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleConfirm = async () => {
    if (isConsultation ? isAnonymous : isGuest) {
      promptGuestRegistration(
        isConsultation
          ? 'Please sign in or register to book a free consultation.'
          : 'Please register your account to confirm and place your service booking.'
      );
      return;
    }
    if (submitting) return;
    if (applianceTypeId && !selectedAppliance && !isConsultation) {
      setFormError('Please select an appliance.');
      return;
    }
    if (applianceTypeId && !issueId && !isConsultation) {
      setFormError('Please select an issue.');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      setFormError('Please select date and time.');
      return;
    }
    if (!address?.trim()) {
      setFormError('Please enter a service address.');
      return;
    }
    if (!locationValidation?.isSupported) {
      setFormError(locationValidation?.message || 'Location not supported.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const applianceDetails = selectedAppliance
        ? {
            brand: selectedAppliance.brand || '',
            capacity: selectedAppliance.capacity || '',
            type: selectedAppliance.type || '',
            location: selectedAppliance.location || '',
            model: selectedAppliance.model || '',
            condition: selectedAppliance.condition || '',
          }
        : null;

      const newBk = await createBooking({
        category,
        subCategory: subCategory || service,
        service: service || category,
        address,
        latitude,
        longitude,
        scheduledDate,
        scheduledDateLabel,
        scheduledTime,
        schedule: [scheduledDateLabel || scheduledDate, scheduledTime].filter(Boolean).join(', '),
        description: issueLabel || (isConsultation ? `Consultation for ${service}` : `Require assistance for ${service}`),
        issue: issueLabel,
        issueId,
        issueDescription,
        issueMedia,
        mediaUrl: issueMediaToLegacyUrl(issueMedia) || catalogOtherMedia?.uri || '',
        applianceId: selectedAppliance?.id ?? null,
        applianceTypeId,
        applianceName:
          selectedAppliance?.name ||
          selectedAppliance?.displayName ||
          [selectedAppliance?.brand, displayName].filter(Boolean).join(' ') ||
          '',
        applianceDetails,
        isNewAppliance,
        applianceCount: 1,
        applianceRegistrationFee,
        isCoveredByAmc: Boolean(selectedAppliance?.isCoveredByAmc),
        bookingMode: isConsultation ? 'consultation' : bookingMode || 'service',
        isConsultation,
      });
      setConfirmedBooking(newBk);
      setStep('CONFIRMED');
    } catch (e) {
      setFormError('Could not create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const applianceSummaryLine = selectedAppliance
    ? [selectedAppliance.brand, selectedAppliance.capacity, selectedAppliance.location]
        .filter(Boolean)
        .join(' · ')
    : '';

  const mediaCounts = countIssueMedia(issueMedia);

  const renderGuestModal = () => (
    <Modal
      visible={showGuestModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowGuestModal(false)}
    >
      <View style={styles.guestModalBackdrop}>
        <View style={styles.guestModalCard}>
          <TouchableOpacity
            style={styles.guestModalCloseIcon}
            onPress={() => setShowGuestModal(false)}
            accessibilityLabel="Close modal"
          >
            <Text style={styles.guestModalCloseIconText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.guestModalIconBadge}>
            <AppIcon name="lock" size={28} color="#2563eb" strokeWidth={2.2} />
          </View>

          <Text style={styles.guestModalTitle}>
            {guestModalContext.title || (isAnonymous ? 'Register First' : 'Complete Your Profile First')}
          </Text>

          <Text style={styles.guestModalBody}>
            {guestModalContext.message ||
              (isAnonymous
                ? `Please register your account first to add ${displayName || 'appliances'} and continue booking.`
                : `Please complete your profile to add ${displayName || 'appliances'} and continue with your service booking.`)}
          </Text>

          <View style={styles.guestModalBtnCol}>
            {!isGuest && !hasActiveAmc ? (
              <TouchableOpacity
                style={styles.guestModalRegisterBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setShowGuestModal(false);
                  if (navigate) navigate('/user/plans');
                  else if (onNavigate) onNavigate('/user/plans');
                }}
              >
                <Text style={styles.guestModalRegisterBtnText}>
                  Explore AMC Plans →
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.guestModalRegisterBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setShowGuestModal(false);
                  if (navigate) navigate('/user/register');
                  else if (onNavigate) onNavigate('/user/register');
                }}
              >
                <Text style={styles.guestModalRegisterBtnText}>
                  {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
                </Text>
              </TouchableOpacity>
            )}

            {isGuest && (
              <TouchableOpacity
                style={styles.guestModalLoginBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setShowGuestModal(false);
                  if (navigate) navigate('/user/login');
                  else if (onNavigate) onNavigate('/user/login');
                }}
              >
                <Text style={styles.guestModalLoginBtnText}>Already have an account? Log In</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.guestModalSkipBtn}
              activeOpacity={0.8}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={styles.guestModalSkipBtnText}>{isGuest ? 'Stay in Guest Mode' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStepContent = () => {
    // ── CONFIRMED ──
    if (step === 'CONFIRMED') {
      return (
        <View style={styles.container}>
          <BookingConfirmation
            booking={confirmedBooking}
            onViewBooking={() => {
              const id = confirmedBooking?.booking_id;
              if (navigate) navigate(`/user/bookings/${id}`);
              else if (onNavigate) onNavigate(`/user/bookings/${id}`);
            }}
            onGoHome={goHome}
          />
        </View>
      );
    }

    // ── APPLIANCE ADD ──
    if (step === 'APPLIANCE_ADD') {
      return (
        <View style={styles.container}>
          <ApplianceAddWizard
            mode="booking"
            lockedApplianceTypeId={applianceTypeId}
            preselectedService={service || displayName}
            initialService={service || displayName}
            initialCategory={category}
            maxQuantity={1}
            onCancel={() => setStep('APPLIANCE_SELECT')}
            onComplete={handleWizardComplete}
          />
        </View>
      );
    }

    // ── APPLIANCE SELECT ──
    if (step === 'APPLIANCE_SELECT') {
      return (
        <View style={styles.container}>
          <BookingApplianceSelectStep
            displayName={displayName}
            appliances={matchedAppliances}
            selectedId={selectedAppliance?.id}
            onSelect={selectExistingAppliance}
            onContinue={() => {
              if (isGuest) {
                promptGuestRegistration();
                return;
              }
              if (!isConsultation && !hasActiveAmc) {
                promptGuestRegistration('An active AMC plan is required to raise complaints on appliances. Please subscribe to an AMC plan to protect your home.');
                return;
              }
              confirmExistingAppliance();
            }}
            onAddNew={() => {
              if (isGuest) {
                promptGuestRegistration();
                return;
              }
              if (!isConsultation && !hasActiveAmc) {
                promptGuestRegistration('An active AMC plan is required to add and cover appliances for complaints. Please subscribe to an AMC plan.');
                return;
              }
              setStep('APPLIANCE_ADD');
            }}
            onBack={handleBack}
            onLiveSupport={goLiveSupport}
          />
        </View>
      );
    }

    // ── ISSUE ──
    if (step === 'ISSUE') {
      return (
        <View style={styles.container}>
          <BookingIssueStep
            displayName={effectiveDisplayName}
            issues={issues}
            selectedIssueId={issueId}
            onSelect={handleIssueSelect}
            onBack={handleBack}
            onContinue={() => setStep(isConsultation ? 'SCHEDULE' : 'DETAILS_SUMMARY')}
            issueMedia={issueMedia}
            onChangeIssueMedia={setIssueMedia}
            issueDescription={issueDescription}
            onChangeIssueDescription={setIssueDescription}
            isComplaint={isComplaint}
            isConsultation={isConsultation}
            onLiveSupport={goLiveSupport}
          />
        </View>
      );
    }

    // ── ISSUE OTHER ──
    if (step === 'ISSUE_OTHER') {
      return (
        <View style={styles.container}>
          <BookingIssueOtherStep
            description={issueDescription}
            onChangeDescription={setIssueDescription}
            issueMedia={issueMedia}
            onChangeIssueMedia={setIssueMedia}
            onBack={handleBack}
            onContinue={handleOtherContinue}
            error={otherError}
          />
        </View>
      );
    }

    // ── DETAILS SUMMARY ──
    if (step === 'DETAILS_SUMMARY') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.pad, isDesktopWeb && styles.padDesktop]}>
          <View style={styles.rowHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <BookingProgress activeIndex={1} />
            </View>
          </View>
          <Text style={styles.h1}>
            {isComplaint
              ? `${service} Complaint & Repair`
              : isConsultation
                ? `${service} Consultation`
                : `${service} Service`}
          </Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {isApplianceLinkedService(service) ? 'Appliance' : 'Service'}
            </Text>
            <Text style={styles.summaryValue}>
              {selectedAppliance?.name || service || effectiveDisplayName}
            </Text>
            {!!applianceSummaryLine && <Text style={styles.summaryMeta}>{applianceSummaryLine}</Text>}
            <Text style={[styles.summaryLabel, { marginTop: 12 }]}>Issue</Text>
            <Text style={styles.summaryValue}>{issueLabel || '—'}</Text>
            {!!issueDescription && (
              <>
                <Text style={[styles.summaryLabel, { marginTop: 12 }]}>Description</Text>
                <Text style={styles.summaryMeta}>{issueDescription}</Text>
              </>
            )}
            {mediaCounts.videoCount > 0 && (
              <>
                <Text style={[styles.summaryLabel, { marginTop: 12 }]}>Attached Media</Text>
                <Text style={styles.summaryMeta}>
                  {mediaCounts.videoCount} live video(s)
                </Text>
              </>
            )}
          </View>
          {!!selectedAppliance && (
            selectedAppliance.isCoveredByAmc !== false ? (
              <View style={styles.coveredAmcBanner}>
                <Text style={styles.coveredAmcTitle}>✓ Covered Under AMC Plan</Text>
                <Text style={styles.coveredAmcSub}>This appliance is protected under your AMC. ₹0 Breakdown inspection & labor included.</Text>
              </View>
            ) : isConsultation ? (
              <View style={styles.consultationAmcBanner}>
                <Text style={styles.consultationAmcTitle}>✓ Free Doorstep Diagnosis (@ ₹0)</Text>
                <Text style={styles.consultationAmcSub}>Complimentary inspection visit is active for this appliance. No plan fees apply.</Text>
              </View>
            ) : null
          )}
          <View style={styles.billNote}>
            <Text style={styles.billNoteText}>
              {isConsultation
                ? 'Zero visitation charge. Certified technician will inspect on-site and share an itemized repair quote. You can approve or decline at ₹0.'
                : 'No payment now. A technician will inspect first, and the bill will be shared with you after that.'}
            </Text>
          </View>
          <View style={{ marginVertical: 12 }}>
            <LiveSupportOptionCard onPress={goLiveSupport} />
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('SCHEDULE')}>
            <Text style={styles.primaryBtnText}>Choose Date & Time</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── SCHEDULE ──
    if (step === 'SCHEDULE') {
      return (
        <View style={styles.container}>
          <BookingScheduleStep
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            onChangeDate={(key, label) => {
              setScheduledDate(key);
              setScheduledDateLabel(label);
            }}
            onChangeTime={setScheduledTime}
            onBack={handleBack}
            onContinue={() => setStep('LOCATION')}
            serviceLabel={isConsultation ? `${service || category} Free Consultation` : `${service || category} Service`}
            applianceSummary={applianceSummaryLine}
            isConsultation={isConsultation}
            onLiveSupport={goLiveSupport}
          />
        </View>
      );
    }

    // ── LOCATION ──
    if (step === 'LOCATION') {
      return (
        <View style={styles.container}>
          <BookingLocationStep
            addresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            address={address}
            onSelectSaved={(a) => {
              setSelectedAddressId(a.id);
              setAddress(a.address);
              if (a.latitude) setLatitude(a.latitude);
              if (a.longitude) setLongitude(a.longitude);
            }}
            onChangeAddress={(newAddr, coords = {}) => {
              setSelectedAddressId(null);
              setAddress(newAddr);
              if (coords.latitude != null) setLatitude(coords.latitude);
              if (coords.longitude != null) setLongitude(coords.longitude);
            }}
            onSaveAddress={(savedAddr, coords = {}) => {
              if (updateProfile && activeUser) {
                updateProfile({
                  ...activeUser,
                  address: savedAddr,
                  ...(coords.latitude != null ? { latitude: coords.latitude } : {}),
                  ...(coords.longitude != null ? { longitude: coords.longitude } : {}),
                });
              }
            }}
            locationValidation={locationValidation}
            isConsultation={isConsultation}
            isGuest={isGuest}
            onBack={handleBack}
            onContinue={() => setStep('REVIEW')}
            onLiveSupport={goLiveSupport}
            onManageSavedAddresses={() => {
              if (navigate) navigate('/user/saved-addresses');
              else if (onNavigate) onNavigate('/user/saved-addresses');
            }}
          />
        </View>
      );
    }

    // ── REVIEW ──
    if (step === 'REVIEW') {
      const displayServiceName =
        selectedAppliance?.name && selectedAppliance?.name !== service
          ? `${selectedAppliance.name} • ${service}`
          : (service || selectedAppliance?.name || category || 'Home Service');

      return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.pad, isDesktopWeb && styles.padDesktop]}>
          {/* Header Row */}
          <View style={styles.reviewTopRow}>
            <TouchableOpacity style={styles.reviewBackBtn} onPress={handleBack} activeOpacity={0.75} accessibilityLabel="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <BookingProgress activeIndex={4} />
            </View>
          </View>

          {/* Title Block */}
          <View style={styles.reviewTitleBlock}>
            <Text style={styles.reviewTitle}>
              {isConsultation ? 'Review Free Consultation' : 'Review Booking'}
            </Text>
            <Text style={styles.reviewSub}>
              {isConsultation
                ? 'Step 4 of 4 • Final appointment & doorstep confirmation'
                : 'Step 4 of 4 • Verify details & confirm'}
            </Text>
          </View>

          {/* Main Booking Summary Card */}
          <View style={styles.summaryCard}>
            {/* Service & Coverage Row */}
            <View style={styles.reviewHeaderRow}>
              <View style={styles.reviewIconCircle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.reviewCategoryLabel}>
                  {category ? category.toUpperCase() : 'SERVICE APPOINTMENT'}
                </Text>
                <Text style={styles.reviewServiceName} numberOfLines={1}>
                  {displayServiceName}
                </Text>
                {!!applianceSummaryLine && (
                  <Text style={styles.reviewApplianceSub} numberOfLines={1}>{applianceSummaryLine}</Text>
                )}
              </View>
              <View style={isConsultation ? styles.reviewFreeBadge : styles.reviewAmcBadge}>
                <Text style={isConsultation ? styles.reviewFreeBadgeText : styles.reviewAmcBadgeText}>
                  {isConsultation ? '✓ ₹0 Free Visit' : '✓ Covered'}
                </Text>
              </View>
            </View>

            <View style={styles.reviewDivider} />

            {/* Issue / Symptoms */}
            {!!issueLabel && (
              <View style={styles.reviewDetailRow}>
                <View style={styles.reviewDetailIconWrap}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewFieldLabel}>ISSUE REPORTED</Text>
                  <Text style={styles.reviewFieldValue}>{issueLabel}</Text>
                  {!!issueDescription && (
                    <Text style={styles.reviewFieldMeta}>{issueDescription}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Scheduled Date & Time */}
            <View style={styles.reviewDetailRow}>
              <View style={styles.reviewDetailIconWrap}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewFieldLabel}>SCHEDULED APPOINTMENT</Text>
                <Text style={styles.reviewFieldValue}>
                  {scheduledDateLabel || scheduledDate} • {scheduledTime}
                </Text>
              </View>
            </View>

            {/* Doorstep Location */}
            <View style={styles.reviewDetailRow}>
              <View style={styles.reviewDetailIconWrap}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewFieldLabel}>DOORSTEP LOCATION</Text>
                <Text style={styles.reviewFieldValue} numberOfLines={2}>
                  {address || 'Location selected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing & Guarantee Card */}
          {isConsultation ? (
            <View style={styles.consultationFeeCard}>
              <View style={styles.consultationFeeHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <Text style={styles.consultationFeeTitle}>Zevota Care ₹0 Free Visit Guarantee</Text>
                </View>
                <View style={styles.freeChip}>
                  <Text style={styles.freeChipText}>₹0 FREE</Text>
                </View>
              </View>

              <View style={styles.feeBreakdownRow}>
                <Text style={styles.feeBreakdownLabel}>Doorstep Inspection & Diagnostic Visit</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.feeStrike}>₹199</Text>
                  <Text style={styles.feeFree}>₹0</Text>
                </View>
              </View>

              <View style={styles.feeBreakdownRow}>
                <Text style={styles.feeBreakdownLabel}>Parts & Labor Repair Quote</Text>
                <Text style={styles.feeQuoteText}>Provided on-site</Text>
              </View>

              <View style={styles.feeDivider} />

              <View style={styles.feeBreakdownRow}>
                <Text style={styles.feeTotalLabel}>Amount Payable Today</Text>
                <Text style={styles.feeTotalValue}>₹0</Text>
              </View>

              <View style={styles.reviewNoteBox}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <Text style={styles.consultationSummaryNote}>
                  Zero upfront payment. Technician will inspect at your doorstep and provide a clear repair quote. Pay ₹0 if you choose not to proceed.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.billNote}>
              <Text style={styles.billNoteText}>
                No payment now. A technician will inspect first, and the bill will be shared with you after that.
              </Text>
            </View>
          )}

          {!!formError && <Text style={styles.error}>{formError}</Text>}

          <View style={{ marginVertical: 6 }}>
            <LiveSupportOptionCard onPress={goLiveSupport} />
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            disabled={submitting}
            onPress={handleConfirm}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              {submitting
                ? (isConsultation ? 'Confirming Free Consultation…' : 'Confirming Booking…')
                : (isConsultation ? 'Confirm Free Consultation (₹0)' : 'Confirm Booking')}
            </Text>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── CATALOG OTHER DETAIL ──
    if (step === 'OTHER_DETAIL') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.pad, isDesktopWeb && styles.padDesktop]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.h1}>Tell us what you need</Text>
          <TextInput
            style={styles.textarea}
            value={customIssueText}
            onChangeText={setCustomIssueText}
            placeholder="Describe your requirement…"
            placeholderTextColor="#94a3b8"
            multiline
          />
          <MediaCapturePanel
            value={catalogOtherMedia}
            emptyTitle="Record Live Video"
            emptyDescription="A short live video helps technicians understand your requirement."
            onChange={setCatalogOtherMedia}
          />
          <View style={{ marginVertical: 12 }}>
            <LiveSupportOptionCard onPress={goLiveSupport} />
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (isGuest) {
                promptGuestRegistration('Please register your account to continue with your service booking.');
                return;
              }
              const defaultLabel = service
                ? `Require assistance for ${service}`
                : `Custom ${category} request`;
              setIssueLabel(customIssueText.trim() || defaultLabel);
              setIssueDescription(customIssueText.trim());
              if (catalogOtherMedia?.uri) {
                setIssueMedia(applyPanelValueToIssueMedia(issueMedia, catalogOtherMedia));
              }
              setStep('SCHEDULE');
            }}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── SERVICE TYPE ──
    if (step === 'SERVICE_TYPE') {
      const gridItems = filteredServiceTypes.filter(
        (item) => !(item.isOther || item.name === 'Other')
      );
      const otherItem =
        filteredServiceTypes.find((item) => item.isOther || item.name === 'Other') || {
          name: 'Other',
          description: 'Tell us your specific requirement',
          isOther: true,
        };

      return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.pad, isDesktopWeb && styles.padDesktop]}>
          <View style={styles.rowHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{subCategory || category}</Text>
              <Text style={styles.sub}>Select a service</Text>
            </View>
          </View>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <div style={isDesktopWeb ? serviceGridCss.desktopWrapper : serviceGridCss.wrapper}>
            {gridItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.svcGridCard, isDesktopWeb && styles.svcGridCardDesktop]}
                onPress={() => selectServiceTypeAndNext(item)}
                activeOpacity={0.88}
              >
                <View style={[styles.svcGridImgWrap, isDesktopWeb && styles.svcGridImgWrapDesktop]}>
                  <Image
                    source={{ uri: resolveServiceItemImageUri(item, category) }}
                    style={styles.svcGridImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[styles.svcGridTitle, isDesktopWeb && styles.svcGridTitleDesktop]} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </div>
          <TouchableOpacity
            style={[styles.otherRow, showOtherInput && styles.otherRowActive]}
            onPress={() => selectServiceTypeAndNext(otherItem)}
            activeOpacity={0.88}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.otherRowTitle}>Other</Text>
              <Text style={styles.otherRowSub}>Tell us your specific requirement</Text>
            </View>
            <Text style={[styles.chevron, showOtherInput && { transform: [{ rotate: '90deg' }] }]}>›</Text>
          </TouchableOpacity>

          {showOtherInput && (
            <View style={styles.otherInlineBox}>
              <Text style={styles.otherInlineLabel}>Describe your requirement *</Text>
              <TextInput
                style={styles.otherInlineTextarea}
                value={customIssueText}
                onChangeText={(text) => {
                  setCustomIssueText(text);
                  if (otherError) setOtherError('');
                }}
                placeholder="Describe what specific service or repair you need..."
                placeholderTextColor="#94a3b8"
                multiline
              />
              <Text style={styles.mediaSectionTitle}>Record Live Video (Optional)</Text>
              <MediaCapturePanel
                value={catalogOtherMedia}
                emptyTitle="Record Live Video"
                emptyDescription="A quick live video helps technicians understand your requirement better."
                onChange={setCatalogOtherMedia}
              />
              {!!otherError && <Text style={styles.errorText}>⚠ {otherError}</Text>}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  !customIssueText.trim() && styles.primaryBtnDisabled,
                ]}
                disabled={!customIssueText.trim()}
                onPress={() => {
                  const text = customIssueText.trim();
                  if (!text) {
                    setOtherError('Please fill in your requirement description to continue.');
                    return;
                  }
                  setOtherError('');
                  setService(`Custom ${category} Request`);
                  if (!categoryHasGroups(category)) setSubCategory('Other');
                  setIssueLabel(text);
                  setIssueDescription(text);
                  if (catalogOtherMedia?.uri) {
                    setIssueMedia(applyPanelValueToIssueMedia(issueMedia, catalogOtherMedia));
                  }
                  setStep('SCHEDULE');
                }}
                activeOpacity={customIssueText.trim() ? 0.88 : 1}
              >
                <Text style={[styles.primaryBtnText, !customIssueText.trim() && styles.primaryBtnTextDisabled]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <LiveSupportOptionCard onPress={goLiveSupport} />
        </ScrollView>
      );
    }

    // ── SUB GROUP ──
    if (step === 'SUB_GROUP') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.pad, isDesktopWeb && styles.padDesktop]}>
          <View style={styles.rowHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{category}</Text>
              <Text style={styles.sub}>Select a subcategory</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {subGroups.map((group) => (
              <TouchableOpacity
                key={group.name}
                style={styles.catCard}
                onPress={() => selectSubGroupAndNext(group.name)}
              >
                <Image
                  source={{ uri: resolveCategoryImageUri(group.name, group.image_url, true) }}
                  style={styles.catImg}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.catTitle}>{group.name}</Text>
                  <Text style={styles.catSub}>{group.description}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
            <LiveSupportOptionCard
              onPress={goLiveSupport}
              subtitle={`Need help picking a ${category} service? Chat with us`}
            />
          </View>
        </ScrollView>
      );
    }

    // ── CATEGORY (step 1) ──
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.pad, isDesktopWeb && styles.padDesktop]}>
        <View style={styles.rowHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{isConsultation ? 'Book a free consultation' : 'What can we help with?'}</Text>
            <Text style={styles.sub}>
              {isConsultation
                ? 'Choose a service. This visit is free for logged-in users, with or without an AMC plan.'
                : 'Choose a service category.'}
            </Text>
          </View>
        </View>
        <div style={isDesktopWeb ? categoryGridCss.desktopWrapper : { display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(categories || []).map((cat) => (
            <TouchableOpacity
              key={cat.id || cat.name}
              style={[styles.catCard, isDesktopWeb && styles.catCardDesktop]}
              onPress={() => selectCategoryAndNext(cat.name)}
            >
              <Image
                source={{ uri: resolveCategoryImageUri(cat.name, cat.image_url, true) }}
                style={[styles.catImg, isDesktopWeb && styles.catImgDesktop]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.catTitle, isDesktopWeb && styles.catTitleDesktop]}>{cat.name}</Text>
                <Text style={[styles.catSub, isDesktopWeb && styles.catSubDesktop]}>{cat.description}</Text>
                <Text style={styles.badge}>
                  {countServicesInCategory(cat.name, services)} services
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          <LiveSupportOptionCard onPress={goLiveSupport} />
        </div>
      </ScrollView>
    );
  };

  return (
    <View style={styles.rootWrapper}>
      {renderStepContent()}
      {renderGuestModal()}
      <AppliancePaymentPromptModal
        visible={showPaymentModal}
        applianceName={paymentPromptTarget?.name || displayName || 'Appliance'}
        activeUser={activeUser}
        contextLabel={isComplaint ? 'complaint resolution and AMC coverage' : 'service booking and AMC coverage'}
        onPaymentSuccess={handleAppliancePaymentSuccess}
        onCancel={() => {
          setShowPaymentModal(false);
          setPaymentPromptTarget(null);
        }}
      />
    </View>
  );
}

const serviceGridCss = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  desktopWrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: '20px',
    width: '100%',
    boxSizing: 'border-box',
  },
};

const categoryGridCss = {
  desktopWrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
};

const styles = StyleSheet.create({
  billNote: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  billNoteText: { fontSize: 13, color: '#b91c1c', fontWeight: '600', lineHeight: 19 },
  container: { flex: 1, backgroundColor: '#ffffff' },
  pad: {
    padding: 20,
    paddingBottom: 48,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  padDesktop: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 80,
    gap: 20,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  catCardDesktop: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 14,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
  },
  catImgDesktop: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  catTitleDesktop: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  catSubDesktop: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 18,
  },
  svcGridCardDesktop: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
  },
  svcGridImgWrapDesktop: {
    aspectRatio: 1.15,
    borderRadius: 14,
    marginBottom: 8,
  },
  svcGridTitleDesktop: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { fontSize: 28, color: '#0f172a', marginTop: -2 },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  sub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  catImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f1f5f9' },
  catTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  catSub: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
  badge: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  chevron: { fontSize: 22, color: '#94a3b8' },
  svcGridCard: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    minWidth: 0,
    cursor: 'pointer',
  },
  svcGridImgWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  svcGridImg: {
    width: '100%',
    height: '100%',
  },
  svcGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 16,
    width: '100%',
    paddingHorizontal: 2,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  otherRowTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  otherRowSub: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
  searchBar: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  searchInput: { height: 44, fontSize: 14, color: '#0f172a' },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  summaryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  summaryMeta: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#cbd5e1', opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  primaryBtnTextDisabled: { color: '#94a3b8' },
  otherRowActive: { borderColor: '#2563eb', backgroundColor: '#f8fafc' },
  otherInlineBox: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  otherInlineLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  otherInlineTextarea: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  mediaSectionTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 4 },
  errorText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  textarea: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  error: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  rootWrapper: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  guestModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  guestModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  guestModalCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  guestModalCloseIconText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  guestModalIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  guestModalEmoji: {
    fontSize: 28,
  },
  guestModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestModalBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  guestModalBtnCol: {
    width: '100%',
    gap: 10,
  },
  guestModalRegisterBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  guestModalRegisterBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  guestModalLoginBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  guestModalLoginBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  guestModalSkipBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  guestModalSkipBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  coveredAmcBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 14,
    gap: 3,
  },
  coveredAmcTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#047857',
  },
  coveredAmcSub: {
    fontSize: 12,
    color: '#065f46',
    lineHeight: 17,
  },
  outOfPlanFeeBanner: {
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  outOfPlanFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outOfPlanFeeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9a3412',
    flex: 1,
  },
  outOfPlanFeeAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#c2410c',
  },
  outOfPlanFeeSub: {
    fontSize: 11.5,
    color: '#7c2d12',
    lineHeight: 16,
  },
  consultationAmcBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    gap: 3,
  },
  consultationAmcTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  consultationAmcSub: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 17,
  },
  consultationFeeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 13,
    gap: 8,
    boxShadow: '0 2px 10px rgba(37,99,235,0.05)',
  },
  consultationFeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  consultationFeeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  freeChip: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  freeChipText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  feeBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeBreakdownLabel: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },
  feeStrike: {
    fontSize: 11.5,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  feeFree: {
    fontSize: 12.5,
    color: '#16a34a',
    fontWeight: '800',
  },
  feeQuoteText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 1,
  },
  feeTotalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  feeTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16a34a',
  },
  reviewNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginTop: 2,
  },
  consultationSummaryNote: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
    fontWeight: '500',
    flex: 1,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
  },
  reviewTitleBlock: {
    gap: 2,
    marginVertical: 2,
  },
  reviewTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  reviewSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reviewCategoryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  reviewServiceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  reviewApplianceSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  reviewFreeBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reviewFreeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  reviewAmcBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reviewAmcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 2,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  reviewDetailIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  reviewFieldLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  reviewFieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
    lineHeight: 16,
  },
  reviewFieldMeta: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
    lineHeight: 15,
  },
});
