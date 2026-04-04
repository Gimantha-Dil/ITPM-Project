import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
 
// Browser Speech APIs
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
 
const Chatbot = () => {
  const { api } = useAuth();
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! \nI\'m your SLIIT Learning Platform AI Helper.\n\n Bot replies auto speak\n\nTry the quick buttons below or type your question! ' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [pendingVoiceSend, setPendingVoiceSend] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef('');
 
  // Keep ref in sync with state
  useEffect(() => { inputRef.current = input; }, [input]);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  // Initialize Speech Recognition
  useEffect(() => {
    if (!SpeechRecognition) return;
 
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceLang;
 
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
 
      if (event.results[event.results.length - 1].isFinal) {
        setPendingVoiceSend(true);
      }
    };
 
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
 
    recognition.onend = () => {
      setIsListening(false);
    };
 
    recognitionRef.current = recognition;
 
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [voiceLang]);
 
  // Clean text for speech (remove emojis, formatting)
  const cleanTextForSpeech = (text) => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}]/gu, '')
      .replace(/[]/g, '')
      .replace(/[•→►▶]/g, '')
      .replace(/[1-9]️⃣/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\.\s*\./g, '.')
      .trim();
  };
 
  // Speak text
  // Google Translate TTS for Sinhala
  const speakSinhala = useCallback((text) => {
    if (!text.trim()) return;
    synth?.cancel();
    setIsSpeaking(true);

    // Split into chunks max 200 chars (Google TTS limit)
    const words = text.split(' ');
    const chunks = [];
    let current = '';
    words.forEach(word => {
      if ((current + ' ' + word).length > 180) {
        if (current) chunks.push(current.trim());
        current = word;
      } else {
        current += (current ? ' ' : '') + word;
      }
    });
    if (current) chunks.push(current.trim());

    let chunkIndex = 0;
    const playChunk = () => {
      if (chunkIndex >= chunks.length) { setIsSpeaking(false); return; }
      const chunk = chunks[chunkIndex];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=si&client=tw-ob`;
      const audio = new Audio(url);
      audio.onended = () => { chunkIndex++; playChunk(); };
      audio.onerror = () => { chunkIndex++; playChunk(); };
      audio.play().catch(() => { chunkIndex++; playChunk(); });
    };
    playChunk();
  }, []);

  // Browser TTS for English
  const speakEnglish = useCallback((text) => {
    if (!synth) return;
    synth.cancel();

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 2);
    const chunks = [];
    let current = '';
    sentences.forEach(s => {
      if ((current + s).length > 180) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += (current ? '. ' : '') + s;
      }
    });
    if (current) chunks.push(current.trim());
    if (chunks.length === 0) return;

    setIsSpeaking(true);
    const speakChunk = (i) => {
      if (i >= chunks.length) { setIsSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(chunks[i]);
      utt.lang = 'en-US';
      utt.rate = 1.0;
      utt.pitch = 1.0;
      const voices = synth.getVoices();
      const voice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
        || voices.find(v => v.lang.startsWith('en') && v.localService)
        || voices.find(v => v.lang.startsWith('en'));
      if (voice) utt.voice = voice;
      utt.onend = () => speakChunk(i + 1);
      utt.onerror = () => setIsSpeaking(false);
      synth.speak(utt);
    };
    speakChunk(0);
  }, []);

  const speakText = useCallback((text) => {
    if (voiceLang === 'si-LK') {
      speakSinhala(text);
    } else {
      speakEnglish(text);
    }
  }, [voiceLang, speakSinhala, speakEnglish]);
 
  const stopSpeaking = () => {
    if (synth) synth.cancel();
    // Stop all playing audio elements (Google TTS)
    document.querySelectorAll('audio').forEach(a => { a.pause(); a.src = ''; });
    setIsSpeaking(false);
  };
 
  // Toggle mic
  const toggleListening = () => {
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser. Use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput('');
      try {
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) { console.error('Mic start error:', err); }
    }
  };
 
  // Send message
  const sendMessage = useCallback(async (msg) => {
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { type: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat/bot', { message: msg, language: voiceLang === 'si-LK' ? 'si' : 'en' });
      const rawReply = res.data.reply;

      // Filter reply lines based on selected language
      const filterReply = (text, lang) => {
        const hasSinhala = (s) => /[\u0D80-\u0DFF]/.test(s);
        const lines = text.split('\n');

        if (lang === 'en') {
          // English mode: remove lines that are mostly Sinhala
          return lines
            .filter(line => {
              const trimmed = line.trim();
              if (!trimmed) return true;
              const sinhalaChars = (trimmed.match(/[\u0D80-\u0DFF]/g) || []).length;
              const totalLetters = (trimmed.match(/[\u0D80-\u0DFF\u0041-\u007A\u0041-\u005A]/g) || []).length;
              if (totalLetters > 0 && sinhalaChars / totalLetters > 0.3) return false;
              return true;
            })
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        } else {
          // Sinhala mode: keep ONLY lines that contain Sinhala text
          // Also keep blank lines for spacing
          return lines
            .filter(line => {
              const trimmed = line.trim();
              if (!trimmed) return true;
              // Keep if has Sinhala characters
              if (hasSinhala(trimmed)) return true;
              return false;
            })
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }
      };

      const currentLang = voiceLang === 'si-LK' ? 'si' : 'en';
      const botReply = filterReply(rawReply, currentLang);
      setMessages(prev => [...prev, { type: 'bot', text: botReply }]);
      if (autoSpeak) setTimeout(() => speakText(botReply), 300);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again!' }]);
    } finally { setLoading(false); }
  }, [api, autoSpeak, speakText]);
 
  const handleSend = (e) => {
    if (e) e.preventDefault();
    sendMessage(input);
  };
 
  // Auto-send after voice recognition final result
  useEffect(() => {
    if (pendingVoiceSend && inputRef.current.trim()) {
      const timer = setTimeout(() => {
        sendMessage(inputRef.current);
        setPendingVoiceSend(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [pendingVoiceSend, sendMessage]);
 
  // Quick send
  const handleQuickSend = (q) => { sendMessage(q); };
 
  const isSinhala = voiceLang === 'si-LK';

  const categories = isSinhala ? [
    { key: 'notes', emoji: '', label: 'Notes', questions: [
      'Notes upload කරන්නේ කොහොමද?', 'Notes ට price set කරන්නේ කොහොමද?', 'කොන් file types upload කරන්න පුළුවන්ද?',
      'Purchase කළ note download කරන්නේ කොහොමද?', 'Note bookmark කරන්නේ කොහොමද?'
    ]},
    { key: 'payment', emoji: '', label: 'Payment', questions: [
      'Payment කරන්නේ කොහොමද?', 'Payment slip upload කරන්නේ කොහොමද?', 'Payment verify කරන්නේ කොහොමද?',
      'Verify වෙන්න කොච්චර කාලයක් යනවාද?', 'මොනවා banks support කරනවාද?'
    ]},
    { key: 'kuppi', emoji: '', label: 'Kuppi', questions: [
      'Kuppi session create කරන්නේ කොහොමද?', 'Session එකකට enroll වෙන්නේ කොහොමද?', 'MS Teams link ගන්නේ කොහොමද?',
      'Student payments verify කරන්නේ කොහොමද?', 'Excel report හදන්නේ කොහොමද?'
    ]},
    { key: 'chat', emoji: '', label: 'Chat', questions: [
      'Seller ට message කරන්නේ කොහොමද?', 'Message send කරන්නේ කොහොමද?', 'Unread messages check කරන්නේ කොහොමද?'
    ]},
    { key: 'analytics', emoji: '', label: 'Analytics', questions: [
      'Earnings බලන්නේ කොහොමද?', 'Download statistics check කරන්නේ කොහොමද?', 'Ratings බලන්නේ කොහොමද?'
    ]},
    { key: 'account', emoji: '', label: 'Account', questions: [
      'Profile update කරන්නේ කොහොමද?', 'Bank details add කරන්නේ කොහොමද?', 'Password change කරන්නේ කොහොමද?', 'Register වෙන්නේ කොහොමද?'
    ]}
  ] : [
    { key: 'notes', emoji: '', label: 'Notes', questions: [
      'How do I upload notes?', 'How to set price for my notes?', 'What file types can I upload?',
      'How to download a purchased note?', 'How to bookmark a note?'
    ]},
    { key: 'payment', emoji: '', label: 'Payment', questions: [
      'How does payment work?', 'How to upload payment slip?', 'How to verify payments?',
      'How long does verification take?', 'What banks are supported?'
    ]},
    { key: 'kuppi', emoji: '', label: 'Kuppi', questions: [
      'How to create a kuppi session?', 'How to enroll in a session?', 'How to get MS Teams link?',
      'How to verify student payments?', 'How to generate Excel report?'
    ]},
    { key: 'chat', emoji: '', label: 'Chat', questions: [
      'How to chat with a seller?', 'How to send a message?', 'How to check unread messages?'
    ]},
    { key: 'analytics', emoji: '', label: 'Analytics', questions: [
      'How to view my earnings?', 'How to check download statistics?', 'How to see my ratings?'
    ]},
    { key: 'account', emoji: '', label: 'Account', questions: [
      'How to update my profile?', 'How to add bank details?', 'How to change password?', 'How to register?'
    ]}
  ];
 
  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title"> AI Helper</h1>
          <span className="text-muted" style={{ fontSize: 13 }}> Voice + Text | Sinhala & English</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer' }}>
            <option value="en-US">🇬🇧 English</option>
            <option value="si-LK">🇱🇰 Sinhala</option>
          </select>
          <button className={`btn btn-sm ${autoSpeak ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) stopSpeaking(); }}
            title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
            style={{ borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>
            {autoSpeak ? <><FiVolume2 style={{ marginRight: 4 }} />Voice ON</> : <><FiVolumeX style={{ marginRight: 4 }} />Voice OFF</>}
          </button>
        </div>
      </div>
 
      {/* Messages */}
      <div className="chatbot-messages">
        {/* Floating Stop Speaking Button */}
        {isSpeaking && (
          <div style={{ position: 'sticky', top: 0, zIndex: 10, textAlign: 'center', padding: '8px 0' }}>
            <button onClick={stopSpeaking} className="btn btn-danger"
              style={{ borderRadius: 24, padding: '8px 24px', fontSize: 14, fontWeight: 600,
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)', animation: 'pulse 1.5s infinite' }}>
              <FiVolumeX style={{ marginRight: 6 }} /> Stop Speaking
            </button>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.type === 'bot' ? 'bot-message' : 'user-message'}
            style={{ whiteSpace: 'pre-line', position: 'relative', paddingRight: msg.type === 'bot' ? 36 : undefined }}>
            {msg.text}
            {msg.type === 'bot' && (
              <button onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)}
                title={isSpeaking ? 'Stop' : 'Read aloud'}
                style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--primary-deeper)', fontSize: 16, padding: 4, opacity: 0.6 }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}>
                {isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
              </button>
            )}
          </div>
        ))}
        {loading && <div className="bot-message" style={{ opacity: 0.6 }}>Thinking...</div>}
        {isListening && (
          <div style={{ padding: '12px 16px', background: '#fef3c7', border: '2px solid #fbbf24',
            borderRadius: 12, marginBottom: 8, animation: 'pulse-bg 2s infinite' }}>
            <div style={{ fontWeight: 600, color: '#92400e' }}>
              🎤 Listening... Speak now! ({voiceLang === 'si-LK' ? 'සිංහල' : 'English'})
            </div>
            {input && <div style={{ marginTop: 6, fontStyle: 'italic', color: '#78350f' }}>"{input}"</div>}
            <div className="voice-bars" style={{ marginTop: 8, display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ width: 4, borderRadius: 2, background: '#ef4444',
                  animation: `voice-bar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                  height: 6 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
 
      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {categories.map(cat => (
          <button key={cat.key}
            className={`btn btn-sm ${activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
        <button className="btn btn-sm btn-outline" onClick={() => handleQuickSend('help')}
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
          {isSinhala ? 'උදව්' : 'Help'}
        </button>
      </div>
 
      {activeCategory && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, padding: '8px 12px',
          background: '#f3f4f6', borderRadius: 10 }}>
          {categories.find(c => c.key === activeCategory)?.questions.map((q, idx) => (
            <button key={idx} className="btn btn-sm"
              onClick={() => { handleQuickSend(q); setActiveCategory(null); }}
              style={{ fontSize: 12, padding: '4px 10px', background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 16, cursor: 'pointer', color: '#374151' }}>
              {q}
            </button>
          ))}
        </div>
      )}
 
      {/* Input Bar */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={toggleListening}
          className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
          disabled={loading} title={isListening ? 'Stop listening' : 'Voice input'}
          style={{ borderRadius: '50%', width: 44, height: 44, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
            animation: isListening ? 'pulse 1.5s infinite' : 'none' }}>
          {isListening ? <FiMicOff /> : <FiMic />}
        </button>
        <input type="text" className="chat-input"
          placeholder={isListening ? (isSinhala ? '🎤 අහගෙන ඉන්නවා...' : '🎤 Listening...') : (isSinhala ? 'ඕනෑම දෙයක් අහන්න...' : 'ඕනෑම දෙයක් අහන්න / Ask anything...')}
          value={input} onChange={(e) => setInput(e.target.value)}
          disabled={loading || isListening} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ borderRadius: 24 }}>
          <FiSend />
        </button>
      </form>
 
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes voice-bar {
          from { height: 4px; }
          to { height: 18px; }
        }
        @keyframes pulse-bg {
          0%, 100% { background: #fef3c7; }
          50% { background: #fde68a; }
        }
      `}</style>
    </div>
  );
};
 
export default Chatbot;