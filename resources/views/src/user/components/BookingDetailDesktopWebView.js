import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppIcon } from '../../components/AppIcons';
import { resolveImageUri } from '../../utils/imageUtils';
import { downloadInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import LiveProviderTrackingMap from '../../components/LiveProviderTrackingMap';

export default function BookingDetailDesktopWebView({
  bk,
  hasProvider,
  providerName,
  providerPhone,
  providerRating,
  providerTrade,
  assignedProvider,
  customerCoords,
  providerLiveCoords,
  trackingStatus,
  stages = [],
  activeStageIndex = 0,
  statusBadge,
  isConsultationBk,
  isBillSent,
  selectedPaymentMode,
  setSelectedPaymentMode,
  approving,
  billError,
  handleApproveBillAction,
  handleRejectBillAction,
  handleConfirmDecline,
  showDeclineConfirmModal,
  setShowDeclineConfirmModal,
  handleGoBack,
  navigate,
  activeUser,
}) {
  return (
    <div className="booking-detail-desktop-wrap" style={wrapperStyle}>
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div style={headerRowStyle}>
        <div>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={backBtnStyle}
            onClick={handleGoBack}
            title="Back to My Bookings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to My Bookings</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={pageTitleStyle}>Live Work Order Tracking</h1>
            <span style={statusBadgeStyle(statusBadge.bg, statusBadge.color)}>
              <span style={statusDotStyle(statusBadge.color)} />
              {statusBadge.text}
            </span>
          </div>

          <div style={subtextRowStyle}>
            <span style={idTagStyle}>Order #{bk?.booking_id}</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{bk?.service_name}</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#64748b' }}>{bk?.category_name} › {bk?.sub_category_name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {bk?.status === 'BOOKING_COMPLETED' && isBillSent && (
            <button
              type="button"
              className="zc-desktop-btn-secondary"
              style={invoiceBtnStyle}
              onClick={() => downloadInvoicePDF(bk)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              <span>Download Tax Invoice</span>
            </button>
          )}

          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={helpBtnStyle}
            onClick={() => navigate('/user/support')}
          >
            <AppIcon name="message-square" size={14} color="#0878f8" />
            <span>24/7 Support</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN DESKTOP SPLIT */}
      <div style={splitGridStyle}>
        {/* ================= LEFT COLUMN: MAP, PROVIDER & TIMELINE ================= */}
        <div style={leftColStyle}>
          {/* Live GPS Provider Map */}
          {hasProvider && (
            <div style={cardWrapStyle}>
              <div style={cardHeaderRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={pulseDotLiveStyle} />
                  <span style={cardHeaderTitleStyle}>Real-Time GPS Technician Tracking</span>
                </div>
                <span style={etaBadgeStyle}>
                  {trackingStatus === 'ON_THE_WAY'
                    ? 'En route • Live ETA 15 mins'
                    : trackingStatus === 'ARRIVED'
                    ? 'Technician Arrived'
                    : trackingStatus === 'COMPLETED'
                    ? 'Work Order Completed'
                    : 'Dispatch Active'}
                </span>
              </div>
              <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <LiveProviderTrackingMap
                  customerCoords={customerCoords}
                  customerAddress={bk?.address_text || ''}
                  providerName={providerName || 'Technician'}
                  providerPhone={providerPhone || ''}
                  providerCoords={providerLiveCoords}
                  bookingStatus={trackingStatus}
                  lastUpdatedAt={bk?.last_location_update || null}
                />
              </div>
            </div>
          )}

          {/* Assigned Technician Card */}
          {hasProvider ? (
            <div style={cardWrapStyle}>
              <div style={cardHeaderRowStyle}>
                <span style={cardHeaderTitleStyle}>ASSIGNED CERTIFIED TECHNICIAN</span>
                <span style={verifiedBadgeStyle}>✓ Background Verified</span>
              </div>

              <div style={techProfileRowStyle}>
                <Image
                  source={{
                    uri:
                      assignedProvider?.photo ||
                      assignedProvider?.avatar ||
                      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
                  }}
                  style={techAvatarStyle}
                />
                <div style={{ flex: 1, minWidth: 0, gap: '4px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={techNameStyle}>{providerName}</h3>
                    <span style={ratingPillStyle}>★ {providerRating != null ? providerRating : '4.9'}</span>
                  </div>
                  <div style={techSpecialtyStyle}>{providerTrade}</div>
                  {providerPhone ? (
                    <div style={techPhoneStyle}>
                      <AppIcon name="phone" size={13} color="#2563eb" />
                      <span>{providerPhone}</span>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    style={callTechBtnStyle}
                    onClick={() => {
                      if (providerPhone && typeof window !== 'undefined') {
                        window.open(`tel:${String(providerPhone).replace(/\s/g, '')}`);
                      }
                    }}
                  >
                    <AppIcon name="phone" size={14} color="#ffffff" />
                    <span>Call</span>
                  </button>
                  <button
                    type="button"
                    style={chatTechBtnStyle}
                    onClick={() => navigate('/user/support')}
                  >
                    <AppIcon name="message-square" size={14} color="#2563eb" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={cardWrapStyle}>
              <div style={cardHeaderTitleStyle}>ASSIGNED FIELD TECHNICIAN</div>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: '4px 0 0 0' }}>
                A verified technician is being assigned to your work order. You will receive an SMS and app alert shortly.
              </p>
            </div>
          )}

          {/* 10-Stage Lifecycle Progress */}
          <div style={cardWrapStyle}>
            <div style={cardHeaderRowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={cardHeaderTitleStyle}>WORK ORDER LIFECYCLE</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Real-time milestone tracking</div>
                </div>
              </div>
              <span style={stageCounterStyle}>Stage {activeStageIndex + 1} of {stages.length}</span>
            </div>

            {/* Visual Mini Progress Bar */}
            <div style={{ height: '5px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', margin: '4px 0 14px 0' }}>
              <div style={{ height: '100%', width: `${Math.round(((activeStageIndex + 1) / stages.length) * 100)}%`, backgroundColor: '#2563eb', borderRadius: '99px', transition: 'width 0.3s ease' }} />
            </div>

            <div style={timelineContainerStyle}>
              {stages.map((st, idx) => {
                const isDone = idx < activeStageIndex;
                const isCurrent = idx === activeStageIndex;
                const isLast = idx === stages.length - 1;

                return (
                  <div key={idx} style={{ ...timelineRowStyle, marginBottom: isCurrent ? '4px' : '0' }}>
                    <div style={timelineLeftColStyle}>
                      <div
                        style={{
                          ...timelineDotStyle,
                          backgroundColor: isDone ? '#10b981' : isCurrent ? '#ffffff' : '#f8fafc',
                          borderColor: isDone ? '#10b981' : isCurrent ? '#2563eb' : '#cbd5e1',
                          borderWidth: isCurrent ? '2.5px' : '1.5px',
                          color: isDone ? '#ffffff' : isCurrent ? '#2563eb' : '#64748b',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.18)' : 'none',
                        }}
                      >
                        {isDone ? (
                          <span style={{ fontSize: '11px', fontWeight: '900' }}>✓</span>
                        ) : isCurrent ? (
                          <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#2563eb' }} />
                        ) : (
                          <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</span>
                        )}
                      </div>
                      {!isLast && (
                        <div
                          style={{
                            ...timelineConnectorStyle,
                            backgroundColor: isDone ? '#10b981' : '#e2e8f0',
                            width: '2px',
                          }}
                        />
                      )}
                    </div>

                    <div style={{
                      flex: 1,
                      paddingBottom: isLast ? '0' : '14px',
                      ...(isCurrent ? {
                        backgroundColor: '#f0f7ff',
                        border: '1.2px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        marginBottom: '6px',
                      } : {}),
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: isCurrent ? '13.5px' : '13px',
                            fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                            color: isCurrent ? '#1d4ed8' : isDone ? '#0f172a' : '#475569',
                          }}
                        >
                          {st.title}
                        </span>
                        {isCurrent && (
                          <span style={activeNowBadgeStyle}>ACTIVE NOW</span>
                        )}
                      </div>
                      {isCurrent && !!st.detail && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#334155', lineHeight: '17px', fontWeight: '500' }}>
                          {st.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: FINANCIALS, ACTIONS & INFO ================= */}
        <div style={rightColStyle}>
          {/* ESTIMATE APPROVAL CARD (If Status == AWAITING_USER_APPROVAL) */}
          {bk?.status === 'AWAITING_USER_APPROVAL' && (
            <div style={estimateCardWrapStyle}>
              <div style={estimateHeaderStyle}>
                <div style={estimateIconStyle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 style={estimateTitleStyle}>
                    {isConsultationBk ? 'On-Site Diagnosis & Upfront Quote' : 'Estimate Bill Sent for Approval'}
                  </h3>
                  <p style={estimateSubStyle}>
                    Review technician inspection findings & upfront repair quote before work starts.
                  </p>
                </div>
              </div>

              {isConsultationBk ? (
                <div style={freeDiagnosisBadgeStyle}>
                  <span style={{ fontSize: '16px' }}>✓</span>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534' }}>
                      Free Doorstep Diagnosis Guarantee Honored (₹0)
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                      The inspection visit is completely free. Approve the quote below only if you want the technician to perform the repair now.
                    </div>
                  </div>
                </div>
              ) : Boolean(activeUser?.subscription_plan && activeUser?.subscription_status === 'ACTIVE') ? (
                <div style={amcCoveredBadgeStyle}>
                  <AppIcon name="shield" size={18} color="#fbbf24" />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#fbbf24' }}>
                      Covered under {activeUser.subscription_plan}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                      Breakdown inspection and technician labor charges are ₹0 under your AMC plan.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Diagnostic Findings */}
              {bk?.inspection_report && (
                <div style={findingsBoxStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AppIcon name="search" size={13} color="#2563eb" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>On-Site Diagnostic Findings</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '18px' }}>{bk.inspection_report}</div>
                </div>
              )}

              {/* Bill Breakdown Table */}
              <div style={billTableStyle}>
                <div style={billRowStyle}>
                  <span style={billLabelStyle}>
                    {isConsultationBk ? 'On-Site Diagnostic Visit' : 'Service Visit & Inspection Fee'}
                  </span>
                  <span style={{ ...billValStyle, color: isConsultationBk ? '#16a34a' : '#0f172a', fontWeight: '800' }}>
                    {isConsultationBk ? '₹0 (FREE)' : `₹${(bk?.service_charge ?? 0).toLocaleString()}`}
                  </span>
                </div>
                <div style={billRowStyle}>
                  <span style={billLabelStyle}>
                    Replacement Spare Parts{bk?.parts_description ? ` (${bk.parts_description})` : ''}
                  </span>
                  <span style={billValStyle}>₹{(bk?.parts_charge ?? 0).toLocaleString()}</span>
                </div>
                <div style={billRowStyle}>
                  <span style={billLabelStyle}>Labour & Workmanship</span>
                  <span style={billValStyle}>₹{(bk?.labour_charge ?? 0).toLocaleString()}</span>
                </div>
                {bk?.discount_amount > 0 && (
                  <div style={billRowStyle}>
                    <span style={{ ...billLabelStyle, color: '#16a34a', fontWeight: '700' }}>Active AMC Plan Discount</span>
                    <span style={{ ...billValStyle, color: '#16a34a', fontWeight: '800' }}>-₹{(bk?.discount_amount ?? 0).toLocaleString()}</span>
                  </div>
                )}
                <div style={billDividerStyle} />
                <div style={billTotalRowStyle}>
                  <span style={billTotalLabelStyle}>NET PAYABLE TOTAL</span>
                  <span style={billTotalValStyle}>₹{(bk?.total_bill ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method Selector (for Consultations) */}
              {isConsultationBk && (
                <div style={{ marginTop: '14px', gap: '8px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>Payment Preference:</div>
                  <div
                    style={payChoiceCardStyle(selectedPaymentMode === 'PAY_ON_COMPLETION')}
                    onClick={() => setSelectedPaymentMode('PAY_ON_COMPLETION')}
                  >
                    <div style={radioCircleStyle(selectedPaymentMode === 'PAY_ON_COMPLETION')}>
                      {selectedPaymentMode === 'PAY_ON_COMPLETION' && <div style={radioDotStyle} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                        Pay After Service (Cash / UPI)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Pay technician only after work is tested & approved</div>
                    </div>
                  </div>

                  <div
                    style={payChoiceCardStyle(selectedPaymentMode === 'WALLET')}
                    onClick={() => setSelectedPaymentMode('WALLET')}
                  >
                    <div style={radioCircleStyle(selectedPaymentMode === 'WALLET')}>
                      {selectedPaymentMode === 'WALLET' && <div style={radioDotStyle} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                        Pay from Wallet Balance
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Available Balance: ₹{(activeUser?.wallet_balance || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  style={approveBtnStyle}
                  onClick={handleApproveBillAction}
                  disabled={approving}
                >
                  {approving ? 'Processing Approval...' : `Approve Quote & Start Repair (₹${(bk?.total_bill ?? 0).toLocaleString()})`}
                </button>
                <button
                  type="button"
                  style={declineBtnStyle}
                  onClick={handleRejectBillAction}
                  disabled={approving}
                >
                  {isConsultationBk ? 'Decline Quote (₹0 Charged)' : 'Reject Estimate'}
                </button>
                {!!billError && <div style={billErrorStyle}>{billError}</div>}
              </div>
            </div>
          )}

          {/* Job Completion OTP Security Card */}
          {(bk?.status === 'SERVICE_IN_PROGRESS' || bk?.status === 'BOOKING_COMPLETED') && (
            <div style={otpCardWrapStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>
                    Job Completion Security OTP
                  </div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                    Share with technician ONLY after job completion & testing.
                  </div>
                </div>
                <div style={otpPillBoxStyle}>
                  {bk?.completion_otp || '4829'}
                </div>
              </div>

              {bk?.payment_mode === 'PAY_AFTER_SERVICE' && bk?.status === 'SERVICE_IN_PROGRESS' && (
                <div style={payDueBannerStyle}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>
                    💵 Payable on completion to technician:
                  </span>
                  <span style={{ fontSize: '14px', color: '#15803d', fontWeight: '800' }}>
                    ₹{(bk?.total_bill || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Work Order Info Card */}
          <div style={cardWrapStyle}>
            <div style={cardHeaderRowStyle}>
              <span style={cardHeaderTitleStyle}>WORK ORDER DETAILS</span>
              <span style={categoryTagStyle}>{bk?.category_name}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={detailRowStyle}>
                <AppIcon name="map-pin" size={15} color="#2563eb" />
                <div style={{ flex: 1 }}>
                  <div style={detailLabelStyle}>Service Location</div>
                  <div style={detailValueStyle}>{bk?.address_text || 'Customer Premises'}</div>
                </div>
              </div>

              <div style={detailRowStyle}>
                <AppIcon name="clock" size={15} color="#2563eb" />
                <div style={{ flex: 1 }}>
                  <div style={detailLabelStyle}>Scheduled Slot</div>
                  <div style={detailValueStyle}>
                    {[bk.scheduledDateLabel || bk.scheduledDate || bk.scheduled_date, bk.scheduledTime || bk.scheduled_time]
                      .filter(Boolean)
                      .join(' · ') || bk.schedule || 'Immediate Dispatch'}
                  </div>
                </div>
              </div>

              {bk?.applianceName && (
                <div style={detailRowStyle}>
                  <AppIcon name="wrench" size={15} color="#2563eb" />
                  <div style={{ flex: 1 }}>
                    <div style={detailLabelStyle}>Registered Appliance</div>
                    <div style={detailValueStyle}>{bk.applianceName}</div>
                  </div>
                </div>
              )}

              <div style={detailRowStyle}>
                <AppIcon name="file-text" size={15} color="#2563eb" />
                <div style={{ flex: 1 }}>
                  <div style={detailLabelStyle}>Reported Issue</div>
                  <div style={detailValueStyle}>{bk?.issue || bk?.issue_description || 'Standard repair & maintenance'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Post-Service Ratings & Feedback */}
          {bk?.status === 'BOOKING_COMPLETED' && (
            <div style={ratingBoxWrapStyle}>
              {bk?.user_rating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#78350f' }}>Your Submitted Rating</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>
                      {'★'.repeat(bk.user_rating)} ({bk.user_rating}/5)
                    </span>
                  </div>
                  {bk.user_feedback ? (
                    <div style={{ fontSize: '12.5px', color: '#451a03', fontStyle: 'italic' }}>
                      &ldquo;{bk.user_feedback}&rdquo;
                    </div>
                  ) : null}
                  <button
                    type="button"
                    style={{ ...openRateBtnStyle, background: '#f59e0b', color: '#ffffff', border: 'none', alignSelf: 'flex-start', marginTop: '6px' }}
                    onClick={() => navigate(`/user/bookings/${bk.booking_id}/rate`)}
                  >
                    View Review Summary →
                  </button>
                </div>
              ) : Boolean(bk?.service_review && !bk?.provider_review) ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#581c87' }}>Complete Technician Evaluation</div>
                    <div style={{ fontSize: '11.5px', color: '#7e22ce' }}>Service review recorded. Please evaluate technician {bk?.provider_name || 'partner'}.</div>
                  </div>
                  <button
                    type="button"
                    style={{ ...openRateBtnStyle, background: '#7c3aed', color: '#ffffff', border: 'none' }}
                    onClick={() => navigate(`/user/bookings/${bk.booking_id}/rate`)}
                  >
                    Rate Technician ★
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#78350f' }}>Rate Your Experience</div>
                    <div style={{ fontSize: '11.5px', color: '#92400e' }}>Rate service quality and field technician</div>
                  </div>
                  <button
                    type="button"
                    style={openRateBtnStyle}
                    onClick={() => navigate(`/user/bookings/${bk.booking_id}/rate`)}
                  >
                    Rate Service & Pro ★
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Declined Consultation Notice */}
          {bk?.status === 'ESTIMATE_REJECTED' && (
            <div style={declinedNoticeWrapStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📋</span>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                  {isConsultationBk ? 'Consultation Concluded (₹0 Charged)' : 'Estimate Declined'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', lineHeight: '18px' }}>
                {isConsultationBk
                  ? 'You chose not to proceed with the repair. In accordance with our free consultation guarantee, no inspection fee was charged to your account.'
                  : 'The repair estimate was rejected. You can request another visit anytime from our catalog.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decline Confirmation Modal */}
      {showDeclineConfirmModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '8px' }}>📋</div>
            <h3 style={modalTitleStyle}>Decline Repair Quote?</h3>
            <p style={modalMessageStyle}>
              Your on-site diagnostic visit is completely free.
              <br /><br />
              If you decline this repair quote, no visitation fee will be charged (₹0 Charged). The technician will pack up and conclude the consultation with ₹0 due.
            </p>
            <div style={modalBtnRowStyle}>
              <button
                type="button"
                style={modalCancelBtnStyle}
                onClick={() => setShowDeclineConfirmModal(false)}
              >
                Keep Quote
              </button>
              <button
                type="button"
                style={modalConfirmBtnStyle}
                onClick={handleConfirmDecline}
              >
                Confirm Decline (₹0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS Hover and Transitions */}
      <style>{`
        .zc-desktop-btn-secondary {
          transition: all 0.2s ease;
        }
        .zc-desktop-btn-secondary:hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
      `}</style>
    </div>
  );
}

// ---------------- STYLES OBJECTS ----------------

const wrapperStyle = {
  width: '100%',
  paddingTop: '24px',
  paddingBottom: '80px',
  boxSizing: 'border-box',
  fontFamily: "'Inter', -apple-system, sans-serif",
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '26px',
};

const backBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '36px',
  padding: '0 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '12px',
};

const pageTitleStyle = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#0f172a',
  letterSpacing: '-0.7px',
  margin: 0,
  lineHeight: 1.2,
};

const subtextRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '6px',
  fontSize: '13.5px',
};

const idTagStyle = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  padding: '2px 8px',
  borderRadius: '6px',
  fontWeight: '700',
  color: '#475569',
  fontSize: '12px',
};

const statusBadgeStyle = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '0.5px',
  padding: '4px 10px',
  borderRadius: '999px',
  backgroundColor: bg,
  color: color,
});

const statusDotStyle = (color) => ({
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: color,
});

const invoiceBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '40px',
  padding: '0 16px',
  borderRadius: '10px',
  border: '1px solid #bfdbfe',
  backgroundColor: '#ffffff',
  color: '#1d4ed8',
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
};

const helpBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '40px',
  padding: '0 16px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
};

const splitGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.18fr) minmax(0, 0.82fr)',
  gap: '28px',
  alignItems: 'start',
  width: '100%',
};

const leftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: 0,
};

const rightColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: 0,
  position: 'sticky',
  top: '20px',
};

const cardWrapStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  border: '1.5px solid #e2e8f0',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
  boxSizing: 'border-box',
};

const cardHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
};

const cardHeaderTitleStyle = {
  fontSize: '13px',
  fontWeight: '800',
  color: '#0f172a',
  letterSpacing: '0.4px',
};

const pulseDotLiveStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#16a34a',
  boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.25)',
};

const etaBadgeStyle = {
  fontSize: '11.5px',
  fontWeight: '700',
  color: '#1d4ed8',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  padding: '3px 8px',
  borderRadius: '6px',
};

const verifiedBadgeStyle = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#15803d',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  padding: '3px 8px',
  borderRadius: '6px',
};

const techProfileRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '4px 0',
};

const techAvatarStyle = {
  width: '54px',
  height: '54px',
  borderRadius: '16px',
  backgroundColor: '#e2e8f0',
};

const techNameStyle = {
  fontSize: '16px',
  fontWeight: '800',
  color: '#0f172a',
  margin: 0,
};

const ratingPillStyle = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#b45309',
  backgroundColor: '#fef3c7',
  padding: '2px 6px',
  borderRadius: '4px',
};

const techSpecialtyStyle = {
  fontSize: '12.5px',
  color: '#64748b',
};

const techPhoneStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#2563eb',
};

const callTechBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '36px',
  padding: '0 14px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '12.5px',
  fontWeight: '700',
  cursor: 'pointer',
};

const chatTechBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '36px',
  padding: '0 14px',
  borderRadius: '10px',
  border: '1px solid #bfdbfe',
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  fontSize: '12.5px',
  fontWeight: '700',
  cursor: 'pointer',
};

const stageCounterStyle = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#1d4ed8',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  padding: '3px 9px',
  borderRadius: '99px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const timelineContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '6px',
};

const timelineRowStyle = {
  display: 'flex',
  gap: '14px',
};

const timelineLeftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '28px',
};

const timelineDotStyle = {
  width: '22px',
  height: '22px',
  borderRadius: '11px',
  borderStyle: 'solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  fontWeight: '800',
  zIndex: 2,
};

const timelineConnectorStyle = {
  width: '2px',
  flex: 1,
  minHeight: '22px',
};

const activeNowBadgeStyle = {
  fontSize: '8.5px',
  fontWeight: '800',
  color: '#ffffff',
  backgroundColor: '#2563eb',
  padding: '2px 7px',
  borderRadius: '99px',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const estimateCardWrapStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  border: '2px solid #fde68a',
  padding: '22px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  boxShadow: '0 10px 28px rgba(217, 119, 6, 0.08)',
  boxSizing: 'border-box',
};

const estimateHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
};

const estimateIconStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const estimateTitleStyle = {
  fontSize: '16px',
  fontWeight: '800',
  color: '#92400e',
  margin: 0,
};

const estimateSubStyle = {
  fontSize: '12px',
  color: '#b45309',
  margin: '2px 0 0 0',
  lineHeight: '16px',
};

const freeDiagnosisBadgeStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  backgroundColor: '#f0fdf4',
  border: '1.2px solid #86efac',
  borderRadius: '12px',
  padding: '10px 12px',
};

const amcCoveredBadgeStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  backgroundColor: '#0a192f',
  border: '1.2px solid #d4af37',
  borderRadius: '12px',
  padding: '10px 12px',
};

const findingsBoxStyle = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '10px 12px',
};

const billTableStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const billRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '13px',
};

const billLabelStyle = {
  color: '#475569',
  fontSize: '12.5px',
};

const billValStyle = {
  color: '#0f172a',
  fontWeight: '700',
  fontSize: '13px',
};

const billDividerStyle = {
  height: '1px',
  backgroundColor: '#cbd5e1',
  margin: '4px 0',
};

const billTotalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '2px',
};

const billTotalLabelStyle = {
  fontSize: '13px',
  fontWeight: '800',
  color: '#0f172a',
};

const billTotalValStyle = {
  fontSize: '18px',
  fontWeight: '800',
  color: '#0f172a',
};

const payChoiceCardStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '10px',
  border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
  backgroundColor: active ? '#eff6ff' : '#ffffff',
  cursor: 'pointer',
});

const radioCircleStyle = (active) => ({
  width: '18px',
  height: '18px',
  borderRadius: '9px',
  border: active ? '2px solid #2563eb' : '1.5px solid #94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const radioDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#2563eb',
};

const approveBtnStyle = {
  height: '44px',
  borderRadius: '12px',
  backgroundColor: '#0a192f',
  border: '1.5px solid #d4af37',
  color: '#fbbf24',
  fontSize: '13.5px',
  fontWeight: '800',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(10, 25, 47, 0.25)',
};

const declineBtnStyle = {
  height: '38px',
  borderRadius: '10px',
  backgroundColor: 'transparent',
  border: '1px solid #cbd5e1',
  color: '#64748b',
  fontSize: '12.5px',
  fontWeight: '600',
  cursor: 'pointer',
};

const billErrorStyle = {
  color: '#dc2626',
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'center',
};

const otpCardWrapStyle = {
  backgroundColor: '#eff6ff',
  borderRadius: '16px',
  border: '1.5px solid #bfdbfe',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const otpPillBoxStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #2563eb',
  padding: '6px 14px',
  borderRadius: '10px',
  color: '#1d4ed8',
  fontSize: '18px',
  fontWeight: '900',
  letterSpacing: '3px',
};

const payDueBannerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  padding: '8px 12px',
  borderRadius: '8px',
};

const categoryTagStyle = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#2563eb',
  backgroundColor: '#eff6ff',
  padding: '3px 8px',
  borderRadius: '6px',
};

const detailRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
};

const detailLabelStyle = {
  fontSize: '11px',
  color: '#64748b',
  fontWeight: '500',
};

const detailValueStyle = {
  fontSize: '13px',
  color: '#0f172a',
  fontWeight: '600',
  marginTop: '1px',
};

const warrantyGuaranteeBoxStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '10px 12px',
  marginTop: '6px',
};

const ratingBoxWrapStyle = {
  backgroundColor: '#fffbeb',
  borderRadius: '16px',
  border: '1px solid #fde68a',
  padding: '16px',
};

const openRateBtnStyle = {
  padding: '8px 14px',
  borderRadius: '8px',
  backgroundColor: '#b45309',
  border: 'none',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const declinedNoticeWrapStyle = {
  backgroundColor: '#f8fafc',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  padding: '16px',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '28px',
  maxWidth: '440px',
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
};

const modalTitleStyle = {
  fontSize: '18px',
  fontWeight: '800',
  color: '#0f172a',
  margin: '0 0 8px 0',
};

const modalMessageStyle = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '20px',
  margin: '0 0 20px 0',
};

const modalBtnRowStyle = {
  display: 'flex',
  gap: '12px',
};

const modalCancelBtnStyle = {
  flex: 1,
  height: '42px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#475569',
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
};

const modalConfirmBtnStyle = {
  flex: 1.3,
  height: '42px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
};
