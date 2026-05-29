const logger = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  })

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' })
  }

  if (err.code === 'P2002') {
    return res.status(400).json({ message: 'Resource already exists' })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Resource not found' })
  }

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
}

module.exports = errorHandler
