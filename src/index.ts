import "dotenv/config";
import { runLLM } from "./llm";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PROMPT_RESUME_TAILOR } from "./constants";
import { runAgent } from "./agent";
import z from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JD_PATH = path.resolve(__dirname, "../resume/jd.txt");
const RESUME_PATH = path.resolve(__dirname, "../resume/resume.json");

async function main() {
  const tools = [
    {
      name: "fetchJobInfo",
      description: "Fetch job title, domain, and description from a job URL.",
      parameters: z.object({
        reasoning: z.string().describe("why did you pick this tool?"),
        jobTitle: z.string().describe("Extract the job title"),
        companyDomain: z.string().describe("What's the compnay domain ?"),
        jobDescription: z
          .string()
          .describe("What's the job description for this job posting ?"),
      }),
    },
    {
      name: "extractATSKeywords",
      description: "Extract ATS keywords from job description.",
    },
    {
      name: "editResumeSummary",
      description: "Edit resume summary section based on job description.",
    },
    {
      name: "editResumeSkills",
      description: "Edit resume skills section based on ATS keywords.",
    },
    {
      name: "editResumeExperience",
      description:
        "Edit professional experience section based on updated skills.",
    },
    {
      name: "enhanceProject",
      description: "Enhance a project from GitHub for resume.",
    },
  ];

  const fetchJobInfoTool = {
    name: "fetchJobInfo",
    description: "Fetch job title, domain, and description from a job URL.",
    parameters: z.object({
      reasoning: z.string().describe("why did you pick this tool?"),
      jobDescription: z
        .string()
        .describe("job description provided by the user"),
    }),
  };

  const extractATSKeywords = {
    name: "extractATSKeywords",
    description: "Extract ATS Keywords from the job description",
    parameters: z.object({
      reasoning: z.string().describe("why did you pick this tool?"),
      jobDescription: z
        .string()
        .describe("job description to extract skills from"),
    }),
  };

  const editResumeSummaryTool = {
    name: "editResumeSummary",
    description:
      "Edit the resume summary section based on the job info and ATS keywords.",
    parameters: z.object({
      reasoning: z.string().describe("Why did you pick this tool?"),
      jobTitle: z.string().describe("The job title from the job description"),
      companyDomain: z.string().describe("The business domain of the company"),
      atsKeywords: z.array(
        z.object({
          name: z.string(),
          keywords: z.array(z.string()),
        })
      ),
    }),
  };

  const editResumeSkillsTool = {
    name: "editResumeSkills",
    description:
      "Edit the resume skills section based on ATS keywords and domain.",
    parameters: z.object({
      reasoning: z.string().describe("Why did you pick this tool?"),
      atsKeywords: z.array(
        z.object({
          name: z.string(),
          keywords: z.array(z.string()),
        })
      ),
      companyDomain: z
        .string()
        .describe("Business domain of the job (e.g., healthcare, fintech)"),
    }),
  };

  const editResumeExperienceTool = {
    name: "editResumeExperience",
    description:
      "Edit the professional experience section to align with the job role and keywords.",
    parameters: z.object({
      reasoning: z.string().describe("Why did you pick this tool?"),
      atsKeywords: z.array(
        z.object({
          name: z.string(),
          keywords: z.array(z.string()),
        })
      ),
      jobTitle: z
        .string()
        .describe("Job title to tailor experience bullets for"),
      companyDomain: z
        .string()
        .describe("Company domain (e.g., healthcare, fintech)"),
    }),
  };

  const enhanceProjectTool = {
    name: "enhanceProject",
    description:
      "Enhance a GitHub project for alignment with the job and keywords.",
    parameters: z.object({
      reasoning: z.string().describe("Why did you pick this tool?"),
      githubUrl: z.string().describe("GitHub URL of the project to enhance"),
      jobTitle: z
        .string()
        .describe("Job title for tailoring project highlights"),
      atsKeywords: z.array(
        z.object({
          name: z.string(),
          keywords: z.array(z.string()),
        })
      ),
    }),
  };

  try {
    const [jobDescriptionRaw, resumeRaw] = await Promise.all([
      readFile(JD_PATH, "utf-8"),
      readFile(RESUME_PATH, "utf-8"),
    ]);

    const resume = JSON.parse(resumeRaw);
    const prompt = `${PROMPT_RESUME_TAILOR} \n this is my resume: \n ${JSON.stringify(
      resume
    )} \n\n this is the job description: ${jobDescriptionRaw}`;
    await runAgent({
      userMessage: prompt,
      tools: [
        fetchJobInfoTool,
        extractATSKeywords,
        editResumeSummaryTool,
        editResumeSkillsTool,
        editResumeExperienceTool,
        enhanceProjectTool,
      ],
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

await main();
