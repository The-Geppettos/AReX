from .abstract import Analyzer
from .korean import KoreanAnalyzer
from .english import EnglishAnalyzer

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
        raise ValueError(
            f"Unsupported language: {language}. Supported languages are: {list(analyzers.keys())}")

    return analyzers[language]()


def analyze(content: str, prev_content: str | None, language: str,
            accum_characters: list[dict]):
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

    current_content_start_offset = len(
        prev_content) if prev_content is not None else 0

    sentence_boundaries = []

    offset = 0
    for paragraph in combined_content.split("\n"):
        sb = analyzer.get_sentence_boundaries(paragraph)

        for s, e in sb:
            start = s + offset
            end = e + offset
            if start >= current_content_start_offset:
                sentence_boundaries.append(
                    [start - current_content_start_offset, end - current_content_start_offset])
            elif end > current_content_start_offset:
                sentence_boundaries.append(
                    [start - current_content_start_offset, end - current_content_start_offset])

        offset += len(paragraph) + 1

    color_code = analyzer.extract_color(content)

    character_list = analyzer.character_analysis(
        content, prev_content, accum_characters)

    return {
        "sentence_boundaries": sentence_boundaries,
        "color_code": color_code,
        "character_list": character_list
    }


if __name__ == "__main__":
    page1 = """
"왕이요!" 어린 독자들은 즉시 말할 것이다.
아니다, 얘들아, 너희들은 틀렸다. 옛날 옛적에 나무 조각이 있었다. 비싼 나무 조각이 아니었다. 전혀 아니었다. 그저 흔한 장작 토막, 겨울에 추운 방을 아늑하고 따뜻하게 만들기 위해 불에 넣는 두껍고 단단한 통나무 중 하나였다.
어떻게 이런 일이 실제로 일어났는지는 모르지만, 어쨌든 어느 화창한 날 이 나무 조각은 한 늙은 목수의 가게에 있게 되었다. 그의 본명은 안토니오 장인이었지만, 모두가 그를 체리 장인이라고 불렀다. 그의 코끝이 너무 둥글고 빨갛고 반짝여서 잘 익은 체리처럼 보였기 때문이었다.
그 나무 조각을 보자마자 체리 장인은 기쁨에 넘쳤다. 행복하게 손을 비비며 그는 혼잣말처럼 중얼거렸다.
"이것은 딱 맞춰서 왔다. 이것으로 테이블 다리를 만들어야겠다."
그는 도끼를 재빨리 잡고 나무껍질을 벗기고 나무를 다듬으려고 했다. 그러나 첫 번째 타격을 가하려던 순간, 그는 팔을 든 채 멈춰 섰다. 작고 가느다란 목소리가 애원하는 듯한 어조로 말하는 것을 들었기 때문이었다. "조심해주세요! 저를 너무 세게 때리지 마세요!"
체리 장인의 얼굴에 얼마나 놀란 표정이 비쳤던가! 그의 우스꽝스러운 얼굴은 더욱 우스꽝스러워졌다.
"""
    page2 = """ 체리 장인이 친구 제페토에게 나무 조각을 주고, 제페토는 그것으로 춤추고, 검술하고, 재주넘기를 할 수 있는 꼭두각시를 만든다.
바로 그 순간, 문에서 큰 노크 소리가 울렸다. "들어와요." 목수는 일어설 힘이 전혀 남아 있지 않은 채 말했다.
그 말에 문이 열리고 단정한 작은 노인이 들어왔다. 그의 이름은 제페토였지만, 동네 아이들에게 그는 폴렌디나(또는 옥수수죽)로 불렸다. 그가 항상 쓰고 다니는 가발이 노란 옥수수 색깔이었기 때문이었다.
제페토는 성질이 매우 나빴다. 그를 폴렌디나라고 부르는 자는 불행할지어다! 그는 짐승처럼 거칠어졌고 아무도 그를 달랠 수 없었다.
"안녕하시오, 안토니오 장인." 제페토가 말했다. "바닥에서 뭘 하고 계시오?"
"개미들에게 알파벳을 가르치고 있소."
"행운을 비오!"
"무엇 때문에 여기까지 오셨소, 친구 제페토?"
"내 다리로. 그리고 안토니오 장인, 내가 당신에게 부탁 하나 하러 왔다는 걸 알아주시면 영광이겠소."
"여기 있소, 기꺼이 도와드리리다." 목수는 무릎을 짚고 몸을 일으키며 대답했다.
"오늘 아침에 좋은 생각이 떠올랐소."
"들어보겠소."
"아름다운 나무 꼭두각시를 만들 생각이었소. 춤추고, 검술하고, 재주넘기를 할 수 있는 아주 멋진 것이어야 하오. 그것으로 세상 곳곳을 다니며, 내 빵 한 조각과 와인 한 잔을 벌 생각이었소. 어떻게 생각하시오?"
"브라보, 폴렌디나!" 아무도 모르는 곳에서 같은 작은 목소리가 외쳤다."""
    language = "ko"
    accumulated_characters = []

    result1 = analyze(page1, None, language, accumulated_characters)
    print(result1)

    accumulated_characters = result1["character_list"]

    result2 = analyze(page2, page1, language, accumulated_characters)
    print(result2)
