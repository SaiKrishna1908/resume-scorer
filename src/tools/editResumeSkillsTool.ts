import type { ATSKeywords } from "../../types";
import { runLLM } from "../llm/llm";
import { Resume } from "../entity/resume";
import { parseJSONFromLLM } from "../utils/utils";

export const resumeSkillsSectionEditor = async (
  companyDomain: string,
  atsKeywords: ATSKeywords[],
  existingSkills: ATSKeywords[]
): Promise<ATSKeywords[]> => {
  const prompt = `
You are an expert ATS optimization specialist.

# TASK
Merge and optimize skills for the "${companyDomain}" domain, applying HARD PRUNING rules.

# TARGET STACK (from job description)
${JSON.stringify(atsKeywords, null, 2)}

# EXISTING SKILLS (from resume)
${JSON.stringify(existingSkills, null, 2)}

# HARD PRUNING RULES (WHITELIST FROM JD)
1. KEEP ONLY:
   - Technologies from TARGET STACK
   - Neutral fundamentals: Git, REST, CI/CD, Docker, Kubernetes, Terraform, Linux, Agile, Unit Testing, Integration Testing, OAuth2, OIDC, JWT, OpenAPI, Design Patterns, DDD, CQRS, Grafana, Prometheus, OpenTelemetry, SLA/SLO, RBAC
   - Core programming languages: Java, JavaScript, TypeScript, Python, C, C++ (always keep these basics)

2. REMOVE:
   - Any technology NOT in TARGET STACK and NOT in neutral fundamentals
   - Example: If JD is Node.js/React focused, REMOVE Flutter, Angular, Spring Boot, etc.
   - Example: If JD is backend-only, REMOVE all frontend frameworks not mentioned

3. MERGE & DEDUPLICATE:
   - Combine TARGET STACK with relevant EXISTING SKILLS
   - Remove duplicates (case-insensitive)
   - Canonicalize names (e.g., "NodeJS" → "Node.js", "Postgres" → "PostgreSQL")

4. ORGANIZE:
   - Keep logical categories (Programming Languages, Frontend, Backend, Databases, etc.)
   - Within each category, prioritize TARGET STACK keywords first
   - Limit to 5-8 keywords per category for readability

# OUTPUT CONTRACT
Return ONLY a JSON array matching this structure:
[
  {
    "name": "Category Name",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

# VALIDATION
- Every keyword MUST appear in TARGET STACK or neutral fundamentals (except core languages)
- No duplicates across categories
- Categories should be logical and ATS-friendly
- Return ONLY the JSON array, no markdown code blocks, no explanatory text

# EXAMPLE
If TARGET STACK emphasizes Node.js, PostgreSQL, AWS, Kafka:
- KEEP: Node.js, JavaScript, TypeScript, PostgreSQL, AWS Lambda, Kafka, Docker, Kubernetes
- REMOVE: Flutter, Angular (if not in JD), Spring Boot (if not in JD)
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  const responseInJson = parseJSONFromLLM(response.content);

  Resume.getInstance().setAtsSkills(responseInJson);

  console.log("Updated skills:", JSON.stringify(responseInJson, null, 2));
  return responseInJson;
};
