import { api, getAccessToken } from "@/services/api";

export async function getStats() {
    const res = await api.get("/incidents/stats");
    return res.data;
}

export async function listAssignableAdmins() {
    const res = await api.get("/users/admins");
    return res.data;
}

export async function updateIncident(id, patch) {
    const res = await api.patch(`/incidents/${id}`, patch);
    return res.data;
}

export async function bulkResolve(incidentIds) {
    const res = await api.patch("/incidents/bulk/resolve", { incidentIds });
    return res.data;
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function exportCsv(params = {}) {
    const token = getAccessToken();
    const res = await api.get("/incidents/export/csv", {
        params,
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    downloadBlob(res.data, "incidents.csv");
}

export async function exportPdf(params = {}) {
    const token = getAccessToken();
    const res = await api.get("/incidents/export/pdf", {
        params,
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    downloadBlob(res.data, "incidents.pdf");
}
