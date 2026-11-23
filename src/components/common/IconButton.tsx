import React, { forwardRef } from "react";
import { Tooltip } from "./Tooltip";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      tooltip,
      tooltipPosition = "bottom",
      isActive = false,
      size = "md",
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "p-1 text-xs",
      md: "p-1.5 text-sm",
      lg: "p-2 text-base",
    }[size];

    const activeClasses = isActive
      ? "bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)] border-[var(--fluent-accent)] font-semibold"
      : "";

    const button = (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        disabled={disabled}
        className={`fluent-icon-btn ${sizeClasses} ${activeClasses} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );

    if (tooltip && !disabled) {
      return (
        <Tooltip content={tooltip} position={tooltipPosition}>
          {button}
        </Tooltip>
      );
    }

    return button;
  }
);

IconButton.displayName = "IconButton";
