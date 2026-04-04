import React, { useState, useEffect } from 'react';

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark'));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Watch for dark mode class changes on body
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{
      background: isDark ? 'rgba(10, 181, 214, 0.12)' : 'rgba(255,255,255,0.25)',
      backdropFilter: 'blur(8px)',
      border: isDark ? '1px solid rgba(10, 181, 214, 0.4)' : '1px solid rgba(255,255,255,0.5)',
      borderRadius: 14,
      padding: '14px 22px',
      textAlign: 'center',
      minWidth: 190,
      flexShrink: 0,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        fontSize: 26,
        fontWeight: 700,
        color: isDark ? '#67e8f9' : '#0a4a57',
        letterSpacing: '2px',
        fontFamily: 'monospace',
        textShadow: isDark ? '0 0 12px rgba(103,232,249,0.5)' : 'none',
      }}>
        {timeStr}
      </div>
      <div style={{
        fontSize: 12,
        color: isDark ? 'rgba(103,232,249,0.75)' : 'rgba(10,74,87,0.7)',
        marginTop: 4,
        fontWeight: 500,
      }}>
        {dateStr}
      </div>
    </div>
  );
};

export default LiveClock;