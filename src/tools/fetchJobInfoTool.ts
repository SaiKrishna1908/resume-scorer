import type { AboutCompany } from "../../types";
import { runLLM } from "../llm/llm";
import { parseJSONFromLLM } from "../utils/utils";

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
