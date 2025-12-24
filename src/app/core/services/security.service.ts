import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Security Service for Authentication Frontend
 * Handles secure cookie management, CSRF protection, and security utilities
 * CRITICAL: This service handles sensitive authentication data
 */
@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Set a secure cookie with strict security flags
   * @param name Cookie name
   * @param value Cookie value
   * @param days Days until expiration (default 1 for auth cookies)
   */
  setCookie(name: string, value: string, days = 1): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;

    // Strict security flags for auth service
    const secure = environment.production ? '; Secure' : '';
    const sameSite = '; SameSite=Strict';
    const path = '; path=/';

    document.cookie = `${name}=${encodeURIComponent(value)}${expires}${path}${secure}${sameSite}`;
  }

  /**
   * Set a session cookie (expires when browser closes)
   * @param name Cookie name
   * @param value Cookie value
   */
  setSessionCookie(name: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const secure = environment.production ? '; Secure' : '';
    const sameSite = '; SameSite=Strict';
    const path = '; path=/';

    document.cookie = `${name}=${encodeURIComponent(value)}${path}${secure}${sameSite}`;
  }

  /**
   * Get a cookie value
   * @param name Cookie name
   * @returns Cookie value or null
   */
  getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      let c = cookie.trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  }

  /**
   * Delete a cookie securely
   * @param name Cookie name
   */
  deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const secure = environment.production ? '; Secure' : '';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${secure}; SameSite=Strict`;
  }

  /**
   * Clear all authentication cookies (for logout)
   */
  clearAuthCookies(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Clear known auth cookies
    const authCookies = ['access_token', 'refresh_token', 'session_id', 'XSRF-TOKEN'];
    authCookies.forEach((name) => this.deleteCookie(name));
  }

  /**
   * Sanitize user input to prevent XSS
   * @param input User input string
   * @returns Sanitized string
   */
  sanitizeInput(input: string): string {
    if (!isPlatformBrowser(this.platformId)) return input;

    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate redirect URL to prevent open redirect attacks
   * Only allows redirects to the main ecommerce site
   * @param url URL to validate
   * @returns true if URL is safe
   */
  isValidRedirectUrl(url: string): boolean {
    // Allow relative URLs that don't start with //
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }

    try {
      const parsedUrl = new URL(url);
      const currentHost = window.location.host;

      // Allow same origin
      if (parsedUrl.host === currentHost) {
        return true;
      }

      // Only allow redirects to known ecommerce domains
      const allowedDomains = this.getAllowedDomains();

      return allowedDomains.some(
        (domain) => parsedUrl.host === domain || parsedUrl.host.endsWith(`.${domain}`),
      );
    } catch {
      return false;
    }
  }

  /**
   * Get allowed domains for redirect validation
   * @returns Array of allowed domain strings
   */
  private getAllowedDomains(): string[] {
    const domains = [
      'ecommerce.com',
      'www.ecommerce.com',
      'localhost:4200', // Development
      'localhost:4400', // Development auth
    ];

    // Add production domains from environment
    const ecommerceUrl = environment.ecommerceUrl;
    if (ecommerceUrl) {
      try {
        const url = new URL(ecommerceUrl);
        if (!domains.includes(url.host)) {
          domains.push(url.host);
        }
      } catch (e) {
        // Invalid URL
      }
    }

    return domains;
  }

  /**
   * Generate a cryptographically secure random token
   * @param length Token length (default 32)
   * @returns Random token string
   */
  generateToken(length = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate CSRF token and store it
   * @returns CSRF token
   */
  generateCsrfToken(): string {
    const token = this.generateToken(32);
    this.setSessionCookie('XSRF-TOKEN', token);
    return token;
  }

  /**
   * Validate CSRF token
   * @param token Token to validate
   * @returns true if valid
   */
  validateCsrfToken(token: string): boolean {
    const storedToken = this.getCookie('XSRF-TOKEN');
    return storedToken !== null && storedToken === token;
  }

  /**
   * Check if the current connection is secure (HTTPS)
   * @returns true if using HTTPS
   */
  isSecureConnection(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    return window.location.protocol === 'https:';
  }

  /**
   * Detect if running in an iframe (clickjacking protection)
   * @returns true if in iframe
   */
  isInIframe(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  /**
   * Check for common security issues and log warnings
   */
  performSecurityCheck(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check HTTPS in production
    if (environment.production && !this.isSecureConnection()) {
      console.error('[SECURITY] Application is running over HTTP in production!');
    }

    // Check for iframe embedding
    if (this.isInIframe()) {
      console.warn('[SECURITY] Application is running inside an iframe');
    }

    // Check for localStorage availability (some privacy modes block it)
    try {
      localStorage.setItem('__security_test__', 'test');
      localStorage.removeItem('__security_test__');
    } catch {
      console.warn('[SECURITY] localStorage is not available');
    }
  }

  /**
   * Hash a string using SHA-256 (for non-sensitive data comparison)
   * @param str String to hash
   * @returns Promise with hex hash
   */
  async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
