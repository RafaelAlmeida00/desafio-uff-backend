import request from 'supertest'
import { app } from '../index'
import { prisma } from '../utils/lib/prisma'
import { compare } from 'bcrypt'

describe('Auth Routes - Integration Tests', () => {
  // Clean user table before each test
  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.user.deleteMany()
  })

  // Disconnect from prisma after all tests
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/auth/signup', () => {
    it('deve criar um novo usuário com sucesso e retornar 201', async () => {
      const userData = {
        nome: 'New User',
        email: 'newuser@example.com',
        senha: 'StrongPassword123',
      }
      const res = await request(app).post('/api/auth/signup').send(userData)

      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.nome).toBe(userData.nome)
      expect(res.body.data.email).toBe(userData.email)

      // Verify user in database
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(userInDb).not.toBeNull()
      expect(userInDb?.nome).toBe(userData.nome)

      // Verify password was hashed
      const isPasswordCorrect = await compare(userData.senha, userInDb!.senha)
      expect(isPasswordCorrect).toBe(true)
    })

    it('deve retornar 409 se o e-mail já estiver cadastrado', async () => {
      // Create user first
      await request(app).post('/api/auth/signup').send({
        nome: 'Existing User',
        email: 'existing@example.com',
        senha: 'Password123',
      })

      // Attempt to create again
      const res = await request(app).post('/api/auth/signup').send({
        nome: 'Another User',
        email: 'existing@example.com',
        senha: 'Password456',
      })

      expect(res.status).toBe(409)
      expect(res.body.message).toBe('Usuário já cadastrado, faça login.')
    })

    it('deve retornar 400 para dados de validação inválidos (senha curta)', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        nome: 'Test',
        email: 'test@invalid.com',
        senha: '123',
      })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    const loginCredentials = {
      email: 'login@example.com',
      senha: 'Password123',
    }

    beforeEach(async () => {
      // Create a user to log in with
      await request(app)
        .post('/api/auth/signup')
        .send({ nome: 'Login User', ...loginCredentials })
    })

    it('deve logar com sucesso, retornar 200 e um cookie de sessão', async () => {
      const res = await request(app).post('/api/auth/login').send(loginCredentials)

      expect(res.status).toBe(200)
      expect(res.headers['set-cookie']).toBeDefined()
      expect(res.headers['set-cookie'][0]).toContain('token=')
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly')
      expect(res.headers['set-cookie'][0]).toContain('Path=/')
    })

    it('deve retornar 401 para senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ ...loginCredentials, senha: 'wrongPassword' })

      expect(res.status).toBe(401)
      expect(res.headers['set-cookie']).toBeUndefined()
    })

    it('deve retornar 401 para um usuário não existente', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nosuchuser@example.com',
        senha: 'anypassword',
      })

      expect(res.status).toBe(401)
      expect(res.headers['set-cookie']).toBeUndefined()
    })
  })

  describe('POST /api/auth/logout', () => {
    it('deve fazer logout e limpar o cookie de sessão', async () => {
      const agent = request.agent(app)

      // Arrange: Create a user and log in to establish a session
      await agent.post('/api/auth/signup').send({
        nome: 'Logout User',
        email: 'logout@example.com',
        senha: 'Password123',
      })

      // Act: Call the logout endpoint
      const logoutRes = await agent.post('/api/auth/logout')

      // Assert: Logout was successful and cookie is cleared
      expect(logoutRes.status).toBe(200)
      expect(logoutRes.headers['set-cookie']).toBeDefined()
      // Check that the cookie is expired by being set to empty
      expect(logoutRes.headers['set-cookie'][0]).toContain('token=;')
    })
  })

  describe('GET /api/auth/me', () => {
    it('deve retornar os dados do usuário se estiver autenticado', async () => {
      const agent = request.agent(app)
      const userEmail = 'me@example.com'
      const credentials = {
        email: userEmail,
        senha: 'Password123',
      }

      // Arrange: Sign up a user first
      await request(app).post('/api/auth/signup').send({
        nome: 'Me User',
        ...credentials,
      })

      // Log in with the agent to establish the session
      await agent.post('/api/auth/login').send(credentials)

      // Act: Call the /me endpoint with the now-authenticated agent
      const res = await agent.get('/api/auth/me')

      // Assert
      expect(res.status).toBe(200)
      expect(res.body.data.email).toBe(userEmail)
      expect(res.body.data).not.toHaveProperty('senha')
    })

    it('deve retornar 401 se não estiver autenticado', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })
  })
})
