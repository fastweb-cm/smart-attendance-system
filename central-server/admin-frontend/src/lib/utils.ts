import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRelativeTimeString = (dateString: string | null | undefined): string => {
  if (!dateString) return "Never connected";

  const now = new Date();
  const heartbeat = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - heartbeat.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// Today's date string in local YYYY-MM-DD format used to mark current day cells
 export const CURRENT_DATE_STRING = (() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

// Example of a utility function to format date strings in a more user-friendly way
export const formatDateFriendly = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Utility to calculate days difference between two date strings (inclusive)
export const getDaysDifference = (start: string, end: string) => {
  const sDate = new Date(start);
  const eDate = new Date(end);
  const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// returns previous day date
export function getPreviousDay() {
  const date = new Date();
  date.setDate(date.getDate() - 1); // Subtract 1 day
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
