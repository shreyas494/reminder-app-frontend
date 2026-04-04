export const APP_ROUTES = {
  landing: "/landing",
  login: "/login",
  dashboard: "/",
  nearExpiry: "/near-expiry",
  quotations: "/quotations",
  bills: "/bills",
  services: "/services",
  adminUsers: "/admin/users",
  adminCreateUser: "/admin/users/create",
};

export const SIDEBAR_BASE_NAV_ITEMS = [
  { label: "Dashboard", to: APP_ROUTES.dashboard },
  { label: "Quotations", to: APP_ROUTES.quotations },
  { label: "Bills", to: APP_ROUTES.bills },
  { label: "Services", to: APP_ROUTES.services },
];

export const SIDEBAR_SUPERADMIN_NAV_ITEMS = [
  { label: "Admin Users", to: APP_ROUTES.adminUsers },
  { label: "Create User", to: APP_ROUTES.adminCreateUser },
];
