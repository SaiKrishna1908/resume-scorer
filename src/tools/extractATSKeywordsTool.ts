import type { ATSKeywords } from "../../types";
import { runLLM } from "../llm/llm";
import { parseJSONFromLLM } from "../utils/utils";

export const extractATSKeywordsFromJobDescription = async (
  jobDescription: string
): Promise<ATSKeywords[]> => {
  const prompt = `
You are an expert technical recruiter and ATS (Applicant Tracking System) specialist.

# TASK
Extract a canonical "target stack" from the job description for resume optimization.

# INPUT
Job Description:
${jobDescription}

# EXTRACTION RULES
1. CATEGORIZE BY TYPE:
   - Programming Languages (e.g., Java, TypeScript, JavaScript, Python, Go, C++)
   - Frontend (e.g., React, Angular, Next.js, Vue.js, HTML5, CSS3)
   - Backend Frameworks (e.g., Node.js, Express, Spring Boot, Django, FastAPI)
   - Databases (e.g., PostgreSQL, MySQL, MongoDB, DynamoDB, Redis)
   - Cloud & Infrastructure (e.g., AWS Lambda, ECS, S3, API Gateway, CloudFront, GCP, Azure)
   - Messaging & Streaming (e.g., Kafka, RabbitMQ, SQS, SNS, Kinesis)
   - DevOps & CI/CD (e.g., Docker, Kubernetes, Terraform, GitHub Actions, Jenkins)
   - Testing (e.g., Jest, JUnit, Pytest, TDD, Integration Testing)
   - Observability (e.g., Prometheus, Grafana, OpenTelemetry, ELK Stack)
   - Security & Auth (e.g., OAuth2, JWT, OIDC, RBAC, Auth0, Cognito)
   - Methodologies (e.g., Agile, Scrum, TDD, CI/CD, Microservices)

2. CANONICALIZE NAMES:
   - Use standard naming: "Node.js" (not "NodeJS"), "PostgreSQL" (not "Postgres"), "Kubernetes" (not "k8s")
   - Be precise: "AWS Lambda", "AWS S3" (not just "AWS")

3. PRIORITIZE:
   - Only extract keywords explicitly mentioned or strongly implied
   - Focus on technical requirements over soft skills
   - Include version numbers if specified (e.g., "Java 17", "React 18")

# OUTPUT CONTRACT
Return ONLY a JSON array of categorized keywords:
[
  {
    "name": "Category Name",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

# EXAMPLE
For "Backend Engineer with Node.js, TypeScript, PostgreSQL, AWS Lambda, Kafka experience":
[
  { "name": "Programming Languages", "keywords": ["JavaScript", "TypeScript"] },
  { "name": "Backend Frameworks", "keywords": ["Node.js", "Express"] },
  { "name": "Databases", "keywords": ["PostgreSQL"] },
  { "name": "Cloud Services", "keywords": ["AWS Lambda", "AWS API Gateway"] },
  { "name": "Messaging", "keywords": ["Kafka"] }
]

Return ONLY the JSON array, no markdown code blocks, no explanatory text.
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  const responseJson: ATSKeywords[] = parseJSONFromLLM(response.content);

  console.log("🎯 extractATSKeywords →", responseJson);
  return responseJson;
};
