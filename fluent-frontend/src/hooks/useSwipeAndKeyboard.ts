import { useEffect, useRef } from "react";

interface UseSwipeAndKeyboardOptions {
  onAdvance: () => void;
  dependencies?: React.DependencyList;
}

/**
 * Custom hook that handles swipe up gestures and keyboard navigation (ArrowRight key)
 * @param onAdvance - Callback function to execute when swipe up or ArrowRight is detected
 * @param dependencies - Optional dependency array to re-register event listeners when values change
 */
export const useSwipeAndKeyboard = ({ onAdvance, dependencies = [] }: UseSwipeAndKeyboardOptions) => {
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;

      touchEndY.current = e.changedTouches[0].clientY;
      const diffY = touchStartY.current - touchEndY.current;

      // Detect swipe up (minimum distance of 50px)
      if (diffY > 50) {
        onAdvance();
      }

      // Reset touch coordinates
      touchStartY.current = null;
      touchEndY.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          onAdvance();
          break;
        default:
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onAdvance, ...dependencies]);
};
