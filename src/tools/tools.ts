import type { AboutCompany, ATSKeywords } from "../../types";
import { runLLM } from "../llm/llm";
import { addMessages } from "../entity/memory";
import { Resume } from "../entity/resume";
import { jsPDF } from "jspdf";
import os from "os";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { parseJSONFromLLM } from '../utils/utils';

// Helper function to safely parse JSON from LLM response

export const fetchJobTitleCompanyDomainAndJobDescriptionFromUrl = async (
  jobDescription: string
): Promise<AboutCompany> => {
  const prompt = `
    You are an expert technical recruiter analyzing job postings.

    # TASK
    Extract structured information from the provided job description.

    # INPUT
    Job Description:
    ${jobDescription}

    # OUTPUT CONTRACT
    Return ONLY valid JSON with these exact fields:
    {
      "jobTitle": "<extracted job title>",
      "companyDomain": "<inferred company domain/industry, e.g., FinTech, HealthTech, E-commerce, Travel, SaaS>",
      "jobDescription": "<cleaned job description text>",
      "nextStep": "<application next step if mentioned, otherwise 'Apply through company careers page'>"
    }

    # RULES
    - jobTitle: Extract the exact role title (e.g., "Senior Full-Stack Engineer", "Backend Developer")
    - companyDomain: Infer from description (FinTech, E-commerce, Healthcare, SaaS, etc.)
    - jobDescription: Clean, condensed description focusing on key responsibilities and requirements
    - nextStep: Application instructions if provided, otherwise generic fallback
    - Return ONLY the JSON object, no markdown code blocks, no explanatory text
    `;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  const responseJson = parseJSONFromLLM(response.content);
  console.log("Parsed job info:", responseJson);
  return responseJson;
};

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

export const generateResumePDF = async (
  companyName?: string
): Promise<{ filePath: string; message: string }> => {
  const resumeInstance = Resume.getInstance();
  const resume = await resumeInstance.getResume();

  if (!resume || !resume.basics) {
    throw new Error("Resume data is not available. Please update the resume first.");
  }

  const doc = new jsPDF();
  const margin = 10;
  let y = margin;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const headingColor: [number, number, number] = [0, 51, 102];
  const subHeadingColor: [number, number, number] = [51, 51, 51];
  const linkColor: [number, number, number] = [0, 0, 255];
  const textColor: [number, number, number] = [0, 0, 0];

  // Helper functions
  const drawSectionDivider = (yPos: number) => {
    const lineMargin = 10;
    doc.setDrawColor(200);
    doc.line(lineMargin, yPos, pageWidth - lineMargin, yPos);
  };

  const checkPageBreak = (currentY: number, buffer = 10): number => {
    if (currentY + buffer > pageHeight) {
      doc.addPage();
      return margin;
    }
    return currentY;
  };

  const formatDateToMonthYear = (dateStr: string): string => {
    if (dateStr === "Current" || dateStr === "Present") {
      return dateStr;
    }
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  const nameWidth = doc.getTextWidth(resume.basics.name);
  doc.text(resume.basics.name, (pageWidth - nameWidth) / 2, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...subHeadingColor);
  const labelWidth = doc.getTextWidth(resume.basics.label);
  doc.text(resume.basics.label, (pageWidth - labelWidth) / 2, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  const contactLine = `${resume.basics.phone} | ${resume.basics.email} | ${resume.basics.location.city}, ${resume.basics.location.countryCode}`;
  const contactWidth = doc.getTextWidth(contactLine);
  doc.text(contactLine, (pageWidth - contactWidth) / 2, y);

  if (resume.basics.profiles && resume.basics.profiles.length > 0) {
    y += 5;
    const linksLine = resume.basics.profiles[0].url;
    const linksWidth = doc.getTextWidth(linksLine);
    doc.text(linksLine, (pageWidth - linksWidth) / 2, y);
  }

  drawSectionDivider(y + 2);
  y += 7;

  // Summary
  y = checkPageBreak(y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  doc.text("SUMMARY", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);

  const maxLineWidth = pageWidth - 2 * margin;
  const words = resume.basics.summary.split(/\s+/).filter((word: string) => word.length > 0);
  let currentLine = "";
  let lineStartY = y;

  words.forEach((word: string) => {
    const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth > maxLineWidth) {
      if (currentLine.length > 0) {
        lineStartY = checkPageBreak(lineStartY, 4);
        doc.text(currentLine, margin, lineStartY);
        lineStartY += 4;
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine.length > 0) {
    lineStartY = checkPageBreak(lineStartY, 4);
    doc.text(currentLine, margin, lineStartY);
    lineStartY += 4;
  }

  y = lineStartY - 4;
  drawSectionDivider(y + 2);
  y += 7;

  // Skills
  y = checkPageBreak(y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  doc.text("SKILLS", margin, y);
  y += 6;

  resume.skills.forEach((skill: any) => {
    if (skill.keywords.length > 0) {
      y = checkPageBreak(y, 10);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...subHeadingColor);
      const label = `${skill.name}:`;
      doc.text(label, margin, y);

      const labelWidth = doc.getTextWidth(label + " ");
      const startX = margin + labelWidth;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);

      let currentLine = "";
      let currentX = startX;

      skill.keywords.forEach((keyword: string, index: number) => {
        const keywordText =
          index < skill.keywords.length - 1 ? `${keyword}, ` : keyword;
        const keywordWidth = doc.getTextWidth(keywordText);

        if (currentX + keywordWidth > pageWidth - margin) {
          doc.text(currentLine.trim(), startX, y);
          y += 4;
          y = checkPageBreak(y);
          currentLine = "";
          currentX = startX;
        }

        currentLine += keywordText;
        currentX += keywordWidth;
      });

      if (currentLine) {
        doc.text(currentLine.trim(), startX, y);
        y += 4;
      }
    }
  });

  y -= 4;
  drawSectionDivider(y + 2);
  y += 7;

  // Professional Experience
  y = checkPageBreak(y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...headingColor);
  doc.text("PROFESSIONAL EXPERIENCE", margin, y);
  y += 6;

  resume.work.forEach((job: any) => {
    y = checkPageBreak(y, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...subHeadingColor);
    doc.text(`${job.name} - ${job.position}`, margin, y);

    const start = formatDateToMonthYear(job.startDate);
    const end = job.endDate ? formatDateToMonthYear(job.endDate) : "Current";
    const dateText = `${start} – ${end}`;

    const dateWidth = doc.getTextWidth(dateText);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...textColor);
    doc.text(dateText, pageWidth - margin - dateWidth, y);
    y += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(job.location, margin, y);
    y += 4;

    job.highlights.forEach((point: string) => {
      const lines = doc.splitTextToSize(`• ${point}`, pageWidth - 2 * margin - 4);
      lines.forEach((line: string) => {
        y = checkPageBreak(y);
        doc.text(line, margin, y);
        y += 4;
      });
    });

    y += 3;
  });

  y -= 4;

  // Education
  if (resume.education) {
    drawSectionDivider(y + 2);
    y += 7;

    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("EDUCATION", margin, y);
    y += 6;

    resume.education.forEach((edu: any) => {
      y = checkPageBreak(y);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...subHeadingColor);
      doc.text(`${edu.studyType} in ${edu.area}`, margin, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      const educationDetails = edu.institution;
      doc.text(
        educationDetails,
        pageWidth - margin - doc.getTextWidth(educationDetails),
        y
      );
      y += 4;
    });

    y -= 4;
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    drawSectionDivider(y + 2);
    y += 7;
    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("PROJECTS", margin, y);
    y += 6;

    resume.projects.forEach((project: any) => {
      y = checkPageBreak(y);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...subHeadingColor);
      doc.text(project.name, margin, y);

      const nameWidth = doc.getTextWidth(project.name + " ");
      doc.setFontSize(9);
      doc.setTextColor(...linkColor);
      doc.textWithLink(`(${project.url})`, margin + nameWidth, y, {
        url: project.url,
      });
      doc.setTextColor(...textColor);
      y += 5;

      doc.setFont("helvetica", "normal");
      const wrappedDescription = doc.splitTextToSize(
        project.description,
        pageWidth - 2 * margin
      );
      wrappedDescription.forEach((line: string) => {
        y = checkPageBreak(y);
        doc.text(line, margin, y);
        y += 5;
      });

      (project.highlights || []).forEach((pt: string) => {
        const lines = doc.splitTextToSize(`• ${pt}`, pageWidth - 2 * margin - 4);
        lines.forEach((line: string) => {
          y = checkPageBreak(y);
          doc.text(line, margin + 4, y);
          y += 4.0;
        });
      });

      y += 2;
    });

    y -= 6;
    drawSectionDivider(y + 2);
    y += 7;
  }

  // Certifications
  if (resume.certificates) {
    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("CERTIFICATIONS", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    resume.certificates.forEach((cert: any) => {
      y = checkPageBreak(y);
      const certLine = `• ${cert.name} - `;
      const textWidth = doc.getTextWidth(certLine);
      doc.text(certLine, margin, y);
      doc.setTextColor(...linkColor);
      doc.textWithLink("Link", margin + textWidth, y, { url: cert.url });
      doc.setTextColor(...textColor);
      y += 3.8;
    });

    y -= 4;
  }

  // Programming Profiles
  if (resume.interests && resume.interests.length > 0) {
    drawSectionDivider(y + 2);
    y += 7;

    y = checkPageBreak(y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...headingColor);
    doc.text("PROGRAMMING PROFILES", margin, y);
    y += 6;

    resume.interests.forEach((profile: any) => {
      y = checkPageBreak(y);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      const profileLine = `• ${profile.name} - `;
      const profileWidth = doc.getTextWidth(profileLine);
      doc.text(profileLine, margin, y);
      doc.setTextColor(...linkColor);
      doc.textWithLink(profile.url, margin + profileWidth, y, {
        url: profile.url,
      });
      doc.setTextColor(...textColor);
      y += 3.8;
    });
  }

  // Save PDF
  const sanitize = (s = "") =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const downloadsDir = path.join(os.homedir(), "Downloads");

  if (!existsSync(downloadsDir)) {
    mkdirSync(downloadsDir, { recursive: true });
  }

  const fileName = `${resume.basics.name.replace(/\s+/g, "_")}_Resume${
    companyName ? `_${sanitize(companyName)}` : ""
  }.pdf`;
  const fullPath = path.join(downloadsDir, fileName);

  doc.save(fullPath);

  return {
    filePath: fullPath,
    message: `Resume PDF successfully generated at ${fullPath}`,
  };
};


