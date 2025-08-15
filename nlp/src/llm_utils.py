
import openai
import json

SCENE_DETECTION_PROMPT = """
You are a professional story editor. Your task is to read a book and split it into scenes.
A scene is a part of the story that happens in a specific location and time.
A scene change occurs when there is a significant change in location, time, or characters.
I will provide you with the full text of a book.
You should respond with a list of page numbers where a new scene begins.
The page numbers should be 1-based.
The first page of the book is always the beginning of a scene.
Your response should be a JSON object with a single key, "scene_breaks", which is a list of page numbers.
For example:
{
  "scene_breaks": [1, 5, 10, 15]
}
"""

def detect_scenes(full_text: str) -> list[int]:
    """
    Detects scene breaks in the full text of a book using an LLM.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": SCENE_DETECTION_PROMPT},
            {"role": "user", "content": full_text},
        ],
    )
    scene_breaks = json.loads(response.choices[0].message.content)["scene_breaks"]
    return scene_breaks

SCENE_SUMMARIZATION_PROMPT = """
You are a professional story editor. Your task is to read a scene from a book and write a short summary.
The summary should be concise and capture the main events of the scene.
I will provide you with the text of a scene.
You should respond with a JSON object with a single key, "summary", which is a string containing the summary.
For example:
{
  "summary": "The hero enters the dark cave and finds the ancient artifact."
}
"""

def summarize_scene(scene_text: str) -> str:
    """
    Summarizes a scene using an LLM.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": SCENE_SUMMARIZATION_PROMPT},
            {"role": "user", "content": scene_text},
        ],
    )
    summary = json.loads(response.choices[0].message.content)["summary"]
    return summary
