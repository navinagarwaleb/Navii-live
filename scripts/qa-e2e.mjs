/**
 * Manual QA runner against production.
 * Usage: node scripts/qa-e2e.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.QA_BASE_URL || "https://www.songtable.com";
const USER = process.env.QA_USER || "testuser";
const PASS = process.env.QA_PASS || "123123123";
const OUT = path.resolve("qa-screenshots");

fs.mkdirSync(OUT, { recursive: true });

const results = [];

function log(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    // 1. Homepage
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "01-home");
    const hasBrand = await page.getByText("Navii Live").first().isVisible();
    const hasCta = await page.getByRole("link", { name: /Get your free page/i }).isVisible();
    const hasSignIn = await page.getByRole("link", { name: /^Sign in$/i }).isVisible();
    const hasTagline = await page.getByText(/Free to start/i).isVisible();
    const noOpenPublic = (await page.getByText(/Open your public page/i).count()) === 0;
    const noDashboardCta = (await page.getByText(/Go to dashboard/i).count()) === 0;
    log("Homepage brand + CTAs", hasBrand && hasCta && hasSignIn, "");
    log("Homepage tagline present", hasTagline);
    log("Homepage no 'Open your public page'", noOpenPublic);
    log("Homepage no 'Go to dashboard'", noDashboardCta);

    // 2. Login
    await page.getByRole("link", { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/login/);
    await shot(page, "02-login");
    await page.getByLabel(/email or username/i).fill(USER);
    await page.locator("#login-password").fill(PASS);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    try {
      await page.waitForURL(/\/(admin|setup)/, { timeout: 25000 });
      log("Login redirects to admin/setup", true, page.url());
    } catch {
      await shot(page, "02-login-fail");
      const errText = await page.locator('[role="alert"]').first().textContent().catch(() => "");
      log("Login redirects to admin/setup", false, errText || page.url());
      throw new Error("Login failed — cannot continue authenticated flows");
    }
    await shot(page, "03-admin");

    // 3. Admin tabs
    const tabNames = ["Queue", "Live", "Songs", "Tips"];
    for (const tab of tabNames) {
      const btn = page.getByRole("button", { name: tab }).or(page.getByRole("link", { name: tab }));
      const visible = (await btn.count()) > 0 && (await btn.first().isVisible());
      log(`Admin tab visible: ${tab}`, visible);
    }

    // Tips tab
    await page.getByRole("button", { name: "Tips" }).or(page.getByRole("link", { name: "Tips" })).first().click();
    await page.waitForTimeout(800);
    await shot(page, "04-tips");
    const saveLabel = await page.getByRole("button", { name: /^Save( tips| changes)?$/i }).first().textContent().catch(() => "");
    log(
      "Tips save button label",
      /^Save$/i.test(saveLabel?.trim() || "") || /Save changes/i.test(saveLabel || ""),
      `got "${saveLabel?.trim()}" (production may lag local fix)`,
    );
    const hasPaypal = await page.getByText("PayPal.Me", { exact: true }).isVisible().catch(() => false);
    const hasVenmo = await page.getByText("Venmo", { exact: true }).first().isVisible().catch(() => false);
    const hasCash = await page.getByText("Cash App", { exact: true }).first().isVisible().catch(() => false);
    log("Tips fields PayPal/Venmo/Cash App", hasPaypal && hasVenmo && hasCash);

    // Save tips smoke (no destructive change — leave values)
    const paypalInput = page.getByPlaceholder(/paypal\.com\/paypalme/i);
    if (await paypalInput.count()) {
      const before = await paypalInput.inputValue();
      await page.getByRole("button", { name: /^Save/i }).first().click();
      await page.waitForTimeout(1500);
      const tipMsg = await page.locator("text=/Tips saved|Tip columns are missing|saved/i").first().textContent().catch(() => "");
      const tipErr = await page.locator('[role="alert"]').first().textContent().catch(() => "");
      const ok = /saved/i.test(tipMsg || "") && !/missing/i.test(tipErr || "");
      log("Tips save works", ok || /saved/i.test(tipMsg || ""), tipMsg || tipErr || "no feedback");
      // restore not needed if unchanged
      void before;
    }
    await shot(page, "05-tips-after-save");

    // Profile settings
    const profileLink = page.locator('a[href="/admin/settings"]').first();
    if (await profileLink.count()) {
      await profileLink.click();
      await page.waitForURL(/\/admin\/settings/);
      try {
        await page
          .getByRole("heading", { name: /Profile settings/i })
          .waitFor({ timeout: 20000 });
        await shot(page, "06-settings");
        const hasDisplay = await page
          .getByText(/Display name/i)
          .first()
          .isVisible();
        const hasPassword = await page
          .getByRole("heading", { name: /^Password$/i })
          .isVisible()
          .catch(() => false);
        log("Settings: display name", hasDisplay);
        log(
          "Settings: password section",
          hasPassword,
          hasPassword ? "" : "missing on prod until deploy",
        );
      } catch (settingsErr) {
        await shot(page, "06-settings");
        log("Settings page loads", false, String(settingsErr));
      }
      await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    } else {
      log("Settings: profile icon link", false, "not found");
    }

    // Live / public URL
    await page.getByRole("button", { name: "Live" }).or(page.getByRole("link", { name: "Live" })).first().click();
    await page.waitForTimeout(600);
    await shot(page, "07-live");

    // 4. Public page
    await page.goto(`${BASE}/${USER}`, { waitUntil: "networkidle" });
    await shot(page, "08-public");
    const publicOk = !page.url().includes("404");
    const requestCta = await page.getByRole("link", { name: /request/i }).or(page.getByRole("button", { name: /request/i })).first().isVisible().catch(() => false);
    log("Public page loads", publicOk, page.url());
    log("Public request CTA", requestCta);

    // Tip button if present
    const tipBtn = page.getByRole("button", { name: /^Tip$/i });
    if ((await tipBtn.count()) > 0 && (await tipBtn.first().isVisible())) {
      await tipBtn.first().click();
      await page.waitForTimeout(500);
      await shot(page, "09-tip-modal");
      const methods = await page.locator("text=/PayPal|Venmo|Cash App/").count();
      log("Tip modal shows configured methods", methods > 0, `${methods} method labels`);
      // Stacking bug: page tagline must not paint over modal
      const dialogBox = page.getByRole("dialog");
      const tagline = page.getByText(/No account needed/i);
      let noOverlap = true;
      if ((await dialogBox.count()) && (await tagline.count())) {
        const d = await dialogBox.boundingBox();
        const t = await tagline.boundingBox();
        if (d && t) {
          const overlap =
            t.y < d.y + d.height &&
            t.y + t.height > d.y &&
            t.x < d.x + d.width &&
            t.x + t.width > d.x;
          noOverlap = !overlap;
        }
      }
      log("Tip modal not overlapped by page copy", noOverlap, noOverlap ? "" : "z-index stacking bug");
      await page.keyboard.press("Escape");
    } else {
      log("Tip button on public page", false, "hidden (no tip methods configured?)");
    }

    // 5. Request wizard
    const reqLink = page.getByRole("link", { name: /request/i }).first();
    if (await reqLink.count()) {
      await reqLink.click();
      await page.waitForURL(/request/);
      await shot(page, "10-request-step1");
      log("Request wizard opens", true, page.url());

      // Try to advance through occasion if present
      const occasionBtn = page.locator("button").filter({ hasText: /Birthday|Just Because|Anniversary|Date Night/i }).first();
      if (await occasionBtn.count()) {
        await occasionBtn.click();
        await page.waitForTimeout(400);
        const next = page.getByRole("button", { name: /next|continue/i }).first();
        if (await next.isVisible().catch(() => false)) await next.click();
      }
      await shot(page, "11-request-after-occasion");
    } else {
      log("Request wizard opens", false, "no request link");
    }

    // Console errors (filter noise)
    const serious = consoleErrors.filter(
      (e) =>
        !/favicon/i.test(e) &&
        !/Download the React DevTools/i.test(e) &&
        !/third-party/i.test(e),
    );
    log("No serious page errors", serious.length === 0, serious.slice(0, 3).join(" | "));
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n—— Summary ——");
  console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`);
  if (failed.length) {
    console.log("Failures:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  }
  console.log(`Screenshots: ${OUT}`);

  fs.writeFileSync(
    path.join(OUT, "report.json"),
    JSON.stringify({ base: BASE, results, consoleErrors }, null, 2),
  );

  process.exit(failed.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error("QA runner crashed:", err);
  process.exit(2);
});
