import "dotenv/config";
import { runLLM } from "./llm";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PROMPT_RESUME_TAILOR } from "./constants";

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
    
    const userMessage = `Job Description:\n${jobDescriptionRaw}\n\nResume (only summary, skills, and work sections):\n${JSON.stringify(partialResume, null, 2)}`;

    const response = await runLLM({ systemPrompt: PROMPT_RESUME_TAILOR, userMessage });
    
    resume.basics.label = process.argv[2] !== undefined ? process.argv[2] :  resume.basics.label;
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
