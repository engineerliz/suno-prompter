# Suno Prompter - Gemini Chat Interface

A ChatGPT-like chat interface built with Next.js and connected to Google's Gemini 2.5 Flash LLM.

## Features

- 🎨 ChatGPT-inspired UI/UX design
- 💬 Real-time chat interface with message history
- 🤖 Powered by Google Gemini 2.5 Flash
- 🌙 Dark mode support
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

Optionally, you can also set a custom model:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash-latest
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

Simply type your message in the input field and press Enter (or Shift+Enter for a new line). The chat interface will send your message to Gemini and display the response.

## Project Structure

- `app/page.tsx` - Main page component
- `app/components/ChatContainer.tsx` - Main chat container component
- `app/components/ChatMessage.tsx` - Individual message component
- `app/components/ChatInput.tsx` - Input component
- `app/api/chat/route.ts` - API route for Gemini integration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
