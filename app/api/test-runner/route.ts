import { NextRequest } from "next/server";

import { TestRunner } from "@/lib/test-runner";

export const maxDuration = 300; // 5 minutes max execution time

export async function GET() {
  try {
    // Get latest test results and execution status
    const latestResults = await TestRunner.getLatestResults();
    const isRunning = TestRunner.isRunning();
    const currentExecutionId = TestRunner.getCurrentExecutionId();

    return Response.json({
      success: true,
      data: latestResults,
      status: {
        isRunning,
        currentExecutionId,
      },
    });
  } catch (error) {
    console.error("Failed to get test results:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to retrieve test results",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      streaming = false,
      continue: continueOptions = null,
      onlyFailed = false,
      skipQualityGates = false,
    } = body;

    // Check if test execution is already running
    if (TestRunner.isRunning()) {
      const currentId = TestRunner.getCurrentExecutionId();

      console.log(
        `🚫 Test execution already running (${currentId}), aborting previous...`,
      );
      TestRunner.abort(); // Abort the current execution

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Create abort controller for process cleanup
    const abortController = new AbortController();

    // Prepare continuation options
    const continuationOptions =
      continueOptions || onlyFailed || skipQualityGates
        ? {
            onlyFailed,
            skipQualityGates,
            fromState: continueOptions?.fromState,
          }
        : undefined;

    const testRunner = new TestRunner(continuationOptions);

    if (streaming) {
      // Return streaming response for real-time updates
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          let heartbeatTimer: NodeJS.Timeout | null = null;
          let lastDataTime = Date.now();
          const connectionId = `conn_${Date.now()}`;

          console.log(`📡 Starting streaming connection ${connectionId}`);

          // Send initial connection confirmation
          const initData = `data: ${JSON.stringify({
            type: "connection_established",
            connectionId,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(initData));

          // Heartbeat mechanism to keep connection alive
          const startHeartbeat = () => {
            heartbeatTimer = setInterval(() => {
              try {
                const timeSinceLastData = Date.now() - lastDataTime;

                // Send heartbeat if no data for 10 seconds and controller is still open
                if (
                  timeSinceLastData > 10000 &&
                  controller.desiredSize !== null
                ) {
                  const heartbeat = `data: ${JSON.stringify({
                    type: "heartbeat",
                    connectionId,
                    timestamp: new Date().toISOString(),
                  })}\n\n`;

                  controller.enqueue(encoder.encode(heartbeat));
                  lastDataTime = Date.now();
                }
              } catch (error) {
                // Controller is closed, clear the timer
                if (heartbeatTimer) {
                  clearInterval(heartbeatTimer);
                  heartbeatTimer = null;
                }
              }
            }, 5000); // Check every 5 seconds
          };

          const cleanup = () => {
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }
          };

          try {
            startHeartbeat();

            for await (const progress of testRunner.executeTestsStreamingEnhanced(
              abortController.signal,
            )) {
              // Update last data time
              lastDataTime = Date.now();

              // Add connection metadata to progress updates
              const enhancedProgress = {
                ...progress,
                connectionId,
                serverTimestamp: new Date().toISOString(),
                currentExecutionId:
                  testRunner.executionId || progress.executionId, // Ensure execution ID is always present
              };

              const data = `data: ${JSON.stringify(enhancedProgress)}\n\n`;

              controller.enqueue(encoder.encode(data));
            }

            // Send completion message
            const completionData = `data: ${JSON.stringify({
              type: "stream_complete",
              connectionId,
              timestamp: new Date().toISOString(),
            })}\n\n`;

            controller.enqueue(encoder.encode(completionData));

            cleanup();
            controller.close();
            console.log(
              `✅ Streaming connection ${connectionId} completed successfully`,
            );
          } catch (error) {
            cleanup();

            // Enhanced error handling with connection context
            const errorType =
              error instanceof Error && error.name === "AbortError"
                ? "user_abort"
                : "execution_error";

            console.log(
              `❌ Streaming connection ${connectionId} failed:`,
              errorType,
              error,
            );

            const errorData = `data: ${JSON.stringify({
              type: "stream_error",
              connectionId,
              errorType,
              error: error instanceof Error ? error.message : "Unknown error",
              status: "failed",
              timestamp: new Date().toISOString(),
            })}\n\n`;

            try {
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            } catch (controllerError) {
              console.error(
                `Failed to send error message on connection ${connectionId}:`,
                controllerError,
              );
            }
          }
        },
        cancel() {
          // Enhanced cancellation with better logging
          const cancelTime = new Date().toISOString();

          console.log(
            `🛑 Stream cancelled by client at ${cancelTime}, aborting test processes...`,
          );
          abortController.abort();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      // Standard execution
      const results = await testRunner.executeAllTests();

      return Response.json({
        success: true,
        data: results,
      });
    }
  } catch (error) {
    console.error("Test execution failed:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test execution failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Stop/abort endpoint
export async function DELETE() {
  try {
    console.log("🛑 DELETE request received - aborting test execution");

    if (TestRunner.isRunning()) {
      const currentId = TestRunner.getCurrentExecutionId();

      console.log(`🛑 Aborting current execution: ${currentId}`);
      TestRunner.abort(); // This will kill all child processes

      return Response.json({
        success: true,
        message: `Test execution ${currentId} aborted successfully`,
      });
    } else {
      return Response.json({
        success: true,
        message: "No test execution was running",
      });
    }
  } catch (error) {
    console.error("Failed to abort test execution:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to abort execution",
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new Response(null, { status: 200 });
}
