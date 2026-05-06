import type { Request, Response } from "express";

import { authService } from "@/api/auth/authService";
import { userService } from "@/api/user/userService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { getClientIp } from "@/common/utils";

export const authController = {
  login: async (req: Request, res: Response) => {
    const response = await authService.login(req.body);
    handleServiceResponse(response, res);
  },

  register: async (req: Request, res: Response) => {
    const response = await authService.register(req.body);
    handleServiceResponse(response, res);
  },

  startRegistration: async (req: Request, res: Response) => {
    const response = await authService.startRegistration(req.body, getClientIp(req));
    handleServiceResponse(response, res);
  },

  verifyRegistration: async (req: Request, res: Response) => {
    const response = await authService.verifyRegistration(req.body);
    handleServiceResponse(response, res);
  },

  refresh: async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const response = await authService.refresh(refreshToken);
    handleServiceResponse(response, res);
  },

  me: async (req: Request, res: Response) => {
    const response = await userService.findById(req.user!.sub);
    handleServiceResponse(response, res);
  },

  updateMe: async (req: Request, res: Response) => {
    const response = await userService.updateProfile(req.user!.sub, req.body);
    handleServiceResponse(response, res);
  },

  changePassword: async (req: Request, res: Response) => {
    const response = await userService.changePassword(req.user!.sub, req.body);
    handleServiceResponse(response, res);
  },
};
