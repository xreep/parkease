const logger = require('../utils/logger')

const adminLogger = (action) => (req, res, next) => {
  logger.info({
    type: 'ADMIN_ACTION',
    action,
    adminId: req.user?.id,
    adminEmail: req.user?.email,
    targetId: req.params?.id,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })
  next()
}

module.exports = adminLogger
