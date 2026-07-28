from abc import abstractmethod
from typing import Iterator

from pydantic import BaseModel, Field
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from src.openai import openai


class Analyzer:
    """
    Abstract base class for analyzers.
    All analyzers should inherit from this class and implement the `analyze` method.
    """

    @abstractmethod
    def get_sentence_boundaries(self, text: str) -> Iterator[tuple[int, int]]:
        """
        Returns the start and end indices of each sentence in the input text.

        Args:
            text (str): The input text to be analyzed.

        Returns:
            list[tuple[int, int]]: A list of tuples, each containing the start and end indices of a sentence.
        """
        pass

    def extract_color(self, text: str) -> str:
        class ThemeColorClassification(BaseModel):
            theme_color: str = Field(
                description="RGB code that best represents the sentiment of the text chunk")

        color_parser = PydanticOutputParser(
            pydantic_object=ThemeColorClassification)

        prompt = PromptTemplate(
            template="""You are an expert in analyzing text sentiment and representing it with colors.
Analyze the following text chunk, considering both the physical description of the location and the sentiment of the events occurring in the narrative. Provide an RGB hexadecimal color code that best represents the overall mood and atmosphere of the scene in this chunk.

{format_instructions}

Text chunk:
{text}""",
            input_variables=["text"],
            partial_variables={
                "format_instructions": color_parser.get_format_instructions()},
        )

        chain = prompt | openai["gpt-5.4-nano"] | color_parser

        try:
            # Classify theme color for the previous chunk
            result = chain.invoke({"text": text})
            return result.theme_color
        except Exception as e:
            raise Exception(f"Error classifying theme color: {e}")

    def character_analysis(self, cur_page: str, prev_page: str | None,
                           accum_characters: list[dict]) -> list[dict]:
        """
        Analyzes the current page for character information and updates the accumulated character list.

        Args:
            cur_page (str): The text of the current page.
            prev_page (str): The text of the previous page.
            accum_characters (list[dict]): The accumulated list of character information from previous pages.
        Returns:
            list[dict]: The updated list of character information after analyzing the current page.
        """
        class CharacterInfo(BaseModel):
            name: str = Field(description="The name of the character")
            description: str = Field(
                description="A brief description of the character such as his/her role in the story, personality, style of speaking, nickname, current status in the story, etc.")

        class CharacterInfoList(BaseModel):
            characters: list[CharacterInfo]

        character_parser = PydanticOutputParser(
            pydantic_object=CharacterInfoList)

        prompt = PromptTemplate(
            template="""You are an expert in analyzing characters in a narrative.
You are not given the entire narrative at once, but you have access to the current page, the previous page if available for context, and an accumulated list of character information up to this point.
Your task is to analyze the current page and identify any characters mentioned. For each character, provide their name and a brief description such as their role in the story, personality traits, style of speaking, any nicknames they may have and their current status in the story. If a character is already in the accumulated list, update their information if there are new details on the current page.
Style of speaking can include any distinctive way the character talks, such as formal, informal, poetic, etc, and can also include any catchphrases or unique expressions they use.
New characters should be added to the accumulated list, and existing characters should be updated with any new information found on the current page. If no new information is found for an existing character, their entry should remain unchanged.
For the character name, provide the most commonly used name for the character in the narrative. If you decide that the name of the existing character in the accumulated list is not the most commonly used name based on the current page, update the name to the most commonly used one.
If any character from the accmulated list is not mentioned in the current page, their information should be retained in the accumulated list without any changes.

{format_instructions}

Current page:
{cur_page}
Previous page:
{prev_page}
Accumulated character information:
{accum_characters}""",
            input_variables=["cur_page", "prev_page", "accum_characters"],
            partial_variables={
                "format_instructions": character_parser.get_format_instructions()},
        )

        chain = prompt | openai["gpt-5.4-mini"] | character_parser

        try:
            # Analyze characters for the current page
            result = chain.invoke({
                "cur_page": cur_page,
                "prev_page": prev_page,
                "accum_characters": accum_characters,
            })
            return result.dict()["characters"]
        except Exception as e:
            raise Exception(f"Error analyzing characters: {e}")
