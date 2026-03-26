import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { z } from "zod";
import type { SidecarRuntime } from "../context.ts";

const MAX_PORTFOLIO_SIZE = 1024 * 1024; // 1 MB

const portfolioUploadSchema = z.object({
  csv: z.string().min(1, "CSV content is required"),
});

export function createPortfolioRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  // Upload or replace portfolio CSV for an agent
  app.post("/:agentId/portfolio", async (context) => {
    const agentId = context.req.param("agentId");
    const agent = await runtime.embeddedGateway.getAgent(agentId);

    if (!agent.workspaceDir) {
      return context.json({ error: "Agent has no workspace directory." }, 400);
    }

    const payload = portfolioUploadSchema.parse(await context.req.json());

    if (payload.csv.length > MAX_PORTFOLIO_SIZE) {
      return context.json(
        {
          error: `Portfolio CSV exceeds the ${String(MAX_PORTFOLIO_SIZE / 1024)}KB size limit.`,
        },
        413,
      );
    }

    // Validate basic CSV structure — must have at least a header row and one data row
    const lines = payload.csv
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      return context.json(
        {
          error:
            "Portfolio CSV must contain at least a header row and one data row.",
        },
        422,
      );
    }

    // Write portfolio.csv to the agent's workspace
    await mkdir(agent.workspaceDir, { recursive: true });
    const portfolioPath = join(agent.workspaceDir, "portfolio.csv");
    await writeFile(portfolioPath, payload.csv, "utf8");

    // Update USER.md to reference the portfolio file
    const userPath = join(agent.workspaceDir, "USER.md");
    let userContent: string;
    try {
      userContent = await readFile(userPath, "utf8");
    } catch {
      userContent = "";
    }

    if (!userContent.includes("portfolio.csv")) {
      const portfolioSection = [
        "",
        "## Portfolio",
        "",
        "Your investment portfolio is stored in `portfolio.csv` in this workspace.",
        "Read this file when the user asks about their portfolio, holdings, or positions.",
        "",
      ].join("\n");

      await writeFile(
        userPath,
        userContent.trimEnd() + "\n" + portfolioSection,
        "utf8",
      );
    }

    return context.json(
      {
        message: "Portfolio uploaded successfully.",
        rows: lines.length - 1,
      },
      201,
    );
  });

  // Check if an agent has a portfolio uploaded
  app.get("/:agentId/portfolio", async (context) => {
    const agentId = context.req.param("agentId");
    const agent = await runtime.embeddedGateway.getAgent(agentId);

    if (!agent.workspaceDir) {
      return context.json({ hasPortfolio: false });
    }

    const portfolioPath = join(agent.workspaceDir, "portfolio.csv");
    try {
      const content = await readFile(portfolioPath, "utf8");
      const lines = content
        .trim()
        .split("\n")
        .filter((line) => line.trim().length > 0);
      return context.json({
        hasPortfolio: true,
        rows: Math.max(0, lines.length - 1),
      });
    } catch {
      return context.json({ hasPortfolio: false });
    }
  });

  // Delete portfolio
  app.delete("/:agentId/portfolio", async (context) => {
    const agentId = context.req.param("agentId");
    const agent = await runtime.embeddedGateway.getAgent(agentId);

    if (!agent.workspaceDir) {
      return context.json({ deleted: false });
    }

    const portfolioPath = join(agent.workspaceDir, "portfolio.csv");
    try {
      await unlink(portfolioPath);
      return context.json({ deleted: true });
    } catch {
      return context.json({ deleted: false });
    }
  });

  return app;
}
