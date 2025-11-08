// constants/routes.constants.ts
export const BASE = "/api/v1";
export const USER_BASE = `${BASE}/users`;
export const TASK_BASE = `${BASE}/tasks`;
export const AUTH_BASE = `${BASE}/auth`;

// Change to relative paths
export const USER_ROUTES = {
  PROFILE: "/profile",
};

export const TASK_ROUTES = {
  CREATE: "/create",
  UPDATE: (taskId: string) => `/${taskId}/update`,
  DELETE: (taskId: string) => `/${taskId}/delete`,
  LIST: "/",
};

export const AUTH_ROUTES = {
  SIGNUP: "/signup",
  LOGIN: "/login",
  LOGOUT: "/logout",
  REFRESH_TOKEN: "/refresh-token",
};
