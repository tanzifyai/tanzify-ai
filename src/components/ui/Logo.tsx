import React from 'react';

type Props = {
  className?: string;
  width?: number;
  height?: number;
};

const Logo: React.FC<Props> = ({ className = '', width = 32, height = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="6" fill="#8b5cf6" />
      <path d="M8 12l4-4 4 4-4 4-4-4z" fill="white" />
      <path d="M16 8l4 4-4 4-4-4 4-4z" fill="white" />
      <path d="M20 16l4-4 4 4-4 4-4-4z" fill="white" />
    </svg>
  );
};

export default Logo;
