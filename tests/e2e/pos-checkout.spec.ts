import { expect, test } from "@playwright/test";

test.skip(
  !process.env.MSSQL_CONNECTION_STRING && (!process.env.MSSQL_SERVER || !process.env.MSSQL_DATABASE),
  "MSSQL environment variables and seeded test users are required for this E2E flow.",
);

test("admin creates latte order and completes it in the barista queue", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: "POS", exact: true }).click();
  await page.getByRole("button", { name: "Latte Coffee THB" }).click();
  await page.getByRole("button", { name: "Medium" }).click();
  await page.getByRole("button", { name: "Iced" }).click();
  await page.getByRole("button", { name: "50%" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByRole("radio", { name: "Cash" }).check();
  await page.getByRole("spinbutton").fill("200");
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page).toHaveURL(/\/receipt\//);
  const orderNumber = await page.getByText(/^O\d{14}$/).textContent();
  expect(orderNumber).toBeTruthy();

  await page.getByRole("link", { name: "Barista" }).click();
  const ticket = page.locator("article").filter({ hasText: orderNumber! });
  await expect(ticket).toContainText("Latte");
  await ticket.getByRole("button", { name: "Start" }).click();
  await ticket.getByRole("button", { name: "Ready" }).click();
  await ticket.getByRole("button", { name: "Complete" }).click();
  await expect(ticket).toBeHidden();
});
