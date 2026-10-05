import React, { useMemo, useState, useCallback } from 'react';
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
import { SERVICE_CATALOG } from '../../config/serviceCatalog';
import { MIN_QUANTITY, MAX_QUANTITY, MEDIA_REQUIREMENTS } from '../../config/applianceConstants';
import { getApplianceById } from '../../config/applianceCatalog';
import { getApplianceTypeIdForService } from '../../config/serviceApplianceMapping';

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
export default function ApplianceAddWizard({
  onComplete,
  onCancel,
  mode = 'inventory',
  maxQuantity = MAX_QUANTITY,
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 5 : width >= 600 ? 4 : 3;
  const qtyCap = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Number(maxQuantity) || MAX_QUANTITY));

  // --- wizard state ---
  const [step, setStep] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [units, setUnits] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [mediaError, setMediaError] = useState('');
  const [showDiscard, setShowDiscard] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUnit = units[currentIndex] || null;

  // --- derived lists ---
  const subgroups = useMemo(() => selectedCategory?.groups || null, [selectedCategory]);

  const serviceItems = useMemo(() => {
    if (!selectedCategory) return [];
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
  const dirty = !!selectedService || units.some((u) => u.location || u.media);

  const requestLeave = useCallback(() => {
    if (dirty && step !== 'category') {
      setShowDiscard(true);
      return;
    }
    onCancel?.();
  }, [dirty, step, onCancel]);

  // --- handlers ---
  const handlePickCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubgroup(null);
    setSearchQuery('');
    if (cat.groups?.length) {
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
      Platform.OS === 'web' ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
    gap: 12,
    rowGap: 16,
    columnGap: 12,
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
      rowGap: 16,
      columnGap: 12,
    };
    if (Platform.OS === 'web') {
      return (
        <div style={serviceGridStyle}>
          {list.map((svc) => (
            <ServiceItemCard key={svc.name} item={svc} onPress={() => handlePickService(svc)} />
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
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        {!!breadcrumb && (
          <Text style={styles.breadcrumb} numberOfLines={1}>
            {breadcrumb}
          </Text>
        )}
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* --------- CATEGORY STEP --------- */}
        {step === 'category' && (
          <>
            <Text style={styles.title}>What would you like to add?</Text>
            <Text style={styles.subtitle}>
              Choose a service category to register items for your home.
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

        {/* --------- SUBGROUP STEP --------- */}
        {step === 'subgroup' && selectedCategory && (
          <>
            <Text style={styles.title}>{selectedCategory.name}</Text>
            <Text style={styles.subtitle}>
              {selectedCategory.description || 'Choose a sub-category.'}
            </Text>
            {renderSubgroupGrid(subgroups)}
          </>
        )}

        {/* --------- SERVICE STEP --------- */}
        {step === 'service' && (
          <>
            <Text style={styles.title}>
              {selectedSubgroup ? selectedSubgroup.name : selectedCategory?.name}
            </Text>
            <Text style={styles.subtitle}>
              Select the item you want to register with a live video.
            </Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchGlyph}>⌕</Text>
              <TextInput
                style={styles.searchInput}
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
                <Text style={styles.coverageNoteTitle}>Coverage Policy Note</Text>
                <Text style={styles.coverageNoteText}>
                  Please note: Only items in active{' '}
                  <Text style={{ fontWeight: '700', color: '#1e40af' }}>working condition</Text>{' '}
                  are covered under the Care Subscription Package. Pre-existing non-functional units cannot be onboarded.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleDetailsContinue} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Continue</Text>
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
          <View style={[styles.modalCard, { maxWidth: 440, maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
                <View style={styles.confirmIconCircle}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </View>
                <Text style={styles.confirmModalTitle}>Confirm Item Registration</Text>
                <Text style={styles.confirmModalSub}>
                  Please review your {units.length > 1 ? `${units.length} items` : 'item'} details before saving:
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {units.map((u, i) => (
                  <View key={i} style={styles.confirmApplianceCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.confirmApplianceBadge}>
                        <Text style={styles.confirmApplianceBadgeText}>#{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.confirmApplianceName} numberOfLines={1}>
                          {u.displayName || selectedService?.name || 'Item'}
                        </Text>
                        <Text style={styles.confirmApplianceMeta} numberOfLines={1}>
                          {[selectedCategory?.name, selectedSubgroup?.name, selectedService?.name]
                            .filter(Boolean)
                            .join(' › ')}
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
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Text style={styles.confirmVideoVerifiedText}>Live Video Walkthrough Attached</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.finalityWarningBox}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <Text style={styles.finalityWarningTitle}>Important Note on Finality</Text>
                </View>
                <Text style={styles.finalityWarningText}>
                  Once saved, this item is permanently registered to your Care Subscription Package and cannot be edited or deleted. If you need to make changes or retake the video, you can do so now before confirming.
                </Text>
              </View>

              <View style={{ gap: 10, paddingTop: 6 }}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 0, paddingHorizontal: 16, paddingVertical: 13 }]}
                  onPress={handleConfirmFinalSave}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryBtnText, { fontSize: 14.5, textAlign: 'center' }]}>
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
    </View>
  );
}

// --------- Internal sub-components ------------------------------------------------------------------------------------------------------------------------------------------------

function CategoryCard({ item, onPress, style }) {
  return (
    <TouchableOpacity
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

// --------- buildSavedApplianceRecords (kept for backward compat) ---------------------------------------------------
export function buildSavedApplianceRecords(units, selectedService, user) {
  return (units || []).map((unit, idx) => {
    const svcName = selectedService?.name || 'Item';
    const brandName = unit.brand === 'Other' && unit.customBrand ? unit.customBrand : (unit.brand || '');
    return {
      id: Date.now() + idx,
      userId: user?.id,
      user_phone: user?.phone || '',
      name: unit.displayName || `${svcName} ${idx + 1}`,
      displayName: unit.displayName || `${svcName} ${idx + 1}`,
      category: svcName,
      applianceTypeId: selectedService?.applianceTypeId || selectedService?.id || 'other',
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
      img: unit.media?.uri || selectedService?.image_url || null,
      uploadedMediaUri: unit.media?.uri || null,
      media: unit.media
        ? { type: unit.media.type, url: unit.media.uri, fileName: unit.media.fileName }
        : null,
      mediaStatus: unit.media ? 'PENDING_REVIEW' : 'SKIPPED',
      createdAt: new Date().toISOString(),
      is_immutable: false,
    };
  });
}

// --------- Styles ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const catStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 90,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 4,
    paddingHorizontal: 0,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: 'none', cursor: 'pointer' }
      : {}),
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
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
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

const svcStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 90,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 4,
    paddingHorizontal: 0,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: 'none', cursor: 'pointer' }
      : {}),
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
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
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff', width: '100%' },
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
    paddingHorizontal: 16, paddingBottom: 48, gap: 14,
    maxWidth: 720, width: '100%', alignSelf: 'center',
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif", letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14, color: '#64748b', lineHeight: 20, marginTop: -6,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderWidth: 1.5,
    borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 11, gap: 8,
  },
  searchGlyph: { fontSize: 16, color: '#94a3b8' },
  searchInput: {
    flex: 1, fontSize: 14, color: '#0f172a',
    outlineStyle: 'none', fontFamily: "'Outfit', 'Inter', sans-serif",
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
    backgroundColor: '#2563eb', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: '#cbd5e1' },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  primaryBtnTextDisabled: { color: '#f8fafc' },
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
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#eff6ff', borderWidth: 1.5,
    borderColor: '#bfdbfe', alignItems: 'center',
    justifyContent: 'center', marginBottom: 4,
  },
  confirmModalTitle: {
    fontSize: 18, fontWeight: '800', color: '#0f172a',
    textAlign: 'center', fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmModalSub: {
    fontSize: 13, color: '#64748b', textAlign: 'center',
    lineHeight: 18, fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmApplianceCard: {
    backgroundColor: '#f8fafc', borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 8,
  },
  confirmApplianceBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
  confirmApplianceBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  confirmApplianceName: {
    fontSize: 14, fontWeight: '700', color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmApplianceMeta: {
    fontSize: 12, color: '#64748b', marginTop: 1,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  confirmApplianceDetailsGrid: {
    flexDirection: 'row', gap: 12, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  confirmDetailItem: { flex: 1 },
  confirmDetailLabel: {
    fontSize: 10.5, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase',
  },
  confirmDetailValue: { fontSize: 12, color: '#1e293b', fontWeight: '600', marginTop: 1 },
  confirmVideoVerifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 2,
  },
  confirmVideoVerifiedText: {
    fontSize: 11.5, color: '#15803d', fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  finalityWarningBox: {
    backgroundColor: '#fffbeb', borderWidth: 1.2,
    borderColor: '#fde68a', borderRadius: 14, padding: 12, gap: 6,
  },
  finalityWarningTitle: {
    fontSize: 12.5, fontWeight: '700', color: '#92400e',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  finalityWarningText: {
    fontSize: 11.5, color: '#78350f', lineHeight: 16,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  reviewEditBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: '#f1f5f9',
  },
  reviewEditBtnText: {
    color: '#475569', fontSize: 13.5, fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', sans-serif", textAlign: 'center',
  },
});
