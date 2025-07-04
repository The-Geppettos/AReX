import { Agentica } from "@agentica/core";
import { ContentAnalysis } from "@shared/types";
import express from "express";
import { OpenAI } from "openai";
import typia from "typia";
import dotenv from "dotenv";
import { ContentParserService } from "./services/ContentParserService";

dotenv.config();

const port = process.env.PORT || 3002;

const app = express();
app.use(express.json());

app.post("/api/parse-content", async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const analysis: ContentAnalysis = {
    characters: [],
  };

  const agent = new Agentica({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
      model: "gpt-4o-mini",
    },
    controllers: [
      {
        protocol: "class",
        name: "content-parser",
        application: typia.llm.application<ContentParserService, "chatgpt">(),
        execute: new ContentParserService(analysis),
      },
    ],
  });

  const response = await agent.conversate(ContentParserService.template.replace("{{content}}", content));
  console.log(response);

  res.json(analysis);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
