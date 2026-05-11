const API_URL = import.meta.env.VITE_API_URL;

export interface ProfileData {
    username: string;
    email: string;
    totalMatches: number;
    totalWins: number;
    bestWpm: number;
    avgWpm: number;
    avgAccuracy: number;
}

export interface PlayerSnapshot {
    userId: string | null;
    username: string;
    wpm: number;
    accuracy: number;
}

export interface Match {
    _id: string;
    winnerId?: string;
    player1: PlayerSnapshot;
    player2: PlayerSnapshot;
    createdAt: string;
}

export interface MatchHistoryResponse {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    matches: Match[];
}

export const getProfile = async (token: string): Promise<ProfileData> => {
    const res = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');

    return data;
};

export const getMatchHistory = async (
    token: string,
    page = 1,
    limit = 10
): Promise<MatchHistoryResponse> => {
    const res = await fetch(`${API_URL}/api/results?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch match history');

    return data;
};
