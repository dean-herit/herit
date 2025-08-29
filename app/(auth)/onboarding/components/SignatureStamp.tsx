"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { Signature } from "@/types/onboarding";

interface SignatureStampProps {
  signature: Signature;
  isSigned: boolean;
  timestamp?: string;
  onClick?: () => void;
  disabled?: boolean;
  userName?: string;
  isLoading?: boolean;
}

export function SignatureStamp({
  signature,
  isSigned,
  timestamp: _timestamp,
  onClick,
  disabled = false,
  userName,
  isLoading = false,
}: SignatureStampProps) {
  const renderSignature = () => {
    // Always use the immutable properties stored with the signature
    // This ensures signatures appear exactly as they were when created

    if (signature.type === "template" && signature.className) {
      return (
        <div
          className={`text-4xl text-black dark:text-white ${signature.className}`}
          style={{
            transform: "scaleY(1.2)",
            letterSpacing: "0.05em",
          }}
        >
          {signature.data}
        </div>
      );
    } else if (signature.type === "uploaded") {
      return (
        <Image
          alt="Signature"
          className="max-h-16 w-auto object-contain"
          height={64}
          src={signature.data}
          width={200}
        />
      );
    } else {
      // Fallback for legacy signatures or drawn signatures
      return (
        <div
          className={`text-4xl text-black dark:text-white ${signature.className || "font-cursive"}`}
          style={{
            transform: "scaleY(1.2)",
            letterSpacing: "0.05em",
          }}
        >
          {signature.data}
        </div>
      );
    }
  };

  return (
    <div className="relative inline-block">
      {!isSigned ? (
        <button
          className={`
            relative inline-flex flex-col items-center
            transition-all duration-200 group
            ${!disabled ? "hover:opacity-70 cursor-pointer" : "opacity-50 cursor-not-allowed"}
          `}
          disabled={disabled}
          onClick={onClick}
        >
          {/* Asterisk and Click to sign text */}
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {isLoading ? "Saving signature..." : "* Click to sign"}
            </p>
          </div>

          {/* Signature line */}
          <div className="w-64 border-b-2 border-black dark:border-gray-300" />

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
      ) : (
        <div className="relative inline-flex flex-col items-center">
          <AnimatePresence>
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1],
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              {/* Signature - positioned above the line */}
              <div className="mb-2 relative" style={{ marginBottom: "2px" }}>
                {renderSignature()}
              </div>

              {/* Signature line with overlap */}
              <div className="w-64 border-b-2 border-black dark:border-gray-300 relative z-0" />

              {/* User name underneath line */}
              {userName && (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-black dark:text-gray-200 font-medium mt-2 uppercase tracking-wider"
                  initial={{ opacity: 0, y: -5 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {userName}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
