import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginUser, registerUser } from '../../services/authService';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('loginUser', () => {
  it('returns AuthResponse on success', async () => {
    const mockData = {
      token: 'jwt.token.here',
      userId: 'user123',
      email: 'test@example.com',
      username: 'testuser',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await loginUser({ emailOrUsername: 'test@example.com', password: 'pw123456' });

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('throws an Error with the server message on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    await expect(
      loginUser({ emailOrUsername: 'bad@example.com', password: 'wrongpw' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('throws a generic Error when server returns no error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(
      loginUser({ emailOrUsername: 'a@b.com', password: 'pw' }),
    ).rejects.toThrow('Login failed');
  });
});

describe('registerUser', () => {
  it('resolves without throwing on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'User created successfully' }),
    });

    await expect(
      registerUser({
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }),
    ).resolves.toBeUndefined();
  });

  it('throws an Error with the server message on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    });

    await expect(
      registerUser({
        email: 'dup@example.com',
        username: 'dupuser',
        password: 'password123',
        firstName: 'Dup',
        lastName: 'User',
      }),
    ).rejects.toThrow('Email already in use');
  });
});
