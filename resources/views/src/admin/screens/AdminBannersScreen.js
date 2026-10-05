import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { resolveImageUri } from '../../utils/imageUtils';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import ImageUploadField from '../components/ImageUploadField';
import UserProfileModal from '../components/UserProfileModal';
import mammoth from 'mammoth';

export function AdminBannersScreen() {
  const { banners, setBanners } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState('');

  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('hero'); // 'hero' or 'footer'
  const [redirectUrl, setRedirectUrl] = useState('');

  const [validationError, setValidationError] = useState('');

  const openModal = (banner = null) => {
    setValidationError('');
    if (banner) {
      setEditId(banner.id);
      setTitle(banner.title || '');
      setDescription(banner.description || '');
      setImageUrl(banner.image_url || '');
      setType(banner.type || 'hero');
      setRedirectUrl(banner.redirect_url || '');
    } else {
      setEditId(null);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setType('hero');
      setRedirectUrl('');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim() && !imageUrl.trim()) {
      setValidationError('Please enter a banner title and upload/paste an image URL.');
      return;
    }
    if (!title.trim()) {
      setValidationError('Please enter a title for the banner.');
      return;
    }
    if (!imageUrl.trim()) {
      setValidationError('Please upload an image or paste a valid image URL.');
      return;
    }

    setValidationError('');

    if (editId) {
      setBanners(prev => prev.map(b => b.id === editId ? {
        ...b, title, description, image_url: imageUrl, type, redirect_url: redirectUrl, status: b.status || 'ACTIVE'
      } : b));
    } else {
      setBanners(prev => [...(prev || []), {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        type: type || 'hero',
        redirect_url: redirectUrl.trim() || '/user/bookings/new',
        status: 'ACTIVE'
      }]);
    }
    setModalVisible(false);
  };

  const promptDeleteBanner = (b) => {
    setDeleteTargetId(b.id);
    setDeleteTargetTitle(b.title);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteBanner = () => {
    if (deleteTargetId) {
      setBanners(prev => prev.filter(b => b.id !== deleteTargetId));
    }
    setDeleteConfirmVisible(false);
    setDeleteTargetId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={styles.title}>Marketing Banners Manager</Text>
          <Text style={styles.subtitle}>Configure active promotional banners displayed in the User App.</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Text style={styles.addBtnText}>Add Banner</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bannerGrid}>
        {banners.map((b, idx) => (
          <View key={idx} style={styles.bannerCard}>
            <Image source={{ uri: resolveImageUri(b.image_url) }} style={styles.bannerImg} />
            <View style={styles.bannerBody}>
              <View style={{ flex: 1 }}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{b.type === 'hero' ? 'Hero Banner' : 'Footer Banner'}</Text>
                </View>
                <Text style={styles.bannerTitle}>{b.title}</Text>
                <Text style={styles.bannerDesc}>{b.description}</Text>
              </View>
              <View style={styles.bannerActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openModal(b)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => promptDeleteBanner(b)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Banner' : 'Add New Banner'}</Text>

            {Boolean(validationError) && (
              <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', padding: 10, borderRadius: 8, marginVertical: 4 }}>
                <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>⚠️ {validationError}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.textInput} value={title} onChangeText={setTitle} placeholder="e.g. Unlimited Home Maintenance" />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={styles.textInput} value={description} onChangeText={setDescription} placeholder="Description text" />

            <ImageUploadField
              label="Banner Image (URL or File Upload)"
              value={imageUrl}
              onChangeImage={setImageUrl}
              placeholder="Paste image URL or upload image from device"
            />

            <Text style={styles.inputLabel}>Banner Type (Position)</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity style={[styles.typeBtn, type === 'hero' && styles.typeBtnActive]} onPress={() => setType('hero')}>
                <Text style={[styles.typeBtnText, type === 'hero' && styles.typeBtnTextActive]}>Top Hero</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, type === 'footer' && styles.typeBtnActive]} onPress={() => setType('footer')}>
                <Text style={[styles.typeBtnText, type === 'footer' && styles.typeBtnTextActive]}>Footer Trust</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Redirect Link Path (Optional)</Text>
            <TextInput style={styles.textInput} value={redirectUrl} onChangeText={setRedirectUrl} placeholder="e.g. /user/bookings/new" />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : 'Add Banner'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ConfirmDeleteModal
        visible={deleteConfirmVisible}
        title="Delete Banner?"
        message={`Are you sure you want to delete "${deleteTargetTitle || 'this banner'}"? It will no longer be visible in the user mobile app.`}
        onConfirm={confirmDeleteBanner}
        onCancel={() => setDeleteConfirmVisible(false)}
        confirmText="Delete Banner"
      />
    </ScrollView>
  );
}

export function AdminChatScreen() {
  const { chats, setChats, users } = useApp();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [modalUserVisible, setModalUserVisible] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Collect all users and guests with active chat threads
  const allConversationUsers = [...users];
  chats.forEach((m) => {
    if (m.user_id !== undefined && m.user_id !== null && !allConversationUsers.some((u) => u.id === m.user_id)) {
      allConversationUsers.push({
        id: m.user_id,
        name: m.sender || (m.user_id === 0 ? 'Guest User' : `User #${m.user_id}`),
        phone: m.user_id === 0 ? 'Guest Session' : '+91 98765 00000',
        subscription_plan: null,
      });
    }
  });

  // Sort queue by most recent message timestamp descending (WhatsApp-style queue)
  const sortedUsers = [...allConversationUsers].sort((a, b) => {
    const aMsgs = chats.filter((m) => m.user_id === a.id || (!m.user_id && a.id === 1));
    const bMsgs = chats.filter((m) => m.user_id === b.id || (!m.user_id && b.id === 1));

    const aLastTime = aMsgs.length > 0 ? (aMsgs[aMsgs.length - 1].timestamp || aMsgs[aMsgs.length - 1].id || 0) : 0;
    const bLastTime = bMsgs.length > 0 ? (bMsgs[bMsgs.length - 1].timestamp || bMsgs[bMsgs.length - 1].id || 0) : 0;

    return bLastTime - aLastTime;
  });

  const filteredUsers = sortedUsers.filter((u) =>
    (u.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (u.phone || '').includes(searchFilter)
  );

  const selectedUser =
    (selectedUserId !== null && sortedUsers.find((u) => u.id === selectedUserId)) ||
    sortedUsers[0] ||
    users[0];
  const effectiveUserId = selectedUser?.id ?? 1;

  const activeChats = chats.filter(
    (m) => m.user_id === effectiveUserId || (!m.user_id && effectiveUserId === 1)
  );

  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewDocVisible, setPreviewDocVisible] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');

  const handleDocumentClick = () => {
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

      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
      const docMsg = {
        id: Date.now(),
        user_id: effectiveUserId,
        sender: 'Zevota Operations',
        senderType: 'admin',
        msgType: 'document',
        fileName: file.name,
        fileSize: fileSizeKb,
        fileExt: fileExt,
        fileMime: fileMime,
        fileData: fileData,
        fileUrl: fileUrl,
        text: file.name,
        time: time,
        timestamp: Date.now(),
      };

      setChats((prev) => [...prev, docMsg]);
    };

    reader.readAsDataURL(file);
  };

  const handleViewDocument = async (msg) => {
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
        console.error('Error generating preview blob', e);
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

  const handleSend = (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;

    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    const newMsg = {
      id: Date.now(),
      user_id: effectiveUserId,
      sender: 'Admin Operations',
      senderType: 'admin',
      text: text.trim(),
      time: time,
      timestamp: Date.now()
    };

    setChats(prev => [...prev, newMsg]);
    if (!textToSend) setInputText('');
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [chats, effectiveUserId]);

  const quickReplies = [
    'Technician is en route to your location.',
    'Your estimate bill has been verified & approved.',
    'We are checking with our dispatch team.',
    'Thank you for contacting Zevota-Care Support.'
  ];

  const getInitials = (name = '') => {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';
  };

  return (
    <View style={styles.chatLayoutContainer}>
      {/* Hidden File Input for Admin Upload */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.txt"
        />
      )}
      
      {/* 1. LEFT SIDEBAR: ACTIVE CONVERSATIONS */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Live Support Desk</Text>
          <Text style={styles.sidebarSub}>{users.length} Active Conversations</Text>
          
          <View style={styles.searchCapsule}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <TextInput
              style={styles.searchTextInput}
              value={searchFilter}
              onChangeText={setSearchFilter}
              placeholder="Search user or phone..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <ScrollView style={styles.threadScroll} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((u) => {
            const userMsgs = chats.filter(m => m.user_id === u.id || (!m.user_id && u.id === 1));
            const lastMsgObj = userMsgs[userMsgs.length - 1];
            const isLastDoc = lastMsgObj?.msgType === 'document' || lastMsgObj?.fileName || /\.(pdf|docx?|xlsx?|jpe?g|png)$/i.test(lastMsgObj?.text || '');
            const lastMsg = isLastDoc ? `📎 Document: ${lastMsgObj.fileName || lastMsgObj.text}` : (lastMsgObj?.text || 'No messages yet');
            const lastTime = lastMsgObj?.time || '';
            const isActive = effectiveUserId === u.id;

            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.threadRow, isActive && styles.threadRowActive]}
                onPress={() => setSelectedUserId(u.id)}
                activeOpacity={0.8}
              >
                <View style={styles.threadAvatar}>
                  <Text style={styles.threadAvatarText}>{getInitials(u.name)}</Text>
                  <View style={styles.onlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.threadRowTop}>
                    <Text style={styles.threadName}>{u.name}</Text>
                    <Text style={styles.threadTime}>{lastTime}</Text>
                  </View>
                  <Text style={styles.threadSnippet} numberOfLines={1}>{lastMsg}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. RIGHT PANEL: MODERN CONVERSATION DESK */}
      {selectedUser ? (
        <View style={styles.chatWindow}>
          {/* Header */}
          <View style={styles.windowHeader}>
            <View style={styles.windowHeaderLeft}>
              <View style={styles.windowAvatar}>
                <Text style={styles.windowAvatarText}>{getInitials(selectedUser.name)}</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.windowTitle}>{selectedUser.name}</Text>
                  <View style={styles.userPlanBadge}>
                    <Text style={styles.userPlanBadgeText}>
                      {selectedUser.subscription_plan ? `${selectedUser.subscription_plan.toUpperCase()} MEMBER` : 'USER'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.windowStatus}>{selectedUser.phone} • {selectedUser.email || 'customer@zevotacare.com'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => { setModalUser(selectedUser); setModalUserVisible(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.viewProfileBtnText}>Review Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Messages Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatAreaScroll}
            contentContainerStyle={styles.chatAreaContent}
            showsVerticalScrollIndicator={false}
          >
            {activeChats.map((m) => {
              const isAdmin = m.senderType === 'admin';
              const isBot = m.sender === 'Zeva Bot' || m.text?.includes('Zeva AI');

              if (isBot) {
                return (
                  <View key={m.id} style={styles.systemNoticeRow}>
                    <View style={styles.systemNoticePill}>
                      <Text style={styles.systemNoticeText}>🤖 {m.text}</Text>
                    </View>
                  </View>
                );
              }

              const isDoc =
                m.msgType === 'document' ||
                Boolean(m.fileName) ||
                Boolean(m.fileData && String(m.fileData).startsWith('data:')) ||
                /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|webp|zip)$/i.test(m.text || '');

              const docName = m.fileName || m.text || 'Document';
              const docExt = (m.fileExt || (docName.includes('.') ? docName.split('.').pop().toUpperCase() : 'PDF')).toUpperCase();
              const isImg = (m.fileMime && m.fileMime.startsWith('image/')) || (m.fileData && String(m.fileData).startsWith('data:image/')) || /\.(jpe?g|png|webp|gif)$/i.test(docName);

              return (
                <View key={m.id} style={[styles.bubbleRow, isAdmin ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                  {!isAdmin && (
                    <View style={styles.msgAvatarCircle}>
                      <Text style={styles.msgAvatarText}>{getInitials(m.sender || selectedUser.name)}</Text>
                    </View>
                  )}
                  <View style={[styles.bubbleBlock, isAdmin ? styles.bubbleBlockRight : styles.bubbleBlockLeft]}>
                    <Text style={[styles.senderLabel, isAdmin && styles.senderLabelRight]}>
                      {isAdmin ? 'Zevota Operations' : m.sender || selectedUser.name}
                    </Text>

                    {isDoc ? (
                      <View style={[styles.adminDocCard, isAdmin ? styles.adminDocCardRight : styles.adminDocCardLeft]}>
                        <View style={styles.adminDocTopRow}>
                          <View style={[styles.adminDocIconBox, docExt === 'PDF' ? styles.docPdf : docExt.includes('DOC') ? styles.docWord : styles.docGeneral]}>
                            <Text style={styles.adminDocExtText}>{docExt.slice(0, 4)}</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.adminDocFileName, isAdmin && styles.adminDocFileNameRight]} numberOfLines={2}>
                              {docName}
                            </Text>
                            <Text style={[styles.adminDocMeta, isAdmin && styles.adminDocMetaRight]}>
                              {m.fileSize || 'Uploaded Document'}
                            </Text>
                          </View>
                        </View>

                        {isImg && m.fileData && (
                          <TouchableOpacity onPress={() => handleViewDocument(m)} activeOpacity={0.9} style={styles.imgPreviewWrap}>
                            <Image source={{ uri: m.fileData }} style={styles.imgPreview} resizeMode="cover" />
                          </TouchableOpacity>
                        )}

                        <View style={styles.adminDocActionRow}>
                          <TouchableOpacity
                            style={[styles.adminDocBtn, isAdmin ? styles.adminDocBtnRight : styles.adminDocBtnLeft]}
                            onPress={() => handleViewDocument(m)}
                            activeOpacity={0.85}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <Text style={[styles.adminDocBtnText, isAdmin ? styles.adminDocBtnTextRight : styles.adminDocBtnTextLeft]}>
                              View Document
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.adminDocDownloadBtn, isAdmin ? styles.adminDocDownloadBtnRight : styles.adminDocDownloadBtnLeft]}
                            onPress={() => handleDownloadDocument(m)}
                            activeOpacity={0.85}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <Text style={[styles.adminDocBtnText, isAdmin ? styles.adminDocBtnTextRight : styles.adminDocBtnTextLeft]}>
                              Download
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.bubbleText, isAdmin && styles.bubbleTextRight]}>{m.text}</Text>
                    )}

                    <Text style={[styles.bubbleTime, isAdmin && styles.bubbleTimeRight]}>
                      {m.time} {isAdmin && ' ✓✓'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Quick Replies Bar */}
          <View style={styles.quickRepliesBar}>
            <Text style={styles.quickReplyTag}>QUICK RESPONSES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {quickReplies.map((qr, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickReplyPill}
                  onPress={() => handleSend(qr)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickReplyText} numberOfLines={1}>{qr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleDocumentClick}
              activeOpacity={0.8}
              title="Attach document or image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </TouchableOpacity>
            
            <View style={styles.inputCapsule}>
              <TextInput
                style={styles.adminTextInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={`Type support reply for ${selectedUser.name}...`}
                placeholderTextColor="#94a3b8"
                onSubmitEditing={() => handleSend()}
              />
            </View>
            
            <TouchableOpacity style={styles.sendButtonCircle} onPress={() => handleSend()} activeOpacity={0.85}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyWindow}>
          <Text style={styles.emptyText}>Select a conversation from the sidebar to begin chatting</Text>
        </View>
      )}

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
                    {previewDoc?.fileSize || 'Standard File'} • {previewDoc?.fileExt || 'DOCUMENT'} • Uploaded by {previewDoc?.sender || selectedUser?.name}
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
                const isImg = ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' || ext === 'WEBP' || (previewDoc.fileMime && previewDoc.fileMime.includes('image'));

                if (isPdf && previewBlobUrl) {
                  return (
                    <iframe
                      src={previewBlobUrl}
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
                    <div style={{ width: '100%', maxHeight: '72vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: 10, borderWidth: '1px', borderColor: '#cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div
                        style={{
                          padding: '28px 36px',
                          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
                          fontSize: '15px',
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
                    <div style={{ width: '100%', maxHeight: '72vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: 10, borderWidth: '1px', borderColor: '#cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <pre style={{ margin: 0, padding: '24px 28px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#1e293b' }}>
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
                          <Text style={{ fontSize: 28 }}>📑</Text>
                        </View>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={styles.docOfficeName}>
                            {previewDoc.fileName || previewDoc.text}
                          </Text>
                          <Text style={styles.docOfficeMeta}>
                            Format: {ext} • Size: {previewDoc.fileSize || 'Standard'} • Security: Verified Clean
                          </Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedBadgeText}>✓ Ready to View</Text>
                        </View>
                      </View>

                      <View style={styles.docPreviewPaper}>
                        <View style={styles.paperHeader}>
                          <Text style={styles.paperOrgTitle}>ZEVOTA CARE OPERATIONS CONSOLE</Text>
                          <Text style={styles.paperDateText}>{previewDoc.time || 'Today'}</Text>
                        </View>
                        <View style={styles.paperDivider} />
                        <Text style={styles.paperDocHeading}>Document Summary & Inspection</Text>
                        <Text style={styles.paperBodyText}>
                          • File Name: {previewDoc.fileName || previewDoc.text}
                        </Text>
                        <Text style={styles.paperBodyText}>
                          • Sender: {previewDoc.sender || selectedUser?.name} ({selectedUser?.phone || 'Customer'})
                        </Text>
                        <Text style={styles.paperBodyText}>
                          • Type: Official Document Attachment ({ext})
                        </Text>
                        <Text style={styles.paperBodyText}>
                          • Time Received: {previewDoc.time || 'Active Session'}
                        </Text>

                        <View style={styles.paperCallout}>
                          <Text style={styles.paperCalloutText}>
                            💡 Document previewed in view-only mode without downloading. Click "Download" on the top right if you need an offline copy.
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

      {/* Customer Profile Modal */}
      <UserProfileModal
        visible={modalUserVisible}
        user={modalUser}
        onClose={() => { setModalUserVisible(false); setModalUser(null); }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },
  addBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },

  bannerGrid: { gap: 16, flexDirection: 'row', flexWrap: 'wrap' },
  bannerCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', width: '48%', minWidth: 300 },
  bannerImg: { width: '100%', height: 160 },
  bannerBody: { padding: 16, gap: 12, flexDirection: 'row' },
  bannerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  bannerDesc: { fontSize: 12, color: '#64748b' },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  
  bannerActions: { gap: 8, justifyContent: 'center' },
  editBtn: { backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center' },
  editBtnText: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#fee2e2', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center' },
  deleteBtnText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 22, width: '100%', maxWidth: 440, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, color: '#0f172a', outlineStyle: 'none' },
  typeSelectorRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  typeBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  typeBtnTextActive: { color: '#2563eb' },
  modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  submitBtn: { flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 12 },

  /* ── Modern Enterprise Support Console ── */
  chatLayoutContainer: {
    flexDirection: 'row',
    height: 'calc(100vh - 100px)',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
  },

  // Sidebar (Left column)
  sidebar: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  sidebarTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  sidebarSub: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  
  searchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    outlineStyle: 'none',
  },

  threadScroll: { flex: 1 },
  threadRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  threadRowActive: {
    backgroundColor: '#f5f3ff',
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  threadAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  threadAvatarText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  threadRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  threadName: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  threadTime: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  threadSnippet: { fontSize: 12, color: '#64748b' },

  // Chat Window (Right panel)
  chatWindow: {
    flex: 1,
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
  },
  windowHeader: {
    height: 64,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  windowHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  windowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowAvatarText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  windowTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  userPlanBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userPlanBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#b45309' },
  windowStatus: { fontSize: 11.5, color: '#64748b', marginTop: 1 },

  viewProfileBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  viewProfileBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },

  chatAreaScroll: { flex: 1, backgroundColor: '#f8fafc' },
  chatAreaContent: { padding: 20, gap: 14, paddingBottom: 20 },

  systemNoticeRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemNoticePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '85%',
  },
  systemNoticeText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
  },

  bubbleRow: { flexDirection: 'row', width: '100%', gap: 8, alignItems: 'flex-end' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },

  msgAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  msgAvatarText: { fontSize: 10, fontWeight: '800', color: '#334155' },

  bubbleBlock: {
    maxWidth: '68%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    position: 'relative',
    minWidth: 90,
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    gap: 3,
  },
  bubbleBlockRight: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 2,
  },
  bubbleBlockLeft: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 2,
  },

  senderLabel: { fontSize: 10.5, fontWeight: '800', color: '#2563eb', marginBottom: 1 },
  senderLabelRight: { color: '#ede9fe' },
  bubbleText: { fontSize: 13, color: '#0f172a', lineHeight: 18 },
  bubbleTextRight: { color: '#ffffff' },
  bubbleTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  bubbleTimeRight: { color: '#ddd6fe' },

  quickRepliesBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickReplyTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  quickReplyPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  quickReplyText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },

  inputContainer: {
    padding: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputCapsule: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  adminTextInput: { fontSize: 13, color: '#0f172a', outlineStyle: 'none' },
  sendButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
    cursor: 'pointer',
  },

  // Admin Document Message Card Styles
  adminDocCard: {
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    marginBottom: 4,
    gap: 8,
    minWidth: 220,
    maxWidth: 320,
  },
  adminDocCardLeft: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  adminDocCardRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adminDocTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminDocIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docPdf: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  docWord: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  docGeneral: {
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  adminDocExtText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1e293b',
  },
  adminDocFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 17,
  },
  adminDocFileNameRight: {
    color: '#ffffff',
  },
  adminDocMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  adminDocMetaRight: {
    color: '#e9d5ff',
  },
  imgPreviewWrap: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginVertical: 4,
  },
  imgPreview: {
    width: '100%',
    height: '100%',
  },
  adminDocActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  adminDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  adminDocBtnLeft: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    color: '#0f172a',
  },
  adminDocBtnRight: {
    backgroundColor: '#ffffff',
    color: '#7c3aed',
  },
  adminDocDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  adminDocDownloadBtnLeft: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  adminDocDownloadBtnRight: {
    backgroundColor: '#4c1d95',
    color: '#ffffff',
  },
  adminDocBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  adminDocBtnTextLeft: {
    color: '#0f172a',
  },
  adminDocBtnTextRight: {
    color: '#7c3aed',
  },

  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },

  // Document Viewer Modal Styles
  docModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  docModalCard: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  docModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  docModalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  docModalSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  docModalDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  docModalDownloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  docModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  docModalBody: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    overflow: 'auto',
  },
  docImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    minHeight: 300,
  },
  docOfficeViewerContainer: {
    padding: 10,
    alignItems: 'center',
  },
  docOfficeCard: {
    width: '100%',
    maxWidth: 720,
    gap: 16,
  },
  docOfficeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docOfficeIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docOfficeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  docOfficeMeta: {
    fontSize: 12,
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
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperOrgTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  paperBodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  paperCallout: {
    marginTop: 12,
    backgroundColor: '#f5f3ff',
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
    padding: 12,
    borderRadius: 6,
  },
  paperCalloutText: {
    fontSize: 12,
    color: '#5b21b6',
    lineHeight: 18,
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
    maxHeight: 220,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  extractedTextBody: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#1e293b',
    fontFamily: 'monospace',
  },

  emptyWindow: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});

