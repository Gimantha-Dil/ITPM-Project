import React, { useState, useEffect } from 'react';

const LiveClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.75)',
      borderRadius: 14,
      padding: '14px 22px',
      textAlign: 'center',
      minWidth: 190,
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 26,
        fontWeight: 700,
        color: 'rgb(0, 26, 255)',
        letterSpacing: '2px',
        fontFamily: 'monospace',
        textShadow: '0 1px 6px rgba(0,0,0,0.15)',
      }}>
        {timeStr}
      </div>
      <div style={{
        fontSize: 12,
        color: 'rgb(0, 26, 255)',
        marginTop: 4,
        fontWeight: 500,
      }}>
        {dateStr}
      </div>
    </div>
  );
};

export default LiveClock;