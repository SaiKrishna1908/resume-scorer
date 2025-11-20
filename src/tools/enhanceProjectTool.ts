import type { ATSKeywords } from "../../types";
import { runLLM } from "../llm/llm";
import { parseJSONFromLLM } from "../utils/utils";

export const projectEnhancerTool = async (
  githubUrl: string,
  jobTitle: string,
  atsKeywords: ATSKeywords[]
): Promise<string[]> => {
  const targetStack = atsKeywords.flatMap((s) => s.keywords).join(", ");

  const prompt = `
You are an expert technical resume writer.

# TASK
Analyze the GitHub project and write 2-3 resume bullet points for the Projects section.

# GITHUB PROJECT
${githubUrl}

# TARGET ROLE
${jobTitle}

# TARGET STACK (align bullets with these technologies)
${targetStack}

# RULES
1. ANALYZE:
   - Infer project purpose, tech stack, and architecture from the repo
   - Focus on features that demonstrate skills in TARGET STACK
   - Identify measurable outcomes or technical depth

2. BULLET STRUCTURE:
   - Format: [What you built] + [Technologies from TARGET STACK] + [Technical detail or outcome]
   - One line per bullet
   - 2-3 bullets maximum
   - Each bullet should highlight different aspects (architecture, performance, features, deployment)

3. ALIGNMENT:
   - Use technologies from TARGET STACK where possible
   - If project uses different stack, reframe to emphasize transferable architecture/patterns
   - Include relevant keywords: API design, microservices, CI/CD, cloud deployment, testing, observability

4. TECHNICAL DEPTH:
   - Name specific technologies (e.g., "Node.js with Express", "PostgreSQL with connection pooling")
   - Include architecture patterns (REST API, event-driven, serverless)
   - Mention deployment (Docker, AWS, Vercel, Railway)
   - Show best practices (TDD, CI/CD, monitoring)

5. CONSTRAINTS:
   - FORBIDDEN characters: < > [ ] " { } \\
   - No generic claims ("easy to use", "user-friendly")
   - Focus on technical implementation, not soft benefits

# OUTPUT CONTRACT
Return ONLY a JSON array of strings:
[
  "bullet point 1",
  "bullet point 2",
  "bullet point 3"
]

# EXAMPLE
For a coding challenge app (Node.js, React, AWS) aligned to Backend role:
[
  "Built REST API with Node.js and Express serving dynamic coding challenges using OpenAI GPT-4, implementing rate limiting and Redis caching for sub-100ms response times",
  "Architected serverless backend on AWS Lambda with API Gateway and DynamoDB, reducing infrastructure costs by 60% while maintaining 99.9% uptime",
  "Implemented JWT authentication with Auth0 and automated CI/CD pipeline using GitHub Actions for zero-downtime deployments"
]

Return ONLY the JSON array, no markdown, no explanatory text.
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  return parseJSONFromLLM(response.content);
};
