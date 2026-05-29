const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    logger.warn({ type: 'UNAUTHORIZED', url: req.url, ip: req.ip })
    return res.status(401).json({ message: 'No token, unauthorized' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    logger.warn({ type: 'INVALID_TOKEN', url: req.url, ip: req.ip, error: err.message })
    res.status(401).json({ message: 'Invalid token' })
  }
}

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    logger.warn({ type: 'FORBIDDEN', userId: req.user?.id, role: req.user?.role, url: req.url, ip: req.ip })
    return res.status(403).json({ message: 'Access denied' })
  }
  next()
}

const checkOwnership = (resourceOwnerId, requestUserId, res) => {
  if (resourceOwnerId !== requestUserId) {
    return res.status(403).json({ message: 'Not authorized to access this resource' })
  }
}

module.exports = { protect, allowRoles, checkOwnership }
