import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import authRoutes from './routes/auth.js'
import messageRoutes from './routes/messages.js'
import groupRoutes from './routes/groups.js'
import { initializeDatabase } from './database/init.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Database
await initializeDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/groups', groupRoutes)

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id)

  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`)
    console.log(`User ${socket.id} joined chat ${chatId}`)
  })

  socket.on('send_message', (data) => {
    io.to(`chat_${data.chatId}`).emit('receive_message', data)
  })

  socket.on('edit_message', (data) => {
    io.to(`chat_${data.chatId}`).emit('message_edited', data)
  })

  socket.on('delete_message', (data) => {
    io.to(`chat_${data.chatId}`).emit('message_deleted', data)
  })

  socket.on('typing', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', { username: data.username })
  })

  socket.on('stop_typing', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_stopped_typing', { username: data.username })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Aether Server running on http://localhost:${PORT}`)
  console.log(`📡 Socket.IO ready for real-time communication`)
})