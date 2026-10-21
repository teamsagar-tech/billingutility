import React from 'react';

export default function LogoSplash() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      margin: 0,
      padding: 0
    }}>
      <div style={{ padding: '2rem', userSelect: 'none' }}>
        <img
          src="https://retailnode.in/logo.svg"
          alt="RetailNode"
          style={{
            width: '96px',
            height: '96px',
            display: 'block',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
}
