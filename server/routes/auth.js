const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { validate, registerSchema, loginSchema } = require('../utils/validate')
const logger = require('../utils/logger')

const router = express.Router()
const prisma = new PrismaClient()

const loginAttempts = {}

const isLocked = (email) => {
  const rec = loginAttempts[email]
  if (!rec) return false
  if (rec.lockedUntil && new Date() < rec.lockedUntil) return true
  if (rec.lockedUntil && new Date() >= rec.lockedUntil) {
    delete loginAttempts[email]
  }
  return false
}

const recordFailedAttempt = (email) => {
  if (!loginAttempts[email]) loginAttempts[email] = { attempts: 0, lockedUntil: null }
  loginAttempts[email].attempts++
  if (loginAttempts[email].attempts >= 5) {
    loginAttempts[email].lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
    logger.warn({ type: 'ACCOUNT_LOCKED', email })
  }
}

const clearAttempts = (email) => {
  delete loginAttempts[email]
}

const issueTokens = (user, res) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
  return accessToken
}

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return res.status(400).json({ message: 'Email already registered' })

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const hashedPassword = await bcrypt.hash(password, rounds)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'USER', phone: phone || null }
    })

    logger.info({ type: 'REGISTER', userId: user.id, email: user.email, role: user.role })

    const token = issueTokens(user, res)
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    logger.error({ type: 'REGISTER_ERROR', error: error.message })
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    if (isLocked(email)) {
      logger.warn({ type: 'LOGIN_LOCKED', email, ip: req.ip })
      return res.status(429).json({ message: 'Account temporarily locked. Try again in 15 minutes.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      recordFailedAttempt(email)
      logger.warn({ type: 'LOGIN_FAILED', email, reason: 'user_not_found', ip: req.ip })
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      recordFailedAttempt(email)
      logger.warn({ type: 'LOGIN_FAILED', email, userId: user.id, reason: 'wrong_password', ip: req.ip })
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    clearAttempts(email)
    logger.info({ type: 'LOGIN_SUCCESS', userId: user.id, email: user.email, ip: req.ip })

    const token = issueTokens(user, res)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    logger.error({ type: 'LOGIN_ERROR', error: error.message })
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ message: 'No refresh token' })

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(401).json({ message: 'User not found' })

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    logger.info({ type: 'TOKEN_REFRESH', userId: user.id })
    res.json({ token: accessToken })
  } catch (error) {
    logger.warn({ type: 'REFRESH_FAILED', error: error.message })
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
  res.json({ message: 'Logged out successfully' })
})

module.exports = router
