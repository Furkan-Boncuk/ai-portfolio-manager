import { z } from "zod";

export const uuids = z.string().uuid();

export const timestampz = z.string().datetime();

export const nonEmptyString = z.string().min(1);

export const positiveInt = z.number().int().positive();

export const nonNegativeDecimal = z.number().min(0);

export const positiveDecimal = z.number().positive();

export type UUID = z.infer<typeof uuids>;
