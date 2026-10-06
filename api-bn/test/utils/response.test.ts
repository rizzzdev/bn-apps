import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { sendResponse, sendError } from '../../src/app/utils/response.ts';

function createMockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('sendResponse', () => {
  it('mengirim status code & body sesuai argumen, tanpa pagination bila tidak diberikan', () => {
    const res = createMockRes();
    sendResponse(res, 200, 'OK', { id: 1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      error: false,
      statusCode: 200,
      message: 'OK',
      data: { id: 1 },
    });
  });

  it('menyertakan pagination hanya ketika diberikan', () => {
    const res = createMockRes();
    const pagination = { currentPage: 1, totalPage: 3, totalData: 30, dataPerPage: 10 };
    sendResponse(res, 200, 'OK', [1, 2, 3], pagination);

    expect(res.json).toHaveBeenCalledWith({
      error: false,
      statusCode: 200,
      message: 'OK',
      data: [1, 2, 3],
      pagination,
    });
  });

  it('data default null bila tidak diberikan', () => {
    const res = createMockRes();
    sendResponse(res, 204, 'No Content');

    expect(res.json).toHaveBeenCalledWith({
      error: false,
      statusCode: 204,
      message: 'No Content',
      data: null,
    });
  });
});

describe('sendError', () => {
  it('selalu mengirim error: true dan data: null', () => {
    const res = createMockRes();
    sendError(res, 404, 'Data tidak ditemukan');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      statusCode: 404,
      message: 'Data tidak ditemukan',
      data: null,
    });
  });
});
