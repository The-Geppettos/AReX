from .abstract import Analyzer
from env import nltk_data_path
import nltk

nltk.data.path.append(nltk_data_path)

from nltk.tokenize import PunktSentenceTokenizer

sentence_tokenizer = PunktSentenceTokenizer()


class EnglishAnalyzer(Analyzer):
    def get_sentence_boundaries(self, text):
        return sentence_tokenizer.span_tokenize(text)


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
