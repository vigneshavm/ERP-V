import Employee from '../models/Employee.js';
/**
 * @swagger
 * /api/hr/employees:
 *   post:
 *     summary: Add new employee
 *     tags: [HR - Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, role, mobile]
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               mobile: { type: string }
 *               dailyRate: { type: number }
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
export const addEmployee = async (req, res) => {
    try {
        const { name, role, roleId, mobile, dailyRate, baseSalary, wageType, joiningDate, branchId, sector } = req.body;
        const tenantId = req.tenantId || req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Tenant context missing' });
        }
        // Check for existing employee with same mobile number for this tenant
        const existingEmployee = await Employee.findOne({ tenantId, mobile });
        if (existingEmployee) {
            return res.status(400).json({ success: false, message: 'Employee with this mobile number already exists.' });
        }
        const newEmployee = await Employee.create({
            tenantId,
            name,
            role,
            roleId,
            mobile,
            dailyRate,
            baseSalary,
            wageType,
            joiningDate,
            branchId,
            sector
        });
        res.status(201).json({
            success: true,
            data: newEmployee
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/hr/employees:
 *   get:
 *     summary: Get all active employees
 *     tags: [HR - Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees retrieved
 */
export const getEmployees = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Tenant context missing' });
        }
        const employees = await Employee.find({ tenantId, isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: employees
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user?.tenantId;
        const updateData = req.body;
        const employee = await Employee.findOneAndUpdate({ _id: id, tenantId }, { $set: updateData }, { new: true, runValidators: true });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found or unauthorized' });
        }
        res.status(200).json({
            success: true,
            data: employee
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user?.tenantId;
        // Perform soft delete
        const employee = await Employee.findOneAndUpdate({ _id: id, tenantId }, { $set: { isActive: false } }, { new: true });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found or unauthorized' });
        }
        res.status(200).json({
            success: true,
            message: 'Employee removed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
