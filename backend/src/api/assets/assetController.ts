// src/api/assets/assetController.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { ServiceResponse } from "@/common/models/serviceResponse";

import { assetService } from "./assetService";

export const assetController = {
  getPresignedUploadUrl: async (req: Request, res: Response) => {
    const response = await assetService.getPresignedUploadUrl(req.body);
    handleServiceResponse(response, res);
  },

  uploadFile: async (req: Request, res: Response) => {
    if (!req.file) {
      const response = ServiceResponse.failure(
        "No file provided. Use the 'file' field in multipart/form-data.",
        null,
        StatusCodes.BAD_REQUEST,
      );
      return handleServiceResponse(response, res);
    }
    const prefix = (req.body?.prefix as string) || "assets";
    const response = await assetService.uploadFile(req.file.buffer, req.file.mimetype, prefix);
    handleServiceResponse(response, res);
  },

  deleteObject: async (req: Request, res: Response) => {
    const response = await assetService.adminDeleteObject(req.body?.key as string);
    handleServiceResponse(response, res);
  },
};
