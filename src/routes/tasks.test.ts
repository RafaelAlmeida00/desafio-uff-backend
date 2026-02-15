import request from 'supertest'
import { app } from '../index'
import { prisma } from '../utils/lib/prisma'
import { hash } from 'bcrypt'

describe('Task Routes - Integration Tests', () => {
  const agent = request.agent(app)
  let testUser: { id: number; email: string; nome: string }

  // Setup: Create a user and log in before all tests
  beforeAll(async () => {
    // Clean database before starting
    await prisma.task.deleteMany()
    await prisma.user.deleteMany()

    // Create a user directly in the database
    const hashedPassword = await hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        nome: 'Test User',
        email: 'test@example.com',
        senha: hashedPassword,
      },
    })
    testUser = { id: user.id, email: user.email, nome: user.nome }

    // Log in to get the session cookie for the agent
    const res = await agent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', senha: 'password123' })

    expect(res.status).toBe(200) // Login successful
    expect(res.headers['set-cookie']).toBeDefined()
  })

  // Teardown: Clean up database and disconnect
  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // Clean tasks before each test to ensure isolation
  beforeEach(async () => {
    await prisma.task.deleteMany({ where: { userId: testUser.id } })
  })

  describe('POST /api/tasks', () => {
    it('deve criar uma nova tarefa para o usuário autenticado', async () => {
      const res = await agent
        .post('/api/tasks')
        .send({ titulo: 'Minha Nova Tarefa' })

      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.titulo).toBe('Minha Nova Tarefa')

      // Verify it was created in the database
      const taskInDb = await prisma.task.findUnique({
        where: { id: res.body.data.id },
      })
      expect(taskInDb).not.toBeNull()
      expect(taskInDb?.userId).toBe(testUser.id)
    })

    it('deve retornar 400 se o título estiver faltando', async () => {
      const res = await agent.post('/api/tasks').send({ descricao: 'sem título' })
      expect(res.status).toBe(400)
    })

    it('deve retornar 401 se tentar criar sem estar logado', async () => {
      const res = await request(app) // new agent without cookie
        .post('/api/tasks')
        .send({ titulo: 'Tarefa não autorizada' })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/tasks', () => {
    it('deve listar apenas as tarefas do usuário autenticado', async () => {
      // Create another user and their task
      const anotherUser = await prisma.user.create({
        data: {
          nome: 'Another User',
          email: 'another@example.com',
          senha: await hash('password123', 10),
        },
      })
      await prisma.task.create({
        data: {
          titulo: 'Tarefa de outro usuário',
          userId: anotherUser.id,
        },
      })

      // Create a task for the logged-in user
      await prisma.task.create({
        data: {
          titulo: 'Minha Tarefa para Listar',
          userId: testUser.id,
        },
      })

      const res = await agent.get('/api/tasks')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].titulo).toBe('Minha Tarefa para Listar')
    })

    it('deve filtrar tarefas por status', async () => {
      await prisma.task.createMany({
        data: [
          { titulo: 'Pendente', userId: testUser.id, status: 'pendente' },
          { titulo: 'Concluída', userId: testUser.id, status: 'concluida' },
        ],
      })

      const res = await agent.get('/api/tasks?status=concluida')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].titulo).toBe('Concluída')
    })
  })

  describe('PUT /api/tasks/:id', () => {
    it('deve atualizar uma tarefa do próprio usuário', async () => {
      const task = await prisma.task.create({
        data: { titulo: 'Original', userId: testUser.id },
      })

      const res = await agent
        .put(`/api/tasks/${task.id}`)
        .send({ titulo: 'Atualizado', status: 'concluida' })
      
      expect(res.status).toBe(200)
      expect(res.body.data.titulo).toBe('Atualizado')
      expect(res.body.data.status).toBe('concluida')
    })

    it('deve retornar 404 ao tentar atualizar tarefa de outro usuário', async () => {
        const anotherUser = await prisma.user.create({
            data: {
              nome: 'Other User',
              email: 'other@example.com',
              senha: await hash('password123', 10),
            },
          })
      const anotherTask = await prisma.task.create({
        data: { titulo: 'Tarefa Alheia', userId: anotherUser.id },
      })

      const res = await agent
        .put(`/api/tasks/${anotherTask.id}`)
        .send({ titulo: 'Tentativa de Update' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    it('deve deletar uma tarefa do próprio usuário', async () => {
      const task = await prisma.task.create({
        data: { titulo: 'Para Deletar', userId: testUser.id },
      })

      const res = await agent.delete(`/api/tasks/${task.id}`)
      expect(res.status).toBe(204)

      const taskInDb = await prisma.task.findUnique({ where: { id: task.id } })
      expect(taskInDb).toBeNull()
    })

    it('deve retornar 404 ao tentar deletar tarefa de outro usuário', async () => {
        const anotherUser = await prisma.user.create({
            data: {
              nome: 'Final User',
              email: 'final@example.com',
              senha: await hash('password123', 10),
            },
          })
      const anotherTask = await prisma.task.create({
        data: { titulo: 'Tarefa de Outro', userId: anotherUser.id },
      })

      const res = await agent.delete(`/api/tasks/${anotherTask.id}`)
      expect(res.status).toBe(404)

      const taskInDb = await prisma.task.findUnique({ where: { id: anotherTask.id } })
      expect(taskInDb).not.toBeNull()
    })

    it('deve retornar 400 para um ID inválido', async () => {
        const res = await agent.delete('/api/tasks/abc')
        expect(res.status).toBe(400)
    })
  })
})
