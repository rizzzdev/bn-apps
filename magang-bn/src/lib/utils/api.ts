import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from "$env/static/public";
import { toast } from "$lib/stores/toast.svelte";

export function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function deleteCookie(name: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function clearAuthCookies() {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
}

function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith("/api/v1/")) {
    return `${PUBLIC_API_URL}${endpoint}`;
  }
  return `${PUBLIC_API_URL}/api/v1/internship${endpoint}`;
}

/**
 * Mengembalikan access token untuk dipakai di header Authorization ketika
 * pemanggil perlu melakukan fetch langsung (mis. download binary file Excel).
 * Hanya membaca dari document.cookie karena token sengaja non-httpOnly agar
 * apiClient dapat menambahkannya; refresh_token disimpan httpOnly dan
 * TIDAK boleh dibaca dari sini.
 */
export function getAccessToken(): string | null {
  return getCookie("access_token");
}

export async function logout() {
  try {
    const token = getAccessToken();
    await fetch(`${PUBLIC_API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  } catch {
    // Backend unreachable, proceed with local logout
  } finally {
    clearAuthCookies();
    if (typeof window !== "undefined") {
      window.location.href = `${PUBLIC_PORTAL_URL}/login`;
    }
  }
}

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  let accessToken = getAccessToken();

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(buildApiUrl(endpoint), config);
  if (response.ok) {
    const data = await response.json();
    return data;
  }

  // Jika bukan 401, jangan mencoba refresh token, langsung kembalikan response error
  if (response.status !== 401) {
    try {
      const errorData = await response.json();
      return errorData;
    } catch {
      return null;
    }
  }

  // Pengecekan token expired (hanya untuk 401 Unauthorized)
  try {
    // Mencoba refresh token
    const refreshRes = await fetch(
      `${PUBLIC_API_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const refreshData = await refreshRes.json();

    if (!refreshRes.ok && refreshData.error) {
      throw new Error("Refresh token gagal");
    }

    headers["Authorization"] = `Bearer ${getAccessToken()}`;
    response = await fetch(buildApiUrl(endpoint), {
      ...config,
      headers,
    });
    const data = await response.json();

    return data;
  } catch (error) {
    // Jika refresh gagal, hapus token dan redirect ke login
    clearAuthCookies();
    if (typeof window !== "undefined") {
      toast.error("Your session is over, please relogin!");
      window.location.href = `${PUBLIC_PORTAL_URL}/login`;
    }

    return null;
  }
};
