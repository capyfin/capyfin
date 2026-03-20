import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Hono } from "hono";
import { createPortfolioRoutes } from "./portfolio.ts";

function createMockRuntime(workspaceDir: string) {
  return {
    embeddedGateway: {
      getAgent: async (agentId: string) => ({
        id: agentId,
        name: "Main",
        workspaceDir,
        description: "",
        instructions: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      }),
    },
  } as never;
}

void test("POST /main/portfolio uploads CSV and creates file", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-portfolio-"));

  try {
    await mkdir(workspaceDir, { recursive: true });

    // Write a USER.md for the portfolio reference to append to
    await writeFile(join(workspaceDir, "USER.md"), "# User\n", "utf8");

    const app = new Hono();
    app.route("/agents", createPortfolioRoutes(createMockRuntime(workspaceDir)));

    const csv = "ticker,shares,cost_basis\nAAPL,100,150.00\nMSFT,50,300.00\n";
    const response = await app.request("/agents/main/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });

    assert.equal(response.status, 201);
    const body = (await response.json()) as { message: string; rows: number };
    assert.equal(body.rows, 2);

    // Verify file was written
    const saved = await readFile(join(workspaceDir, "portfolio.csv"), "utf8");
    assert.equal(saved, csv);

    // Verify USER.md was updated
    const userMd = await readFile(join(workspaceDir, "USER.md"), "utf8");
    assert.ok(userMd.includes("portfolio.csv"), "USER.md should reference portfolio.csv");
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("POST /main/portfolio rejects empty CSV", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-portfolio-"));

  try {
    const app = new Hono();
    app.route("/agents", createPortfolioRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/agents/main/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: "ticker,shares\n" }),
    });

    assert.equal(response.status, 422);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("GET /main/portfolio returns hasPortfolio:false when no file", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-portfolio-"));

  try {
    const app = new Hono();
    app.route("/agents", createPortfolioRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/agents/main/portfolio");
    assert.equal(response.status, 200);

    const body = (await response.json()) as { hasPortfolio: boolean };
    assert.equal(body.hasPortfolio, false);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("GET /main/portfolio returns hasPortfolio:true after upload", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-portfolio-"));

  try {
    await mkdir(workspaceDir, { recursive: true });
    await writeFile(
      join(workspaceDir, "portfolio.csv"),
      "ticker,shares\nAAPL,100\nTSLA,50\n",
      "utf8",
    );

    const app = new Hono();
    app.route("/agents", createPortfolioRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/agents/main/portfolio");
    assert.equal(response.status, 200);

    const body = (await response.json()) as { hasPortfolio: boolean; rows: number };
    assert.equal(body.hasPortfolio, true);
    assert.equal(body.rows, 2);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("DELETE /main/portfolio removes the file", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-portfolio-"));

  try {
    await mkdir(workspaceDir, { recursive: true });
    await writeFile(
      join(workspaceDir, "portfolio.csv"),
      "ticker,shares\nAAPL,100\n",
      "utf8",
    );

    const app = new Hono();
    app.route("/agents", createPortfolioRoutes(createMockRuntime(workspaceDir)));

    const deleteResponse = await app.request("/agents/main/portfolio", {
      method: "DELETE",
    });
    assert.equal(deleteResponse.status, 200);
    const deleteBody = (await deleteResponse.json()) as { deleted: boolean };
    assert.equal(deleteBody.deleted, true);

    // Verify file is gone
    const getResponse = await app.request("/agents/main/portfolio");
    const getBody = (await getResponse.json()) as { hasPortfolio: boolean };
    assert.equal(getBody.hasPortfolio, false);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("POST /main/portfolio rejects oversized CSV", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-portfolio-"));

  try {
    const app = new Hono();
    app.route("/agents", createPortfolioRoutes(createMockRuntime(workspaceDir)));

    // Create a CSV larger than 1MB
    const bigCsv = "ticker,shares\n" + "AAPL,100\n".repeat(200_000);
    const response = await app.request("/agents/main/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: bigCsv }),
    });

    assert.equal(response.status, 413);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});
