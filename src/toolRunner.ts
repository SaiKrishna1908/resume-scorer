import type OpenAI from "openai";
import {
  fetchJobTitleCompanyDomainAndJobDescriptionFromUrl,
  extractATSKeywordsFromJobDescription,
  resumeSummarySectionEditor,
  resumeSkillsSectionEditor,
  resumeProfessionalExperienceSectionEditor,
  projectEnhancerTool,
} from "./tools";

export const runTool = async (
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string
) => {
  let toolArgs: any;
  
  try {
    toolArgs = JSON.parse(toolCall.function.arguments || "{}");
  } catch (error) {
    throw new Error(`Failed to parse tool arguments: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    switch (toolCall.function.name) {
      case "fetchJobInfo": {
        const { jobDescription } = toolArgs;
        if (!jobDescription) {
          throw new Error("Missing required parameter: jobDescription");
        }
        const result = await fetchJobTitleCompanyDomainAndJobDescriptionFromUrl(jobDescription);
        return result;
      }

      case "extractATSKeywords": {
        const { jobDescription } = toolArgs;
        if (!jobDescription) {
          throw new Error("Missing required parameter: jobDescription");
        }
        const result = await extractATSKeywordsFromJobDescription(jobDescription);
        return result;
      }

      case "editResumeSummary": {
        console.log("Tool Args are: " + JSON.stringify(toolArgs))
        const { jobTitle, companyDomain, atsKeywords } = toolArgs;
        if (!jobTitle || !companyDomain || !atsKeywords) {
          throw new Error("Missing required parameters: jobTitle, companyDomain, or atsKeywords");
        }
        const result = await resumeSummarySectionEditor(jobTitle, companyDomain, atsKeywords);
        return result;
      }

      case "editResumeSkills": {
        const { companyDomain, atsKeywords, existingSkills } = toolArgs;
        if (!companyDomain || !atsKeywords || !existingSkills) {
          throw new Error("Missing required parameters: companyDomain, atsKeywords, or existingSkills");
        }
        const result = await resumeSkillsSectionEditor(companyDomain, existingSkills ,atsKeywords);
        return result;
      }

      case "editResumeExperience": {
        const { jobTitle, companyDomain, atsKeywords, existingExperiences } = toolArgs;
        if (!jobTitle || !companyDomain || !atsKeywords || !existingExperiences) {
          throw new Error("Missing required parameters: jobTitle, companyDomain, atsKeywords, or existingExperiences");
        }
        const result = await resumeProfessionalExperienceSectionEditor(jobTitle, companyDomain, atsKeywords, existingExperiences);
        return result;
      }

      case "enhanceProject": {
        const { githubUrl, jobTitle, atsKeywords } = toolArgs;
        if (!githubUrl || !jobTitle || !atsKeywords) {
          throw new Error("Missing required parameters: githubUrl, jobTitle, or atsKeywords");
        }
        const result = await projectEnhancerTool(githubUrl, jobTitle, atsKeywords);
        return result;
      }

      default:
        throw new Error(`Unknown tool: ${toolCall.function.name}`);
    }
  } catch (error) {
    console.error(`Error in tool ${toolCall.function.name}:`, error);
    throw error;
  }
};
