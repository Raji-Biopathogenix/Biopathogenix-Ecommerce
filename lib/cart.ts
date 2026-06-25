import { API_BASE_URL } from "@/config/env";
import { getAccessToken } from "@/lib/auth";
import {CartItem} from "@/types/cart";
type Cart = CartItem[];
import {CheckoutPayload} from "@/types/checkout";


async function authFetch(path: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || payload?.error || "Request failed");
  }

  if (response.status === 204) {
    return {};
  }
  return response.json();
}

export async function getCart(): Promise<Cart> {
  const payload = await authFetch("/v1/cart/");

  console.log("payload of the ", payload)
  return payload.data as Cart;
}

export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  const payload = await authFetch("/v1/cart/", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  return payload.data as Cart;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const payload = await authFetch(`/v1/cart/${itemId}/`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return payload.data as Cart;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const payload = await authFetch(`/v1/cart/${itemId}/`, {
    method: "DELETE",
  });
  return payload.data as Cart;
}

export async function clearCart(): Promise<Cart> {
  const payload = await authFetch("/v1/cart/", {
    method: "DELETE",
  });
  return payload.data as Cart;
}

export async function checkout(payload: CheckoutPayload) {
  return authFetch("/v1/address/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

