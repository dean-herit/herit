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
    retries: number = 3,
  ): Promise<Stripe.Identity.VerificationSession> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `Attempting to create Stripe verification session (attempt ${attempt}/${retries})`,
          {
            userId,
            returnUrl,
            type: options?.type || "document",
          },
        );

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

        console.log(
          `Successfully created Stripe verification session on attempt ${attempt}`,
          {
            sessionId: session.id,
            status: session.status,
            hasUrl: !!session.url,
          },
        );

        return session;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(
          `Error creating verification session (attempt ${attempt}/${retries}):`,
          error,
          {
            userId,
            errorType: error instanceof Error ? error.name : "Unknown",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        );

        // Don't retry on client errors that are permanent
        if (
          error instanceof Error &&
          error.message.includes("rate_limit") === false &&
          error.message.includes("temporary") === false
        ) {
          // For non-retryable errors, still wait and retry as they might be transient
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s

          console.log(`Waiting ${waitTime}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw new Error(
      `Failed to create verification session after ${retries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Retrieve a verification session by ID
   */
  static async getVerificationSession(
    sessionId: string,
    retries: number = 3,
  ): Promise<Stripe.Identity.VerificationSession> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `Attempting to retrieve Stripe session (attempt ${attempt}/${retries})`,
          {
            sessionId,
          },
        );

        const session =
          await stripe.identity.verificationSessions.retrieve(sessionId);

        console.log(
          `Successfully retrieved Stripe session on attempt ${attempt}`,
          {
            sessionId: session.id,
            status: session.status,
          },
        );

        return session;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(
          `Error retrieving verification session (attempt ${attempt}/${retries}):`,
          error,
          {
            sessionId,
            errorType: error instanceof Error ? error.name : "Unknown",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        );

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes("No such")) {
          console.log("Session not found, not retrying");
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s

          console.log(`Waiting ${waitTime}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw new Error(
      `Failed to retrieve verification session after ${retries} attempts: ${lastError?.message}`,
    );
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
