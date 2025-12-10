import axiosInstance from "../../../lib/axios";

export const sqlService = {
  runQuery: async (sql: string) => {
    const response = await axiosInstance.post("/query", { sql });
    return response.data;
  },

  getHistory: async () => {
    const response = await axiosInstance.get("/query/history");
    return response.data;
  }
};
