import { defineDriver } from "unstorage";

const DRIVER_NAME = "cookie";

interface CookieOptions {
  prefix?: string;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

interface CookieSetOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export default defineDriver((opts: CookieOptions = {}) => {
  const {
    prefix = "unstorage_",
    maxAge = 60 * 60 * 24 * 7, // 7 days default
    path = "/",
    domain = "",
    secure = false,
    sameSite = "Lax"
  } = opts;

  const makeKey = (key: string): string => prefix + key;

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  };

  const setCookie = (name: string, value: string, options: CookieSetOptions = {}): void => {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    
    if (options.maxAge) {
      const date = new Date();
      date.setTime(date.getTime() + options.maxAge * 1000);
      cookie += `; expires=${date.toUTCString()}`;
    }
    
    if (options.path) cookie += `; path=${options.path}`;
    if (options.domain) cookie += `; domain=${options.domain}`;
    if (options.secure) cookie += "; secure";
    if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
    
    document.cookie = cookie;
  };

  const deleteCookie = (name: string): void => {
    setCookie(name, "", { maxAge: -1 });
  };

  return {
    name: DRIVER_NAME,
    options: opts,
    
    hasItem(key: string): boolean {
      const value = getCookie(makeKey(key));
      return value !== null;
    },
    
    getItem(key: string): unknown {
      const value = getCookie(makeKey(key));
      if (value === null) return null;
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return value;
      }
    },
    
    getItemRaw(key: string): string | null {
      const value = getCookie(makeKey(key));
      return value === null ? null : decodeURIComponent(value);
    },
    
    setItem(key: string, value: unknown): void {
      const stringValue = typeof value === "string" 
        ? value 
        : JSON.stringify(value);
      setCookie(makeKey(key), stringValue, {
        maxAge,
        path,
        domain,
        secure,
        sameSite
      });
    },
    
    setItemRaw(key: string, value: string): void {
      setCookie(makeKey(key), value, {
        maxAge,
        path,
        domain,
        secure,
        sameSite
      });
    },
    
    removeItem(key: string): void {
      deleteCookie(makeKey(key));
    },
    
    getKeys(): string[] {
      return document.cookie
        .split("; ")
        .map((cookie: string) => cookie.split("=")[0])
        .filter((key: string) => key.startsWith(prefix))
        .map((key: string) => key.slice(prefix.length));
    },
    
    clear(): void {
      const keys = this.getKeys();
      keys.forEach((key: string) => this.removeItem(key));
    }
  // @ts-ignore - unstorage driver interface compatibility
  } as any;
}); 