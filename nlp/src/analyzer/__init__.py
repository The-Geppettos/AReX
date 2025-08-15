from .abstract import Analyzer
from .korean import KoreanAnalyzer
from .english import EnglishAnalyzer
from .chunker import chunk_sentences
from .embedding_processor import EmbeddingProcessor

analyzers = {
    "ko": KoreanAnalyzer,
    "en": EnglishAnalyzer
}

def get_analyzer(language: str) -> Analyzer:
    """
    Returns the appropriate analyzer based on the specified language.
    
    Args:
        language (str): The language for which the analyzer is requested.
        
    Returns:
        Analyzer: An instance of the appropriate analyzer for the specified language.
    """

    if language not in analyzers:
        raise ValueError(f"Unsupported language: {language}. Supported languages are: {list(analyzers.keys())}")

    return analyzers[language]()


def analyze(content: str, prev_content: str | None, language: str):
    """
    Analyzes the content and returns a structured analysis result.
    
    Args:
        content (str): The content to be analyzed.
        prev_content (str | None): The previous content for comparison, if any.
        language (str): The language of the content.
        
    Returns:
        dict: A dictionary containing the analysis result.
    """

    analyzer = get_analyzer(language)

    combined_content = prev_content + content if prev_content is not None else content

    current_content_start_offset = len(prev_content) if prev_content is not None else 0

    sentence_boundaries = []

    offset = 0
    for paragraph in combined_content.split("\n"):
        sb = analyzer.get_sentence_boundaries(paragraph)

        for s, e in sb:
            start = s + offset
            end = e + offset
            if start >= current_content_start_offset:
                sentence_boundaries.append([start - current_content_start_offset, end - current_content_start_offset])
            elif end > current_content_start_offset:
                sentence_boundaries.append([start - current_content_start_offset, end - current_content_start_offset])


        offset += len(paragraph) + 1

    return {
        "sentence_boundaries": sentence_boundaries
    }


if __name__ == "__main__":
    content = "Hello, world! This is a test sentence. \n How are you?"
    prev_content = None
    language = "en"

    result = analyze(content, prev_content, language)
    print(result)

    content = "rld! This is a test sentence. \n How are you?"
    prev_content = "Hello, wo"
    language = "en"

    result = analyze(content, prev_content, language)
    print(result)
    
    content_ko = "안녕하세요. 반갑습니다. \n 오늘은 날씨가 좋네요."
    prev_content = None
    language_ko = "ko"
    
    result = analyze(content_ko, prev_content, language_ko)
    print(result)

    content_ko = "세요. 반갑습니다. \n 오늘은 날씨가 좋네요."
    prev_content = "안녕하"
    language_ko = "ko"
    
    result = analyze(content_ko, prev_content, language_ko)
    print(result)
