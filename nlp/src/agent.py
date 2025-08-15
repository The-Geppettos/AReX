from langchain_openai import ChatOpenAI
from langchain.agents import tool, AgentExecutor, create_react_agent
from langchain import hub

import os

llm = ChatOpenAI(api_key=os.environ.get("OPENAI_API_KEY"), model="gpt-3.5-turbo", temperature=0)

@tool
def scene_analyzer(scene_text: str, task: str) -> str:
    """Analyzes a scene to get a summary or a color.
    Args:
        scene_text (str): The text of the scene to analyze.
        task (str): The task to perform. Must be one of 'summarize' or 'get_color'.
    """
    if task == "summarize":
        response = llm.invoke(f"Summarize the following scene:\n\n{scene_text}")
    elif task == "get_color":
        response = llm.invoke(f"What color best represents the following scene's physical environment and mood? Respond with a single color name (e.g., 'blue', 'red', 'green').\n\n{scene_text}")
    else:
        return "Invalid task. Must be one of 'summarize' or 'get_color'."
    return response.content

tools = [scene_analyzer]

prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)