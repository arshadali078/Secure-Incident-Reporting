import { api } from "@/services/api";

export async function getNotifications(params = {}) {
    const res = await api.get("/notifications", { params });
    return res.data;
}

export async function markAsRead(notificationId) {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
}

export async function markAllAsRead() {
    const res = await api.patch("/notifications/read-all");
    return res.data;
}

export async function deleteNotification(notificationId) {
    const res = await api.delete(`/notifications/${notificationId}`);
    return res.data;
}

export async function deleteAllNotifications() {
    const res = await api.delete("/notifications");
    return res.data;
}
