import express from 'express';
import supertest from 'supertest';
import authRouter from '../../routes/auth';
import protectedRouter from '../../routes/protectedRoutes';
import passageRouter from '../../routes/passageRoutes';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/api/passage', passageRouter);
app.use('/api', protectedRouter);

const testUser = {
  email: 'api@example.com',
  username: 'apiuser99',
  password: 'password123',
  firstName: 'Api',
  lastName: 'User',
};

let token: string;

beforeAll(async () => {
  await supertest(app).post('/auth/register').send(testUser);
  const res = await supertest(app).post('/auth/login').send({
    emailOrUsername: testUser.email,
    password: testUser.password,
  });
  token = res.body.token;
});

describe('GET /api/profile', () => {
  it('returns 401 without an auth token', async () => {
    const res = await supertest(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('returns 200 with profile data for an authenticated user', async () => {
    const res = await supertest(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).toHaveProperty('email', testUser.email);
  });
});

describe('GET /api/results', () => {
  it('returns 401 without an auth token', async () => {
    const res = await supertest(app).get('/api/results');
    expect(res.status).toBe(401);
  });

  it('returns 200 with paginated match history for authenticated user', async () => {
    const res = await supertest(app)
      .get('/api/results')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('matches');
    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });
});

describe('GET /api/leaderboard', () => {
  it('returns 401 without an auth token', async () => {
    const res = await supertest(app).get('/api/leaderboard');
    expect(res.status).toBe(401);
  });

  it('returns 200 with leaderboard array for authenticated user', async () => {
    const res = await supertest(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/passage', () => {
  it('returns 200 with a passage text (no auth required)', async () => {
    const res = await supertest(app).get('/api/passage');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(typeof res.body.text).toBe('string');
    expect(res.body.text.split(' ').length).toBeGreaterThan(0);
  });
});
