from .abstract import Analyzer
from kss import Kss

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
