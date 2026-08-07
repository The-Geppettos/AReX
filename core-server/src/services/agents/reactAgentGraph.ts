import {
  END,
  START,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import type { StructuredTool } from "@langchain/core/tools";
import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";
import { ChatOpenAI } from "@langchain/openai";

const agentConditionalMap = {
  tools: "tools",
  [END]: END,
} as const;

export function createReactStyleAgentGraph(
  model: ChatOpenAI,
  tools: StructuredTool[],
  checkpointer?: BaseCheckpointSaver,
) {
  const modelWithTools = model.bindTools(tools);

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await modelWithTools.invoke(state.messages);
    return { messages: [response] };
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition, agentConditionalMap)
    .addEdge("tools", "agent");

  return workflow.compile({ checkpointer });
}
