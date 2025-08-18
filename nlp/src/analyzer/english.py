from .abstract import Analyzer
from env import nltk_data_path

from pydantic import BaseModel, Field
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from src.openai import openai

import nltk

nltk.data.path.append(nltk_data_path)

from nltk.tokenize import PunktSentenceTokenizer

sentence_tokenizer = PunktSentenceTokenizer()


class EnglishAnalyzer(Analyzer):
    def get_sentence_boundaries(self, text):
        return sentence_tokenizer.span_tokenize(text)

    def extract_color(self, text):
        class ThemeColorClassification(BaseModel):
            theme_color: str = Field(description="RGB code that best represents the sentiment of the text chunk")

        color_parser = PydanticOutputParser(pydantic_object=ThemeColorClassification)

        prompt = PromptTemplate(
            template="""You are an expert in analyzing text sentiment and representing it with colors.
Analyze the following text chunk, considering both the physical description of the location and the sentiment of the events occurring in the narrative. Provide an RGB hexadecimal color code that best represents the overall mood and atmosphere of the scene in this chunk.

{format_instructions}

Text chunk:
{text}""",
            input_variables=["text"],
            partial_variables={"format_instructions": color_parser.get_format_instructions()},
        )

        chain = prompt | openai | color_parser

        try:
            # Classify theme color for the previous chunk
            result = chain.invoke({"text": text})
            theme_color = result.theme_color
        except Exception as e:
            print(f"Error classifying theme color': {e}")
            theme_color = "#FFFFFF" # Default to white on error

        return theme_color



if __name__ == "__main__":
    # Example usage
    analyzer = EnglishAnalyzer()
    text = "This is a sentence. Here is another one! \n And yet another one."
    print("Analyzing text:", text)
    
    for start, end in analyzer.get_sentence_boundaries(text):
        print(f"Sentence boundary: {start} - {end}")
        print(text[start:end])
        print("Start character:", text[start])
        print("End character:", text[end - 1])
