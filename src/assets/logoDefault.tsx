import React from 'react';

export const LogoNiasBarat: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className = 'w-16 h-16', style }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width="72"
      height="72"
      className={className}
      style={{
        width: '72px',
        height: '72px',
        maxWidth: '72px',
        maxHeight: '72px',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Lambang Kabupaten Nias Barat"
    >
      <defs>
        {/* Gradients & filters */}
        <filter id="subtle-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Pentagon Shield (Red) */}
      <polygon
        points="100,6 194,74 156,194 44,194 6,74"
        fill="#ED1C24"
        stroke="#111111"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <polygon
        points="100,10 190,75 153,190 47,190 10,75"
        fill="none"
        stroke="#111111"
        strokeWidth="1.2"
        opacity="0.6"
      />

      {/* Top 5-pointed Yellow Star */}
      <polygon
        points="100,16 102.5,23.5 110.5,23.5 104,28 106.5,35.5 100,31 93.5,35.5 96,28 89.5,23.5 97.5,23.5"
        fill="#FFD700"
        stroke="#111111"
        strokeWidth="0.8"
      />

      {/* Left Golden Cotton Pods (17 items) */}
      <g fill="#FFD700" stroke="#111111" strokeWidth="0.7">
        <path d="M 70,36 C 66,32 58,35 60,42 C 62,49 72,46 70,36 Z" />
        <path d="M 58,45 C 52,43 46,48 50,54 C 54,60 62,55 58,45 Z" />
        <path d="M 48,56 C 42,54 36,60 41,67 C 46,73 54,67 48,56 Z" />
        <path d="M 40,70 C 34,70 30,78 36,84 C 42,90 48,82 40,70 Z" />
        <path d="M 33,88 C 28,90 26,98 32,104 C 38,110 44,101 33,88 Z" />
        <path d="M 30,107 C 25,110 25,119 32,125 C 38,130 43,121 30,107 Z" />
        <path d="M 32,128 C 28,133 30,143 38,147 C 45,150 48,140 32,128 Z" />
        <path d="M 38,149 C 35,155 40,164 48,166 C 56,168 57,157 38,149 Z" />
        <path d="M 49,167 C 47,173 55,181 64,180 C 72,179 70,169 49,167 Z" />
      </g>

      {/* Right Golden Rice Grain Stalk (45 grains) */}
      <g fill="#FFD700" stroke="#111111" strokeWidth="0.7">
        <path d="M 132,36 C 136,31 144,34 141,41 C 138,48 130,46 132,36 Z" />
        <path d="M 143,45 C 149,42 155,47 151,53 C 146,59 139,55 143,45 Z" />
        <path d="M 152,57 C 158,54 163,60 158,67 C 153,73 145,67 152,57 Z" />
        <path d="M 160,71 C 166,70 170,78 164,84 C 158,90 152,82 160,71 Z" />
        <path d="M 167,89 C 172,90 174,99 168,104 C 162,110 156,101 167,89 Z" />
        <path d="M 170,108 C 174,111 174,120 168,125 C 162,130 157,121 170,108 Z" />
        <path d="M 167,129 C 171,134 168,143 161,147 C 154,150 151,140 167,129 Z" />
        <path d="M 160,150 C 163,156 158,164 150,166 C 142,168 141,157 160,150 Z" />
        <path d="M 149,168 C 151,174 143,181 134,180 C 126,179 128,169 149,168 Z" />
      </g>

      {/* Central Ni'obungai Spirals (Golden Life Tree) */}
      <g stroke="#111111" strokeWidth="0.8">
        {/* Central striped trunk */}
        <line x1="100" y1="36" x2="100" y2="108" stroke="#111111" strokeWidth="3" />
        <line x1="100" y1="36" x2="100" y2="108" stroke="#FFD700" strokeWidth="2" strokeDasharray="3,3" />

        {/* Spirals branching left and right */}
        {/* Top pair */}
        <path d="M 100,56 C 92,48 83,52 83,58 C 83,63 90,65 93,61 C 95,58 91,55 88,57" fill="none" stroke="#FFD700" strokeWidth="2.5" />
        <path d="M 100,56 C 108,48 117,52 117,58 C 117,63 110,65 107,61 C 105,58 109,55 112,57" fill="none" stroke="#FFD700" strokeWidth="2.5" />

        {/* Middle pair */}
        <path d="M 100,72 C 88,60 74,66 75,76 C 76,84 87,86 91,80 C 93,75 87,70 82,74" fill="none" stroke="#FFD700" strokeWidth="3" />
        <path d="M 100,72 C 112,60 126,66 125,76 C 124,84 113,86 109,80 C 107,75 113,70 118,74" fill="none" stroke="#FFD700" strokeWidth="3" />

        {/* Lower wide pair */}
        <path d="M 100,92 C 84,76 60,82 62,96 C 64,107 80,109 85,100 C 88,94 80,88 74,93" fill="none" stroke="#FFD700" strokeWidth="3.2" />
        <path d="M 100,92 C 116,76 140,82 138,96 C 136,107 120,109 115,100 C 112,94 120,88 126,93" fill="none" stroke="#FFD700" strokeWidth="3.2" />
      </g>

      {/* Traditional Nias House (Omo Hada) */}
      <g id="omo-hada">
        {/* High Steep Brown Thatched Roof */}
        <path
          d="M 100,103 C 94,103 89,114 86,122 C 83,129 74,132 70,135 L 130,135 C 126,132 117,129 114,122 C 111,114 106,103 100,103 Z"
          fill="#3B2314"
          stroke="#111111"
          strokeWidth="1.2"
        />
        {/* Skylight window / roof opening */}
        <polygon points="107,125 116,132 110,133 105,127" fill="#F4EAE0" stroke="#111111" strokeWidth="0.8" />

        {/* House Walls (Wood and latticework) */}
        <path
          d="M 76,135 L 124,135 L 121,146 C 118,149 82,149 79,146 Z"
          fill="#EFE7DA"
          stroke="#111111"
          strokeWidth="1.2"
        />
        <line x1="84" y1="135" x2="84" y2="147" stroke="#111111" strokeWidth="0.8" />
        <line x1="94" y1="135" x2="94" y2="147" stroke="#111111" strokeWidth="0.8" />
        <line x1="100" y1="135" x2="100" y2="148" stroke="#111111" strokeWidth="0.8" />
        <line x1="106" y1="135" x2="106" y2="147" stroke="#111111" strokeWidth="0.8" />
        <line x1="116" y1="135" x2="116" y2="147" stroke="#111111" strokeWidth="0.8" />

        {/* Lower wooden posts/pillars (Ehomo) */}
        <g stroke="#111111" strokeWidth="1.2" fill="#5A3A1F">
          <rect x="80" y="147" width="3" height="9" />
          <rect x="86" y="147" width="3" height="9" />
          <rect x="93" y="147" width="3.5" height="9" />
          <rect x="98.5" y="147" width="3" height="9" />
          <rect x="103.5" y="147" width="3.5" height="9" />
          <rect x="111" y="147" width="3" height="9" />
          <rect x="117" y="147" width="3" height="9" />
        </g>

        {/* Stone circular pavement base (Fatao) */}
        <ellipse cx="100" cy="155" rx="32" ry="5.5" fill="#EAE5DB" stroke="#111111" strokeWidth="1" />
        <ellipse cx="100" cy="155" rx="27" ry="3.5" fill="none" stroke="#111111" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
        
        {/* Pedestal base banner */}
        <path
          d="M 67,156 C 85,162 115,162 133,156 L 131,166 C 114,171 86,171 69,166 Z"
          fill="#3B1C0B"
          stroke="#FFD700"
          strokeWidth="0.9"
        />
        <text
          x="100"
          y="164.5"
          textAnchor="middle"
          fill="#FFD700"
          fontSize="6.8"
          fontWeight="900"
          fontFamily="'Arial Black', sans-serif"
          letterSpacing="2.5"
        >
          HASAMBUA
        </text>
      </g>

      {/* Bottom Ribbon Banner: NIAS BARAT */}
      <g id="bottom-ribbon">
        {/* Ribbon folds */}
        <path d="M 50,181 L 40,174 L 54,192 Z" fill="#660D0D" stroke="#111111" strokeWidth="0.8" />
        <path d="M 150,181 L 160,174 L 146,192 Z" fill="#660D0D" stroke="#111111" strokeWidth="0.8" />
        
        {/* Main Ribbon Body */}
        <path
          d="M 48,181 C 75,174 125,174 152,181 L 146,193 C 122,186 78,186 54,193 Z"
          fill="#111111"
          stroke="#CBB383"
          strokeWidth="1"
        />
        <text
          x="100"
          y="188.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="9.2"
          fontWeight="bold"
          fontFamily="'Arial Black', Impact, sans-serif"
          letterSpacing="1.8"
        >
          NIAS BARAT
        </text>
      </g>
    </svg>
  );
};

export const LogoDesaRenderer: React.FC<{
  logoUrl?: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}> = ({ logoUrl, className = 'w-16 h-16', style, alt = 'Logo Desa' }) => {
  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt={alt}
        className={`${className} object-contain`}
        style={{
          width: '72px',
          height: '72px',
          maxWidth: '72px',
          maxHeight: '72px',
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    );
  }
  return <LogoNiasBarat className={className} style={style} />;
};
