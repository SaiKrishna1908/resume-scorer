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

  const loader = showLoader("Thinking... 😅");

  let counter = 0;
  const executedTools = new Set<string>(); // Track executed tools

  while (counter < 5) {
    const history = await getMessages();
    const response = await runLLM({ messages: history, tools });

    await addMessages([response]);

    if (response.content) {
      break;
    }

    if (response.tool_calls) {
      const toolCall = response.tool_calls[0];

      // Skip if the tool has already been executed
      if (executedTools.has(toolCall.function.name)) {
        loader.update(`Skipping already executed tool: ${toolCall.function.name}`);
        break;
      }

      loader.update(`Executing: ${toolCall.function.name}`);
      const toolResponse = await runTool(toolCall, userMessage);
      await saveToolResponse(toolCall.id, JSON.stringify(toolResponse));

      loader.update(`Done: ${toolCall.function.name}`);
      executedTools.add(toolCall.function.name); // Mark tool as executed

      counter++;
    }
  }

  loader.stop();
  return getMessages();
};
