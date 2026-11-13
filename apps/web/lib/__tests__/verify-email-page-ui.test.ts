import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("verify email recovery UI", () => {
  const source = readFileSync("app/(auth)/verify-email/page.tsx", "utf8");

  it("keeps verification optional and routes recovery through the signed-in app", () => {
    expect(source).toContain("gunakan notifikasi verifikasi");
    expect(source).toContain("Tautan yang belum kedaluwarsa tetap");
    expect(source).toContain("Buka PETORA INDONESIA untuk mengirim ulang");
    expect(source).not.toContain("resendVerification.useMutation");
    expect(source).not.toContain('href="/register"');
    expect(source).not.toContain("disabled={!email");
  });

  it("does not claim confirmation activates a trial", () => {
    expect(source).toContain("Email confirmed. You can return to your workspace.");
    expect(source).not.toMatch(/trial (?:is|was) already active/i);
    expect(source).not.toMatch(/activate your account|start your free trial/i);
  });
});
