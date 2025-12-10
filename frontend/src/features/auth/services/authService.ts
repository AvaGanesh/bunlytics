import axiosInstance from "../../../lib/axios";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  register: async (email: string, password: string) => {
    const response = await axiosInstance.post("/auth/signup", { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },
};
