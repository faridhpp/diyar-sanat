import test from "node:test";
import assert from "node:assert/strict";
import { createCaptcha, verifyCaptcha } from "../lib/captcha";

test("captcha challenges are signed, dynamic, and reject the old static answer", () => {
  const first = createCaptcha();
  const second = createCaptcha();
  const [left, operator, right] = first.question.split(" ");
  const expected = operator === "−" ? Number(left) - Number(right) : Number(left) + Number(right);
  assert.notEqual(first.token, second.token);
  assert.equal(verifyCaptcha(first.token, String(expected)), true);
  assert.equal(verifyCaptcha("", "7"), false);
  assert.equal(verifyCaptcha(first.token, String(expected + 1)), false);
});
