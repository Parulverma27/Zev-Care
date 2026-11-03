import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, useWindowDimensions, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import SupportDesktopWebView from '../components/SupportDesktopWebView';
import mammoth from 'mammoth';
import { classifySupportQuery, getQuickStartQuestions } from '../../utils/supportBot';

const QUICK_REPLIES = getQuickStartQuestions();

export default function LiveSupportScreen({ onNavigate }) {
  const { activeUser, chats, setChats, bookings, activeAmc, wallet } = useApp();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // In-app Document Viewer Modal States
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewDocVisible, setPreviewDocVisible] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');

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

  const [showGuestModal, setShowGuestModal] = useState(isGuest);

  const userId = isGuest ? null : activeUser?.id;
  const userName = activeUser?.name || 'User';
  const userMessages = (isGuest || !userId) ? [] : chats.filter((m) => m.user_id === userId);

  const handleNav = (path) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path);
  };

  const handleGoBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      if (navigate) navigate(-1);
      else if (onNavigate) onNavigate(-1);
    } else {
      handleNav('/user/home');
    }
  };

  const getFmtTime = () => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const handleDocumentClick = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeKb = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
       
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'DOC';
    const fileMime = file.type || (fileExt === 'PDF' ? 'application/pdf' : 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result;
      let fileUrl = '';
      try {
        fileUrl = URL.createObjectURL(file);
      } catch (err) {}

      const docMsg = {
        id: Date.now(),
        user_id: userId,
        sender: userName,
        senderType: 'user',
        msgType: 'document',
        fileName: file.name,
        fileSize: fileSizeKb,
        fileExt: fileExt,
        fileMime: fileMime,
        fileData: fileData,
        fileUrl: fileUrl,
        text: file.name,
        time: getFmtTime(),
        timestamp: Date.now(),
      };

      setChats((prev) => [...prev, docMsg]);

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botMsg = {
          id: Date.now() + 1,
          user_id: userId,
          sender: 'Zevota Operations',
          senderType: 'admin',
          text: `📎 Received document "${file.name}" (${fileSizeKb}). Our operations desk is reviewing it now.`,
          time: getFmtTime(),
          timestamp: Date.now(),
        };
        setChats((prev) => [...prev, botMsg]);
      }, 1200);
    };

    reader.readAsDataURL(file);
  };

  const handleOpenDocument = async (msg) => {
    let blobUrl = '';
    const ext = (msg.fileExt || (msg.fileName || '').split('.').pop() || '').toUpperCase();
    let mimeString = 'application/pdf';
    if (ext === 'PDF') {
      mimeString = 'application/pdf';
    } else if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(ext)) {
      mimeString = ext === 'JPG' ? 'image/jpeg' : `image/${ext.toLowerCase()}`;
    } else if (['TXT', 'CSV', 'JSON', 'LOG', 'MD', 'XML'].includes(ext)) {
      mimeString = 'text/plain;charset=utf-8';
    } else {
      mimeString = msg.fileMime || 'application/pdf';
    }

    let arrayBuffer = null;
    if (msg.fileData && typeof msg.fileData === 'string' && msg.fileData.includes(',')) {
      try {
        const byteString = atob(msg.fileData.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        arrayBuffer = ab;
        const blob = new Blob([ab], { type: mimeString });
        blobUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.error('Error opening fileData', e);
      }
    } else if (msg.fileUrl) {
      blobUrl = msg.fileUrl;
    }

    let extractedHtml = '';
    let extractedText = '';

    if (ext === 'DOCX' || ext === 'DOC') {
      if (arrayBuffer) {
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          extractedHtml = result.value;
        } catch (err) {
          console.error('Mammoth conversion error:', err);
        }
      }
    } else if (['TXT', 'CSV', 'JSON', 'MD', 'LOG'].includes(ext)) {
      if (msg.fileData && typeof msg.fileData === 'string') {
        try {
          extractedText = atob(msg.fileData.split(',')[1] || '');
        } catch (err) {}
      }
    }

    setPreviewDoc({ ...msg, extractedHtml, extractedText });
    setPreviewBlobUrl(blobUrl);
    setPreviewDocVisible(true);
  };

  const handleDownloadDocument = (msg) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    if (msg.fileData && typeof msg.fileData === 'string' && msg.fileData.includes(',')) {
      try {
        const byteString = atob(msg.fileData.split(',')[1]);
        const mimeString = msg.fileData.split(',')[0].split(':')[1]?.split(';')[0] || msg.fileMime || 'application/octet-stream';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = msg.fileName || msg.text || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (e) {
        console.error('Error downloading file', e);
      }
    }

    if (msg.fileUrl) {
      const a = document.createElement('a');
      a.href = msg.fileUrl;
      a.download = msg.fileName || msg.text || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const fallbackName = msg.fileName || (msg.text?.includes('.') ? msg.text : `${msg.text || 'document'}.pdf`);
    const fallbackBlob = new Blob([`Zevota Care Document: ${fallbackName}\nFrom: ${msg.sender || 'Customer'}\nTime: ${msg.time}`], { type: 'text/plain;charset=utf-8' });
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    const a = document.createElement('a');
    a.href = fallbackUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sendMessage = (text, type = 'text') => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!text.trim()) return;

    // 1. Add User Message
    const newMsg = {
      id: Date.now(),
      user_id: userId,
      sender: userName,
      senderType: 'user',
      text: text,
      time: getFmtTime(),
      timestamp: Date.now()
    };
    setChats(prev => [...prev, newMsg]);
    setInputText('');

    // 2. Intelligent Auto-Support Classification & Dynamic Context
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let botMsg;

      if (type === 'voice') {
        botMsg = {
          id: Date.now() + 1,
          user_id: userId,
          sender: 'Senior Operations Desk',
          senderType: 'admin',
          text: '🎙️ Operations Desk: Received your voice recording. A support specialist is reviewing it and will follow up immediately.',
          time: getFmtTime(),
          timestamp: Date.now(),
          isEscalation: true,
        };
      } else {
        const classified = classifySupportQuery(text, {
          activeUser,
          bookings,
          activeAmc,
          wallet,
        });

        botMsg = {
          id: Date.now() + 1,
          user_id: userId,
          sender: classified.isEscalation ? 'Senior Operations Desk' : 'Zeva AI',
          senderType: classified.isEscalation ? 'admin' : 'bot',
          text: classified.replyText,
          suggestedQuestions: classified.suggestedQuestions,
          actionLink: classified.actionLink,
          actionText: classified.actionText,
          isEscalation: classified.isEscalation,
          time: getFmtTime(),
          timestamp: Date.now(),
        };
      }

      setChats((prev) => [...prev, botMsg]);
    }, 800);
  };

  // Timer for Voice Recording simulation
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleVoiceRecording = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (isRecording) {
      // Stop and Send simulated audio note
      const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;
      sendMessage(`🎙️ Voice Message (${durationStr})`, 'voice');
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
      setShowEmojiPicker(false);
      setShowAttachmentMenu(false);
    }
  };

  const handleSelectEmoji = (emoji) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [chats, isTyping]);

  const renderModals = () => (
    <>
      {/* Registration Required Modal for Guests */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowGuestModal(false);
          handleGoBack();
        }}
      >
        <View style={styles.guestModalOverlay}>
          <View style={styles.guestModalContent}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleGoBack();
              }}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.guestIconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={styles.guestModalTitle}>
              {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
            </Text>
            <Text style={styles.guestModalSub}>
              {isAnonymous
                ? 'Please register your account first to access Live Operations Support.'
                : 'Please complete your profile or log in with your mobile number to access Live Operations Support.'}
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestPrimaryBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestOutlineBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* IN-APP DOCUMENT PREVIEW MODAL */}
      <Modal
        visible={previewDocVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewDocVisible(false)}
      >
        <View style={styles.docModalOverlay}>
          <View style={styles.docModalCard}>
            {/* Header */}
            <View style={styles.docModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View style={styles.docModalIconBadge}>
                  <Text style={{ fontSize: 18 }}>📄</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.docModalTitle} numberOfLines={1}>
                    {previewDoc?.fileName || previewDoc?.text || 'Document Viewer'}
                  </Text>
                  <Text style={styles.docModalSub}>
                    {previewDoc?.fileSize || 'Standard File'} • {previewDoc?.fileExt || 'DOCUMENT'} • {previewDoc?.time || 'Today'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={styles.docModalDownloadBtn}
                  onPress={() => previewDoc && handleDownloadDocument(previewDoc)}
                  activeOpacity={0.85}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <Text style={styles.docModalDownloadBtnText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docModalCloseBtn}
                  onPress={() => setPreviewDocVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Viewer Content */}
            <View style={styles.docModalBody}>
              {(() => {
                if (!previewDoc) return null;
                const ext = (previewDoc.fileExt || (previewDoc.fileName || '').split('.').pop() || '').toUpperCase();
                const isPdf = ext === 'PDF' || (previewDoc.fileMime && previewDoc.fileMime.includes('pdf'));
                const isImg = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(ext) || (previewDoc.fileMime && previewDoc.fileMime.includes('image'));

                if (isPdf && previewBlobUrl) {
                  return (
                    <iframe
                      src={`${previewBlobUrl}#toolbar=1&navpanes=0`}
                      style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, backgroundColor: '#525659' }}
                      title="PDF Document Preview"
                    />
                  );
                }

                if (isImg && (previewBlobUrl || previewDoc.fileData)) {
                  return (
                    <View style={styles.docImageContainer}>
                      <img
                        src={previewBlobUrl || previewDoc.fileData}
                        alt="Document Preview"
                        style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 8 }}
                      />
                    </View>
                  );
                }

                if (previewDoc.extractedHtml) {
                  return (
                    <div style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: 10, borderWidth: '1px', borderColor: '#cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div
                        style={{
                          padding: '24px 32px',
                          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
                          fontSize: '14.5px',
                          lineHeight: '1.7',
                          color: '#1e293b',
                        }}
                        dangerouslySetInnerHTML={{ __html: previewDoc.extractedHtml }}
                      />
                    </div>
                  );
                }

                if (previewDoc.extractedText) {
                  return (
                    <div style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: 10, borderWidth: '1px', borderColor: '#cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <pre style={{ margin: 0, padding: '20px 24px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#1e293b' }}>
                        {previewDoc.extractedText}
                      </pre>
                    </div>
                  );
                }

                return (
                  <View style={styles.docOfficeViewerContainer}>
                    <View style={styles.docOfficeCard}>
                      <View style={styles.docOfficeHeaderRow}>
                        <View style={styles.docOfficeIconCircle}>
                          <Text style={{ fontSize: 26 }}>📑</Text>
                        </View>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={styles.docOfficeName}>
                            {previewDoc.fileName || previewDoc.text}
                          </Text>
                          <Text style={styles.docOfficeMeta}>
                            Format: {ext} • Size: {previewDoc.fileSize || 'Standard'} • Verified Clean
                          </Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedBadgeText}>✓ Ready to View</Text>
                        </View>
                      </View>

                      <View style={styles.docPreviewPaper}>
                        <View style={styles.paperHeader}>
                          <Text style={styles.paperOrgTitle}>ZEVOTA CARE DOCUMENT VIEWER</Text>
                          <Text style={styles.paperDateText}>{previewDoc.time || 'Today'}</Text>
                        </View>
                        <View style={styles.paperDivider} />
                        <Text style={styles.paperDocHeading}>Document Summary & Inspection</Text>
                        <Text style={styles.paperBodyText}>
                          • File Name: {previewDoc.fileName || previewDoc.text}
                        </Text>
                        <Text style={styles.paperBodyText}>
                          • Sender: {previewDoc.sender || userName}
                        </Text>
                        <Text style={styles.paperBodyText}>
                          • Type: Official Document Attachment ({ext})
                        </Text>
                        <Text style={styles.paperBodyText}>
                          • Time Sent: {previewDoc.time || 'Active Session'}
                        </Text>

                        <View style={styles.paperCallout}>
                          <Text style={styles.paperCalloutText}>
                            💡 Viewing in preview mode without downloading. Click Download above if you need a local copy.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  // Desktop Web Layout (Zevota 2-Column Luxury Operations Desk)
  if (isDesktop) {
    return (
      <View style={{ flex: 1, width: '100%', backgroundColor: 'transparent' }}>
        <SupportDesktopWebView
          activeUser={activeUser}
          userMessages={userMessages}
          isTyping={isTyping}
          inputText={inputText}
          setInputText={setInputText}
          sendMessage={sendMessage}
          handleFileUpload={handleFileUpload}
          handleOpenDocument={handleOpenDocument}
          handleDownloadDocument={handleDownloadDocument}
          isGuest={isGuest}
          setShowGuestModal={setShowGuestModal}
          onNavigate={handleNav}
          bookings={bookings}
          QUICK_REPLIES={QUICK_REPLIES}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          handleSelectEmoji={handleSelectEmoji}
          fileInputRef={fileInputRef}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          toggleVoiceRecording={toggleVoiceRecording}
          setIsRecording={setIsRecording}
        />
        {renderModals()}
      </View>
    );
  }

  // Modern Luxury Web-Inspired Operations Desk Layout
  return (
    <View style={styles.container}>
      
      {/* Web Style Luxury Operations Desk Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7} title="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Zevota Support</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus} numberOfLines={1}>Operations Desk • Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.humanHandoverBtn}
          onPress={() => sendMessage('Speak with Live Executive')}
          activeOpacity={0.8}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          <Text style={styles.humanHandoverBtnText}>Human Desk</Text>
        </TouchableOpacity>
      </View>

      {/* Web Style Quick Inquiries Carousel */}
      <View style={styles.quickRowContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScrollContent}>
          <Text style={styles.quickInquiriesLabel}>QUICK INQUIRIES:</Text>
          {QUICK_REPLIES.map((q) => (
            <TouchableOpacity key={q} style={styles.quickReplyChip} onPress={() => sendMessage(q)} activeOpacity={0.85}>
              <Text style={styles.quickReplyText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Web Style Messages Stream Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatBackground}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.encryptionNotice}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <Text style={styles.encryptionText}>
            This conversation is secured and linked to your active Zevota Care account ({activeUser?.name || 'Customer'}).
          </Text>
        </View>

        {userMessages.map((msg) => {
          const isMe = msg.senderType === 'user';
          const isDoc = msg.msgType === 'document' || msg.fileName;
          return (
            <View key={msg.id} style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
              {!isMe && (
                <View style={styles.deskAvatar}>
                  <Text style={styles.deskAvatarText}>ZO</Text>
                </View>
              )}

              <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                {!isMe && (
                  <View style={styles.senderTagRow}>
                    <Text style={styles.senderLabel}>{msg.sender || 'Zevota Operations'}</Text>
                    <View style={styles.opsLeadBadge}>
                      <Text style={styles.opsLeadText}>Ops Lead</Text>
                    </View>
                  </View>
                )}
                
                {isDoc ? (
                  <TouchableOpacity
                    style={isMe ? styles.docMessageCardMe : styles.docMessageCardThem}
                    onPress={() => handleOpenDocument(msg)}
                    activeOpacity={0.7}
                  >
                    <View style={isMe ? styles.docIconBoxMe : styles.docIconBoxThem}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isMe ? '#0878f8' : '#2563eb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </View>
                    <View style={styles.docInfoCol}>
                      <Text style={isMe ? styles.docFileNameMe : styles.docFileNameThem} numberOfLines={2}>
                        {msg.fileName || msg.text}
                      </Text>
                      <Text style={isMe ? styles.docMetaTextMe : styles.docMetaTextThem}>
                        {msg.fileSize || '120 KB'} • {msg.fileExt || 'DOC'} • Click to view
                      </Text>
                    </View>
                    <View style={styles.docOpenIconBox}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isMe ? '#ffffff' : '#0878f8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text style={isMe ? styles.bubbleTextRight : styles.bubbleText}>{msg.text}</Text>

                    {/* Dynamic Action Button */}
                    {Boolean(msg.actionLink) && (
                      <TouchableOpacity
                        style={styles.botActionBtn}
                        onPress={() => handleNav(msg.actionLink)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.botActionBtnText}>{msg.actionText || 'Open →'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Clickable Follow-up Questions */}
                {Array.isArray(msg.suggestedQuestions) && msg.suggestedQuestions.length > 0 && (
                  <View style={styles.followUpWrap}>
                    <Text style={styles.followUpHeading}>Related questions:</Text>
                    <View style={styles.followUpGrid}>
                      {msg.suggestedQuestions.map((sq) => (
                        <TouchableOpacity
                          key={sq}
                          style={styles.followUpChip}
                          onPress={() => sendMessage(sq)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.followUpChipText}>{sq}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <Text style={isMe ? styles.timeTextRight : styles.timeText}>{msg.time}</Text>
                  {isMe && (
                    <View style={styles.ticksWrap}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L7 17l-5-5" />
                        <path d="M22 10l-7.5 7.5-2-2" />
                      </svg>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowLeft]}>
            <View style={styles.deskAvatar}>
              <Text style={styles.deskAvatarText}>ZO</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleLeft, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { opacity: 0.7 }]} />
              <View style={[styles.typingDot, { opacity: 0.4 }]} />
              <Text style={styles.typingIndicator}>Operations is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Interactive Floating Emoji Picker */}
      {showEmojiPicker && (
        <View style={styles.emojiTray}>
          {['😊', '👍', '👋', '❤️', '😂', '🔧', '📍', '💳', '❓', '🏠', '🧹', '📞'].map(e => (
            <TouchableOpacity key={e} style={styles.emojiIconCell} onPress={() => handleSelectEmoji(e)}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv,.zip"
        onChange={handleFileUpload}
      />

      {/* Interactive Floating Attachment Drawer - Document Only */}
      {showAttachmentMenu && (
        <View style={styles.attachmentDrawer}>
          <TouchableOpacity style={styles.attachCell} onPress={handleDocumentClick} activeOpacity={0.85}>
            <View style={styles.docAttachIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </View>
            <Text style={styles.attachLabel}>Document</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Web Style Chat Composer Input Bar */}
      <View style={styles.inputOuterContainer}>
        {isRecording ? (
          <View style={styles.recordingCapsule}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimer}>
              Recording voice inquiry... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity style={styles.cancelRecordingBtn} onPress={() => setIsRecording(false)}>
              <Text style={styles.cancelRecordingText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendVoiceBtn} onPress={toggleVoiceRecording}>
              <Text style={styles.sendVoiceBtnText}>Send Voice Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.composerFormRow}>
            {/* Paperclip attachment button */}
            <TouchableOpacity
              style={styles.composerActionIconBtn}
              onPress={handleDocumentClick}
              activeOpacity={0.7}
              title="Attach document"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </TouchableOpacity>

            {/* Emoji toggle */}
            <TouchableOpacity
              style={styles.composerActionIconBtn}
              onPress={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); }}
              activeOpacity={0.7}
              title="Add emoji"
            >
              <Text style={{ fontSize: 18 }}>😊</Text>
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              style={styles.chatTextInput}
              value={inputText}
              onChangeText={(t) => { setInputText(t); if (t) { setShowEmojiPicker(false); setShowAttachmentMenu(false); } }}
              placeholder="Type your message or ask a question..."
              placeholderTextColor="#94a3b8"
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
            />

            {/* Blue Web Send Button */}
            <TouchableOpacity
              style={styles.webSendBtn}
              onPress={() => {
                if (inputText.trim()) {
                  sendMessage(inputText);
                } else {
                  toggleVoiceRecording();
                }
              }}
              activeOpacity={0.85}
              title={inputText.trim() ? "Send message" : "Voice note"}
            >
              {inputText.trim() ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              ) : isRecording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                </svg>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderModals()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' },

  // Luxury Web Style Header
  topHeader: {
    height: 68,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0878f8',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(8,120,248,0.25)',
  },
  headerInfo: { justifyContent: 'center', flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', fontFamily: "'Outfit', 'Inter', sans-serif", letterSpacing: -0.2 },
  verifiedStaffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexShrink: 0,
  },
  verifiedStaffText: { color: '#0284c7', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a', flexShrink: 0 },
  headerStatus: { fontSize: 11, color: '#64748b', fontFamily: "'Outfit', 'Inter', sans-serif" },
  humanHandoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0878f8',
    flexShrink: 0,
  },
  humanHandoverBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },

  // Quick inquiries carousel
  quickRowContainer: { backgroundColor: '#ffffff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  quickScrollContent: { gap: 8, paddingHorizontal: 12, alignItems: 'center' },
  quickInquiriesLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5, marginRight: 2 },
  quickReplyChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  quickReplyText: { fontSize: 12, color: '#1e293b', fontWeight: '600', fontFamily: "'Outfit', 'Inter', sans-serif" },

  // Modern Web Stream Styling
  chatBackground: { flex: 1, backgroundColor: '#f8fafc' },
  chatContent: { padding: 14, paddingBottom: 24, gap: 12 },

  encryptionNotice: {
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 4,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  encryptionText: {
    fontSize: 11,
    color: '#1e40af',
    textAlign: 'center',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    fontWeight: '600',
    lineHeight: 15,
    flexShrink: 1,
  },

  deskAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  deskAvatarText: { color: '#0878f8', fontWeight: '800', fontSize: 11 },

  messageRow: { flexDirection: 'row', width: '100%' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start', alignItems: 'flex-start' },

  bubble: { maxWidth: '82%', padding: 12, paddingHorizontal: 14, borderRadius: 16, position: 'relative', minWidth: 70 },
  bubbleRight: {
    backgroundColor: '#0878f8',
    borderTopRightRadius: 4,
    boxShadow: '0 4px 12px rgba(8,120,248,0.22)',
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },

  senderTagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  senderLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a', fontFamily: "'Outfit', 'Inter', sans-serif" },
  opsLeadBadge: { backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1.5, marginLeft: 6 },
  opsLeadText: { color: '#475569', fontSize: 9.5, fontWeight: '700' },

  bubbleText: { fontSize: 13.5, color: '#0f172a', fontFamily: "'Outfit', 'Inter', sans-serif", lineHeight: 20 },
  bubbleTextRight: { fontSize: 13.5, color: '#ffffff', fontFamily: "'Outfit', 'Inter', sans-serif", lineHeight: 20 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  timeText: { fontSize: 10, color: '#94a3b8', fontFamily: "'Outfit', 'Inter', sans-serif" },
  timeTextRight: { fontSize: 10, color: '#bfdbfe', fontFamily: "'Outfit', 'Inter', sans-serif" },
  ticksWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Document Cards in Chat
  docMessageCardMe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    minWidth: 200,
    maxWidth: 290,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  docMessageCardThem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    minWidth: 200,
    maxWidth: 290,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docIconBoxMe: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  docIconBoxThem: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  docInfoCol: { flex: 1, minWidth: 0 },
  docFileNameMe: { fontSize: 12.5, fontWeight: '700', color: '#ffffff', fontFamily: "'Outfit', 'Inter', sans-serif", wordBreak: 'break-word' },
  docFileNameThem: { fontSize: 12.5, fontWeight: '700', color: '#0f172a', fontFamily: "'Outfit', 'Inter', sans-serif", wordBreak: 'break-word' },
  docMetaTextMe: { fontSize: 10.5, color: '#bfdbfe', fontFamily: "'Outfit', 'Inter', sans-serif", marginTop: 2 },
  docMetaTextThem: { fontSize: 10.5, color: '#64748b', fontFamily: "'Outfit', 'Inter', sans-serif", marginTop: 2 },
  docOpenIconBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0878f8' },
  typingIndicator: { fontSize: 12, fontStyle: 'italic', color: '#64748b', fontFamily: "'Outfit', 'Inter', sans-serif", marginLeft: 4 },

  // Emoji Tray Styling
  emojiTray: {
    position: 'absolute',
    bottom: 68,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 16,
    boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
    justifyContent: 'space-around',
    zIndex: 99,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emojiIconCell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Attachment Drawer
  attachmentDrawer: {
    position: 'absolute',
    bottom: 68,
    right: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    boxShadow: '0 6px 22px rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attachCell: { alignItems: 'center', gap: 4 },
  docAttachIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0878f8',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 8px rgba(8,120,248,0.3)',
  },
  attachLabel: { fontSize: 11, color: '#0f172a', fontWeight: '700', fontFamily: "'Outfit', 'Inter', sans-serif" },

  // Modern Web Composer
  inputOuterContainer: {
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
  },
  composerFormRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerActionIconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#f1f5f9' },
  chatTextInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    outlineStyle: 'none',
  },
  webSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0878f8',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(8,120,248,0.3)',
  },

  // Voice Note Recording view
  recordingCapsule: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#dc2626' },
  recordingTimer: { fontSize: 13, color: '#334155', fontWeight: '600', flex: 1, fontFamily: "'Outfit', 'Inter', sans-serif" },
  cancelRecordingBtn: { paddingHorizontal: 8 },
  cancelRecordingText: { fontSize: 12, fontWeight: '700', color: '#dc2626', fontFamily: "'Outfit', 'Inter', sans-serif" },
  sendVoiceBtn: { backgroundColor: '#0878f8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sendVoiceBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  // Guest Modal Styles
  guestModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  guestModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 14,
    alignItems: 'center',
    position: 'relative',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
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
  guestModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  guestModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  guestPrimaryBtn: {
    backgroundColor: '#0878f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    boxShadow: '0 2px 6px rgba(8,120,248,0.3)',
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  guestOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },

  // Document Preview Modal Styles
  docModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  docModalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90vh',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  docModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docModalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  docModalSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  docModalDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0878f8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    cursor: 'pointer',
  },
  docModalDownloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  docModalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  docModalBody: {
    padding: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  docImageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  docOfficeViewerContainer: {
    width: '100%',
  },
  docOfficeCard: {
    width: '100%',
    gap: 12,
  },
  docOfficeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docOfficeIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docOfficeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  docOfficeMeta: {
    fontSize: 11.5,
    color: '#64748b',
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  docPreviewPaper: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperOrgTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0878f8',
    letterSpacing: 0.8,
  },
  paperDateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  paperDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  paperDocHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  paperBodyText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 19,
  },
  paperCallout: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0878f8',
    padding: 12,
    borderRadius: 6,
  },
  paperCalloutText: {
    fontSize: 11.5,
    color: '#1e40af',
    lineHeight: 17,
    fontWeight: '500',
  },
  extractedTextWrap: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  extractedTextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  extractedTextScroll: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  extractedTextBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  humanHandoverBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  humanHandoverBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  botActionBtn: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botActionBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  followUpWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  followUpHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  followUpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  followUpChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  followUpChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
});
