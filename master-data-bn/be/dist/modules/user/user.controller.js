"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateRoles = exports.updateRoles = exports.getUsers = void 0;
const database_1 = require("../../database");
const zod_1 = require("zod");
const updateRolesSchema = zod_1.z.object({
    roles: zod_1.z.array(zod_1.z.string()),
});
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;
        let whereClause = {};
        if (search) {
            whereClause = {
                OR: [
                    {
                        id: {
                            contains: search,
                            mode: 'insensitive',
                        }
                    },
                    {
                        sentri_identifiers: {
                            some: {
                                value: {
                                    contains: search,
                                    mode: 'insensitive',
                                }
                            }
                        }
                    }
                ]
            };
        }
        const [users, totalData] = await Promise.all([
            database_1.prisma.sentri_users.findMany({
                where: whereClause,
                include: {
                    sentri_identifiers: true,
                },
                skip,
                take: limit,
            }),
            database_1.prisma.sentri_users.count({ where: whereClause })
        ]);
        const formattedUsers = users.map((user) => ({
            ...user,
            roles: JSON.parse(user.roles || '[]'),
        }));
        res.json({
            data: formattedUsers,
            pagination: {
                page,
                limit,
                totalData,
                totalPage: Math.ceil(totalData / limit),
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const updateRoles = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { roles } = updateRolesSchema.parse(req.body);
        const updatedUser = await database_1.prisma.sentri_users.update({
            where: { id },
            data: {
                roles: JSON.stringify(roles),
            },
        });
        res.json({ data: { ...updatedUser, roles: JSON.parse(updatedUser.roles) } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Invalid data', errors: error.errors });
        }
        next(error);
    }
};
exports.updateRoles = updateRoles;
const bulkUpdateRoles = async (req, res, next) => {
    try {
        const bulkUpdateSchema = zod_1.z.object({
            userIds: zod_1.z.array(zod_1.z.string()),
            roles: zod_1.z.array(zod_1.z.string()),
            action: zod_1.z.enum(['add', 'remove', 'replace']).default('replace')
        });
        const { userIds, roles, action } = bulkUpdateSchema.parse(req.body);
        if (action === 'replace') {
            await database_1.prisma.sentri_users.updateMany({
                where: { id: { in: userIds } },
                data: { roles: JSON.stringify(roles) },
            });
        }
        else {
            const users = await database_1.prisma.sentri_users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, roles: true }
            });
            const updates = users.map(user => {
                let currentRoles = JSON.parse(user.roles || '[]');
                let newRoles = [...currentRoles];
                if (action === 'add') {
                    newRoles = Array.from(new Set([...currentRoles, ...roles]));
                }
                else if (action === 'remove') {
                    newRoles = currentRoles.filter(r => !roles.includes(r));
                }
                return database_1.prisma.sentri_users.update({
                    where: { id: user.id },
                    data: { roles: JSON.stringify(newRoles) }
                });
            });
            await database_1.prisma.$transaction(updates);
        }
        res.json({ message: 'Roles updated successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Invalid data', errors: error.errors });
        }
        next(error);
    }
};
exports.bulkUpdateRoles = bulkUpdateRoles;
