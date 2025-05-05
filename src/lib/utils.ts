
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to display in a user-friendly way
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

// Generate unique ID
export function generateId(prefix: string = ""): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Sort array by date
export function sortByDate<T>(array: T[], dateKey: keyof T, ascending: boolean = false): T[] {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey] as string | number | Date).getTime();
    const dateB = new Date(b[dateKey] as string | number | Date).getTime();
    
    return ascending ? dateA - dateB : dateB - dateA;
  });
}
