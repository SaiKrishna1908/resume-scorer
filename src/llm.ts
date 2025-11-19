import type { AIMessage } from "../types";
import { openai } from "./ai";
import { zodFunction  } from "openai/helpers/zod";

export const runLLM = async ({ messages, tools }: { messages: AIMessage[], tools: any[] }) => {
  try {
    const formattedTools = tools.map(zodFunction);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",      
      messages: messages,
      tools: formattedTools.length > 0 ? formattedTools : undefined,
      tool_choice: formattedTools.length > 0 ? 'auto' : undefined,
      ...(formattedTools.length > 0 && { parallel_tool_calls: false }),    
    });

    console.log(`response from llm: ${JSON.stringify(response, null, 2)}`);
    
    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error("No message returned from LLM");
    }
    
    return message;
  } catch (error) {
    console.error("LLM Error:", error);
    throw new Error(`LLM call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
