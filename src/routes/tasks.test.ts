import request from 'supertest'
import { app } from '../index'
import { TaskService } from '../services/task.service'
import { AppError } from '../utils/errors/app.errors'
import jwt from 'jsonwebtoken'

jest.mock('../services/task.service')
jest.mock('jsonwebtoken')

describe('Task Routes', () => {
  const mockToken = 'valid-token'
  const mockUserId = 1

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock do JWT para simular usuário autenticado
    ;(jwt.verify as jest.Mock).mockReturnValue({ sub: mockUserId })
  })

  describe('POST /api/tasks', () => {
    it('deve criar tarefa com sucesso (201)', async () => {
      (TaskService.prototype.create as jest.Mock).mockResolvedValue({
        id: 1,
        titulo: 'Nova Tarefa',
        status: 'pendente',
      })

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ titulo: 'Nova Tarefa' })

      expect(res.status).toBe(201)
      expect((res.body as { data: { titulo: string } }).data.titulo).toBe('Nova Tarefa')
    })

    it('deve falhar validação se titulo estiver vazio (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ descricao: 'Sem titulo' })

      expect(res.status).toBe(400)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(TaskService.prototype.create).not.toHaveBeenCalled()
    })

    it('deve retornar 401 se não enviar token', async () => {
      const res = await request(app).post('/api/tasks').send({ titulo: 'Teste' })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/tasks', () => {
    it('deve listar tarefas (200)', async () => {
      (TaskService.prototype.listByUser as jest.Mock).mockResolvedValue([
        { id: 1, titulo: 'T1' },
      ])

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${mockToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray((res.body as { data: any[] }).data)).toBe(true)
    })

    it('deve filtrar por status', async () => {
      (TaskService.prototype.listByUser as jest.Mock).mockResolvedValue([])

      await request(app)
        .get('/api/tasks?status=pendente')
        .set('Authorization', `Bearer ${mockToken}`)

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(TaskService.prototype.listByUser).toHaveBeenCalledWith(
        mockUserId,
        'pendente'
      )
    })
  })

  describe('PUT /api/tasks/:id', () => {
    it('deve atualizar tarefa com sucesso (200)', async () => {
      (TaskService.prototype.update as jest.Mock).mockResolvedValue({
        id: 1,
        titulo: 'Atualizado',
      })

      const res = await request(app)
        .put('/api/tasks/1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ titulo: 'Atualizado' })

      expect(res.status).toBe(200)
    })

    it('deve retornar 404 se tarefa não existir', async () => {
      (TaskService.prototype.update as jest.Mock).mockRejectedValue(
        new AppError('Tarefa não encontrada', 404)
      )

      const res = await request(app)
        .put('/api/tasks/999')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ titulo: 'X' })

      expect(res.status).toBe(404)
    })

    it('deve falhar validação se status for inválido (400)', async () => {
      const res = await request(app)
        .put('/api/tasks/1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'invalido' })

      expect(res.status).toBe(400)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(TaskService.prototype.update).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    it('deve deletar tarefa com sucesso (204)', async () => {
      (TaskService.prototype.delete as jest.Mock).mockResolvedValue(undefined)

      const res = await request(app)
        .delete('/api/tasks/1')
        .set('Authorization', `Bearer ${mockToken}`)

      expect(res.status).toBe(204)
    })

    it('deve retornar 400 se ID for inválido', async () => {
      const res = await request(app)
        .delete('/api/tasks/abc')
        .set('Authorization', `Bearer ${mockToken}`)

      expect(res.status).toBe(400)
    })
  })
})