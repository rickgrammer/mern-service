import dotenv from 'dotenv'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';
import bindRoutes from './handlers'
import {connectDatabase} from './db';
dotenv.config()
import { verify } from 'jsonwebtoken'


const app = express()
const port = 9900

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.NODE_ENV === 'local' ? /.*/ : process.env.UI_DOMAIN,
  credentials: true
}))

// parse cookie to check if user is logged in and user is admin on each request
app.use((req: express.Request, _, next: express.NextFunction) => {
  req.isLoggedIn = false
  const token = req.cookies?.token as string
  try {
    const user = verify(token, process.env.JWT_SECRET as string)
    req.isLoggedIn = true
    req.user = user
    next()
  } catch (e) {
    next()
  }
})

bindRoutes(app)

app.listen(port, '0.0.0.0', async () => {
  await connectDatabase()
  console.log(`server listening on port ${port}`)
})

