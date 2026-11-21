import { describe, it, expect } from "vitest";
import { getConfig, cleanEnvValue, logLlmStartup } from "./config";

describe("API Centralized Environment & Config Loader", () => {
  describe("cleanEnvValue helper", () => {
    it("handles undefined and null", () => {
      expect(cleanEnvValue(undefined)).toBeUndefined();
      expect(cleanEnvValue(null)).toBeUndefined();
    });

    it("treats empty strings and whitespace-only strings as undefined (missing)", () => {
      expect(cleanEnvValue("")).toBeUndefined();
      expect(cleanEnvValue("   ")).toBeUndefined();
      expect(cleanEnvValue("\r\n")).toBeUndefined();
    });

    it("strips double quotes and trims whitespace", () => {
      expect(cleanEnvValue('"gsk_1234567890"')).toBe("gsk_1234567890");
      expect(cleanEnvValue('  "gsk_1234567890"  ')).toBe("gsk_1234567890");
    });

    it("strips single quotes and trims whitespace", () => {
      expect(cleanEnvValue("'gsk_1234567890'")).toBe("gsk_1234567890");
      expect(cleanEnvValue("  'gsk_1234567890'  ")).toBe("gsk_1234567890");
    });

    it("strips Windows carriage returns (\\r)", () => {
      expect(cleanEnvValue("gsk_1234567890\r")).toBe("gsk_1234567890");
      expect(cleanEnvValue('"gsk_1234567890"\r')).toBe("gsk_1234567890");
    });
  });

  describe("getConfig() behavior across key scenarios", () => {
    it("1. Missing key scenario: keyPresent is false, llm.enabled is false", () => {
      const config = getConfig({
        GROQ_API_KEY: undefined,
        LLM_ENABLED: "true",
      });
      expect(config.llm.keyPresent).toBe(false);
      expect(config.llm.enabled).toBe(false);
      expect(config.llm.keyLength).toBe(0);
      expect(config.llm.keyPrefixOk).toBe(false);
    });

    it("2. Empty key scenario: treated as missing, keyPresent is false", () => {
      const config = getConfig({
        GROQ_API_KEY: "   ",
        LLM_ENABLED: "true",
      });
      expect(config.llm.keyPresent).toBe(false);
      expect(config.llm.enabled).toBe(false);
      expect(config.llm.keyLength).toBe(0);
    });

    it("3. Quoted key scenario: quotes stripped, keyPresent is true, keyPrefixOk is true", () => {
      const config = getConfig({
        GROQ_API_KEY: '"gsk_mock_valid_key_for_test_1234567890"',
        LLM_ENABLED: "true",
      });
      expect(config.llm.keyPresent).toBe(true);
      expect(config.llm.enabled).toBe(true);
      expect(config.llm.keyPrefixOk).toBe(true);
      expect(config.llm.keyLength).toBe(38);
    });

    it("4. \\r in value scenario: \\r stripped, keyPresent is true, keyPrefixOk is true", () => {
      const config = getConfig({
        GROQ_API_KEY: "gsk_mock_valid_key_for_test_1234567890\r",
        LLM_ENABLED: "true",
      });
      expect(config.llm.keyPresent).toBe(true);
      expect(config.llm.enabled).toBe(true);
      expect(config.llm.keyPrefixOk).toBe(true);
      expect(config.llm.keyLength).toBe(38);
    });

    it("5. LLM_ENABLED=false scenario: llm.enabled is false even if key is present", () => {
      const config = getConfig({
        GROQ_API_KEY: "gsk_mock_valid_key_for_test_1234567890",
        LLM_ENABLED: "false",
      });
      expect(config.llm.keyPresent).toBe(true);
      expect(config.llm.keyPrefixOk).toBe(true);
      expect(config.llm.enabled).toBe(false);
    });

    it("6. Key present scenario: keyPresent is true, llm.enabled is true, model defaults", () => {
      const config = getConfig({
        GROQ_API_KEY: "gsk_mock_valid_key_for_test_1234567890",
        LLM_ENABLED: "true",
      });
      expect(config.llm.keyPresent).toBe(true);
      expect(config.llm.enabled).toBe(true);
      expect(config.llm.keyPrefixOk).toBe(true);
      expect(config.llm.model).toBe("qwen/qwen3.8-27b");
      expect(config.llm.timeoutMs).toBe(15000);
    });
  });

  describe("logLlmStartup()", () => {
    it("logs enabled message with model without leaking key", () => {
      let logged = "";
      const orig = console.log;
      console.log = (msg: string) => { logged = msg; };

      const config = getConfig({
        GROQ_API_KEY: "gsk_secret_value_never_to_be_logged",
        LLM_ENABLED: "true",
      });
      logLlmStartup(config);
      console.log = orig;

      expect(logged).toBe("LLM: enabled (key present, model qwen/qwen3.8-27b)");
      expect(logged).not.toContain("secret");
      expect(logged).not.toContain("gsk_");
    });

    it("logs disabled message when key is missing", () => {
      let logged = "";
      const orig = console.log;
      console.log = (msg: string) => { logged = msg; };

      const config = getConfig({
        GROQ_API_KEY: undefined,
        LLM_ENABLED: "true",
      });
      logLlmStartup(config);
      console.log = orig;

      expect(logged).toBe("LLM: disabled (reason: missing key)");
    });

    it("logs disabled message when LLM_ENABLED is false", () => {
      let logged = "";
      const orig = console.log;
      console.log = (msg: string) => { logged = msg; };

      const config = getConfig({
        GROQ_API_KEY: "gsk_some_key",
        LLM_ENABLED: "false",
      });
      logLlmStartup(config);
      console.log = orig;

      expect(logged).toBe("LLM: disabled (reason: LLM_ENABLED=false)");
    });
  });
});
