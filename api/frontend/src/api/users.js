import axios from "../config/axios";

// Users API helpers
export const UsersAPI = {
  // List users (owner-only on server)
  list: async () => {
    const { data } = await axios.get("/api/usuarios");
    return data;
  },
  // Update user by id; fields can include { nome, email, telefone, papel, senha }
  update: async (id, payload) => {
    const { data } = await axios.put(`/api/usuarios/${id}`, payload);
    return data;
  },
  // Delete user by id
  remove: async (id) => {
    const { data } = await axios.delete(`/api/usuarios/${id}`);
    return data;
  }
};
