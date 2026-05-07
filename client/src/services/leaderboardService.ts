const API_URL = import.meta.env.VITE_API_URL;

export interface LeaderboardEntry {
    userId: string;
    username: string;
    bestWpm: number;
    avgWpm: number;
    avgAccuracy: number;
    totalMatches: number;
    totalWins: number;
}

export const getLeaderboard = async (token: string, limit = 50): Promise<LeaderboardEntry[]> => {
    const res = await fetch(`${API_URL}/api/leaderboard?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard');

    return data;
};
