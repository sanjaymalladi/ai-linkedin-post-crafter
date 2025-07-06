# Setup Guide for AI LinkedIn Post Crafter

## Environment Variables Setup

1. **Create a `.env` file** in the root directory (it has already been created with placeholders)

2. **Configure your API Keys:**

   ### Gemini API Key
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Replace `your_gemini_api_key_here` in the `.env` file with your actual API key

   ### Clerk Authentication
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Copy the "Publishable Key" from your Clerk dashboard
   - Replace `your_clerk_publishable_key_here` in the `.env` file with your actual Clerk publishable key

3. **Your `.env` file should look like this:**
   ```
   API_KEY=your_actual_gemini_api_key_here
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_clerk_key_here
   ```

## Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Features

- **Authentication Required**: All users must sign in through Clerk to access the app
- **AI Post Generation**: Generate LinkedIn posts using Google Gemini AI
- **Editable Posts**: Edit generated posts manually in a text area
- **AI Improvement Suggestions**: Get AI-powered suggestions to improve your posts
- **Accept/Reject Improvements**: Choose whether to accept or reject suggested improvements
- **Copy to Clipboard**: Easy copy functionality for your final posts
- **News Integration**: Get inspired by recent AI news for your posts
- **Persona Selection**: Choose different writing personas for varied content styles

## Troubleshooting

- If you get authentication errors, verify your Clerk publishable key is correct
- If AI generation fails, check that your Gemini API key is valid and has quota remaining
- Make sure your `.env` file is in the root directory and not committed to version control 
 