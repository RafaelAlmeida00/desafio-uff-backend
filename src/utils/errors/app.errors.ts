export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errors?: string[]
  ) {
    super(message)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}