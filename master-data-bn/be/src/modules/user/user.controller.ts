import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/database';
import { z } from 'zod';

const updateRolesSchema = z.object({
  roles: z.array(z.string()),
});

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    
    const skip = (page - 1) * limit;

    let whereClause: Record<string, unknown> = {};
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
      prisma.sentri_users.findMany({
        where: whereClause,
        include: {
          sentri_identifiers: true,
        },
        skip,
        take: limit,
      }),
      prisma.sentri_users.count({ where: whereClause })
    ]);

    const formattedUsers = users.map((user: any) => ({
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
  } catch (error: unknown) {
    next(error);
  }
};

export const updateRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roles } = updateRolesSchema.parse(req.body);

    const updatedUser = await prisma.sentri_users.update({
      where: { id },
      data: {
        roles: JSON.stringify(roles),
      },
    });

    res.json({ data: { ...updatedUser, roles: JSON.parse(updatedUser.roles) } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    next(error);
  }
};

export const bulkUpdateRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bulkUpdateSchema = z.object({
      userIds: z.array(z.string()),
      roles: z.array(z.string()),
      action: z.enum(['add', 'remove', 'replace']).default('replace')
    });
    
    const { userIds, roles, action } = bulkUpdateSchema.parse(req.body);

    if (action === 'replace') {
      await prisma.sentri_users.updateMany({
        where: { id: { in: userIds } },
        data: { roles: JSON.stringify(roles) },
      });
    } else {
      const users = await prisma.sentri_users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, roles: true }
      });

      const updates = users.map(user => {
        let currentRoles: string[] = JSON.parse(user.roles || '[]');
        let newRoles = [...currentRoles];

        if (action === 'add') {
          newRoles = Array.from(new Set([...currentRoles, ...roles]));
        } else if (action === 'remove') {
          newRoles = currentRoles.filter(r => !roles.includes(r));
        }

        return prisma.sentri_users.update({
          where: { id: user.id },
          data: { roles: JSON.stringify(newRoles) }
        });
      });

      await prisma.$transaction(updates);
    }

    res.json({ message: 'Roles updated successfully' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    next(error);
  }
};
