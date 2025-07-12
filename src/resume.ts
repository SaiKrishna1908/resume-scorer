import { readFile, writeFile } from "fs/promises";
import type { ATSKeywords } from "../types";
import path from "path";

export class Resume {
  private static instance: Resume | null = null;

  summary: string;
  atsSkills: ATSKeywords[];
  professionalExperience: string[][];

  private constructor(
    summary: string,
    atsSkills: ATSKeywords[],
    professionalExperience: string[][]
  ) {
    this.summary = summary;
    this.atsSkills = atsSkills;
    this.professionalExperience = professionalExperience;
  }

  static getInstance(
    summary: string = "",
    atsSkills: ATSKeywords[] = [],
    professionalExperience: string[][] = []
  ): Resume {
    if (!Resume.instance) {
      Resume.instance = new Resume(summary, atsSkills, professionalExperience);
    }
    return Resume.instance;
  }

  setSummary(summary: string): void {
    this.summary = summary;
  }

  setAtsSkills(skills: ATSKeywords[]): void {
    this.atsSkills = skills;
  }

  setProfessionalExperience(professionalExperience: string[][]): void {
    this.professionalExperience = professionalExperience;
  }

  async updateResume(): Promise<void> {
    const OUTPUT_RESUME_PATH = path.resolve(__dirname, "../output/resume.json");
    const RESUME_PATH = path.resolve(__dirname, "../resume/resume.json");
    const [resume] = JSON.parse(await readFile(RESUME_PATH, "utf-8"));
    resume.basics.summary = this.summary;
    resume.skills = this.atsSkills;
    await writeFile(OUTPUT_RESUME_PATH, JSON.stringify(resume, null, 2), "utf-8");
  }
}
