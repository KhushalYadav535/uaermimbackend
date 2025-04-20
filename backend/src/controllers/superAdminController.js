const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { DEV_EMAIL, DEV_PASSWORD, JWT_SECRET } = require('../../temp-config');


// super admin login 
const authenticateSuperAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        // validate email and password
        if (email !== DEV_EMAIL) {
            return res.status(403).json({ error: "Invalid email" });
        }

        // Compare password directly with DEV_PASSWORD
        if (password !== DEV_PASSWORD) {
            return res.status(403).json({ error: "Invalid password" });
        }

        // generate a jwt for superAdmin 
        const token = jwt.sign({ 
            id: 'super_admin_1',
            email, 
            role: 'super_admin',
            isSuperAdmin: true 
        }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ 
            message: 'Login successful', 
            token,
            user: {
                id: 'super_admin_1',
                email,
                role: 'super_admin',
                isSuperAdmin: true,
                first_name: 'Super',
                last_name: 'Admin'
            }
        });
    } catch (error) {
        console.error('Error during superadmin login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// for getting all the user
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'email', 'firstName', 'lastName', 'status'],
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}
// create a new user
const createUser = async (req, res) => {
    const { email, firstName, lastName, role } = req.body;

    try {
        const newUser = await User.create({ email, firstName, lastName, role });
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};
// Assign role to user 
const assignRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.role = role;
        await user.save();

        res.status(200).json({ message: 'Role assigned successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign role' });
    }
};
// Toggle feature 
const toggleFeature = async (req, res) => {
    const { feature, enabled } = req.body;

    try {
        res.status(200).json({ message: 'Feature is now enabled' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle feature' })
    }
}
// delete user
const deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user
        await user.destroy();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
module.exports = {
    authenticateSuperAdmin,
    getAllUsers,
    createUser,
    assignRole,
    toggleFeature
    , deleteUser
}