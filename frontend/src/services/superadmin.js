import { api } from "@/services/api";

export async function listUsers(params = {}) {
    const res = await api.get("/users", { params });
    return res.data;
}

export async function createUser(payload) {
    const res = await api.post("/users", payload);
    return res.data;
}

export async function updateUser(id, patch) {
    const res = await api.patch(`/users/${id}`, patch);
    return res.data;
}

export async function deleteUser(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
}

export async function listLogs(params = {}) {
    const res = await api.get("/logs", { params });
    return res.data;
}

export async function hardDeleteIncident(id) {
    const res = await api.delete(`/incidents/${id}`);
    return res.data;
}
