import { defineDriver } from "unstorage";
import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

const DRIVER_NAME = "cookie";

// Schema for CookieOptions
export const CookieOptionsSchema = Type.Object({
  prefix: Type.Optional(Type.String()),
  maxAge: Type.Optional(Type.Number()),
  path: Type.Optional(Type.String()),
  domain: Type.Optional(Type.String()),
  secure: Type.Optional(Type.Boolean()),
  sameSite: Type.Optional(Type.Union([Type.Literal('Strict'), Type.Literal('Lax'), Type.Literal('None')]))
});

export type CookieOptions = Static<typeof CookieOptionsSchema>;

// Schema for CookieSetOptions
export const CookieSetOptionsSchema = Type.Object({
  maxAge: Type.Optional(Type.Number()),
  path: Type.Optional(Type.String()),
  domain: Type.Optional(Type.String()),
  secure: Type.Optional(Type.Boolean()),
  sameSite: Type.Optional(Type.Union([Type.Literal('Strict'), Type.Literal('Lax'), Type.Literal('None')]))
});

export type CookieSetOptions = Static<typeof CookieSetOptionsSchema>;

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
    
    async hasItem(key: string): Promise<boolean> {
      const value = getCookie(makeKey(key));
      return value !== null;
    },
    
    async getItem(key: string): Promise<unknown> {
      const value = getCookie(makeKey(key));
      if (value === null) return null;
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return value;
      }
    },
    
    async getItemRaw(key: string): Promise<string | null> {
      const value = getCookie(makeKey(key));
      return value === null ? null : decodeURIComponent(value);
    },
    
    async setItem(key: string, value: unknown): Promise<void> {
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
    
    async setItemRaw(key: string, value: string): Promise<void> {
      setCookie(makeKey(key), value, {
        maxAge,
        path,
        domain,
        secure,
        sameSite
      });
    },
    
    async removeItem(key: string): Promise<void> {
      deleteCookie(makeKey(key));
    },
    
    async getKeys(): Promise<string[]> {
      return document.cookie
        .split("; ")
        .map((cookie: string) => cookie.split("=")[0])
        .filter((key: string) => key.startsWith(prefix))
        .map((key: string) => key.slice(prefix.length));
    },
    
    async clear(): Promise<void> {
      const keys = await this.getKeys();
      for (const key of keys) {
        await this.removeItem(key);
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}); 