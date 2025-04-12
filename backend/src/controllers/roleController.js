const { Role, Permission, User } = require('../models');
const { Op } = require('sequelize');

const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    const role = await Role.create({
      name,
      description,
      isSystemRole: false
    });

    if (permissions && permissions.length > 0) {
      const permissionInstances = await Permission.findAll({
        where: { id: { [Op.in]: permissions } }
      });
      await role.addPermissions(permissionInstances);
    }

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: 'Cannot modify system roles' });
    }

    role.name = name || role.name;
    role.description = description || role.description;
    await role.save();

    if (permissions) {
      const permissionInstances = await Permission.findAll({
        where: { id: { [Op.in]: permissions } }
      });
      await role.setPermissions(permissionInstances);
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    // Check if role is assigned to any users
    const usersWithRole = await role.countUsers();
    if (usersWithRole > 0) {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        through: { attributes: [] }
      }]
    });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id, {
      include: [{
        model: Permission,
        through: { attributes: [] }
      }]
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await user.addRole(role);
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ error: 'Cannot remove system roles' });
    }

    await user.removeRole(role);
    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRole,
  updateRole,
  deleteRole,
  getRoles,
  getRole,
  assignRoleToUser,
  removeRoleFromUser
}; 