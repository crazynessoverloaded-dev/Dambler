import axios from "axios";
import { ENV } from "./env";

export async function notifyOwner(input: { title: string; content: string }): Promise<boolean> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey || !ENV.ownerOpenId) {
    console.warn("[Notification] Forge API not configured — skipping notification");
    return false;
  }

  try {
    await axios.post(
      `${ENV.forgeApiUrl}/notification`,
      { title: input.title, content: input.content, openId: ENV.ownerOpenId },
      { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }, timeout: 10_000 }
    );
    return true;
  } catch (error) {
    console.error("[Notification] Failed to send notification:", error);
    return false;
  }
}
