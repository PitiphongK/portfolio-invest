import { Portfolio } from "@/lib/infrastructure/portfolio-repository";
import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";
import { nameCharacterLimit, POST } from "./route";
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
    user_id: "user-1",
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

test.describe(`Name should be between 1-${nameCharacterLimit} characters`, () => {
  test.for([
    {name: "Long-term Porfolio", expectedStatus: 201},
    {name: "1", expectedStatus: 201},
    {name: "1".repeat(nameCharacterLimit), expectedStatus: 201},
  ])('Create a portfolio named \"$name\", expects response status $expectedStatus', async ({name, expectedStatus}) => {
    const portfolio: Portfolio = {
      id: 1,
      user_id: "user-1",
      name
    }
    vi.mocked(createPortfolio).mockResolvedValue(portfolio);
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
      })
    })
    const response = await POST(request);
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toEqual({portfolio});
  })

  test.for([
    {name: 1, expectedStatus: 400, errorMessage: "Name must be a string"},
    {name: "", expectedStatus: 400, errorMessage: `Name should be between 1-${nameCharacterLimit} characters`},
    {name: "1".repeat(nameCharacterLimit+1), expectedStatus: 400, errorMessage: `Name should be between 1-${nameCharacterLimit} characters`},
  ])('Create a portfolio named \"$name\", expects response status $expectedStatus, error message \"$errorMessage\"', async ({name, expectedStatus, errorMessage}) => {
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
      })
    })
    const response = await POST(request);
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toEqual({ error: errorMessage })
  })
})