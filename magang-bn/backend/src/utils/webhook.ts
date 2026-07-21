import { Request, Response, NextFunction } from "express";
import { env } from "@/configs/env.js";
import { UnauthorizedError, BadRequestError, MethodNotAllowedError } from "@/errors/index.js";

export type WebhookEvent = "create" | "update" | "delete";

export interface WebhookPayload<T = any> {
  event: WebhookEvent;
  data: T;
}

/**
 * Sends a webhook to all clients configured in the CLIENT_URL environment variable.
 * @param moduleName The name of the module triggering the webhook (e.g., 'users', 'products')
 * @param event The type of event ('create', 'update', 'delete')
 * @param data The payload data to send
 */
export const sendWebhook = async <T>(
  moduleName: string,
  event: WebhookEvent,
  data: T
): Promise<void> => {
  const clientUrlsStr = env.MASTER_API_URL || "";
  
  // Split the URLs by comma, trim whitespace, and remove empty strings
  const clientUrls = clientUrlsStr
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (clientUrls.length === 0) {
    return;
  }

  const payload: WebhookPayload<T> = {
    event,
    data,
  };

  const methodMap: Record<WebhookEvent, string> = {
    create: "POST",
    update: "PATCH",
    delete: "DELETE",
  };

  const promises = clientUrls.map(async (clientUrl) => {
    // Ensure the base URL doesn't have a trailing slash before appending the path
    const baseUrl = clientUrl.endsWith("/") ? clientUrl.slice(0, -1) : clientUrl;
    const endpoint = `${baseUrl}/api/v1/webhook/${moduleName}`;

    try {
      const response = await fetch(endpoint, {
        method: methodMap[event],
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": env.MASTER_API_KEY || "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `[Webhook Error] Failed to send event "${event}:${moduleName}" to ${baseUrl}. Status: ${response.status} - ${response.statusText}`
        );
      } else {
        console.log(
          `[Webhook Success] Sent event "${event}:${moduleName}" to ${baseUrl}. Status: ${response.status} - ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(`[Webhook Error] Failed to send event "${event}:${moduleName}" to ${baseUrl}:`, error);
    }
  });

  // Use Promise.allSettled to ensure we wait for all webhooks to finish (or fail)
  // without rejecting the main promise if one of the webhooks fails.
  await Promise.allSettled(promises);
};

/**
 * Express Middleware/Handler to receive and process webhooks based on sendWebhook structure.
 * 
 * @param handler Callback function to process the received webhook data
 */
export const getWebHooks = <T = any>(
  handler: (
    data: T, 
  ) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'];

      // 1. Validasi API Key
      if (!apiKey || apiKey !== env.MASTER_API_KEY) {
        throw new UnauthorizedError('Unauthorized webhook request: Invalid or missing API Key');
      }

      // Ambil param moduleName jika route didefinisikan sebagai /api/v1/webhook/:moduleName
      const payload = req.body as WebhookPayload<T>;
      const { event, data } = payload;

      // 2. Validasi Struktur Payload
      if (!event || !data) {
        throw new BadRequestError('Invalid webhook payload structure');
      }

      // 3. Validasi Kesesuaian Method HTTP dengan Event
      const validMethods: Record<WebhookEvent, string> = {
        create: "POST",
        update: "PATCH",
        delete: "DELETE",
      };

      if (req.method !== validMethods[event]) {
        throw new MethodNotAllowedError(`Method ${req.method} not allowed for event '${event}'`);
      }

      // 4. Proses Webhook dengan handler yang dikirimkan
      await handler( data);

      // 5. Kembalikan Response Sukses ke Publisher
      res.status(200).json({
        error: false,
        statusCode: 200,
        message: 'Webhook processed successfully',
        data: null
      });
    } catch (error) {
      console.error(`[Webhook Handler Error]`, error);
      next(error);
    }
  };
};
