import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const LogoSvg: React.FC<LogoProps> = ({ size = 48, className = '' }) => {
  return (
    <div
      className={`logo-container-svg ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Scanner corner brackets */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '15%',
        right: '15%',
        bottom: '15%',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '8px',
        pointerEvents: 'none'
      }}></div>
      
      {/* Scan overlay line or clean scanner bracket overlay */}
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: '#ffffff', zIndex: 1 }}
      >
        <path
          d="M17 21H20C20.5523 21 21 20.5523 21 20V17M21 7V4C21 3.44772 20.5523 3 20 3H17M7 3H4C3.44772 3 3 3.44772 3 4V7M3 17V20C3 20.5523 3.44772 21 4 21H7"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 19C6 16.2386 8.68629 14 12 14C15.3137 14 18 16.2386 18 19"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
export default LogoSvg;
