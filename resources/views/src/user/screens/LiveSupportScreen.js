import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import mammoth from 'mammoth';

const QUICK_REPLIES = [
  'What services do you offer?',
  'How do I reschedule a booking?',
  'Track my technician',
  'Refund / Cancellation policy',
  'How to use wallet credits?',
];

const BOT_RESPONSES = {
  'What services do you offer?': '🔧 We offer Electrician, Plumbing, Carpentry, Home Appliance Repair, Furniture Repair, and Pest Control services — all across your city, 24/7.',
  'How do I reschedule a booking?': '📅 Please contact Live Support or raise a request from your booking detail screen. Our operations team will help you pick a new slot (up to 2 hours before arrival).',
  'Track my technician': '📍 Once your technician is assigned and sharing GPS, open your booking details to see live tracking on the map.',
  'Refund / Cancellation policy': '💰 Cancellations before 2 hours get a full wallet credit refund. Within 2 hours, a ₹99 convenience fee applies.',
  'How to use wallet credits?': '💳 Your wallet balance auto-applies when you approve a service bill. You can also add credit by purchasing a Care Plan.',
};

export default function LiveSupportScreen({ onNavigate }) {
  const { activeUser, chats, setChats } = useApp();
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

    // 2. Bot/Agent auto response simulation
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';
      if (type === 'voice') {
        replyText = '🎙️ Agent Voice Reply: Received your voice message! Give us a minute to review and get back to you.';
      } else {
        const isBotResponse = BOT_RESPONSES[text] || text.includes('?') || text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi');
        replyText = isBotResponse
          ? (BOT_RESPONSES[text] || '🤖 Zeva AI: I am here to help! Our operations team has also been notified and will reply shortly.')
          : '📥 Operations Agent: Got your request! We are checking your active bookings and will update you right here.';
      }

      const botMsg = {
        id: Date.now() + 1,
        user_id: userId,
        sender: type === 'voice' ? 'Zevota Operations' : 'Zeva Bot',
        senderType: type === 'voice' ? 'admin' : 'bot',
        text: replyText,
        time: getFmtTime(),
        timestamp: Date.now()
      };
      setChats(prev => [...prev, botMsg]);
    }, 1200);
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

  return (
    <View style={styles.container}>
      
      {/* WhatsApp Dark Green Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => handleNav('/user/profile')} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 20 }}>🟢</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>Zevota Operations Helpdesk</Text>
            <Text style={styles.headerStatus}>online</Text>
          </View>
        </View>
      </View>

      {/* Quick Replies Carousel */}
      <View style={styles.quickRowContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScrollContent}>
          {QUICK_REPLIES.map((q) => (
            <TouchableOpacity key={q} style={styles.quickReplyChip} onPress={() => sendMessage(q)} activeOpacity={0.85}>
              <Text style={styles.quickReplyText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* WhatsApp Chat Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatBackground}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.encryptionNotice, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
          <AppIcon name="lock" size={11} color="#594411" strokeWidth={2.2} />
          <Text style={[styles.encryptionText, { flexShrink: 1 }]}>Messages and calls are end-to-end encrypted. No one outside of this chat, not even ZevotaCare, can read or listen to them.</Text>
        </View>

        {userMessages.map((msg) => {
          const isMe = msg.senderType === 'user';
          const isDoc = msg.msgType === 'document' || msg.fileName;
          return (
            <View key={msg.id} style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
              <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                {!isMe && <Text style={styles.senderLabel}>{msg.sender}</Text>}
                
                {isDoc ? (
                  <TouchableOpacity
                    style={styles.docMessageCard}
                    onPress={() => handleOpenDocument(msg)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.docIconBox}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5f63f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </View>
                    <View style={styles.docInfoCol}>
                      <Text style={styles.docFileName} numberOfLines={2}>{msg.fileName || msg.text}</Text>
                      <Text style={styles.docMetaText}>
                        {msg.fileSize || '120 KB'} • {msg.fileExt || 'DOC'}
                      </Text>
                    </View>
                    <View style={styles.docOpenIconBox}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.bubbleText}>{msg.text}</Text>
                )}

                <View style={styles.metaRow}>
                  <Text style={styles.timeText}>{msg.time}</Text>
                  {isMe && (
                    <View style={styles.ticksWrap}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34b7f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
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
            <View style={[styles.bubble, styles.bubbleLeft]}>
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

      {/* WhatsApp Input Row */}
      <View style={styles.inputOuterContainer}>
        {isRecording ? (
          // Recording simulated view
          <View style={styles.recordingCapsule}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimer}>
              Recording Voice Note... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity style={styles.cancelRecordingBtn} onPress={() => setIsRecording(false)}>
              <Text style={styles.cancelRecordingText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainerCapsule}>
            {/* Emoji icon toggles emoji picker tray */}
            <TouchableOpacity style={styles.inputEmojiBtn} onPress={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); }}>
              <Text style={{ fontSize: 20 }}>😊</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.chatTextInput}
              value={inputText}
              onChangeText={(t) => { setInputText(t); if (t) { setShowEmojiPicker(false); setShowAttachmentMenu(false); } }}
              placeholder="Message"
              placeholderTextColor="#7f8c8d"
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
            />

            {/* Paperclip toggles attachment drawer */}
            <TouchableOpacity style={styles.clipBtn} onPress={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </TouchableOpacity>
          </View>
        )}

        {/* WhatsApp Round Green Mic / Send Button - Fully Interactive */}
        <TouchableOpacity
          style={[styles.micSendCircle, isRecording && styles.micCircleRecording]}
          onPress={() => {
            if (inputText.trim()) {
              sendMessage(inputText);
            } else {
              toggleVoiceRecording();
            }
          }}
          activeOpacity={0.85}
        >
          {inputText.trim() ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          ) : isRecording ? (
            // Stop icon to stop recording
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
            </svg>
          ) : (
            // Microphone icon to record voice note
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
            </svg>
          )}
        </TouchableOpacity>
      </View>

      {/* Registration Required Modal for Guests */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowGuestModal(false);
          handleNav('/user/profile');
        }}
      >
        <View style={styles.guestModalOverlay}>
          <View style={styles.guestModalContent}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/profile');
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

                // Fallback In-App Interactive Reader View
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ece5dd', display: 'flex', flexDirection: 'column' },

  // WhatsApp Header
  topHeader: {
    height: 64,
    backgroundColor: '#008069',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#ffffff', fontWeight: '700' },
  avatarWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  headerInfo: { justifyContent: 'center', flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', fontFamily: "'Outfit', 'Inter', sans-serif" },
  headerStatus: { fontSize: 11, color: '#e0f2f1', fontFamily: "'Outfit', 'Inter', sans-serif", marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  headerIcon: { padding: 4 },

  // Quick replies
  quickRowContainer: { backgroundColor: '#f6f6f6', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  quickScrollContent: { gap: 8, paddingHorizontal: 12 },
  quickReplyChip: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  quickReplyText: { fontSize: 12, color: '#008069', fontWeight: '700', fontFamily: "'Outfit', 'Inter', sans-serif" },

  // Wallpaper styling
  chatBackground: { flex: 1, backgroundColor: '#efeae2' },
  chatContent: { padding: 12, paddingBottom: 16, gap: 10 },

  encryptionNotice: { backgroundColor: '#ffe9a2', padding: 8, borderRadius: 8, marginHorizontal: 16, marginVertical: 4, alignSelf: 'center', width: '90%', borderWidth: 1, borderColor: '#ffd073' },
  encryptionText: { fontSize: 10.5, color: '#594411', textAlign: 'center', fontFamily: "'Outfit', 'Inter', sans-serif", lineHeight: 14 },

  messageRow: { flexDirection: 'row', width: '100%' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },

  bubble: { maxWidth: '82%', padding: 8, paddingHorizontal: 10, borderRadius: 8, position: 'relative', minWidth: 60 },
  bubbleRight: { backgroundColor: '#d9fdd3', borderTopRightRadius: 0, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' },
  bubbleLeft: { backgroundColor: '#ffffff', borderTopLeftRadius: 0, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' },
  senderLabel: { fontSize: 11, fontWeight: '800', color: '#128c7e', marginBottom: 2, fontFamily: "'Outfit', 'Inter', sans-serif" },
  bubbleText: { fontSize: 13.5, color: '#111b21', fontFamily: "'Outfit', 'Inter', sans-serif", lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  timeText: { fontSize: 9.5, color: '#667781', fontFamily: "'Outfit', 'Inter', sans-serif" },
  ticksWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Document Card in Chat Bubble
  docMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2f4ea',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    minWidth: 200,
    maxWidth: 280,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: '#c6edd7'
  },
  docIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  docInfoCol: { flex: 1, minWidth: 0 },
  docFileName: { fontSize: 13, fontWeight: '700', color: '#111b21', fontFamily: "'Outfit', 'Inter', sans-serif", wordBreak: 'break-word' },
  docMetaText: { fontSize: 10.5, color: '#667781', fontFamily: "'Outfit', 'Inter', sans-serif", marginTop: 2 },
  docOpenIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },

  typingIndicator: { fontSize: 12, fontStyle: 'italic', color: '#667781', fontFamily: "'Outfit', 'Inter', sans-serif" },

  // Emoji Tray Styling (Floating Popup)
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
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
    justifyContent: 'space-around',
    zIndex: 99,
    borderWidth: 1,
    borderColor: '#e8ecef'
  },
  emojiIconCell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Attachment Drawer Styling - Compact Floating WhatsApp Bubble
  attachmentDrawer: {
    position: 'absolute',
    bottom: 68,
    right: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    boxShadow: '0 6px 22px rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#e8ecef'
  },
  attachCell: { alignItems: 'center', gap: 4 },
  docAttachIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#5f63f2', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(95,99,242,0.35)' },
  attachLabel: { fontSize: 11, color: '#334155', fontWeight: '700', fontFamily: "'Outfit', 'Inter', sans-serif" },

  // Input Row Styling
  inputOuterContainer: { flexDirection: 'row', padding: 8, gap: 6, backgroundColor: 'transparent', alignItems: 'center' },
  inputContainerCapsule: { flex: 1, backgroundColor: '#ffffff', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
  inputEmojiBtn: { padding: 2 },
  chatTextInput: { flex: 1, minWidth: 0, fontSize: 14.5, color: '#111b21', fontFamily: "'Outfit', 'Inter', sans-serif", outlineStyle: 'none' },
  clipBtn: { padding: 4 },

  micSendCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#008069', alignItems: 'center', justifyContent: 'center', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
  micCircleRecording: { backgroundColor: '#dc2626' },

  // Voice Note Recording view
  recordingCapsule: { flex: 1, backgroundColor: '#ffffff', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#dc2626' },
  recordingTimer: { fontSize: 13, color: '#334155', fontWeight: '600', flex: 1, fontFamily: "'Outfit', 'Inter', sans-serif" },
  cancelRecordingBtn: { paddingHorizontal: 8 },
  cancelRecordingText: { fontSize: 12.5, fontWeight: '750', color: '#dc2626', fontFamily: "'Outfit', 'Inter', sans-serif" },

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
    backgroundColor: '#008069',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    boxShadow: '0 2px 6px rgba(0,128,105,0.3)',
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
    backgroundColor: '#008069',
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
    color: '#008069',
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
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#008069',
    padding: 12,
    borderRadius: 6,
  },
  paperCalloutText: {
    fontSize: 11.5,
    color: '#166534',
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
});
