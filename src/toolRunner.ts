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
  const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

  switch (toolCall.function.name) {
    case "fetchJobInfo": {
      const { jobDescription } = toolArgs;
      const result = await fetchJobTitleCompanyDomainAndJobDescriptionFromUrl(jobDescription);
      return result;
    }

    case "extractATSKeywords": {
      const { jobDescription } = toolArgs;
      const result = await extractATSKeywordsFromJobDescription(jobDescription);
      return result;
    }

    case "editResumeSummary": {
      console.log("Tool Args are: " + JSON.stringify(toolArgs))
      const { jobTitle, companyDomain, atsKeywords } = toolArgs;
      const result = await resumeSummarySectionEditor(jobTitle, companyDomain, atsKeywords);
      return result;
    }

    case "editResumeSkills": {
      const { companyDomain, atsKeywords } = toolArgs;
      const result = await resumeSkillsSectionEditor(companyDomain, atsKeywords);
      return result;
    }

    case "editResumeExperience": {
      const { jobTitle, companyDomain, atsKeywords } = toolArgs;
      const result = await resumeProfessionalExperienceSectionEditor(jobTitle, companyDomain, atsKeywords);
      return result;
    }

    case "enhanceProject": {
      const { githubUrl, jobTitle, atsKeywords } = toolArgs;
      const result = await projectEnhancerTool(githubUrl, jobTitle, atsKeywords);
      return result;
    }

    default:
      throw new Error(`Unknown tool: ${toolCall.function.name}`);
  }
};
