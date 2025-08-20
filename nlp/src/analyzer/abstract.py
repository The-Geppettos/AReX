from abc import abstractmethod
from typing import Iterator


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

    @abstractmethod
    def extract_color(self, text: str) -> str:
        """
        Extracts color names from the input text.
        
        Args:
            text (str): The input text to be analyzed.
            
        Returns:
            str: Hexadecimal RGB color code that best represents the sentiment of the text chunk.
        """
        pass
