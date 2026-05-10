import express from 'express';
import supertest from 'supertest';
import mongoose from 'mongoose';
import authRouter from '../../routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

const validUser = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
};

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('POST /auth/register', () => {
  it('registers a new user and returns 201', async () => {
    const res = await supertest(app).post('/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
  });

  it('returns 409 when email or username is already taken', async () => {
    await supertest(app).post('/auth/register').send(validUser);
    const res = await supertest(app).post('/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  it('returns 400 when email is missing', async () => {
    const { email: _email, ...body } = validUser;
    const res = await supertest(app).post('/auth/register').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is shorter than 4 characters', async () => {
    const res = await supertest(app)
      .post('/auth/register')
      .send({ ...validUser, username: 'ab' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await supertest(app)
      .post('/auth/register')
      .send({ ...validUser, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when firstName is missing', async () => {
    const { firstName: _firstName, ...body } = validUser;
    const res = await supertest(app).post('/auth/register').send(body);
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await supertest(app).post('/auth/register').send(validUser);
  });

  it('logs in with valid email and password, returns token', async () => {
    const res = await supertest(app).post('/auth/login').send({
      emailOrUsername: validUser.email,
      password: validUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('userId');
    expect(res.body.username).toBe(validUser.username);
    expect(res.body.email).toBe(validUser.email);
  });

  it('logs in with valid username instead of email', async () => {
    const res = await supertest(app).post('/auth/login').send({
      emailOrUsername: validUser.username,
      password: validUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 for wrong password', async () => {
    const res = await supertest(app).post('/auth/login').send({
      emailOrUsername: validUser.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await supertest(app).post('/auth/login').send({
      emailOrUsername: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when emailOrUsername field is missing', async () => {
    const res = await supertest(app).post('/auth/login').send({
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });
});
