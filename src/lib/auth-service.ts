// Simple admin authentication with hardcoded password
const ADMIN_PASSWORD = 'admin123';
const AUTH_KEY = 'admin_authenticated';

export const loginAdmin = async (password: string): Promise<boolean> => {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
};

export const logoutAdmin = async (): Promise<boolean> => {
  localStorage.removeItem(AUTH_KEY);
  return true;
};

export const isAdminAuthenticated = (): Promise<boolean> => {
  return Promise.resolve(localStorage.getItem(AUTH_KEY) === 'true');
}; 