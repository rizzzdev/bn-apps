"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoute = void 0;
const express_1 = require("express");
const env_1 = require("../../configs/env");
const database_1 = require("../../database");
exports.webhookRoute = (0, express_1.Router)();
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== env_1.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
exports.webhookRoute.use(validateApiKey);
exports.webhookRoute.post('/students/sync', async (_req, res) => {
    const data = await database_1.prisma.student.findMany({
        include: { currentClass: true, currentMajor: true, picture: true },
    });
    res.json({ data });
});
exports.webhookRoute.post('/teachers/sync', async (_req, res) => {
    const data = await database_1.prisma.teacher.findMany({
        include: { picture: true },
    });
    res.json({ data });
});
exports.webhookRoute.post('/academic-years/sync', async (_req, res) => {
    const data = await database_1.prisma.academicYear.findMany({
        include: { semesters: true },
    });
    res.json({ data });
});
exports.webhookRoute.post('/semesters/sync', async (_req, res) => {
    const data = await database_1.prisma.semester.findMany({
        include: { academicYear: true },
    });
    res.json({ data });
});
exports.webhookRoute.post('/subjects/sync', async (_req, res) => {
    const data = await database_1.prisma.subject.findMany({});
    res.json({ data });
});
exports.webhookRoute.post('/majors/sync', async (_req, res) => {
    const data = await database_1.prisma.major.findMany({
        include: {
            classes: true,
            currentStudents: true,
        },
    });
    res.json({ data });
});
exports.webhookRoute.post('/classes/sync', async (_req, res) => {
    const data = await database_1.prisma.class.findMany({
        include: {
            major: true,
            currentStudents: true,
        },
    });
    res.json({ data });
});
