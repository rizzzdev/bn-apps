import { type Request, type Response } from 'express';
import {
  type IExamSupervisorService,
  type IExamSupervisorController,
} from './exam-supervisor.interface.js';
import {
  type CreateExamSupervisorDto,
  type UpdateExamSupervisorDto,
} from './exam-supervisor.types.js';
import {
  type ExamSupervisorGetByIdQuery,
  type ExamSupervisorGetAllQuery,
} from './exam-supervisor.query.js';
import { sendResponse } from '#app/index.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

/** Handles HTTP requests for ExamSupervisor endpoints. */
export class ExamSupervisorController implements IExamSupervisorController {
  constructor(private readonly service: IExamSupervisorService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const examRoomIdParam = request.query.examRoomId as string | undefined;
    const userIdParam = request.query.userId as string | undefined;

    const query: ExamSupervisorGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      examRoomId: examRoomIdParam,
      userId: userIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, 'Get exam supervisors data successfully.', data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamSupervisorGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, 'Get exam supervisor data successfully.', data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamSupervisorDto = request.body as CreateExamSupervisorDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, 'Create exam supervisor data successfully.', data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamSupervisorDto = request.body as UpdateExamSupervisorDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, 'Update exam supervisor data successfully.', data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, 'Delete exam supervisor data successfully.', data);
  });
}
