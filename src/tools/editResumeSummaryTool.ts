import type { ATSKeywords } from "../../types";
import { runLLM } from "../llm/llm";
import { Resume } from "../entity/resume";

export const resumeSummarySectionEditor = async (
  jobTitle: string,
  companyDomain: string,
  atsKeywords: ATSKeywords[]
) => {
  const targetStack = atsKeywords.flatMap((k) => k.keywords).join(", ");

  const prompt = `
You are an expert resume writer specializing in technical resumes.

# TASK
Rewrite a professional summary for the role of "${jobTitle}" in the "${companyDomain}" domain.

# TARGET STACK (from job description)
${targetStack}

# RULES
1. CONTENT:
   - 2-3 concise, high-impact sentences (max 80 words total)
   - Lead with years of experience and core expertise matching the target stack
   - Include 1-2 quantified achievements (scale, performance, impact)
   - Align language and keywords with the target stack
   
2. STYLE:
   - Active voice, confident tone
   - Use specific technical terms from target stack
   - Include metrics where possible (e.g., "500K+ users", "35% latency reduction")
   - Avoid generic phrases like "team player" or "fast learner"

3. STRUCTURE:
   - Sentence 1: Role + expertise + primary technologies
   - Sentence 2: Key achievement or specialization with metrics
   - Sentence 3 (optional): Additional strength or domain expertise

# FORBIDDEN
- Do NOT use these characters: < > [ ] " { } \\
- Do NOT use buzzwords without context ("innovative", "passionate", etc.)
- Do NOT copy generic resume templates

# OUTPUT CONTRACT
Return ONLY the summary text (2-3 sentences), no JSON, no markdown, no extra formatting.

# EXAMPLE
For "Senior Backend Engineer" in "FinTech" with Node.js, PostgreSQL, AWS:
"Senior Backend Engineer with 5+ years designing scalable financial APIs using Node.js, PostgreSQL, and AWS Lambda. Architected payment processing systems handling 10M+ transactions monthly with 99.99% uptime and sub-100ms p95 latency. Expert in building PCI-compliant microservices, event-driven architectures with Kafka, and implementing robust observability with OpenTelemetry and Grafana."
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  const summary = response.content?.trim() || "";
  Resume.getInstance().setSummary(summary);

  return { summary };
};
