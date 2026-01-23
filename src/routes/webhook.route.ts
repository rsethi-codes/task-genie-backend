import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { userCreationService } from "../services/user-creation.service.js";

const router = Router();

/**
 * Clerk webhook handler
 * Handles user lifecycle events from Clerk
 * 
 * Verifies Svix signature for security.
 */
router.post("/clerk-webhook", async (req: Request, res: Response) => {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!secret) {
        console.error("❌ [Webhook] CLERK_WEBHOOK_SIGNING_SECRET is not set");
        return res.status(500).json({ error: "Configuration error" });
    }

    try {
        // Use the captured rawBody for reliable signature verification
        const payload = (req as any).rawBody || JSON.stringify(req.body);
        const headers = {
            "svix-id": req.headers["svix-id"] as string,
            "svix-timestamp": req.headers["svix-timestamp"] as string,
            "svix-signature": req.headers["svix-signature"] as string,
        };

        if (!headers["svix-id"] || !headers["svix-timestamp"] || !headers["svix-signature"]) {
            console.error("❌ [Webhook] Missing Svix headers");
            return res.status(401).json({ error: "Unauthorized: Missing signature" });
        }

        const wh = new Webhook(secret);

        let evt: any;
        try {
            evt = wh.verify(payload, headers);
        } catch (err) {
            console.error("❌ [Webhook] Svix verification failed:", err);
            return res.status(401).json({ error: "Unauthorized: Invalid signature" });
        }

        const eventType = evt.type;
        const eventData = evt.data;
        const clerkId = eventData.id;

        console.log(`📨 [Webhook] Received ${eventType} | clerkId: ${clerkId}`);

        switch (eventType) {
            case "user.created":
            case "user.updated": {
                // More robust email extraction: Primary or first available
                const email = eventData.email_addresses?.find(
                    (e: any) => e.id === eventData.primary_email_address_id
                )?.email_address || eventData.email_addresses?.[0]?.email_address;

                if (!email) {
                    console.error(`❌ [Webhook] No email address found for user: ${clerkId}`);
                    return res.status(400).json({ error: "Missing email address" });
                }

                const user = await userCreationService.createUserFromWebhook({
                    clerkId,
                    email: email,
                    firstName: eventData.first_name,
                    lastName: eventData.last_name,
                    avatar: eventData.image_url
                });

                console.log(`✅ [Webhook] Synchronized ${eventType} | clerkId: ${clerkId} | userId: ${user.id}`);
                break;
            }

            case "user.deleted": {
                const user = await userCreationService.deleteUser(clerkId);
                console.log(`✅ [Webhook] Processed ${eventType} | clerkId: ${clerkId} | userId: ${user?.id || 'not_found'}`);
                break;
            }

            default:
                console.log(`ℹ️ [Webhook] Unhandled event: ${eventType}`);
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error(`❌ [Webhook] Processing Error:`, error);
        return res.status(500).json({
            error: "Failed to process webhook",
            message: error.message
        });
    }
});

export const webhookRoutes = router;
