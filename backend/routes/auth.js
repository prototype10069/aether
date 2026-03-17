import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../aether.db')

function getDb() {
  return new sqlite3.Database(DB_PATH)
}

const JWT_SECRET = process.env.JWT_SECRET || 'aether-secret-key-2024'

// Signup
router.post('/signup', async (req, res) => {
  const { username, password, name } = req.body

  if (!username || !password || !name) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    const db = getDb()
    const hashedPassword = await bcrypt.hash(password, 10)

    db.run(
      'INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)',
      [username, hashedPassword, name],
      function (err) {
        if (err) {
          db.close()
          return res.status(400).json({ message: 'Username already exists' })
        }

        const userId = this.lastID
        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })

        db.close()
        res.json({ token, userId, username })
      }
    )
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' })
  }

  try {
    const db = getDb()

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err || !user) {
        db.close()
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash)

      if (!isPasswordValid) {
        db.close()
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '7d',
      })

      db.close()
      res.json({ token, userId: user.id, username: user.username })
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get User Profile
router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params
  const db = getDb()

  db.get('SELECT id, username, name, profilePic, aura, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    db.close()
    if (err || !user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  })
})

// Update User Profile
router.put('/profile/:userId', (req, res) => {
  const { userId } = req.params
  const { name, aura, profilePic } = req.body
  const db = getDb()

  db.run(
    'UPDATE users SET name = ?, aura = ?, profilePic = ? WHERE id = ?',
    [name || '', aura || '', profilePic || '', userId],
    function (err) {
      db.close()
      if (err) {
        return res.status(500).json({ message: 'Error updating profile' })
      }
      res.json({ message: 'Profile updated successfully' })
    }
  )
})

export default router