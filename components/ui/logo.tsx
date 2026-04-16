interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient Background */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" />
        </linearGradient>
      </defs>

      {/* Rounded Rectangle Background */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="20"
        fill="url(#logoGradient)"
        stroke="white"
        strokeWidth="3"
      />

      {/* LZ Text */}
      <text
        x="50"
        y="50"
        fontSize="42"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="2"
      >
        LZ
      </text>
    </svg>
  );
}
