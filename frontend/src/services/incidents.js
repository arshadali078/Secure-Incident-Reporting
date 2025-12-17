import { api } from "@/services/api";

export async function listIncidents(params = {}) {
    const res = await api.get("/incidents", { params });
    return res.data;
}

export async function getIncident(id) {
    const res = await api.get(`/incidents/${id}`);
    return res.data;
}

export async function createIncident({
    title,
    description,
    category,
    priority,
    incidentDate,
    evidenceFiles = [],
}) {
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("category", category);
    form.append("priority", priority);
    form.append("incidentDate", incidentDate);

    for (const f of evidenceFiles) {
        form.append("evidence", f);
    }

    const res = await api.post("/incidents", form);
    return res.data;
}
