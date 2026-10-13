import { UserProfile, AuthResponse, PublicOrderSummary } from '../types';

const TOKEN_KEY = 'somtopup_customer_token';
const USER_KEY = 'somtopup_customer_user';

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCurrentCustomer(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomerSession(token: string, user: UserProfile): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('somtopup_customer_auth_change'));
  } catch (e) {
    console.error('Error saving customer session:', e);
  }
}

export function clearCustomerSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('somtopup_customer_auth_change'));
  } catch (e) {
    console.error('Error clearing customer session:', e);
  }
}

// Check session on load
export async function fetchCustomerProfile(): Promise<UserProfile | null> {
  const token = getCustomerToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
    }
    // Token expired or invalid
    clearCustomerSession();
    return null;
  } catch {
    return getCurrentCustomer();
  }
}

export async function registerCustomer(
  email: string,
  password: string,
  name?: string,
  defaultPlayerId?: string
): Promise<AuthResponse> {
  try {
    const guestSessionId = localStorage.getItem('somtopup_guest_session_id') || undefined;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, defaultPlayerId, guestSessionId }),
    });
    const data: AuthResponse = await res.json();
    if (data.success && data.token && data.user) {
      saveCustomerSession(data.token, data.user);
    }
    return data;
  } catch (err) {
    return { success: false, error: 'Khalad xagga xiriirka ah ayaa dhacay.' };
  }
}

export async function loginCustomer(email: string, password: string): Promise<AuthResponse> {
  try {
    const guestSessionId = localStorage.getItem('somtopup_guest_session_id') || undefined;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, guestSessionId }),
    });
    const data: AuthResponse = await res.json();
    if (data.success && data.token && data.user) {
      saveCustomerSession(data.token, data.user);
    }
    return data;
  } catch (err) {
    return { success: false, error: 'Khalad xagga xiriirka ah ayaa dhacay.' };
  }
}

export async function logoutCustomer(): Promise<void> {
  const token = getCustomerToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  clearCustomerSession();
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Khalad xagga xiriirka ah ayaa dhacay.' };
  }
}

export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetToken, newPassword }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Khalad xagga xiriirka ah ayaa dhacay.' };
  }
}

export async function fetchCustomerOrders(): Promise<PublicOrderSummary[]> {
  const token = getCustomerToken();
  if (!token) return [];

  try {
    const res = await fetch('/api/customer/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        return data.orders;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function updateCustomerProfile(name: string, defaultPlayerId?: string): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/customer/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, defaultPlayerId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        saveCustomerSession(token, data.user);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function changeCustomerPassword(
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const token = getCustomerToken();
  if (!token) return { success: false, error: 'Fadlan soo gal marka hore.' };

  try {
    const res = await fetch('/api/customer/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword, currentPassword }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Khalad xagga xiriirka ah ayaa dhacay.' };
  }
}
