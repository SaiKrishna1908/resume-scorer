import type { AboutCompany, ATSKeywords } from "../types";
import { runLLM } from "./llm";
import { addMessages } from "./memory";

export const fetchJobTitleCompanyDomainAndJobDescriptionFromUrl = async (
  jobDescription: string
): Promise<AboutCompany> => {
  const response = await runLLM({
    messages: [
      {
        role: "user",
        content: `Extract jobTitle, companyDomain and jobDescription from this job description: ${jobDescription}, use "open_url" to fetch the content from web. The response should be in valid json format`,
      },
    ],
    tools: [],
  });
  let responseJson = JSON.parse(
    JSON.stringify(response.content)
      .replace("```json", "")
      .replace("```", "")
      .replaceAll("\n", "")
  );

  // responseJson.nextStep = "Extract keywords from job description"
  console.log(responseJson);
  return responseJson;
};

export const extractATSKeywordsFromJobDescription = async (
  jobDescription: string
): Promise<ATSKeywords[]> => {
  const prompt = `
Extract important ATS keywords from the following job description.
Group them into categories. Return in this format:

[
  {
    "name": "Category",
    "keywords": ["keyword1", "keyword2"]
  }
]

Job Description:
${jobDescription}
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  const responseJson: ATSKeywords[] = JSON.parse(
    JSON.stringify(response.content)
      .replace(/```json|```/g, "")
      .trim()
  );

  console.log("🎯 extractATSKeywords →", responseJson);
  return responseJson;
};

export const resumeSummarySectionEditor = async (
  jobTitle: string,
  companyDomain: string,
  atsKeywords: ATSKeywords[]
) => {
  const prompt = `
You are a resume optimization agent.

Rewrite the candidate's resume summary to align with the job title "${jobTitle}" in the "${companyDomain}" domain.
Incorporate relevant keywords from the following list: ${atsKeywords
    .flatMap((k) => k.keywords)
    .join(", ")}.

Return 2-3 concise, impactful sentences.
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  return { "summary" : response.content![0]};
};

export const resumeSkillsSectionEditor = async (
  companyDomain: string,
  atsKeywords: ATSKeywords[]
): Promise<ATSKeywords[]> => {
  const prompt = `
Given the domain "${companyDomain}", refine the following skill categories and keywords to better match ATS expectations.

Skills:
${JSON.stringify(atsKeywords, null, 2)}

Return a JSON array in the same format.
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  return JSON.parse(
    JSON.stringify(response.content)
      .replace(/```json|```/g, "")
      .trim()
  );
};

export const resumeProfessionalExperienceSectionEditor = async (
  jobTitle: string,
  companyDomain: string,
  updatedSkills: ATSKeywords[]
): Promise<string[][]> => {
  const prompt = `
Rewrite the professional experience section to align with the job title "${jobTitle}" in the "${companyDomain}" domain.
Highlight use of these skills: ${updatedSkills
    .flatMap((s) => s.keywords)
    .join(", ")}.

Return grouped bullet points as JSON in this format:

[
  ["point1", "point2", ...], // Experience 1
  ["point1", "point2", ...]  // Experience 2
]
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  return JSON.parse(
    JSON.stringify(response.content)
      .replace(/```json|```/g, "")
      .trim()
  );
};

export const projectEnhancerTool = async (
  githubUrl: string,
  jobTitle: string,
  atsKeywords: ATSKeywords[]
): Promise<string[]> => {
  const prompt = `
Analyze the GitHub project at: ${githubUrl}

Rewrite 2-3 bullet points for the 'Projects' section of a resume. Align with the job title "${jobTitle}" and include keywords like: ${atsKeywords
    .flatMap((s) => s.keywords)
    .join(", ")}.

Format:
[
  "bullet point 1",
  "bullet point 2",
  ...
]
`;

  const response = await runLLM({
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });

  return JSON.parse(
    JSON.stringify(response.content)
      .replace(/```json|```/g, "")
      .trim()
  );
};
