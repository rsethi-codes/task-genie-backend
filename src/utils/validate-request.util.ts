import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod/v3";

export const validateRequest =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(400).json({
          message: "Invalid request",
          errors: error.cause || "Invalid Request",
        });
      }
    }
  };
