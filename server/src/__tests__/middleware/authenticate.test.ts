import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/authenticate';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_jest';

const mockRes = () => {
  const res: Partial<Response> = {};
  const jsonMock = jest.fn().mockReturnValue(res);
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  res.status = statusMock as unknown as Response['status'];
  res.json = jsonMock as unknown as Response['json'];
  return { res: res as Response, statusMock, jsonMock };
};

const mockNext: NextFunction = jest.fn();

beforeEach(() => {
  (mockNext as jest.Mock).mockClear();
});

describe('authenticate middleware', () => {
  it('returns 401 when Authorization header is missing', () => {
    const req = { headers: {} } as Request;
    const { res, statusMock } = mockRes();

    authenticate(req, res, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Token abc123' } } as Request;
    const { res, statusMock } = mockRes();

    authenticate(req, res, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() and attaches user when token is valid', () => {
    const payload = { userId: 'abc123', email: 'a@b.com', username: 'tester' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const { res } = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((req as any).user).toMatchObject({ userId: 'abc123', username: 'tester' });
  });

  it('returns 401 with "Token expired" message for an expired token', () => {
    const payload = { userId: 'abc123', email: 'a@b.com', username: 'tester' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const { res, statusMock, jsonMock } = mockRes();

    authenticate(req, res, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 with "Invalid token" message for a garbage token', () => {
    const req = {
      headers: { authorization: 'Bearer not.a.real.token' },
    } as Request;
    const { res, statusMock, jsonMock } = mockRes();

    authenticate(req, res, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
