import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateLoginAuditDto } from "./login-audit.types.js";

export const fakeLoginAudit = (
  overrides: Partial<CreateLoginAuditDto> = {},
): CreateLoginAuditDto => ({
  userId: faker.string.alphanumeric(25),
  token: faker.string.alphanumeric(64),
  ipAddress: faker.internet.ipv4(),
  userAgent: faker.internet.userAgent(),
  loginAt: faker.date.recent(),
  logoutAt: null,
  ...overrides,
});
