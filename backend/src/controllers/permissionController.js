const { Permission, Role } = require('../models');
const { Op } = require('sequelize');

const createPermission = async (req, res) => {
  try {
    const { name, description, module, action } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      where: {
        [Op.or]: [
          { name },
          {
            [Op.and]: [
              { module },
              { action }
            ]
          }
        ]
      }
    });

    if (existingPermission) {
      return res.status(400).json({ error: 'Permission already exists' });
    }

    const permission = await Permission.create({
      name,
      description,
      module,
      action
    });

    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, module, action } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Check for conflicts with other permissions
    const conflictingPermission = await Permission.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          { name },
          {
            [Op.and]: [
              { module },
              { action }
            ]
          }
        ]
      }
    });

    if (conflictingPermission) {
      return res.status(400).json({ error: 'Permission name or module/action combination already exists' });
    }

    permission.name = name || permission.name;
    permission.description = description || permission.description;
    permission.module = module || permission.module;
    permission.action = action || permission.action;
    await permission.save();

    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Check if permission is assigned to any roles
    const rolesWithPermission = await permission.countRoles();
    if (rolesWithPermission > 0) {
      return res.status(400).json({ error: 'Cannot delete permission that is assigned to roles' });
    }

    await permission.destroy();
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      include: [{
        model: Role,
        through: { attributes: [] }
      }]
    });

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await Permission.findByPk(id, {
      include: [{
        model: Role,
        through: { attributes: [] }
      }]
    });

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPermissionsByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const permissions = await Permission.findAll({
      where: { module },
      include: [{
        model: Role,
        through: { attributes: [] }
      }]
    });

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAvailableModules = async (req, res) => {
  try {
    const modules = await Permission.findAll({
      attributes: ['module'],
      group: ['module']
    });

    res.json(modules.map(m => m.module));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPermission,
  updatePermission,
  deletePermission,
  getPermissions,
  getPermission,
  getPermissionsByModule,
  getAvailableModules
}; 