import { HateoasLink } from '../types'

export function signupLinks(): Record<string, HateoasLink> {
  return {
    login: { href: '/api/auth/login', method: 'POST' },
  }
}

export function loginLinks(): Record<string, HateoasLink> {
  return {
    tasks: { href: '/api/tasks', method: 'GET' },
    createTask: { href: '/api/tasks', method: 'POST' },
  }
}

export function taskLinks(taskId: number): Record<string, HateoasLink> {
  return {
    self: { href: `/api/tasks/${taskId}`, method: 'PUT' },
    delete: { href: `/api/tasks/${taskId}`, method: 'DELETE' },
    list: { href: '/api/tasks', method: 'GET' },
  }
}

export function taskItemLinks(taskId: number): Record<string, HateoasLink> {
  return {
    self: { href: `/api/tasks/${taskId}`, method: 'PUT' },
    delete: { href: `/api/tasks/${taskId}`, method: 'DELETE' },
  }
}

export function taskListLinks(): Record<string, HateoasLink> {
  return {
    self: { href: '/api/tasks', method: 'GET' },
    create: { href: '/api/tasks', method: 'POST' },
    filterPendentes: { href: '/api/tasks?status=pendente', method: 'GET' },
    filterConcluidas: { href: '/api/tasks?status=concluida', method: 'GET' },
  }
}