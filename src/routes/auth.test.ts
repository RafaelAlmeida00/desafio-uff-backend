import request from 'supertest'
import { app } from '../index'
import { AuthService } from '../services/auth.service'
import { AppError } from '../utils/errors/app.errors'

jest.mock('../services/auth.service')

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    it('deve retornar 201 ao criar usuário com sucesso', async () => {
      (AuthService.prototype.signup as jest.Mock).mockResolvedValue({
        id: 1,
        nome: 'Teste',
        email: 'teste@email.com',
      })

      const res = await request(app).post('/api/auth/signup').send({
        nome: 'Teste',
        email: 'teste@email.com',
        senha: 'password123',
      })

      expect(res.status).toBe(201)
      expect((res.body as Record<string, any>).data).toHaveProperty('id')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(AuthService.prototype.signup).toHaveBeenCalled()
    })

    it('deve retornar 400 se a validação falhar (senha curta)', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        nome: 'Teste',
        email: 'teste@email.com',
        senha: '123', 
      })

      expect(res.status).toBe(400)
      expect((res.body as Record<string, any>).message).toBe('Dados inválidos')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(AuthService.prototype.signup).not.toHaveBeenCalled()
    })

    it('deve retornar 409 se o email já existir', async () => {
      (AuthService.prototype.signup as jest.Mock).mockRejectedValue(
        new AppError('E-mail já cadastrado', 409)
      )

      const res = await request(app).post('/api/auth/signup').send({
        nome: 'Teste',
        email: 'existente@email.com',
        senha: 'password123',
      })

      expect(res.status).toBe(409)
      expect((res.body as Record<string, any>).message).toBe('E-mail já cadastrado')
    })
  })

  describe('POST /api/auth/login', () => {
    it('deve retornar 200 e token ao logar com sucesso', async () => {
      (AuthService.prototype.login as jest.Mock).mockResolvedValue({
        token: 'fake-jwt-token',
      })

      const res = await request(app).post('/api/auth/login').send({
        email: 'teste@email.com',
        senha: 'password123',
      })

      expect(res.status).toBe(200)
      expect((res.body as Record<string, any>).data).toHaveProperty('token')
    })

    it('deve retornar 400 se email for inválido', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        senha: 'password123',
      })

      expect(res.status).toBe(400)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(AuthService.prototype.login).not.toHaveBeenCalled()
    })

    it('deve retornar 401 se credenciais forem inválidas', async () => {
      (AuthService.prototype.login as jest.Mock).mockRejectedValue(
        new AppError('Credenciais inválidas', 401)
      )

      const res = await request(app).post('/api/auth/login').send({
        email: 'teste@email.com',
        senha: 'wrongpassword',
      })

      expect(res.status).toBe(401)
      expect((res.body as Record<string, any>).message).toBe('Credenciais inválidas')
    })
  })
})