export interface HateoasLink {
  href: string
  method: string
}

export interface HateoasResponse<T> {
  data: T
  _links: Record<string, HateoasLink>
}

declare module 'express' {
  interface Request {
    userId?: number 
  }
}