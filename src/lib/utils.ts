import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getJsonOrError(res: Response, fallbackError: string): Promise<any> {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || fallbackError);
      }
      return data;
    } catch (e: any) {
      if (!res.ok) {
        throw new Error(e.message || fallbackError);
      }
      throw new Error("Failed to parse server response");
    }
  } else {
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText || fallbackError}`);
    }
    throw new Error("Expected JSON response but received text/html");
  }
}
