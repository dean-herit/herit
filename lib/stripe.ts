import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

// Stripe Identity Verification helper functions
export class StripeIdentityService {
  /**
   * Create a new identity verification session
   */
  static async createVerificationSession(
    userId: string,
    returnUrl: string,
    options?: {
      type?: "document" | "id_number";
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Identity.VerificationSession> {
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: options?.type || "document",
        metadata: {
          user_id: userId,
          ...options?.metadata,
        },
        return_url: returnUrl,
        options: {
          document: {
            allowed_types: ["driving_license", "passport", "id_card"],
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
      });

      return session;
    } catch (error) {
      console.error("Error creating Stripe verification session:", error);
      throw new Error("Failed to create verification session");
    }
  }

  /**
   * Retrieve a verification session by ID
   */
  static async getVerificationSession(
    sessionId: string,
  ): Promise<Stripe.Identity.VerificationSession> {
    try {
      const session =
        await stripe.identity.verificationSessions.retrieve(sessionId);

      return session;
    } catch (error) {
      console.error("Error retrieving verification session:", error);
      throw new Error("Failed to retrieve verification session");
    }
  }

  /**
   * Cancel a verification session
   */
  static async cancelVerificationSession(
    sessionId: string,
  ): Promise<Stripe.Identity.VerificationSession> {
    try {
      const session =
        await stripe.identity.verificationSessions.cancel(sessionId);

      return session;
    } catch (error) {
      console.error("Error canceling verification session:", error);
      throw new Error("Failed to cancel verification session");
    }
  }

  /**
   * Process verification session webhook event
   */
  static async processWebhookEvent(event: Stripe.Event): Promise<{
    userId: string;
    status: string;
    verificationData?: any;
  } | null> {
    if (
      event.type !== "identity.verification_session.verified" &&
      event.type !== "identity.verification_session.requires_input"
    ) {
      return null;
    }

    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error("No user_id found in verification session metadata");

      return null;
    }

    return {
      userId,
      status: session.status,
      verificationData: {
        sessionId: session.id,
        verified: session.status === "verified",
        lastError: session.last_error,
        createdAt: new Date(session.created * 1000).toISOString(),
        verifiedAt:
          session.status === "verified" ? new Date().toISOString() : null,
      },
    };
  }
}

// Export Stripe instance for direct use if needed
export default stripe;
