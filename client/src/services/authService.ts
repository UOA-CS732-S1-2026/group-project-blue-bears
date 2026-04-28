const API_URL = import.meta.env.VITE_API_URL;

export interface LoginPayload {
    emailOrUsername: string;
    password: string;
}

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    userId: string;
    email: string;
}

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Login failed');

    return data;
};

export const registerUser = async (payload: RegisterPayload): Promise<void> => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Registration failed');
};