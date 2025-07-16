# Agentic AI Augmented Reading eXperience (AReX)

An intelligent eBook reading application that uses AI to enhance the reading experience. The application helps users understand and engage with books better through AI-powered assistance.

## Features

- Modern, responsive UI for reading books
- AI-powered assistance panel for explanations and insights
- Progress tracking and checkpoints
- User level-based content adaptation
- Interactive quizzes and summaries

## Project Structure

```
.
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend server
├── ai/                # AI engine for generating explanations and insights
└── shared/            # Shared TypeScript types
```

## Setup

### Prerequisites

- Node.js (lts/jod)
- npm
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### AI Setup

1. Navigate to the ai directory:
   ```bash
   cd ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure your OpenAI API key.
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
