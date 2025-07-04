import { ContentAnalysis } from "@shared/types";

export class ContentParserService {
  constructor(private contentAnalysis: ContentAnalysis) {}

  public static template = `
  You are a content parser. You are given a chunk of text and you need to parse it into a structured analysis.
  Do not include any text in your response. Only call functions.
  The content is:
  {{content}}
  `;

  /**
   * Set the characters in the content analysis.
   * @param input - The input object containing the character names.
   */
  public setCharacters(input: { characterNames: string[] }): void {
    this.contentAnalysis.characters = input.characterNames;
  }
}
