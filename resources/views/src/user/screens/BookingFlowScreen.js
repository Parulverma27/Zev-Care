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
} from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  categoryHasGroups,
  countServicesInCategory,
  getInitialStepForCategory,
  getServiceTypes,
  getSubGroups,
  isZeroFrictionCategory,
  isPestControlCategory,
} from '../../config/serviceCatalogUtils';
import { resolveCategoryImageUri, resolveServiceItemImageUri } from '../../utils/imageUtils';
import MediaCapturePanel from '../../components/MediaCapturePanel';
import ApplianceAddWizard, {
  buildSavedApplianceRecords,
} from '../../components/appliances/ApplianceAddWizard';
import FastAddConfirmationModal from '../../components/booking/FastAddConfirmationModal';
import BlinkitCartBar from '../../components/booking/BlinkitCartBar';
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
  const {
    createBooking,
    activeUser,
    categories,
    subCategories,
    services,
    validateServiceLocation,
    getAppliancesForUser,
    addUserAppliance,
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
  const [cartItems, setCartItems] = useState([]);
  const [fastAddModalItem, setFastAddModalItem] = useState(null);
  const [showFastAddModal, setShowFastAddModal] = useState(false);
  const [fastAddQty, setFastAddQty] = useState(1);

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

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledDateLabel, setScheduledDateLabel] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [address, setAddress] = useState(activeUser?.address || '');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
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

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalContext, setGuestModalContext] = useState({
    title: '',
    message: '',
  });

  const promptGuestRegistration = (customMsg) => {
    setGuestModalContext({
      title: isAnonymous ? 'Register First' : 'Complete Your Profile First',
      message:
        customMsg ||
        (isAnonymous
          ? `Please register your account first to add ${displayName || 'appliances'} and continue with your service booking.`
          : `Please complete your profile to add ${displayName || 'appliances'} and continue with your service booking.`),
    });
    setShowGuestModal(true);
  };

  useEffect(() => {
    if (preSelectedService) {
      const catName = preSelectedCategory || '';
      const subCatName = preSelectedSubCategory || '';
      if (catName) setCategory(catName);
      if (subCatName) setSubCategory(subCatName);
      setService(preSelectedService);
      setSkippedCategoryStep(true);

      if (isConsultation) {
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
        const typeId = getApplianceTypeIdForService(preSelectedService);
        resetApplianceDraftForType(typeId);
        setStep('APPLIANCE_SELECT');
      } else {
        resetApplianceDraftForType(null);
        setCustomIssueText('');
        setCatalogOtherMedia(null);
        setIssueLabel(`Require assistance for ${preSelectedService}`);
        if (isGuest) {
          promptGuestRegistration(`You haven't registered yet. Please register your account to book ${preSelectedService} service.`);
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
  }, [preSelectedCategory, preSelectedSubCategory, preSelectedService]);

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
    setSelectedAppliance(appliance);
    setIsNewAppliance(false);
    const isCovered = Boolean(appliance?.isCoveredByAmc);
    setApplianceRegistrationFee(isConsultation || isCovered ? 0 : APPLIANCE_REGISTRATION_FEE);
    if (changed) clearIssueState();
  };

  const confirmExistingAppliance = () => {
    if (!selectedAppliance) return;
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
    setCategory(catName);
    setSubCategory('');
    setService('');
    setCartItems([]);
    setSkippedCategoryStep(false);
    setStep(getInitialStepForCategory(catName));
  };

  const selectSubGroupAndNext = (groupName) => {
    setSubCategory(groupName);
    setService('');
    setSearchQuery('');
    setShowOtherInput(false);
    setStep('SERVICE_TYPE');
  };

  const selectServiceTypeAndNext = (item) => {
    if (item.isOther || item.name === 'Other') {
      if (isGuest) {
        promptGuestRegistration(`You haven't registered yet. Please register your account to book ${category || 'services'}.`);
        return;
      }
      setShowOtherInput((prev) => !prev);
      setOtherError('');
      return;
    }

    if (isZeroFrictionCategory(category)) {
      setFastAddModalItem(item);
      setFastAddQty(1);
      setShowFastAddModal(true);
      return;
    }

    if (isGuest && !isApplianceLinkedService(item.name)) {
      promptGuestRegistration(`You haven't registered yet. Please register your account to book ${item.name} service.`);
      return;
    }
    setShowOtherInput(false);
    if (!categoryHasGroups(category)) setSubCategory(item.name);
    afterServicePicked(item.name);
  };

  const handleConfirmFastAdd = () => {
    if (!fastAddModalItem) return;
    const newItems = Array.from({ length: fastAddQty }, () => fastAddModalItem);
    setCartItems((prev) => [...prev, ...newItems]);
    setShowFastAddModal(false);
    setFastAddModalItem(null);
  };

  const proceedWithZeroFrictionCart = () => {
    if (cartItems.length === 0) return;
    const primaryService = cartItems[0].name;
    const allNames = cartItems.map((c) => c.name).join(', ');
    setService(primaryService);
    if (!categoryHasGroups(category)) setSubCategory(category);
    setSelectedAppliance({
      id: `zf-${Date.now()}`,
      name: `${category} Services (${cartItems.length} items)`,
      type: allNames,
      isCoveredByAmc: true,
      verification_status: 'VERIFIED',
    });
    setApplianceRegistrationFee(0);
    setIssueLabel(`Doorstep service for: ${allNames}`);
    setIssueDescription(`Requested ${cartItems.length} service item(s): ${allNames}.`);
    setStep('SCHEDULE');
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
    records.forEach((r) => addUserAppliance(r));
    const first = records[0];
    setSelectedAppliance(first);
    setIsNewAppliance(true);
    setApplianceRegistrationFee(isConsultation ? 0 : APPLIANCE_REGISTRATION_FEE);
    clearIssueState();
    setStep('ISSUE');
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
      setOtherError('Please describe the issue in a bit more detail.');
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
    if (isGuest) {
      promptGuestRegistration(
        isConsultation
          ? 'Please register or log in to book a free consultation. Consultations are complimentary for every logged-in user.'
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

            <TouchableOpacity
              style={styles.guestModalSkipBtn}
              activeOpacity={0.8}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={styles.guestModalSkipBtnText}>Stay in Guest Mode</Text>
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
              confirmExistingAppliance();
            }}
            onAddNew={() => {
              if (isGuest) {
                promptGuestRegistration();
                return;
              }
              setStep('APPLIANCE_ADD');
            }}
            onBack={handleBack}
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
        <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
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
            selectedAppliance.isCoveredByAmc ? (
              <View style={styles.coveredAmcBanner}>
                <Text style={styles.coveredAmcTitle}>✓ Covered Under AMC Plan</Text>
                <Text style={styles.coveredAmcSub}>This appliance is protected under your AMC. ₹0 Breakdown inspection & labor included.</Text>
              </View>
            ) : isConsultation ? (
              <View style={styles.consultationAmcBanner}>
                <Text style={styles.consultationAmcTitle}>✓ Free Doorstep Diagnosis (@ ₹0)</Text>
                <Text style={styles.consultationAmcSub}>Complimentary inspection visit is active for this appliance. No plan fees apply.</Text>
              </View>
            ) : !isConsultation ? (
              <View style={styles.outOfPlanFeeBanner}>
                <View style={styles.outOfPlanFeeRow}>
                  <Text style={styles.outOfPlanFeeTitle}>Out-of-Plan Appliance Service Charge</Text>
                  <Text style={styles.outOfPlanFeeAmount}>₹{APPLIANCE_REGISTRATION_FEE}</Text>
                </View>
                <Text style={styles.outOfPlanFeeSub}>
                  This appliance was not added during your AMC plan purchase. Standard ₹{APPLIANCE_REGISTRATION_FEE} fee applies for this booking.
                </Text>
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
            }}
            onChangeAddress={(t) => {
              setAddress(t);
              setSelectedAddressId(null);
            }}
            onChangeCoords={({ latitude: la, longitude: lo }) => {
              setLatitude(la);
              setLongitude(lo);
            }}
            locationValidation={locationValidation}
            onFetchGps={handleFetchGps}
            locatingGps={locatingGps}
            gpsError={gpsError}
            isConsultation={isConsultation}
            onBack={handleBack}
            onContinue={() => setStep('REVIEW')}
          />
        </View>
      );
    }

    // ── REVIEW ──
    if (step === 'REVIEW') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
          <View style={styles.rowHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <BookingProgress activeIndex={4} />
            </View>
          </View>
          <Text style={styles.h1}>{isConsultation ? 'Review Free Consultation' : 'Review booking'}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{service || category}</Text>
            {!!selectedAppliance && (
              <>
                <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Appliance</Text>
                <Text style={styles.summaryValue}>{selectedAppliance.name}</Text>
                {!!applianceSummaryLine && <Text style={styles.summaryMeta}>{applianceSummaryLine}</Text>}
                <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Coverage / Visit Fee</Text>
                {isConsultation ? (
                  <Text style={[styles.summaryValue, { color: '#16a34a' }]}>✓ Complimentary On-Site Diagnosis (₹0 Visit Fee)</Text>
                ) : selectedAppliance.isCoveredByAmc ? (
                  <Text style={[styles.summaryValue, { color: '#15803d' }]}>✓ Covered under AMC (₹0 Labor & Inspection)</Text>
                ) : (
                  <Text style={[styles.summaryValue, { color: '#c2410c' }]}>Out-of-Plan (₹{APPLIANCE_REGISTRATION_FEE} Booking Fee Applies)</Text>
                )}
              </>
            )}
            {!!issueLabel && (
              <>
                <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Issue / Symptoms</Text>
                <Text style={styles.summaryValue}>{issueLabel}</Text>
              </>
            )}
            {!!issueDescription && <Text style={styles.summaryMeta}>{issueDescription}</Text>}
            <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Scheduled Date</Text>
            <Text style={styles.summaryValue}>{scheduledDateLabel || scheduledDate}</Text>
            <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Time Slot</Text>
            <Text style={styles.summaryValue}>{scheduledTime}</Text>
            <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Doorstep Location</Text>
            <Text style={styles.summaryMeta}>{address}</Text>
          </View>
          {isConsultation ? (
            <View style={styles.consultationFeeCard}>
              <View style={styles.consultationFeeHeader}>
                <Text style={styles.consultationFeeTitle}>Urban Company ₹0 Free Visit Guarantee</Text>
                <View style={styles.freeChip}>
                  <Text style={styles.freeChipText}>₹0 FREE</Text>
                </View>
              </View>
              <View style={styles.feeBreakdownRow}>
                <Text style={styles.feeBreakdownLabel}>Doorstep Inspection & Diagnostic Visit</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
              <Text style={styles.consultationSummaryNote}>
                Zero payment required now. The technician will inspect the issue at your doorstep and provide a clear quote. If you choose not to proceed with the repair, you pay absolutely ₹0.
              </Text>
            </View>
          ) : (
            <>
              {!!selectedAppliance && !selectedAppliance.isCoveredByAmc && (
                <View style={styles.outOfPlanFeeBanner}>
                  <View style={styles.outOfPlanFeeRow}>
                    <Text style={styles.outOfPlanFeeTitle}>Out-of-Plan Appliance Fee</Text>
                    <Text style={styles.outOfPlanFeeAmount}>₹{APPLIANCE_REGISTRATION_FEE}</Text>
                  </View>
                  <Text style={styles.outOfPlanFeeSub}>
                    Added because this appliance was not registered during AMC plan purchase.
                  </Text>
                </View>
              )}
              <View style={styles.billNote}>
                <Text style={styles.billNoteText}>
                  No payment now. A technician will inspect first, and the bill will be shared with you after that.
                </Text>
              </View>
            </>
          )}
          {!!formError && <Text style={styles.error}>{formError}</Text>}
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            disabled={submitting}
            onPress={handleConfirm}
          >
            <Text style={styles.primaryBtnText}>
              {submitting
                ? isConsultation
                  ? 'Confirming Free Consultation…'
                  : 'Confirming booking…'
                : isConsultation
                  ? 'Confirm Free Consultation (₹0)'
                  : 'Confirm Booking'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── CATALOG OTHER DETAIL ──
    if (step === 'OTHER_DETAIL') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
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
        <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
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
          <div style={serviceGridCss.wrapper}>
            {gridItems.map((item) => {
              const isZeroFriction = isZeroFrictionCategory(category);
              const addedCount = cartItems.filter((c) => c.name === item.name).length;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.svcGridCard, addedCount > 0 && styles.svcGridCardAdded]}
                  onPress={() => selectServiceTypeAndNext(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.svcGridImgWrap}>
                    <Image
                      source={{ uri: resolveServiceItemImageUri(item, category) }}
                      style={styles.svcGridImg}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.svcGridTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {isZeroFriction && (
                    <View style={[styles.zfBadgePill, addedCount > 0 && styles.zfBadgePillAdded]}>
                      <Text style={[styles.zfBadgePillText, addedCount > 0 && styles.zfBadgePillTextAdded]}>
                        {addedCount > 0 ? `✓ Added (${addedCount})` : '+ Add'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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

          {/* Blinkit-Style Cart Bar for Plumber and Pest Control */}
          {isZeroFrictionCategory(category) && cartItems.length > 0 && (
            <BlinkitCartBar
              count={cartItems.length}
              items={cartItems}
              actionLabel="Proceed ›"
              onProceed={proceedWithZeroFrictionCart}
            />
          )}
        </ScrollView>
      );
    }

    // ── SUB GROUP ──
    if (step === 'SUB_GROUP') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
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
                  source={{ uri: resolveCategoryImageUri(group.name, group.image_url, isComplaint || isConsultation) }}
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
      <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
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
        <View style={{ gap: 10 }}>
          {(categories || []).map((cat) => (
            <TouchableOpacity
              key={cat.id || cat.name}
              style={styles.catCard}
              onPress={() => selectCategoryAndNext(cat.name)}
            >
              <Image
                source={{ uri: resolveCategoryImageUri(cat.name, cat.image_url, isComplaint || isConsultation) }}
                style={styles.catImg}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.catTitle}>{cat.name}</Text>
                <Text style={styles.catSub}>{cat.description}</Text>
                <Text style={styles.badge}>
                  {countServicesInCategory(cat.name, services)} services
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          <LiveSupportOptionCard onPress={goLiveSupport} />
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.rootWrapper}>
      {renderStepContent()}
      {renderGuestModal()}
      <FastAddConfirmationModal
        visible={showFastAddModal}
        item={fastAddModalItem}
        categoryName={category}
        quantity={fastAddQty}
        onIncrement={() => setFastAddQty((q) => q + 1)}
        onDecrement={() => setFastAddQty((q) => Math.max(1, q - 1))}
        onConfirm={handleConfirmFastAdd}
        onCancel={() => {
          setShowFastAddModal(false);
          setFastAddModalItem(null);
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
};

const styles = StyleSheet.create({
  billNote: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  billNoteText: { fontSize: 13, color: '#1e3a8a', fontWeight: '600', lineHeight: 19 },
  container: { flex: 1, backgroundColor: '#ffffff' },
  pad: {
    padding: 20,
    paddingBottom: 48,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
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
  },
  svcGridCardAdded: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 4,
  },
  zfBadgePill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zfBadgePillText: {
    color: '#1d4ed8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  zfBadgePillAdded: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  zfBadgePillTextAdded: {
    color: '#15803d',
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
    borderRadius: 16,
    padding: 16,
    gap: 10,
    boxShadow: '0 4px 14px rgba(37,99,235,0.06)',
  },
  consultationFeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  consultationFeeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  freeChip: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freeChipText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  feeBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeBreakdownLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  feeStrike: {
    fontSize: 13,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  feeFree: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '800',
  },
  feeQuoteText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  feeTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  feeTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16a34a',
  },
  consultationSummaryNote: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 2,
  },
});
