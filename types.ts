import OpenAI from 'openai'

export type AIMessage =
  | OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam
  | { role: 'user'; content: string }
  | { role: 'tool'; content: string; tool_call_id: string }

export interface ToolFn<A = any, T = any> {
  (input: { userMessage: string; toolArgs: A }): Promise<T>
}

export type AboutCompany = {jobTitle: string, companyDomain: string, jobDescription: string, nextStep: string}

export type ATSKeywords = {
  name: string,
  keywords: string[]
}
