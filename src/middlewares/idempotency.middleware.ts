import { type Request, type Response, type NextFunction } from 'express'
import crypto from 'crypto'

const cache = new Map<
  string,
  {
    timestamp: number
    inProgress: boolean
    responseBody?: unknown
    statusCode?: number
  }
>()

const TWO_MINUTES_IN_MS = 2 * 60 * 1000

function getRequestSignature (req: Request): string {
  const bodyString =
    req.body && Object.keys(req.body as object).length > 0 ? JSON.stringify(req.body) : ''
  const signature = `${req.method}|${req.path}|${bodyString}`
  return crypto.createHash('sha256').update(signature).digest('hex')
}

export const idempotencyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next()
  }

  const signature = getRequestSignature(req)
  const now = Date.now()
  const cached = cache.get(signature)

  if (cached) {
    if (cached.inProgress) {
      res
        .status(429)
        .json({ message: 'Requisição em andamento, tente novamente mais tarde.' })
      return
    }

    if (now - cached.timestamp < TWO_MINUTES_IN_MS) {
      if (cached.responseBody !== undefined) {
        res.status(cached.statusCode ?? 200).json(cached.responseBody)
      } else {
        res.status(cached.statusCode ?? 204).send()
      }
      return
    }
  }

  cache.set(signature, { timestamp: now, inProgress: true })

  const originalJson = res.json
  let responseBodyToCache: unknown
  let statusCodeToCache: number

  res.json = (body: unknown): Response => {
    responseBodyToCache = body
    statusCodeToCache = res.statusCode
    return originalJson.call(res, body)
  }

  res.on('finish', () => {
    if (responseBodyToCache !== undefined) {
      const finalCacheEntry = {
        timestamp: now,
        inProgress: false,
        responseBody: responseBodyToCache,
        statusCode: statusCodeToCache || res.statusCode,
      }
      cache.set(signature, finalCacheEntry)

      setTimeout(() => {
        const currentCached = cache.get(signature)
        if (currentCached?.timestamp === now) {
          cache.delete(signature)
        }
      }, TWO_MINUTES_IN_MS)
    } else {
      cache.delete(signature)
    }
  })

  next()
}