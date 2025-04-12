const { AuditLog } = require('../models');

const audit = async (req, res, next) => {
  const startTime = Date.now();
  const oldJson = res.json;

  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
    
    const auditData = {
      userId: req.user?.id,
      action: `${req.method} ${req.originalUrl}`,
      entityType: req.baseUrl.split('/')[1],
      entityId: req.params.id,
      oldValue: req.body,
      newValue: data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status,
      errorMessage: status === 'failure' ? data.message : null,
      responseTime
    };

    // Log the audit data asynchronously
    AuditLog.create(auditData).catch(console.error);

    return oldJson.call(this, data);
  };

  next();
};

module.exports = audit; 