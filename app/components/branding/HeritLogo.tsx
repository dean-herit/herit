import React from "react";

interface HeritLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}

export const HeritLogo: React.FC<HeritLogoProps> = ({
  size = 32,
  width,
  height,
  className = "",
}) => (
  <div
    className={`bg-contain bg-no-repeat bg-center dark:invert ${className}`}
    style={{
      width: width || size,
      height: height || size,
      backgroundImage: "url('/herit.svg')",
    }}
  />
);
