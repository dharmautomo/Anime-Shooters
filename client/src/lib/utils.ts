import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getLocalStorage = (key: string): any =>
  JSON.parse(window.localStorage.getItem(key) || "null");
const setLocalStorage = (key: string, value: any): void =>
  window.localStorage.setItem(key, JSON.stringify(value));

// Type safe helper for handling React Three Fiber KeyboardControls
export type KeyMapping = {
  forward?: boolean;
  backward?: boolean;
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  [key: string]: boolean | undefined;
};

export { getLocalStorage, setLocalStorage };
