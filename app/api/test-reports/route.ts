import { readdir, readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), "tests", "test-reports");

    // Read all files in the directory
    const files = await readdir(reportsDir);

    // Filter for test result files (exclude latest.json)
    const testFiles = files.filter(
      (file) => file.startsWith("test-") && file.endsWith(".json"),
    );

    // Read and parse each file
    const reports = await Promise.all(
      testFiles.map(async (file) => {
        try {
          const filePath = path.join(reportsDir, file);
          const content = await readFile(filePath, "utf-8");

          return JSON.parse(content);
        } catch (error) {
          console.warn(`Failed to read ${file}:`, error);

          return null;
        }
      }),
    );

    // Filter out any failed reads and sort by timestamp (newest first)
    const validReports = reports
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10); // Return max 10 most recent

    return Response.json(validReports);
  } catch (error) {
    console.error("Failed to load test reports:", error);

    return Response.json(
      { error: "Failed to load test reports" },
      { status: 500 },
    );
  }
}
