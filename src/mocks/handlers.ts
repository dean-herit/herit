import { http, HttpResponse } from "msw";

export const handlers = [
  // Authentication endpoints
  http.get("/api/auth/session", () => {
    return HttpResponse.json({
      user: {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        onboarding_completed: true,
      },
    });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
        user: {
          id: "1",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
      });
    }

    return HttpResponse.json(
      {
        error: "Invalid credentials",
      },
      { status: 401 },
    );
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };

    return HttpResponse.json({
      success: true,
      user: {
        id: "2",
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        onboarding_completed: false,
      },
    });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/auth/refresh", () => {
    return HttpResponse.json({
      accessToken: "new_mock_access_token",
      refreshToken: "new_mock_refresh_token",
    });
  }),

  // Assets endpoints
  http.get("/api/assets", () => {
    return HttpResponse.json([
      {
        id: "1",
        name: "Family Home",
        type: "property",
        value: 500000,
        location: "Dublin, Ireland",
        eircode: "D02 X285",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Investment Account",
        type: "financial",
        value: 150000,
        account_number: "IBAN123456789",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]);
  }),

  http.post("/api/assets", async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      id: "3",
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  // Beneficiaries endpoints
  http.get("/api/beneficiaries", () => {
    return HttpResponse.json([
      {
        id: "1",
        name: "John Doe",
        relationship: "spouse",
        allocation: 50,
        email: "john.doe@test.com",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Jane Doe",
        relationship: "child",
        allocation: 30,
        email: "jane.doe@test.com",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]);
  }),

  // Onboarding endpoints
  http.post("/api/onboarding/personal-info", async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      data: body,
    });
  }),

  http.post("/api/onboarding/signature", async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      signatureId: "mock_signature_id",
      data: body,
    });
  }),

  http.post("/api/onboarding/legal-consent", () => {
    return HttpResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post("/api/onboarding/verification", () => {
    return HttpResponse.json({
      success: true,
      verificationId: "mock_verification_id",
      status: "pending",
    });
  }),

  http.post("/api/onboarding/complete", () => {
    return HttpResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  }),

  // Health check
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "healthy",
        auth: "healthy",
        storage: "healthy",
      },
    });
  }),
];
