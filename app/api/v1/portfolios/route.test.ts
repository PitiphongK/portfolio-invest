import { Portfolio } from "@/lib/infrastructure/portfolio-repository";
import { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { nameCharacterLimit, POST } from "./route";
import { createPortfolio } from "@/lib/service/portfolio-service";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock(import("next/headers"), () => ({
  cookies: vi.fn().mockResolvedValue({})
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { 
      getUser: mocks.getUser
    }
  })
}));

vi.mock(import("@/lib/service/portfolio-service"), () => ({
  createPortfolio: vi.fn()
}))

beforeEach(() => {
  vi.mocked(createPortfolio).mockReset();
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({ 
    data: { 
      user: {id: "user-1"}
    }
  });
})

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
  expect(createPortfolio).toHaveBeenCalledExactlyOnceWith(
    "Long-term Portfolio",
    expect.objectContaining({ id: "user-1" }),
    expect.anything(),
  );
});

test.describe(`name should be between 1-${nameCharacterLimit} characters`, () => {
  test.for([
    {name: "Long-term Porfolio", expectedStatus: 201},
    {name: " Long-term Porfolio ", expectedStatus: 201},
    {name: "1", expectedStatus: 201},
    {name: "1".repeat(nameCharacterLimit), expectedStatus: 201},
  ])('Create a portfolio named \"$name\", expects response status $expectedStatus', async ({name, expectedStatus}) => {
    const portfolio: Portfolio = {
      id: 1,
      user_id: "user-1",
      name: name.trim()
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
    expect(createPortfolio).toHaveBeenCalledExactlyOnceWith(
      name.trim(),
      expect.objectContaining({ id: "user-1" }),
      expect.anything(),
    );
  })

  test.for([
    {name: 1, expectedStatus: 400, errorMessage: "Name must be a string"},
    {name: "", expectedStatus: 400, errorMessage: `Name should be between 1-${nameCharacterLimit} characters`},
    {name: " ", expectedStatus: 400, errorMessage: `Name should be between 1-${nameCharacterLimit} characters`},
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
    expect(createPortfolio).not.toHaveBeenCalled();
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toEqual({ error: errorMessage })
  })
})

test.for([{}, null])(
  "rejects invalid body: %j",
  async (body) => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/portfolios",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Name must be a string",
    });
    expect(createPortfolio).not.toHaveBeenCalled();
  },
);

test("rejects unauthenticated users", async () => {
  mocks.getUser.mockResolvedValue({
    data: { user: null },
  });
  const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Long-term Portfolio",
    })
  })
  const response = await POST(request);
  expect(createPortfolio).not.toHaveBeenCalled();
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Unauthenticated"})
});

test("returns a generic error when portfolio creation fails", async () => {
  vi.mocked(createPortfolio).mockRejectedValueOnce(
    new Error("Internal database details"),
  );

  const request = new NextRequest(
    "http://localhost:3000/api/v1/portfolios",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Investments" }),
    },
  );

  const response = await POST(request);

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: "Unable to create an portfolio",
  });
});

test("rejects malformed JSON", async () => {
  const request = new NextRequest(
    "http://localhost:3000/api/v1/portfolios",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":',
    },
  );

  const response = await POST(request);

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "Invalid JSON",
  });
  expect(createPortfolio).not.toHaveBeenCalled();
});