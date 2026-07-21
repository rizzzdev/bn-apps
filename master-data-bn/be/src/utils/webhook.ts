import { env } from "@/configs/env";

export interface WebhookPayload<T = any> {
  data: T;
}

/**
 * Sends a webhook to all clients configured in the WEBHOOK_CLIENT_URL environment variable.
 * @param moduleName The module name (e.g., 'majors') used to build the webhook endpoint path
 * @param data The payload data to send
 */
export const sendWebhook = async <T>(
  moduleName: string,
  data: T,
): Promise<void> => {
  const clientUrlsStr = env.WEBHOOK_CLIENT_URL || "";
  const apiKey = env.API_KEY;

  // Split the URLs by comma, trim whitespace, and remove empty strings
  const clientUrls = clientUrlsStr
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (clientUrls.length === 0) {
    return;
  }

  // Receiver expects data as an array, so wrap single object in array
  const payloadData = Array.isArray(data) ? data : [data];
  const payload: WebhookPayload<T[]> = {
    data: payloadData,
  };

  const promises = clientUrls.map(async (clientUrl) => {
    const baseUrl = clientUrl.endsWith("/")
      ? clientUrl.slice(0, -1)
      : clientUrl;
    const endpoint = `${baseUrl}/api/v1/webhook/${moduleName}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-Api-Key": apiKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        console.error(
          `[Webhook Error] Failed to send to ${endpoint}. Status: ${response.status} - ${response.statusText}`,
        );
        console.error(`[Webhook Error] Response body:`, responseBody);
      } else {
        console.log(
          `[Webhook Success] Sent to ${endpoint}. Status: ${response.status}`,
        );
      }
    } catch (error) {
      console.error(
        `[Webhook Error] Failed to send to ${endpoint}:`,
        error,
      );
    }
  });

  // Use Promise.allSettled to ensure we wait for all webhooks to finish (or fail)
  // without rejecting the main promise if one of the webhooks fails.
  await Promise.allSettled(promises);
};
