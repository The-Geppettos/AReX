import { type ChatCompletionFunctionTool } from "openai/resources";

export abstract class Tool {
  abstract name: string;
  abstract definition: ChatCompletionFunctionTool["function"];

  abstract call(args: any, ): Promise<string>;
}
