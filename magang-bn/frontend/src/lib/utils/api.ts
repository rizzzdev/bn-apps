import { PUBLIC_API_URL, PUBLIC_MASTER_API_URL } from "$env/static/public";
import { goto } from "$app/navigation";
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

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  let accessToken = getCookie("access_token");

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

  let response = await fetch(`${PUBLIC_API_URL}${endpoint}`, config);
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
      `${PUBLIC_MASTER_API_URL}/api/v1/auth/refresh`,
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

    headers["Authorization"] = `Bearer ${getCookie("access_token")}`;
    response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
      ...config,
      headers,
    });
    const data = await response.json();

    return data;
  } catch (error) {
    // Jika refresh gagal, hapus token dan redirect ke login
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    if (typeof window !== "undefined") {
      toast.error("Your session is over, please relogin!");
      goto("/login");
    }

    return null;
  }
};
