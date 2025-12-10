import axiosInstance from "../../../lib/axios";

export const dashboardsService = {
  fetchAll: async () => {
    const response = await axiosInstance.get("/dashboards");
    return response.data;
  },

  create: async (name: string) => {
    const response = await axiosInstance.post("/dashboards", { name });
    return response.data;
  },

  fetchPanels: async (id: string) => {
    const response = await axiosInstance.get(`/dashboards/${id}/panels`);
    return response.data;
  },

  addPanel: async (dashboardId: string, panel: any) => {
    const response = await axiosInstance.post(
      `/dashboards/${dashboardId}/panels`,
      panel
    );
    return response.data;
  },

  run: async (id: string) => {
    const response = await axiosInstance.get(`/dashboards/${id}/run`);
    return response.data;
  },
};
