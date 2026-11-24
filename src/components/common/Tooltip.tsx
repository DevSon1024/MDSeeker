import { useState, useRef, useLayoutEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "bottom",
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [shiftX, setShiftX] = useState(0);

  const show = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hide = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useLayoutEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;
      let shift = 0;

      if (rect.left < padding) {
        shift = padding - rect.left;
      } else if (rect.right > window.innerWidth - padding) {
        shift = window.innerWidth - padding - rect.right;
      }

      setShiftX(shift);
    } else {
      setShiftX(0);
    }
  }, [isVisible]);

  const positionClasses = {
    top: "bottom-full left-1/2 mb-1.5",
    bottom: "top-full left-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[position];

  const transformStyle =
    position === "top" || position === "bottom"
      ? { transform: `translateX(calc(-50% + ${shiftX}px))` }
      : undefined;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={transformStyle}
          className={`absolute ${positionClasses} z-50 pointer-events-none whitespace-nowrap px-2 py-1 text-[11px] font-normal text-[var(--fluent-text-primary)] bg-[var(--fluent-bg-flyout)] border border-[var(--fluent-border-card)] rounded-[var(--fluent-radius-sm)] shadow-[var(--fluent-shadow-tooltip)] animate-in fade-in duration-150`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
