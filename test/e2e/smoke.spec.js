import { test } from "@playwright/test";

// Placeholder smoke test. In CI, load unpacked extension and assert popup shell.
test("markoo smoke", async () => {
  test.skip(true, "Extension E2E wiring is tracked and will run in release candidate stage.");
});
