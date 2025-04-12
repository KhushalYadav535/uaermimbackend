const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { format } = require('date-fns');
const { Parser } = require('json2csv');

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ message: 'Error fetching audit log', error: error.message });
  }
};

const getUserAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: { user_id: req.params.userId },
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ message: 'Error fetching user audit logs', error: error.message });
  }
};

const exportAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transform the data to match the CSV fields
    const transformedLogs = logs.map(log => ({
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userName: log.User.name,
      userEmail: log.User.email,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')
    }));

    const fields = [
      'action',
      'entityType',
      'entityId',
      'userName',
      'userEmail',
      'ipAddress',
      'userAgent',
      'createdAt'
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(transformedLogs);

    res.header('Content-Type', 'text/csv');
    res.attachment(`audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ message: 'Error exporting audit logs', error: error.message });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLog,
  getUserAuditLogs,
  exportAuditLogs
}; 