import type { ATSKeywords } from "../../types";
import { runLLM } from "../llm/llm";
import { Resume } from "../entity/resume";
import { parseJSONFromLLM } from "../utils/utils";

export const resumeProfessionalExperienceSectionEditor = async (
  jobTitle: string,
  companyDomain: string,
  updatedSkills: ATSKeywords[],
  existingExperiences: string[][]
): Promise<string[][]> => {
  const targetStack = updatedSkills.flatMap((s) => s.keywords).join(", ");

  const prompt = `
You are an expert technical resume writer specializing in ATS optimization.

# TASK
Rewrite professional experience bullets to align with "${jobTitle}" in "${companyDomain}" domain.

# TARGET STACK (from optimized skills)
${targetStack}

# EXISTING EXPERIENCES (conceptual hints only)
${JSON.stringify(existingExperiences, null, 2)}

# STACK MIGRATION RULES
Treat original highlights as CONCEPTUAL HINTS ONLY. Completely rewrite using TARGET STACK:

1. TECHNOLOGY MIGRATION:
   - Frontend → If JD is backend-focused, convert to API/backend/infrastructure outcomes
   - Flutter/Mobile → Convert to Node.js/Express APIs, BFF patterns, or platform services if JD requires
   - Java/Spring → Convert to Node.js/Express/Koa if JD is Node-centric
   - React → Keep only if in TARGET STACK, otherwise convert to backend services
   - SQL tuning → Keep but name JD's database (e.g., PostgreSQL) with specific metrics
   - Messaging → Map to JD's broker (Kafka, SQS, SNS, RabbitMQ)
   - Auth → Align to JD's platform (Cognito, Auth0, Okta) with OAuth2/OIDC/JWT details

2. DOMAIN ALIGNMENT:
   - FinTech: Emphasize PCI DSS, payment processing, fraud detection, financial APIs
   - Healthcare: HIPAA compliance, patient data security, EHR integration
   - E-commerce: Cart optimization, checkout flow, payment gateways, inventory
   - Travel: Booking systems, OTA integration, IATA standards, reservation management
   - SaaS: Multi-tenancy, subscription management, usage metering, API rate limiting

3. BULLET STRUCTURE (MANDATORY):
   - Format: [Action verb] + [What in TARGET STACK] + [How/tech detail] + [Quantified impact]
   - One line per bullet; no paragraphs; no passive voice
   - 4-6 bullets per role, strongest first
   - EVERY bullet must reference TARGET STACK technologies

4. QUANTIFICATION (REQUIRED):
   - Scale: users (100K+, 1M+), requests (QPS, RPS), data volume (TB, PB)
   - Performance: latency (p50/p95/p99 in ms), throughput, error rates (%)
   - Impact: reduction % (35% faster, 50% fewer errors), improvement (2x throughput)
   - Reliability: uptime (99.9%, 99.99%), SLOs, MTTR
   - Business: conversion rate, revenue impact, cost savings

5. TECHNICAL DEPTH:
   - Name specific cloud services (AWS Lambda, ECS, API Gateway, S3, DynamoDB, RDS)
   - Include observability (OpenTelemetry, Prometheus, Grafana, ELK, distributed tracing)
   - Show architecture (microservices, event-driven, CQRS, API Gateway patterns)
   - Mention data formats (Avro, Protobuf, JSON Schema), partitioning, indexes
   - Include testing (TDD, integration tests, E2E, code coverage %)

6. HARD CONSTRAINTS:
   - DO NOT copy phrases from original bullets (zero overlap >3 tokens)
   - Every skill in TARGET STACK MUST appear at least once across all bullets
   - If a skill doesn't appear, add a credible bullet featuring it
   - You MAY invent plausible details (traffic, latency, scale) consistent with JD and domain
   - FORBIDDEN characters: < > [ ] " { } \\

# OUTPUT CONTRACT
Return ONLY a JSON array of arrays (one per job role):
[
  ["bullet 1 for role 1", "bullet 2 for role 1", "bullet 3 for role 1", ...],
  ["bullet 1 for role 2", "bullet 2 for role 2", ...],
  ...
]

# EXAMPLE
For Node.js Backend Engineer in E-commerce (PostgreSQL, AWS, Kafka):

Original: "Built OMR grading pipeline (AWS Lambda, S3, OpenCV) processing 10K+/day"
Rewritten: "Architected event-driven order processing pipeline using AWS Lambda, SQS, and PostgreSQL, handling 50K orders/day with 99.95% success rate and sub-200ms p95 latency"

Original: "Migrated modules to Flutter improving load times by 35%"
Rewritten: "Designed Node.js microservices with Express and PostgreSQL for product catalog and inventory, reducing API response time by 40% (p95 <150ms) and supporting 2M+ SKUs with Redis caching"

Return ONLY the JSON array, no markdown, no explanatory text.
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  const updatedExperiences = parseJSONFromLLM(response.content);

  Resume.getInstance().setProfessionalExperience(updatedExperiences);

  console.log(
    "Updated professional experiences:",
    JSON.stringify(updatedExperiences, null, 2)
  );
  return updatedExperiences;
};
