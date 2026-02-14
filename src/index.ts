import './config/env'
import express, { Request, Response } from 'express'
import { env } from './config/env'

const app = express()
app.use(express.json())

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'API rodando com sucesso!' })
})

app.listen(env.PORT, () => {
  console.log(`Servidor rodando na porta ${env.PORT}`)
})