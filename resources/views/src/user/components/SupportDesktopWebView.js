import React, { useRef, useEffect } from 'react';

export default function SupportDesktopWebView({
  activeUser,
  userMessages = [],
  isTyping = false,
  inputText = '',
  setInputText,
  sendMessage,
  handleFileUpload,
  handleOpenDocument,
  handleDownloadDocument,
  isGuest = false,
  setShowGuestModal,
  onNavigate,
  bookings = [],
  QUICK_REPLIES = [],
  showEmojiPicker = false,
  setShowEmojiPicker,
  handleSelectEmoji,
  fileInputRef,
  isRecording = false,
  recordingSeconds = 0,
  toggleVoiceRecording,
  setIsRecording,
}) {
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages, isTyping]);

  // Find latest active or upcoming booking for quick context card
  const latestBooking = bookings && bookings.length > 0 ? bookings[0] : null;

  const handleQuickSend = (text) => {
    if (isGuest && setShowGuestModal) {
      setShowGuestModal(true);
      return;
    }
    if (sendMessage) {
      sendMessage(text);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (isGuest && setShowGuestModal) {
      setShowGuestModal(true);
      return;
    }
    sendMessage(inputText.trim());
  };

  return (
    <div className="support-desktop-web-wrap" style={wrapperStyle}>
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div style={headerRowStyle}>
        <div style={headerLeftColStyle}>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={backBtnStyle}
            onClick={() => onNavigate ? onNavigate('/user/home') : (window.location.href = '/user/home')}
            title="Back to Home"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Home</span>
          </button>
          <div style={{ marginTop: '12px' }}>
            <h1 style={pageTitleStyle}>24/7 Operations Helpdesk & Live Support</h1>
            <p style={pageSubtextStyle}>
              Direct priority channel to Zevota Care dispatchers, technicians, and customer success specialists.
            </p>
          </div>
        </div>

        <div style={headerRightColStyle}>
          <div style={deskStatusPillStyle}>
            <span style={pulseGreenDotStyle} />
            <span style={{ fontWeight: 800, color: '#059669' }}>Live Operations Active</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#475569', fontWeight: 600 }}>Avg. Response &lt; 2 mins</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CONCIERGE GRID */}
      <div style={mainGridStyle}>
        {/* ========================================================= */}
        {/* LEFT COLUMN: Operations Desk Hub & Quick Actions (350px) */}
        {/* ========================================================= */}
        <aside style={leftColStyle}>
          {/* Card A: Desk Officer & Hotline */}
          <div style={conciergeCardStyle}>
            <div style={conciergeHeaderStyle}>
              <div style={conciergeAvatarStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div>
                <div style={deskBadgeStyle}>Dedicated Support Desk</div>
                <div style={deskTitleStyle}>Zevota Central Desk</div>
                <div style={deskIdStyle}>Station ID: ZEV-OPS-BLR</div>
              </div>
            </div>

            <p style={deskDescStyle}>
              Assisting with immediate service dispatch, technician arrival tracking, parts approval, and billing assistance.
            </p>

            <div style={statsRowStyle}>
              <div style={statBoxStyle}>
                <span style={statValStyle}>24x7</span>
                <span style={statLabelStyle}>Availability</span>
              </div>
              <div style={statDividerStyle} />
              <div style={statBoxStyle}>
                <span style={statValStyle}>100%</span>
                <span style={statLabelStyle}>Resolution Rate</span>
              </div>
              <div style={statDividerStyle} />
              <div style={statBoxStyle}>
                <span style={statValStyle}>~90s</span>
                <span style={statLabelStyle}>Avg Reply</span>
              </div>
            </div>

            <a
              href="tel:+919876543210"
              style={callHotlineBtnStyle}
              className="zc-support-call-btn"
              title="Call Helpline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call Helpline: +91 98765 43210</span>
            </a>
          </div>

          {/* Card B: Active Booking Reference Context */}
          {latestBooking && (
            <div style={bookingContextCardStyle}>
              <div style={bookingCardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={bookingIconWrapStyle}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </span>
                  <div>
                    <div style={bookingCardTitleStyle}>Recent Active Booking</div>
                    <div style={bookingIdStyle}>#{latestBooking.id || latestBooking.booking_id || 'BK-ACTIVE'}</div>
                  </div>
                </div>
                <span style={bookingStatusPillStyle(latestBooking.status)}>
                  {latestBooking.status || 'In Progress'}
                </span>
              </div>

              <div style={bookingDetailTextStyle}>
                {latestBooking.service_name || latestBooking.category || 'Home Maintenance Service'}
                {latestBooking.slot ? ` • ${latestBooking.slot}` : ''}
              </div>

              <button
                type="button"
                style={askAboutBookingBtnStyle}
                className="zc-support-quick-action-btn"
                onClick={() => handleQuickSend(`Regarding my booking #${latestBooking.id || latestBooking.booking_id || 'BK'}: What is the status of my technician?`)}
              >
                <span>Track Technician for this Booking</span>
                <span style={{ fontSize: '14px' }}>→</span>
              </button>
            </div>
          )}

          {/* Card C: Quick Topic FAQs */}
          <div style={faqCardStyle}>
            <div style={faqCardHeaderStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={faqCardTitleStyle}>Frequently Asked Topics</span>
            </div>

            <div style={faqListStyle}>
              {QUICK_REPLIES.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={faqItemBtnStyle}
                  className="zc-support-faq-btn"
                  onClick={() => handleQuickSend(q)}
                >
                  <span style={faqItemDotStyle} />
                  <span style={faqItemTextStyle}>{q}</span>
                  <span style={faqItemArrowStyle}>›</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: The Luxury Live Chat Console                */}
        {/* ========================================================= */}
        <section style={chatConsoleContainerStyle}>
          {/* Chat Console Top Bar */}
          <div style={chatTopBarStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={agentAvatarStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span style={agentLivePipStyle} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={chatConsoleTitleStyle}>Zevota Operations Desk</span>
                  <span style={verifiedBadgeStyle}>Verified Staff</span>
                </div>
                <div style={chatConsoleSubStyle}>
                  Direct Operations Dispatch • End-to-end encrypted session
                </div>
              </div>
            </div>

            <div style={chatTopBarRightStyle}>
              <div style={encryptionChipStyle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Encrypted Channel</span>
              </div>
            </div>
          </div>

          {/* Quick Suggestions Ribbon */}
          <div style={quickSuggestionsRibbonStyle}>
            <span style={quickSuggestionsLabelStyle}>Quick Inquiries:</span>
            <div style={quickChipsRowStyle}>
              {QUICK_REPLIES.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={quickChipBtnStyle}
                  className="zc-support-quick-chip"
                  onClick={() => handleQuickSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream Area */}
          <div style={messagesStreamStyle}>
            {/* System Security Notice Card */}
            <div style={systemNoticeCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={systemNoticeTextStyle}>
                  This conversation is secured and linked to your active Zevota Care account ({activeUser?.name || 'Customer'}).
                </span>
              </div>
            </div>

            {/* Empty state welcome if no messages */}
            {(!userMessages || userMessages.length === 0) && (
              <div style={emptyChatStyle}>
                <div style={emptyChatIconStyle}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h4 style={emptyChatTitleStyle}>Welcome to Zevota Live Support</h4>
                <p style={emptyChatSubStyle}>
                  How can our operations desk help you today? Pick one of the quick suggestions above or write below.
                </p>
              </div>
            )}

            {/* Message Bubbles */}
            {userMessages.map((msg) => {
              const isMe = msg.senderType === 'user';
              const isDoc = msg.msgType === 'document' || msg.fileName;

              return (
                <div
                  key={msg.id}
                  style={isMe ? messageRowRightStyle : messageRowLeftStyle}
                >
                  {!isMe && (
                    <div style={messageSenderAvatarStyle}>
                      <span>ZO</span>
                    </div>
                  )}

                  <div style={isMe ? bubbleRightStyle : bubbleLeftStyle}>
                    {!isMe && (
                      <div style={bubbleSenderTagStyle}>
                        <span>{msg.sender || 'Zevota Operations'}</span>
                        <span style={bubbleRoleBadgeStyle}>Ops Lead</span>
                      </div>
                    )}

                    {isDoc ? (
                      <div
                        style={docAttachmentCardStyle(isMe)}
                        onClick={() => handleOpenDocument && handleOpenDocument(msg)}
                        title="Click to preview document"
                      >
                        <div style={docIconWrapStyle(isMe)}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={docFileNameStyle(isMe)}>{msg.fileName || msg.text}</div>
                          <div style={docMetaTextStyle(isMe)}>
                            {msg.fileSize || 'Attachment'} • {msg.fileExt || 'DOC'} • Click to view
                          </div>
                        </div>
                        <div style={docActionWrapStyle(isMe)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div style={bubbleTextStyle(isMe)}>{msg.text}</div>
                    )}

                    <div style={bubbleMetaRowStyle(isMe)}>
                      <span style={bubbleTimeStyle(isMe)}>{msg.time}</span>
                      {isMe && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Operations Typing Indicator */}
            {isTyping && (
              <div style={messageRowLeftStyle}>
                <div style={messageSenderAvatarStyle}>
                  <span>ZO</span>
                </div>
                <div style={typingBubbleStyle}>
                  <div style={typingDotAnimStyle(0)} />
                  <div style={typingDotAnimStyle(1)} />
                  <div style={typingDotAnimStyle(2)} />
                  <span style={typingTextStyle}>Operations is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Emoji Tray Popover */}
          {showEmojiPicker && (
            <div style={emojiTrayPopoverStyle}>
              {['😊', '👍', '👋', '❤️', '🙏', '🔧', '📍', '💳', '🏠', '⚡', '💧', '✅'].map((e, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={emojiCellBtnStyle}
                  onClick={() => handleSelectEmoji && handleSelectEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv,.zip"
            onChange={handleFileUpload}
          />

          {/* Chat Composer Input Bar */}
          <div style={composerWrapStyle}>
            {isRecording ? (
              <div style={recordingCapsuleStyle}>
                <div style={recordingDotStyle} />
                <span style={recordingTimerTextStyle}>
                  Recording voice inquiry... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
                <button
                  type="button"
                  style={cancelRecordingBtnStyle}
                  onClick={() => setIsRecording && setIsRecording(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={sendRecordingBtnStyle}
                  onClick={() => toggleVoiceRecording && toggleVoiceRecording()}
                >
                  Send Voice Note
                </button>
              </div>
            ) : (
              <form onSubmit={handleInputSubmit} style={composerFormStyle}>
                {/* Attachment Button */}
                <button
                  type="button"
                  style={composerActionIconBtnStyle}
                  title="Attach document or bill (PDF, DOC, Images)"
                  onClick={() => fileInputRef?.current?.click()}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                {/* Emoji Tray Toggle */}
                <button
                  type="button"
                  style={composerActionIconBtnStyle}
                  title="Emoji picker"
                  onClick={() => setShowEmojiPicker && setShowEmojiPicker(!showEmojiPicker)}
                >
                  <span style={{ fontSize: '18px' }}>😊</span>
                </button>

                {/* Main Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText && setInputText(e.target.value)}
                  placeholder="Type your message or ask a question..."
                  style={composerInputStyle}
                />

                {/* Voice Note Simulation Toggle (if empty) */}
                {!inputText.trim() && (
                  <button
                    type="button"
                    style={composerActionIconBtnStyle}
                    title="Record voice note"
                    onClick={() => toggleVoiceRecording && toggleVoiceRecording()}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  style={sendBtnStyle(Boolean(inputText.trim()))}
                  className="zc-support-send-btn"
                  title="Send message"
                >
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Send</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* STYLES: Modern Luxury 2-Column Desktop Support Web View                  */
/* ========================================================================= */

const wrapperStyle = {
  width: '100%',
  paddingTop: '24px',
  paddingBottom: '48px',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
  boxSizing: 'border-box',
};

const headerRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '24px',
  marginBottom: '26px',
  flexWrap: 'wrap',
};

const headerLeftColStyle = {
  flex: 1,
  minWidth: '320px',
};

const headerRightColStyle = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: '8px',
};

const backBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1px solid #bfdbfe',
  borderRadius: '12px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 2px 6px rgba(8, 120, 248, 0.08)',
};

const pageTitleStyle = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#0f172a',
  letterSpacing: '-0.8px',
  margin: '0 0 6px 0',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const pageSubtextStyle = {
  fontSize: '14.5px',
  color: '#64748b',
  lineHeight: 1.5,
  margin: 0,
  maxWidth: '720px',
};

const deskStatusPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#ffffff',
  border: '1.2px solid #e2e8f0',
  borderRadius: '30px',
  padding: '8px 18px',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
  fontSize: '13px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const pulseGreenDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#10b981',
  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
};

/* 2-Column Grid */
const mainGridStyle = {
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  gap: '28px',
  alignItems: 'start',
};

const leftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

/* Concierge Card */
const conciergeCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '22px',
  padding: '24px',
  border: '1.5px solid rgba(226, 232, 240, 0.9)',
  boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(15, 23, 42, 0.02)',
  boxSizing: 'border-box',
};

const conciergeHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '16px',
};

const conciergeAvatarStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #0878f8 0%, #0256c7 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 16px rgba(8, 120, 248, 0.3)',
  flexShrink: 0,
};

const deskBadgeStyle = {
  fontSize: '10.5px',
  fontWeight: 800,
  color: '#0878f8',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  fontFamily: "'Inter', sans-serif",
};

const deskTitleStyle = {
  fontSize: '17px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '1px 0 2px 0',
  fontFamily: "'Inter', sans-serif",
};

const deskIdStyle = {
  fontSize: '11px',
  color: '#64748b',
  fontWeight: 600,
};

const deskDescStyle = {
  fontSize: '13px',
  color: '#475569',
  lineHeight: 1.5,
  margin: '0 0 16px 0',
};

const statsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '12px 14px',
  marginBottom: '18px',
};

const statBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
};

const statValStyle = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#0878f8',
  fontFamily: "'Inter', sans-serif",
};

const statLabelStyle = {
  fontSize: '10px',
  color: '#64748b',
  fontWeight: 600,
  marginTop: '2px',
};

const statDividerStyle = {
  width: '1px',
  height: '24px',
  backgroundColor: '#e2e8f0',
};

const callHotlineBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#eff6ff',
  color: '#0878f8',
  border: '1.2px solid #bfdbfe',
  borderRadius: '14px',
  padding: '11px 16px',
  fontSize: '13px',
  fontWeight: 700,
  textDecoration: 'none',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.18s ease',
  boxSizing: 'border-box',
};

/* Booking Context Card */
const bookingContextCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '20px',
  border: '1.5px solid #dbeafe',
  boxShadow: '0 8px 24px -6px rgba(8, 120, 248, 0.08)',
  boxSizing: 'border-box',
};

const bookingCardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px',
};

const bookingIconWrapStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '10px',
  backgroundColor: '#eff6ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const bookingCardTitleStyle = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#0f172a',
  fontFamily: "'Inter', sans-serif",
};

const bookingIdStyle = {
  fontSize: '10.5px',
  color: '#64748b',
  fontWeight: 600,
};

const bookingStatusPillStyle = (status) => ({
  fontSize: '10.5px',
  fontWeight: 800,
  color: status === 'COMPLETED' ? '#059669' : '#0878f8',
  backgroundColor: status === 'COMPLETED' ? '#ecfdf5' : '#eff6ff',
  border: `1px solid ${status === 'COMPLETED' ? '#a7f3d0' : '#bfdbfe'}`,
  borderRadius: '8px',
  padding: '2px 8px',
});

const bookingDetailTextStyle = {
  fontSize: '12.5px',
  color: '#334155',
  fontWeight: 500,
  marginBottom: '12px',
};

const askAboutBookingBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#0878f8',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.16s ease',
  boxSizing: 'border-box',
};

/* FAQ Card */
const faqCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '20px',
  border: '1.5px solid rgba(226, 232, 240, 0.9)',
  boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.04)',
  boxSizing: 'border-box',
};

const faqCardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '14px',
};

const faqCardTitleStyle = {
  fontSize: '13.5px',
  fontWeight: 800,
  color: '#0f172a',
  fontFamily: "'Inter', sans-serif",
};

const faqListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const faqItemBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '9px 12px',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.15s ease',
  boxSizing: 'border-box',
};

const faqItemDotStyle = {
  width: '5px',
  height: '5px',
  borderRadius: '2.5px',
  backgroundColor: '#0878f8',
  flexShrink: 0,
};

const faqItemTextStyle = {
  fontSize: '12px',
  color: '#334155',
  fontWeight: 600,
  flex: 1,
  lineHeight: 1.35,
};

const faqItemArrowStyle = {
  fontSize: '14px',
  color: '#94a3b8',
  fontWeight: 700,
};

/* Chat Console (Right Panel) */
const chatConsoleContainerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  border: '1.5px solid rgba(226, 232, 240, 0.9)',
  boxShadow: '0 16px 40px -10px rgba(15, 23, 42, 0.07), 0 2px 8px rgba(15, 23, 42, 0.02)',
  display: 'flex',
  flexDirection: 'column',
  height: '740px',
  overflow: 'hidden',
  position: 'relative',
  boxSizing: 'border-box',
};

const chatTopBarStyle = {
  padding: '16px 24px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
};

const agentAvatarStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, #0878f8 0%, #0256c7 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  flexShrink: 0,
  boxShadow: '0 4px 12px rgba(8, 120, 248, 0.25)',
};

const agentLivePipStyle = {
  position: 'absolute',
  bottom: '-2px',
  right: '-2px',
  width: '10px',
  height: '10px',
  borderRadius: '5px',
  backgroundColor: '#10b981',
  border: '2px solid #ffffff',
};

const chatConsoleTitleStyle = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#0f172a',
  fontFamily: "'Inter', sans-serif",
};

const verifiedBadgeStyle = {
  fontSize: '10px',
  fontWeight: 700,
  color: '#0878f8',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '1px 6px',
};

const chatConsoleSubStyle = {
  fontSize: '11.5px',
  color: '#64748b',
  marginTop: '1px',
};

const chatTopBarRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const encryptionChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '20px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#059669',
};

/* Quick Suggestions Ribbon */
const quickSuggestionsRibbonStyle = {
  padding: '10px 20px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  overflowX: 'auto',
  flexShrink: 0,
};

const quickSuggestionsLabelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
  fontFamily: "'Inter', sans-serif",
};

const quickChipsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const quickChipBtnStyle = {
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '5px 12px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: "'Inter', sans-serif",
  boxShadow: '0 1px 3px rgba(8, 120, 248, 0.05)',
  transition: 'all 0.16s ease',
};

/* Messages Stream */
const messagesStreamStyle = {
  flex: 1,
  padding: '24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  backgroundColor: '#fbfcfd',
};

const systemNoticeCardStyle = {
  backgroundColor: '#eff6ff',
  border: '1px solid #dbeafe',
  borderRadius: '12px',
  padding: '8px 14px',
  alignSelf: 'center',
  maxWidth: '560px',
};

const systemNoticeTextStyle = {
  fontSize: '11.5px',
  color: '#1e40af',
  fontWeight: 500,
  textAlign: 'center',
};

const emptyChatStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  textAlign: 'center',
  margin: 'auto 0',
};

const emptyChatIconStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '28px',
  backgroundColor: '#eff6ff',
  border: '1.5px solid #bfdbfe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
};

const emptyChatTitleStyle = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 6px 0',
  fontFamily: "'Inter', sans-serif",
};

const emptyChatSubStyle = {
  fontSize: '13.5px',
  color: '#64748b',
  maxWidth: '420px',
  lineHeight: 1.5,
  margin: 0,
};

/* Bubble rows */
const messageRowLeftStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  alignSelf: 'flex-start',
  maxWidth: '78%',
};

const messageRowRightStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  gap: '10px',
  alignSelf: 'flex-end',
  maxWidth: '78%',
};

const messageSenderAvatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '10px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#0878f8',
  fontSize: '11px',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: '2px',
};

/* Bubbles */
const bubbleLeftStyle = {
  backgroundColor: '#ffffff',
  border: '1.2px solid #e2e8f0',
  borderRadius: '16px 16px 16px 4px',
  padding: '12px 16px',
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
  position: 'relative',
};

const bubbleRightStyle = {
  background: 'linear-gradient(135deg, #0878f8 0%, #0256c7 100%)',
  color: '#ffffff',
  borderRadius: '16px 16px 4px 16px',
  padding: '12px 16px',
  boxShadow: '0 4px 16px rgba(8, 120, 248, 0.25)',
  position: 'relative',
};

const bubbleSenderTagStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  fontWeight: 800,
  color: '#0878f8',
  marginBottom: '4px',
  fontFamily: "'Inter', sans-serif",
};

const bubbleRoleBadgeStyle = {
  fontSize: '9.5px',
  fontWeight: 700,
  color: '#475569',
  backgroundColor: '#f1f5f9',
  padding: '1px 6px',
  borderRadius: '6px',
};

const bubbleTextStyle = (isMe) => ({
  fontSize: '14px',
  lineHeight: 1.55,
  color: isMe ? '#ffffff' : '#0f172a',
  margin: 0,
  wordBreak: 'break-word',
});

const bubbleMetaRowStyle = (isMe) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '4px',
  marginTop: '6px',
});

const bubbleTimeStyle = (isMe) => ({
  fontSize: '10.5px',
  color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8',
  fontWeight: 500,
});

/* Documents in message */
const docAttachmentCardStyle = (isMe) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: isMe ? 'rgba(255, 255, 255, 0.14)' : '#f8fafc',
  border: isMe ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '10px 14px',
  cursor: 'pointer',
  minWidth: '240px',
  maxWidth: '320px',
  transition: 'all 0.16s ease',
});

const docIconWrapStyle = (isMe) => ({
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  backgroundColor: isMe ? 'rgba(255, 255, 255, 0.2)' : '#eff6ff',
  color: isMe ? '#ffffff' : '#0878f8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const docFileNameStyle = (isMe) => ({
  fontSize: '13px',
  fontWeight: 700,
  color: isMe ? '#ffffff' : '#0f172a',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: "'Inter', sans-serif",
});

const docMetaTextStyle = (isMe) => ({
  fontSize: '11px',
  color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#64748b',
  marginTop: '2px',
});

const docActionWrapStyle = (isMe) => ({
  color: isMe ? '#ffffff' : '#0878f8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

/* Typing Bubble */
const typingBubbleStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px 16px 16px 4px',
  padding: '10px 14px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const typingDotAnimStyle = (index) => ({
  width: '6px',
  height: '6px',
  borderRadius: '3px',
  backgroundColor: '#0878f8',
  animation: 'pulse 1.2s infinite ease-in-out',
  animationDelay: `${index * 0.2}s`,
});

const typingTextStyle = {
  fontSize: '12px',
  color: '#64748b',
  fontStyle: 'italic',
  marginLeft: '4px',
};

/* Emoji Tray Popover */
const emojiTrayPopoverStyle = {
  position: 'absolute',
  bottom: '76px',
  left: '24px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '16px',
  padding: '10px',
  display: 'flex',
  gap: '8px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
  zIndex: 100,
};

const emojiCellBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
  transition: 'transform 0.12s ease',
};

/* Composer Footer */
const composerWrapStyle = {
  padding: '16px 20px',
  backgroundColor: '#ffffff',
  borderTop: '1px solid #e2e8f0',
  flexShrink: 0,
};

const composerFormStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
};

const composerActionIconBtnStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#64748b',
  transition: 'all 0.15s ease',
  outline: 'none',
  flexShrink: 0,
};

const composerInputStyle = {
  flex: 1,
  height: '42px',
  padding: '0 16px',
  borderRadius: '12px',
  border: '1.5px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
};

const sendBtnStyle = (active) => ({
  height: '42px',
  padding: '0 20px',
  borderRadius: '12px',
  backgroundColor: active ? '#0878f8' : '#e2e8f0',
  color: active ? '#ffffff' : '#94a3b8',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  cursor: active ? 'pointer' : 'not-allowed',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 0.18s ease',
  boxShadow: active ? '0 4px 14px rgba(8, 120, 248, 0.35)' : 'none',
  flexShrink: 0,
});

/* Recording capsule */
const recordingCapsuleStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  backgroundColor: '#fef2f2',
  border: '1.2px solid #fecaca',
  borderRadius: '12px',
  padding: '8px 14px',
};

const recordingDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#dc2626',
  boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.25)',
};

const recordingTimerTextStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#dc2626',
  fontFamily: "'Inter', sans-serif",
};

const cancelRecordingBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#64748b',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
};

const sendRecordingBtnStyle = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 14px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};
