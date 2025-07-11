# Resume Scorer

Resume Scorer is a tool that optimizes resumes for specific job descriptions using AI. It extracts relevant ATS (Applicant Tracking System) keywords and updates the summary, skills, and work sections of a resume to align with the job description. The tool also generates a PDF version of the updated resume.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- OpenAI API Key (stored in `.env`)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/resume-scorer.git
   cd resume-scorer
   ```
2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file and add your OpenAI API Key:
   ```
   OPENAI_API_KEY='YOUR-API-KEY'
   ```

## Usage
Place your job description in resume/jd.txt and your resume in JSON format in resume/resume.json.

Run the optimization script:

```
npm run start
```

## Tools Available for the LLM

```
1. Job Description Parser - Job Title, Company Name, Domain
2. ATS - a list of ATS keywords grouped by sub-heading
3. Resume Section Editor - edits a section of the resume (skills, professional exp, summary, projects)
4. Project Enhancer Tool - Give 2 strong impact projects for this particular JD
```