import { expect, test } from "@playwright/test";

test.skip(
  !process.env.MSSQL_CONNECTION_STRING && (!process.env.MSSQL_SERVER || !process.env.MSSQL_DATABASE),
  "MSSQL environment variables and seeded test users are required for this E2E flow.",
);

test("cashier creates latte order and barista completes it", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("cashier@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/pos/);

  await page.getByRole("button", { name: /Latte/ }).click();
  await page.getByRole("button", { name: "Medium" }).click();
  await page.getByRole("button", { name: "Iced" }).click();
  await page.getByRole("button", { name: "50%" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByLabel("Cash").check();
  await page.getByRole("spinbutton").fill("200");
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page).toHaveURL(/\/receipt\//);

  const barista = await context.newPage();
  await barista.goto("/barista");
  await expect(barista.getByText("Latte")).toBeVisible();
  await barista.getByRole("button", { name: "Start" }).click();
  await barista.getByRole("button", { name: "Ready" }).click();
  await barista.getByRole("button", { name: "Complete" }).click();
  await expect(barista.getByText("Latte")).toBeHidden();
});
