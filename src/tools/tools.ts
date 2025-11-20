/**
 * Central tools registry following the Strategy Pattern
 * Each tool is implemented in its own file for better maintainability and separation of concerns
 */

// Re-export all tools from their individual modules
export { fetchJobTitleCompanyDomainAndJobDescriptionFromUrl } from "./fetchJobInfoTool";
export { extractATSKeywordsFromJobDescription } from "./extractATSKeywordsTool";
export { resumeSummarySectionEditor } from "./editResumeSummaryTool";
export { resumeSkillsSectionEditor } from "./editResumeSkillsTool";
export { resumeProfessionalExperienceSectionEditor } from "./editResumeExperienceTool";
export { projectEnhancerTool } from "./enhanceProjectTool";
export { generateResumePDF } from "./generatePDFTool";
