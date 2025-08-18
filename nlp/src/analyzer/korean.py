from .abstract import Analyzer
from kss import Kss

from pydantic import BaseModel, Field
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from src.openai import openai

module = Kss("split_sentences")


class KoreanAnalyzer(Analyzer):
    def get_sentence_boundaries(self, text):
        def generator():
            sentences = module(text)
            start = 0
            current_sentence = 0


            while current_sentence < len(sentences) and start < len(text):
                sentence = sentences[current_sentence]

                if sentence == text[start:start + len(sentence)]:
                    yield start, start + len(sentence)
                    start += len(sentence)
                    current_sentence += 1
                else:
                    start += 1

        return generator()
    
    def extract_color(self, text):
        class ThemeColorClassification(BaseModel):
            theme_color: str = Field(description="텍스트 청크의 감정을 가장 잘 나타내는 RGB 코드")

        color_parser = PydanticOutputParser(pydantic_object=ThemeColorClassification)

        prompt = PromptTemplate(
            template="""당신은 텍스트 감정을 분석하고 색상으로 표현하는 전문가입니다.
분석할 텍스트 청크를 고려하여 해당 장면의 전반적인 분위기와 감정을 가장 잘 나타내는 RGB 16진수 색상 코드를 제공하십시오.

{format_instructions}

텍스트 청크:
{text}""",
            input_variables=["text"],
            partial_variables={"format_instructions": color_parser.get_format_instructions()},
        )

        chain = prompt | openai | color_parser

        try:
            # 텍스트 청크의 테마 색상 분류
            result = chain.invoke({"text": text})
            theme_color = result.theme_color
        except Exception as e:
            print(f"테마 색상 분류 중 오류 발생: {e}")
            theme_color = "#FFFFFF"

        return theme_color

if __name__ == "__main__":
    # Example usage
    analyzer = KoreanAnalyzer()
    text = "이것은 문장입니다. 여기에 또 다른 문장이 있습니다! \n 그리고 또 하나의 문장이 있습니다."
    print("Analyzing text:", text)
    
    for start, end in analyzer.get_sentence_boundaries(text):
        print(f"Sentence boundary: {start} - {end}")
        print(text[start:end])
        print("Start character:", text[start])
        print("End character:", text[end - 1])
