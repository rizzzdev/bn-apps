import { type Request, type Response } from "express";
import { type IAuthService } from "./auth.interface.js";
import { type LoginDto, type TokenPayload } from "./auth.types.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { UnauthorizedError } from "../../utils/errors.js";

const REFRESH_COOKIE = "refresh_token";
const REFRESH_TOKEN_TTL_MS = 86400 * 1000; // 1 day in ms

export class AuthController {
  constructor(private readonly service: IAuthService) {}

  login = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const dto = request.body as LoginDto;
    const { refreshToken, accessToken, user } = await this.service.login(dto);

    response.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    // refreshToken also returned in body so SSR proxies (e.g. SvelteKit) can set their own cookie
    sendSuccess({
      response,
      data: { accessToken, refreshToken, user },
      message: "Login successful.",
    });
  });

  logout = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const payload = request.user as TokenPayload;
    await this.service.logout(payload.id);
    response.clearCookie(REFRESH_COOKIE, { httpOnly: true, sameSite: "lax" });
    sendSuccess({ response, data: null, message: "Logout successful." });
  });

  me = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const payload = request.user as TokenPayload;
    const data = await this.service.me(payload);
    sendSuccess({ response, data, message: "Get current user successfully." });
  });

  refreshAccessToken = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) throw new UnauthorizedError("Refresh token not found");

    const data = await this.service.refreshAccessToken(refreshToken);
    sendSuccess({ response, data, message: "Access token refreshed." });
  });
}
