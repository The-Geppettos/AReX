from pydantic import SecretStr
from env import openai_api_key
from langchain_openai import ChatOpenAI

openai = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=SecretStr(openai_api_key))
