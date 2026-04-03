"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./LinkMapCodeControl.module.css";

type LinkMapCodeControlProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
  placeholder?: string;
};

export default function LinkMapCodeControl({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  busy = false,
  label = "Link Map Code",
  placeholder = "Enter code here",
}: LinkMapCodeControlProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 140);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  return (
    <div ref={panelRef} className={`${styles.linkPanelInline} ${open ? styles.linkPanelInlineOpen : ""}`}>
      <div className={styles.linkExpandShell}>
        <button
          type="button"
          className={styles.linkExpandTrigger}
          onClick={() => !disabled && onOpenChange(!open)}
          aria-expanded={open}
          disabled={disabled}
        >
          <Image src="/icons/relationship.svg" alt="" width={16} height={16} className={styles.toolbarButtonIcon} />
          <span>{label}</span>
        </button>
        <input
          ref={inputRef}
          type="text"
          className={styles.linkInput}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
            if (event.key === "Escape") {
              onOpenChange(false);
            }
          }}
          disabled={disabled}
        />
      </div>
      <div className={styles.linkPanelInlineBody}>
        <button
          type="button"
          className={styles.linkInlineIconButton}
          onClick={onSubmit}
          disabled={disabled || busy}
          title={busy ? "Linking" : "Link map code"}
          aria-label={busy ? "Linking" : "Link map code"}
        >
          <Image src="/icons/relationship.svg" alt="" width={16} height={16} className={styles.linkInlineIcon} />
        </button>
        <button
          type="button"
          className={styles.linkInlineIconButton}
          onClick={() => onOpenChange(false)}
          title="Close link map code"
          aria-label="Close link map code"
          disabled={disabled}
        >
          <span className={styles.linkInlineCloseIcon} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
