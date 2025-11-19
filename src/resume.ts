import { readFile, writeFile } from "fs/promises";
import type { ATSKeywords } from "../types";
import path from "path";
import { fileURLToPath } from "url";

export class Resume {
  private static instance: Resume | null = null;
  private static isInitializing = false;

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
    // Prevent race conditions in async code
    if (Resume.isInitializing) {
      throw new Error("Resume is already being initialized. Please wait.");
    }
    
    if (!Resume.instance) {
      Resume.isInitializing = true;
      Resume.instance = new Resume(summary, atsSkills, professionalExperience);
      Resume.isInitializing = false;
    }
    return Resume.instance;
  }
  
  static reset(): void {
    Resume.instance = null;
    Resume.isInitializing = false;
  }

  setSummary(summary: string): void {
    if (!summary || typeof summary !== 'string') {
      throw new Error("Invalid summary: must be a non-empty string");
    }
    this.summary = summary;
  }

  setAtsSkills(skills: ATSKeywords[]): void {
    if (!Array.isArray(skills)) {
      throw new Error("Invalid skills: must be an array");
    }
    this.atsSkills = skills;
  }

  setProfessionalExperience(professionalExperience: string[][]): void {
    if (!Array.isArray(professionalExperience)) {
      throw new Error("Invalid professional experience: must be a 2D array");
    }
    this.professionalExperience = professionalExperience;
  }

  async updateResume(): Promise<void> {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const OUTPUT_RESUME_PATH = path.resolve(__dirname, "../output/resume.json");
      const RESUME_PATH = path.resolve(__dirname, "../resume/resume.json");
      
      const resumeContent = await readFile(RESUME_PATH, "utf-8");
      const resume = JSON.parse(resumeContent);
      
      // Validate resume structure
      if (!resume.basics) {
        throw new Error("Invalid resume: missing basics section");
      }
      
      // Update resume sections
      resume.basics.summary = this.summary;
      resume.skills = this.atsSkills;
      
      // Update work experience highlights if available
      if (this.professionalExperience.length > 0 && Array.isArray(resume.work)) {
        this.professionalExperience.forEach((highlights, index) => {
          if (resume.work[index]) {
            resume.work[index].highlights = highlights;
          }
        });
      }
      
      await writeFile(OUTPUT_RESUME_PATH, JSON.stringify(resume, null, 2), "utf-8");
      console.log(`✅ Resume updated successfully at: ${OUTPUT_RESUME_PATH}`);
    } catch (error) {
      console.error("Error updating resume:", error);
      throw new Error(`Failed to update resume: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
