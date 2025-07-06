# AI LinkedIn Post Crafter

A powerful AI-powered LinkedIn post generator with authentication, editable posts, and improvement suggestions.

## Features

- 🔐 **Secure Authentication**: Login required for all users via Clerk
- 🤖 **AI Post Generation**: Generate engaging LinkedIn posts using Google Gemini AI
- ✏️ **Editable Posts**: Edit generated posts manually in a rich text area
- 🚀 **AI Improvement Suggestions**: Get AI-powered suggestions to enhance your posts
- ✅ **Accept/Reject Improvements**: Choose whether to accept or reject suggested improvements
- 📋 **Copy to Clipboard**: Easy copy functionality for your final posts
- 📰 **News Integration**: Get inspired by recent AI news for your posts
- 🎭 **Persona Selection**: Choose different writing personas (Neutral, Ethan Hunt, Iron Man, Mike Ross, Harvey Specter)

## Prerequisites

- Node.js (v16 or higher)
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- A Clerk account and publishable key from [Clerk Dashboard](https://dashboard.clerk.com/)

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Update the `.env` file with your API keys:
   ```
   API_KEY=your_actual_gemini_api_key_here
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_clerk_key_here
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## Detailed Setup

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Usage

1. **Sign In**: Use the secure Clerk authentication to sign in
2. **Get Inspired**: Optionally select from recent AI news to inspire your post
3. **Enter Content**: Add your content idea or topic
4. **Choose Persona**: Select a writing persona for your post style
5. **Generate**: Click "Generate Post" to create your LinkedIn post
6. **Edit**: Manually edit the generated post in the text area
7. **Improve**: Click "Suggest Improvements" to get AI-powered enhancement suggestions
8. **Accept/Reject**: Choose to accept or reject the suggested improvements
9. **Copy**: Copy your final post to clipboard and share on LinkedIn

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Authentication**: Clerk
- **AI**: Google Gemini API
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via classes)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
