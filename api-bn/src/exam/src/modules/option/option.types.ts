import { type Option as OptionBase } from "#exam/database/index.js";
import { type z } from "zod";
import { type createOptionSchema, type updateOptionSchema } from "./option.schema.js";

export type Option = OptionBase;

export type CreateOptionDto = z.infer<typeof createOptionSchema>;
export type UpdateOptionDto = z.infer<typeof updateOptionSchema>;
