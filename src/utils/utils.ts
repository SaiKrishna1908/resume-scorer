export const parseJSONFromLLM = (content: string | null | undefined): any => {
  if (!content) {
    throw new Error("No content to parse");
  }

  try {
    // Remove markdown code blocks
    let cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON:", content);
    throw new Error(
      `JSON parsing failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
