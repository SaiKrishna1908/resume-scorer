import { addMessages, getMessages } from "../entity/memory";
import { runAgentLoop } from './agent_loop';

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string;
  tools: any[];
}) => {
  await addMessages([{ role: "user", content: userMessage }]);
  
  const MAX_ITERATIONS = 10;

  await runAgentLoop({
    maxIterations: MAX_ITERATIONS,    
    tools: tools,
    userMessage: userMessage,
  });

  
  return getMessages();
};