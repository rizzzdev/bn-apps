import { describe, it, expect, vi } from "vitest";
import { ExamService } from "../../src/modules/exam/exam.service.js";

describe("ExamService", () => {
  it("should create an exam and return it", async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue({ id: "1", name: "Test Exam" }),
      getAll: vi.fn(),
      getById: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new ExamService(mockRepo);
    const dto = {
      name: "Test Exam",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
    };

    const result = await service.create(dto as any);
    expect(result).toBeDefined();
    expect(result.id).toBe("1");
    expect(mockRepo.create).toHaveBeenCalledWith(dto);
  });
});
