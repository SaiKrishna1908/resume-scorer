import "dotenv/config";
import { runLLM } from "./llm";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JD_PATH = path.resolve(__dirname, "../resume/jd.txt");
const RESUME_PATH = path.resolve(__dirname, "../resume/resume.json");
const OUTPUT_RESUME_PATH = path.resolve(__dirname, "../output/resume.json");


async function main() {
  try {
    const [jobDescriptionRaw, resumeRaw] = await Promise.all([
      readFile(JD_PATH, "utf-8"),
      readFile(RESUME_PATH, "utf-8"),
    ]);

    const resume = JSON.parse(resumeRaw);

    const partialResume = {
      basics: { summary: resume.basics.summary },
      skills: resume.skills,
      work: resume.work
    };

    const systemPrompt = `You are an expert resume optimization agent. Given a job description (as plain text) and a resume (in JSON Resume format), extract relevant ATS keywords and update only the summary, skills, and work sections of the resume. The summary should highlight alignment with the role. The skills section should include relevant tools, technologies, or concepts from the job description. In the work section, revise each job’s summary and highlights to reflect responsibilities and achievements that match the job’s focus, using action-oriented language and measurable impact where possible. Do not modify any other parts of the resume. Output only the updated JSON with the changed fields.`;
    const userMessage = `Job Description:\n${jobDescriptionRaw}\n\nResume (only summary, skills, and work sections):\n${JSON.stringify(partialResume, null, 2)}`;

    const response = await runLLM({ systemPrompt, userMessage });
    
    resume.basics.summary = response.basics.summary
    resume.skills = response.skills
    resume.work = response.work

    await writeFile(OUTPUT_RESUME_PATH, JSON.stringify(resume, null, 2), "utf-8");    
    console.log("Resume updated.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
