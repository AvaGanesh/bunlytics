import axiosInstance from "../../../lib/axios";

export const datasetsService = {
  fetchAll: async () => {
    const response = await axiosInstance.get("/datasets");
    return response.data;
  },

  upload: async (file: File, name?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);

    const response = await axiosInstance.post("/datasets", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
