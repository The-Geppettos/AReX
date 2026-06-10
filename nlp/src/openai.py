from pydantic import SecretStr
from env import openai_api_key
from langchain_openai import ChatOpenAI

openai = {
    "gpt-5.4-nano": ChatOpenAI(model="gpt-5.4-nano", temperature=0, api_key=SecretStr(openai_api_key)),
    "gpt-5.4-mini": ChatOpenAI(model="gpt-5.4-mini", temperature=0, api_key=SecretStr(openai_api_key)),
}
