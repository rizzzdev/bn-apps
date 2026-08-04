import { type Request, type Response } from 'express';
import { type IEssayGradeService } from './essay-grade.interface.js';
import { type CreateEssayGradeDto, type UpdateEssayGradeDto } from './essay-grade.types.js';
import { type EssayGradeGetAllQuery } from './essay-grade.query.js';
import { sendResponse } from '#app';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

export class EssayGradeController {
  constructor(private readonly service: IEssayGradeService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const query: EssayGradeGetAllQuery = {
      page: request.query.page !== undefined ? Number(request.query.page) : undefined,
      limit: request.query.limit !== undefined ? Number(request.query.limit) : undefined,
      examRoomId: request.query.examRoomId as string | undefined,
      userId: request.query.userId as string | undefined,
      questionId: request.query.questionId as string | undefined,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, 'Get essay grades successfully.', data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id = request.params.id as string;
    const data = await this.service.getById(id, {});
    sendResponse(response, 200, 'Get essay grade successfully.', data);
  });

  upsert = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateEssayGradeDto;
    const data = await this.service.upsert(body);
    sendResponse(response, 201, 'Essay grade saved successfully.', data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id = request.params.id as string;
    const body = request.body as UpdateEssayGradeDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, 'Essay grade updated successfully.', data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, 'Essay grade deleted successfully.', data);
  });
}
