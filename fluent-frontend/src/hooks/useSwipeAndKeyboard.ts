import { useEffect, useRef } from "react";

interface UseSwipeAndKeyboardOptions {
  callback: () => void;
  direction?: "up" | "down" | "left" | "right";
  key?: string;
  dependencies?: React.DependencyList;
}

/**
 * Custom hook that handles swipe up gestures and keyboard navigation (ArrowRight key)
 * @param callback - Callback function to execute when swipe up/down/left/right or ArrowRight is detected
 * @param dependencies - Optional dependency array to re-register event listeners when values change
 */
export const useSwipeAndKeyboard = ({
  callback,
  direction = "up",
  key = "ArrowRight",
  dependencies = [],
}: UseSwipeAndKeyboardOptions) => {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || touchStartX.current === null) return;

      touchEndY.current = e.changedTouches[0].clientY;
      touchEndX.current = e.changedTouches[0].clientX;
      const diffY = touchStartY.current - touchEndY.current;
      const diffX = touchStartX.current - touchEndX.current;

      // Detect swipe up/down/left/right (minimum distance of 50px)
      if (
        (diffY > 50 && direction === "up") ||
        (diffX > 50 && direction === "left") ||
        (diffX < -50 && direction === "right") ||
        (diffY < -50 && direction === "down")
      ) {
        callback();
      }

      // Reset touch coordinates
      touchStartY.current = null;
      touchEndY.current = null;
      touchStartX.current = null;
      touchEndX.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case key:
          callback();
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
  }, [callback, direction, key, ...dependencies]);
};
