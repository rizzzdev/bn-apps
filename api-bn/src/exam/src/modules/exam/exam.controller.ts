import { type Request, type Response } from 'express';
import { type IExamService, type IExamController } from './exam.interface.js';
import { type CreateExamDto, type UpdateExamDto } from './exam.types.js';
import { type ExamGetByIdQuery, type ExamGetAllQuery } from './exam.query.js';
import { sendResponse } from '#app/index.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

/** Handles HTTP requests for Exam endpoints. */
export class ExamController implements IExamController {
  constructor(private readonly service: IExamService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const nameParam = request.query.name as string | undefined;
    const examRoomsParam = request.query.examRooms as string | undefined;
    const questionCreatorIdParam = request.query.questionCreatorId as string | undefined;

    const query: ExamGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      name: nameParam,
      examRooms: examRoomsParam === 'true',
      questionCreatorId: questionCreatorIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, 'Get exams data successfully.', data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const examRoomsParam = request.query.examRooms as string | undefined;

    const query: ExamGetByIdQuery = {
      examRooms: examRoomsParam === 'true',
    };
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, 'Get exam data successfully.', data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamDto = request.body as CreateExamDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, 'Create exam data successfully.', data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamDto = request.body as UpdateExamDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, 'Update exam data successfully.', data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, 'Delete exam data successfully.', data);
  });
}
