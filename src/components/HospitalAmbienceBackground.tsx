import React from 'react';
import hospitalBgImage from '../assets/images/modern_hospital_ambience_1789724504271.jpg';

interface HospitalAmbienceBackgroundProps {
  variant?: 'default' | 'login' | 'chat' | 'subtle';
}

export const HospitalAmbienceBackground: React.FC<HospitalAmbienceBackgroundProps> = ({
  variant = 'default',
}) => {
  // Variant configurations to adapt opacity and overlay intensity for different screens
  const isLogin = variant === 'login';
  const isChat = variant === 'chat';
  const isSubtle = variant === 'subtle';

  // Responsive image opacity
  const imageOpacityClass = isChat
    ? 'opacity-20 sm:opacity-25 md:opacity-30'
    : isLogin
    ? 'opacity-30 sm:opacity-40 md:opacity-45'
    : isSubtle
    ? 'opacity-25 sm:opacity-30 md:opacity-35'
    : 'opacity-35 sm:opacity-45 md:opacity-50';

  const silhouetteOpacity = isChat ? 'opacity-[0.05]' : isLogin ? 'opacity-[0.08]' : 'opacity-[0.07]';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Base Calming Neutral Hospital Tint */}
      <div className="absolute inset-0 bg-slate-50/90" />

      {/* 2. Realistic Modern Hospital Architecture & Reception Corridor Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={hospitalBgImage}
          alt=""
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center filter blur-[4px] sm:blur-[5px] md:blur-[6px] scale-105 transition-opacity duration-700 ${imageOpacityClass}`}
        />
      </div>

      {/* 3. Gradient Lighting Wash (Teal, Cyan, Hospital Daylight & Trustworthy Blue) */}
      <div
        className="absolute inset-0"
        style={{
          background: isLogin
            ? 'radial-gradient(ellipse at 50% 15%, rgba(204, 251, 241, 0.50) 0%, rgba(240, 253, 250, 0.70) 45%, rgba(248, 250, 252, 0.88) 100%)'
            : isChat
            ? 'linear-gradient(to bottom, rgba(248, 250, 252, 0.92) 0%, rgba(240, 253, 250, 0.88) 55%, rgba(241, 245, 249, 0.94) 100%)'
            : 'radial-gradient(ellipse at 15% 10%, rgba(45, 212, 191, 0.26) 0%, transparent 60%), radial-gradient(ellipse at 85% 20%, rgba(56, 189, 248, 0.22) 0%, transparent 65%), linear-gradient(to bottom, rgba(248, 250, 252, 0.65) 0%, rgba(240, 253, 250, 0.55) 40%, rgba(248, 250, 252, 0.75) 100%)',
        }}
      />

      {/* 4. Doctors & Medical Staff Silhouettes in Corridor (Softened, Depth-of-Field Blur) */}
      <div className={`absolute inset-x-0 bottom-0 top-0 w-full h-full pointer-events-none transition-opacity duration-700 ${silhouetteOpacity}`}>
        <svg
          className="w-full h-full filter blur-[1.5px]"
          viewBox="0 0 1600 900"
          fill="none"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Hospital Reception Desk Arch & Perspective Corridors */}
          <path
            d="M-50,900 L380,520 L720,520 L680,900"
            fill="currentColor"
            className="text-teal-900/10"
          />
          <path
            d="M1650,900 L1220,540 L980,540 L920,900"
            fill="currentColor"
            className="text-teal-900/8"
          />

          {/* Clean Glass Corridor Pillars & Ceiling Light Trajectories */}
          <line x1="380" y1="0" x2="380" y2="900" stroke="currentColor" strokeWidth="2" className="text-teal-800/15" />
          <line x1="720" y1="0" x2="720" y2="900" stroke="currentColor" strokeWidth="1.5" className="text-teal-800/10" />
          <line x1="980" y1="0" x2="980" y2="900" stroke="currentColor" strokeWidth="1.5" className="text-teal-800/10" />
          <line x1="1220" y1="0" x2="1220" y2="900" stroke="currentColor" strokeWidth="2" className="text-teal-800/15" />

          {/* Doctor Silhouette (Walking with lab coat & stethoscope, right-center distance) */}
          <g className="text-teal-900/25" transform="translate(1080, 480) scale(0.65)">
            {/* Head */}
            <circle cx="50" cy="30" r="18" fill="currentColor" />
            {/* Doctor's Stethoscope Outline */}
            <path d="M42,42 C38,55 35,68 45,75 C52,70 56,58 58,45" stroke="currentColor" strokeWidth="3" fill="none" />
            <circle cx="45" cy="77" r="4" fill="currentColor" />
            {/* Lab Coat Torso & Shoulders */}
            <path
              d="M20,60 C25,50 38,45 50,45 C62,45 75,50 80,60 L92,150 L68,230 L52,230 L58,160 L42,160 L48,230 L32,230 L8,150 Z"
              fill="currentColor"
            />
            {/* Arm with medical clipboard */}
            <rect x="75" y="95" width="22" height="30" rx="3" fill="currentColor" opacity="0.8" />
          </g>

          {/* Nurse / Healthcare Professional Silhouette (Left side corridor) */}
          <g className="text-teal-900/20" transform="translate(430, 510) scale(0.58)">
            {/* Head */}
            <circle cx="50" cy="30" r="16" fill="currentColor" />
            {/* Scrub & Coat */}
            <path
              d="M25,58 C30,48 40,45 50,45 C60,45 70,48 75,58 L85,150 L66,225 L53,225 L56,155 L44,155 L47,225 L34,225 L15,150 Z"
              fill="currentColor"
            />
          </g>

          {/* Medical Equipment Silhouette 1: Mobile IV Drip Stand */}
          <g className="text-teal-800/20" transform="translate(560, 470) scale(0.6)">
            {/* Vertical pole */}
            <line x1="50" y1="20" x2="50" y2="240" stroke="currentColor" strokeWidth="4" />
            {/* Hooks */}
            <path d="M30,35 Q50,20 50,30 Q50,20 70,35" stroke="currentColor" strokeWidth="3" fill="none" />
            {/* Saline Bag */}
            <rect x="25" y="38" width="14" height="28" rx="4" fill="currentColor" opacity="0.6" />
            {/* Wheeled Base */}
            <line x1="20" y1="240" x2="80" y2="240" stroke="currentColor" strokeWidth="4" />
            <circle cx="22" cy="243" r="3" fill="currentColor" />
            <circle cx="78" cy="243" r="3" fill="currentColor" />
          </g>

          {/* Medical Equipment Silhouette 2: Patient Monitor on Trolley (Right background) */}
          <g className="text-teal-800/18" transform="translate(1290, 520) scale(0.55)">
            <rect x="20" y="30" width="60" height="42" rx="4" fill="currentColor" />
            <line x1="50" y1="72" x2="50" y2="180" stroke="currentColor" strokeWidth="4" />
            <rect x="30" y="100" width="40" height="15" rx="3" fill="currentColor" opacity="0.6" />
            <line x1="25" y1="180" x2="75" y2="180" stroke="currentColor" strokeWidth="4" />
            {/* Monitor Screen blip trace */}
            <path d="M26,51 L36,51 L40,42 L44,60 L48,51 L74,51" stroke="#5eead4" strokeWidth="2" fill="none" opacity="0.6" />
          </g>
        </svg>
      </div>

      {/* 5. Subtle Architectural Grid & Medical Cross Motif (Clean Glass Aesthetic) */}
      <div
        className="absolute inset-0 opacity-[0.035] sm:opacity-[0.045]"
        style={{
          backgroundImage: `linear-gradient(to right, #0f766e 1px, transparent 1px), linear-gradient(to bottom, #0f766e 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
      />

      {/* 6. Soft Floating Medical Ambient Lights (Gentle Glow Orbs) */}
      <div className="absolute top-[6%] left-[8%] w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-teal-300/18 filter blur-3xl animate-gentle-glow" />
      <div className="absolute top-[32%] right-[6%] w-80 h-80 sm:w-[440px] sm:h-[440px] rounded-full bg-cyan-300/16 filter blur-3xl animate-subtle-float" />
      <div className="absolute bottom-[8%] left-[28%] w-64 h-64 sm:w-88 sm:h-88 rounded-full bg-emerald-200/16 filter blur-3xl animate-gentle-glow" />

      {/* 7. Distant ECG Vital Rhythm Trace Silhouette (Understated, Calming) */}
      <svg
        className="absolute bottom-12 sm:bottom-20 left-0 right-0 w-full h-20 text-teal-600/12 pointer-events-none hidden sm:block"
        viewBox="0 0 1200 120"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 L280,60 L300,60 L310,30 L320,95 L335,15 L350,80 L360,60 L390,60 L410,50 L425,60 L700,60 L720,60 L730,25 L740,100 L755,10 L770,85 L780,60 L810,60 L830,50 L845,60 L1200,60"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
