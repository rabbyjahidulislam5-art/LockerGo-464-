import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect } from "react"
import { io } from "socket.io-client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001");

export function useRealtime(callback: (data: any) => void) {
  useEffect(() => {
    socket.on("DATA_UPDATE", callback);
    return () => {
      socket.off("DATA_UPDATE", callback);
    };
  }, [callback]);
}

/**
 * Returns a strict local date string (YYYY-MM-DD) from an ISO string or Date object.
 * This avoids the UTC off-by-one issue common with .toISOString().split('T')[0].
 */
export function formatDateLocal(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a strict local month string (YYYY-MM) from an ISO string or Date object.
 */
export function formatMonthLocal(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns a user-friendly error message by stripping technical prefixes (like HTTP 400).
 */
export function getErrorMessage(err: any): string {
  const msg = err?.message || "";
  if (msg.includes(":")) {
    return msg.split(":").pop()?.trim() || "An unexpected error occurred.";
  }
  return msg || "An unexpected error occurred.";
}

/**
 * Returns a string formatted for datetime-local input (YYYY-MM-DDTHH:mm) 
 * using the local timezone.
 */
export function getDateTimeLocal(dateInput?: string | Date | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a date string specifically for Bangladesh timezone (Asia/Dhaka)
 * to ensure consistency across all dashboards.
 */
export function formatDateTime(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
