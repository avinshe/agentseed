import { describe, it, expect } from "vitest";
import { buildMetaTag, parseMetaTag, needsRegeneration, type FileMeta } from "../../src/utils/git";

describe("git utilities", () => {
  describe("buildMetaTag / parseMetaTag", () => {
    it("should round-trip metadata", () => {
      const meta: FileMeta = {
        sha: "abc123def456",
        timestamp: "2025-01-15T10:00:00.000Z",
        format: "agentseed-v1",
      };
      const tag = buildMetaTag(meta);
      expect(tag).toContain("<!-- agentseed:meta");
      expect(tag).toContain("abc123def456");

      const parsed = parseMetaTag(tag);
      expect(parsed).toEqual(meta);
    });

    it("should parse metadata from a full file", () => {
      const content = [
        "# Project Rules",
        "",
        "## Stack",
        "TypeScript",
        "",
        '<!-- agentseed:meta {"sha":"deadbeef","timestamp":"2025-01-15T10:00:00.000Z","format":"agentseed-v1"} -->',
      ].join("\n");

      const parsed = parseMetaTag(content);
      expect(parsed).not.toBeNull();
      expect(parsed!.sha).toBe("deadbeef");
    });

    it("should return null for content without metadata", () => {
      const content = "# Just a regular markdown file\n\nNo metadata here.";
      expect(parseMetaTag(content)).toBeNull();
    });

    it("should return null for malformed JSON", () => {
      const content = "<!-- agentseed:meta {invalid json} -->";
      expect(parseMetaTag(content)).toBeNull();
    });
  });

  describe("needsRegeneration", () => {
    // Note: needsRegeneration calls hasUncommittedChanges which needs a real git repo.
    // We test the pure logic paths here (null content, missing meta, SHA mismatch).

    it("should return true when content is null", () => {
      expect(needsRegeneration(null, "abc123", ".")).toBe(true);
    });

    it("should return true when SHA is null", () => {
      expect(needsRegeneration("some content", null, ".")).toBe(true);
    });

    it("should return true when content has no metadata tag", () => {
      const content = "# Just markdown, no meta tag";
      expect(needsRegeneration(content, "abc123", ".")).toBe(true);
    });

    it("should return true when SHA has changed", () => {
      const meta: FileMeta = {
        sha: "old-sha-000",
        timestamp: "2025-01-01T00:00:00.000Z",
        format: "agentseed-v1",
      };
      const content = `# Content\n\n${buildMetaTag(meta)}`;
      // Current SHA is different from the one stored in the file
      expect(needsRegeneration(content, "new-sha-111", ".")).toBe(true);
    });
  });
});
