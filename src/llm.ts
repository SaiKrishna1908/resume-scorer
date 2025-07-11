import { openai } from "./ai";

export const runLLM = async ({ systemPrompt, userMessage }: { systemPrompt: string, userMessage: string }) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",

    temperature: 0.1,

    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  let jsonResponse = response.choices[0].message.content?.replace('```json', '')
  jsonResponse = jsonResponse?.replace('```', '')
  return JSON.parse(jsonResponse!);
};
