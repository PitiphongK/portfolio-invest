import { Portfolio } from "@/lib/infrastructure/portfolio-repository";
import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";
import { POST } from "./route";
import { createPortfolio } from "@/lib/service/portfolio-service";

vi.mock(import("next/headers"), () => ({
  cookies: vi.fn().mockResolvedValue({})
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { 
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" }}
      })
    }
  })
}));

vi.mock(import("@/lib/service/portfolio-service"), () => ({
  createPortfolio: vi.fn()
}))

test("creates a portfolio correctly", async () => {
  const portfolio: Portfolio = {
    id: 1,
    user_id: "d3b07384-d113-4956-a5db-2a4c14c000df",
    name: "Long-term Portfolio"
  }
  vi.mocked(createPortfolio).mockResolvedValue(portfolio);
  const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Long-term Portfolio",
    })
  })
  const response = await POST(request);
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({portfolio});
});