import axios from "axios";

const baseURL =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.length > 0
        ? import.meta.env.VITE_API_URL
        : "/api/v1";

export const api = axios.create({
    baseURL,
    withCredentials: true,
});

let _accessToken = null;
let _refreshPromise = null;

export function setAccessToken(token) {
    _accessToken = token;
}

export function getAccessToken() {
    return _accessToken;
}

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error?.config;
        const status = error?.response?.status;

        if (!original || status !== 401 || original._retry) {
            throw error;
        }

        original._retry = true;

        if (!_refreshPromise) {
            _refreshPromise = api
                .post("/auth/refresh")
                .then((r) => {
                    const token = r?.data?.accessToken;
                    if (!token)
                        throw new Error("No accessToken returned from refresh");
                    setAccessToken(token);
                    return token;
                })
                .finally(() => {
                    _refreshPromise = null;
                });
        }

        const newToken = await _refreshPromise;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return api.request(original);
    }
);
