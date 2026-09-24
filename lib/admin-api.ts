import { apiFetch } from "./api";

export type AdminDashboardData = {
  stats: {
    products: number;
    orders: number;
    customers: number;
    revenue: number;
    categories: number;
    banners: number;
  };
  status: {
    backend: string;
    mongodb: string;
    productsApi: string;
    categoriesApi: string;
    bannersApi: string;
    cloudinary: string;
  };
};

export type AdminCustomer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "super_admin";
};

export async function getAdminMe() {
  const result = await apiFetch<{ success: boolean; user: AdminUser }>("/api/admin/me");
  return result.user;
}

export async function getAdminDashboard() {
  const result = await apiFetch<{ success: boolean } & AdminDashboardData>("/api/admin/dashboard");
  return { stats: result.stats, status: result.status };
}

export async function getAdminCustomers() {
  const result = await apiFetch<{ success: boolean; customers: AdminCustomer[] }>("/api/admin/customers");
  return Array.isArray(result.customers) ? result.customers : [];
}

export async function setAdminCustomerActive(id: string, isActive: boolean) {
  return apiFetch<{ success: boolean; customer: AdminCustomer }>(
    `/api/admin/customers/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { isActive } }
  );
}

export async function getAdminOrders() {
  const result = await apiFetch<{ success: boolean; orders: Record<string, unknown>[] }>("/api/admin/orders");
  return Array.isArray(result.orders) ? result.orders : [];
}

export async function setAdminOrderStatus(id: string, status: string) {
  return apiFetch<{ success: boolean; order: Record<string, unknown> }>(
    `/api/admin/orders/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { status } }
  );
}

export async function getAdminCoupons() {
  const result = await apiFetch<{ success: boolean; coupons: Record<string, unknown>[] }>("/api/admin/coupons");
  return Array.isArray(result.coupons) ? result.coupons : [];
}

export async function getAdminPages() {
  const result = await apiFetch<{ success: boolean; pages: Record<string, unknown>[] }>("/api/admin/pages");
  return Array.isArray(result.pages) ? result.pages : [];
}

export async function getAdminSystemStatus() {
  return apiFetch<{
    success: boolean;
    services: Record<string, string>;
    collections: Record<string, number>;
    environment: string;
  }>("/api/admin/system-status");
}
