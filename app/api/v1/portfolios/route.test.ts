import { Portfolio } from "@/lib/infrastructure/portfolio-repository";
import { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { GET, nameCharacterLimit, POST, PATCH } from "./route";
import {
  createPortfolio,
  getPortfolios,
  updatePortfolio,
} from "@/lib/service/portfolio-service";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock(import("next/headers"), () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock(import("@/lib/service/portfolio-service"), () => ({
  createPortfolio: vi.fn(),
  getPortfolios: vi.fn(),
  updatePortfolio: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(createPortfolio).mockReset();
  vi.mocked(updatePortfolio).mockReset();
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({
    data: {
      user: { id: "user-1" },
    },
  });
});

test.describe("GET /api/v1/portfolios", () => {
  test("retrieves portfolios correctly", async () => {
    vi.mocked(getPortfolios).mockResolvedValue([
      { id: 1, name: "Portfolio-1" },
      { id: 2, name: "Portfolio-2" },
    ]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      portfolios: [
        { id: 1, name: "Portfolio-1" },
        { id: 2, name: "Portfolio-2" },
      ],
    });
  });
  test("rejects unauthenticated user", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: null,
      },
    });
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthenticated",
    });
  });

  test("returns a generic error when portfolio retrieval fails", async () => {
    vi.mocked(getPortfolios).mockRejectedValueOnce(
      new Error("Internal database details"),
    );
    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to retrieve portfolios",
    });
  });
});

test.describe("POST /api/v1/portfolios", () => {
  test("creates a portfolio correctly", async () => {
    const portfolio: Portfolio = {
      id: 1,
      name: "Long-term Portfolio",
    };
    vi.mocked(createPortfolio).mockResolvedValue(portfolio);
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Long-term Portfolio",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ portfolio });
    expect(createPortfolio).toHaveBeenCalledExactlyOnceWith(
      "Long-term Portfolio",
      expect.objectContaining({ id: "user-1" }),
      expect.anything(),
    );
  });

  test.describe(`name should be between 1-${nameCharacterLimit} characters`, () => {
    test.for([
      { name: "Long-term Porfolio", expectedStatus: 201 },
      { name: " Long-term Porfolio ", expectedStatus: 201 },
      { name: "1", expectedStatus: 201 },
      { name: "1".repeat(nameCharacterLimit), expectedStatus: 201 },
    ])(
      'Create a portfolio named \"$name\", expects response status $expectedStatus',
      async ({ name, expectedStatus }) => {
        const portfolio: Portfolio = {
          id: 1,
          name: name.trim(),
        };
        vi.mocked(createPortfolio).mockResolvedValue(portfolio);
        const request = new NextRequest(
          "http://localhost:3000/api/v1/portfolios",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
            }),
          },
        );
        const response = await POST(request);
        expect(response.status).toBe(expectedStatus);
        expect(await response.json()).toEqual({ portfolio });
        expect(createPortfolio).toHaveBeenCalledExactlyOnceWith(
          name.trim(),
          expect.objectContaining({ id: "user-1" }),
          expect.anything(),
        );
      },
    );

    test.for([
      { name: 1, expectedStatus: 400, errorMessage: "Name must be a string" },
      {
        name: "",
        expectedStatus: 400,
        errorMessage: `Name should be between 1-${nameCharacterLimit} characters`,
      },
      {
        name: " ",
        expectedStatus: 400,
        errorMessage: `Name should be between 1-${nameCharacterLimit} characters`,
      },
      {
        name: "1".repeat(nameCharacterLimit + 1),
        expectedStatus: 400,
        errorMessage: `Name should be between 1-${nameCharacterLimit} characters`,
      },
    ])(
      'Create a portfolio named \"$name\", expects response status $expectedStatus, error message \"$errorMessage\"',
      async ({ name, expectedStatus, errorMessage }) => {
        const request = new NextRequest(
          "http://localhost:3000/api/v1/portfolios",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
            }),
          },
        );
        const response = await POST(request);
        expect(createPortfolio).not.toHaveBeenCalled();
        expect(response.status).toBe(expectedStatus);
        expect(await response.json()).toEqual({ error: errorMessage });
      },
    );
  });

  test.for([{}, null])("rejects invalid body: %j", async (body) => {
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Name must be a string",
    });
    expect(createPortfolio).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated users", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
    });
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Long-term Portfolio",
      }),
    });
    const response = await POST(request);
    expect(createPortfolio).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthenticated" });
  });

  test("returns a generic error when portfolio creation fails", async () => {
    vi.mocked(createPortfolio).mockRejectedValueOnce(
      new Error("Internal database details"),
    );

    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Investments" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to create a portfolio",
    });
  });

  test("createPortfolio repo return null", async () => {
    vi.mocked(createPortfolio).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Investments" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to create a portfolio",
    });
  });

  test("rejects malformed JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid JSON",
    });
    expect(createPortfolio).not.toHaveBeenCalled();
  });
});

test.describe("PATCH /api/v1/portfolios", () => {
  test("update a portfolio correctly", async () => {
    const portfolio: Portfolio = {
      id: 1,
      name: "Long-term Portfoli (new)",
    };
    vi.mocked(updatePortfolio).mockResolvedValue(portfolio);
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        name: "Long-term Portfolio (new)",
      }),
    });
    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ portfolio });
    expect(updatePortfolio).toHaveBeenCalledExactlyOnceWith(
      1,
      "Long-term Portfolio (new)",
      expect.anything(),
    );
  });

  test.describe(`name should be between 1-${nameCharacterLimit} characters`, () => {
    test.for([
      { id: 1, name: "Long-term Porfolio", expectedStatus: 200 },
      { id: 1, name: " Long-term Porfolio ", expectedStatus: 200 },
      { id: 1, name: "1", expectedStatus: 200 },
      { id: 1, name: "1".repeat(nameCharacterLimit), expectedStatus: 200 },
    ])(
      'Create a portfolio named \"$name\", expects response status $expectedStatus',
      async ({ id, name, expectedStatus }) => {
        const portfolio: Portfolio = {
          id: id,
          name: name.trim(),
        };
        vi.mocked(updatePortfolio).mockResolvedValue(portfolio);
        const request = new NextRequest(
          "http://localhost:3000/api/v1/portfolios",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              name,
            }),
          },
        );
        const response = await PATCH(request);
        expect(response.status).toBe(expectedStatus);
        expect(await response.json()).toEqual({ portfolio });
        expect(updatePortfolio).toHaveBeenCalledExactlyOnceWith(
          id,
          name.trim(),
          expect.anything(),
        );
      },
    );

    test.for([
      {
        id: 1,
        name: 1,
        expectedStatus: 400,
        errorMessage:
          "Invalid request: name must be a string and id must be number",
      },
      {
        id: 1,
        name: "",
        expectedStatus: 400,
        errorMessage: `Name should be between 1-${nameCharacterLimit} characters`,
      },
      {
        id: 1,
        name: " ",
        expectedStatus: 400,
        errorMessage: `Name should be between 1-${nameCharacterLimit} characters`,
      },
      {
        id: 1,
        name: "1".repeat(nameCharacterLimit + 1),
        expectedStatus: 400,
        errorMessage: `Name should be between 1-${nameCharacterLimit} characters`,
      },
      {
        id: "",
        name: "Good name",
        expectedStatus: 400,
        errorMessage: `Invalid request: name must be a string and id must be number`,
      },
    ])(
      'Update name of portfolio id \"$id\ " to \"$name\", expects response status $expectedStatus, error message \"$errorMessage\"',
      async ({ id, name, expectedStatus, errorMessage }) => {
        const request = new NextRequest(
          "http://localhost:3000/api/v1/portfolios",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              name,
            }),
          },
        );
        const response = await PATCH(request);
        expect(updatePortfolio).not.toHaveBeenCalled();
        expect(response.status).toBe(expectedStatus);
        expect(await response.json()).toEqual({ error: errorMessage });
      },
    );
  });

  test.for([{}, null])("rejects invalid body: %j", async (body) => {
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request: name must be a string and id must be number",
    });
    expect(updatePortfolio).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated users", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
    });
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Long-term Portfolio",
      }),
    });
    const response = await PATCH(request);
    expect(updatePortfolio).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthenticated" });
  });

  test("returns a generic error when portfolio creation fails", async () => {
    vi.mocked(updatePortfolio).mockRejectedValueOnce(
      new Error("Internal database details"),
    );

    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, name: "Investments" }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to update the portfolio",
    });
  });

  test("updatePortfolio repo return null", async () => {
    vi.mocked(updatePortfolio).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, name: "Investments" }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to update the portfolio",
    });
  });

  test("rejects malformed JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: '{"name":',
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid JSON",
    });
    expect(updatePortfolio).not.toHaveBeenCalled();
  });
});
