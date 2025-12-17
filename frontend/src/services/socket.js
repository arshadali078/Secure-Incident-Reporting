import { io } from "socket.io-client";

export function createSocket({ token } = {}) {
    const url =
        import.meta.env.VITE_SOCKET_URL &&
        import.meta.env.VITE_SOCKET_URL.length > 0
            ? import.meta.env.VITE_SOCKET_URL
            : "http://localhost:5000";

    return io(url, {
        transports: ["websocket"],
        withCredentials: true,
        auth: token ? { token } : undefined,
    });
}
