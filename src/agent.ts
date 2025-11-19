import type { AIMessage } from "../types";
import { addMessages, getMessages, saveToolResponse } from "./memory";
import { runLLM } from "./llm";
import { logMessage, showLoader } from "./ui";
import { runTool } from "./toolRunner";

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string;
  tools: any[];
}) => {
  await addMessages([{ role: "user", content: userMessage }]);

  const loader = showLoader("Thinking... 🤔");

  let iterations = 0;
  const MAX_ITERATIONS = 10;
  const executedTools = new Set<string>(); 

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    try {
      const history = await getMessages();
      const response = await runLLM({ messages: history, tools });

      await addMessages([response]);

      // LLM provided final content - success!
      if (response.content) {
        loader.succeed("Done!");
        break;
      }

      // No tool calls and no content - unexpected state
      if (!response.tool_calls || response.tool_calls.length === 0) {
        loader.fail("LLM returned no content and no tool calls");
        break;
      }

      if (response.tool_calls) {
        const toolCall = response.tool_calls[0];

        // Skip if the tool has already been executed
        if (executedTools.has(toolCall.function.name)) {
          loader.update(`Tool ${toolCall.function.name} already executed. Stopping.`);
          
          // Add a message to history explaining the tool was skipped
          await addMessages([{
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Error: Tool ${toolCall.function.name} has already been executed. Each tool can only be called once.`
          }]);
          
          break; // Stop the loop instead of continuing
        }

        loader.update(`Executing: ${toolCall.function.name}`);
        
        try {
          const toolResponse = await runTool(toolCall, userMessage);
          await saveToolResponse(toolCall.id, JSON.stringify(toolResponse));
          loader.update(`Done: ${toolCall.function.name}`);
          executedTools.add(toolCall.function.name);
        } catch (error) {
          loader.fail(`Tool ${toolCall.function.name} failed: ${error instanceof Error ? error.message : String(error)}`);
          
          // Add error to conversation history
          await addMessages([{
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
          }]);
          
          break; // Stop on error
        }
      }
    } catch (error) {
      loader.fail(`Agent error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Agent error:", error);
      break;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    loader.fail("Maximum iterations reached without completion");
  }

  loader.stop();
  return getMessages();
};
