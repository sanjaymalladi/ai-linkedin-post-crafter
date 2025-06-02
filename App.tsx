
import React, { useState, useCallback, useEffect } from 'react';
import { generateLinkedInPostText } from './services/geminiService';
import { GeneratedPost, Status, RssItem } from './types';
import LoadingSpinner from './components/LoadingSpinner';

type Persona = "neutral" | "ethan-hunt" | "iron-man" | "mike-ross" | "harvey-specter";

interface PersonaOption {
  id: Persona;
  name: string;
  description: string;
}

const personaOptions: PersonaOption[] = [
  { id: "neutral", name: "Neutral (Default)", description: "Standard professional tone." },
  { id: "ethan-hunt", name: "Ethan Hunt", description: "Action-Oriented, Intense, Mission-Focused." },
  { id: "iron-man", name: "Iron Man (Tony Stark)", description: "Witty, Confident, Tech-Savvy, Visionary." },
  { id: "mike-ross", name: "Mike Ross", description: "Smart, Empathetic, Detailed, Insightful." },
  { id: "harvey-specter", name: "Harvey Specter", description: "Confident, Direct, Assertive, Results-Driven." },
];

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedPost | null>(null);
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>("neutral");

  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [rssStatus, setRssStatus] = useState<Status>(Status.Idle);
  const [rssError, setRssError] = useState<string | null>(null);

  const RSS_FEED_URL = 'https://rss-feed-aggrigator.onrender.com/rss';

  useEffect(() => {
    if (!process.env.API_KEY) {
      setIsApiKeyMissing(true);
      setError("Configuration Error: Gemini API Key is not available. Please ensure the API_KEY environment variable is set and accessible to the application.");
      setStatus(Status.Error); 
      setRssStatus(Status.Error); 
      setRssError("API Key not configured, cannot fetch news or generate posts.");
    } else {
      fetchRssFeed();
    }
  }, []);

  const fetchRssFeed = useCallback(async () => {
    setRssStatus(Status.Loading);
    setRssError(null);
    try {
      const response = await fetch(RSS_FEED_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed. Server responded with ${response.status}: ${response.statusText}`);
      }
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      
      const errorNode = xmlDoc.querySelector("parsererror");
      if (errorNode) {
        console.error("Error parsing XML:", errorNode.textContent);
        throw new Error("Failed to parse RSS feed XML. The feed might be malformed.");
      }

      const items = Array.from(xmlDoc.querySelectorAll("item")).map(item => {
        const title = item.querySelector("title")?.textContent || 'No title';
        const link = item.querySelector("link")?.textContent || '#';
        const descriptionContent = item.querySelector("description")?.textContent || 'No description';
        const pubDate = item.querySelector("pubDate")?.textContent;
        
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = descriptionContent;
        const plainDescription = tempDiv.textContent || tempDiv.innerText || "";

        return { 
          id: link + title + (pubDate || Date.now()), 
          title, 
          link, 
          description: plainDescription.substring(0, 200) + (plainDescription.length > 200 ? '...' : ''), 
          pubDate 
        };
      });
      
      setRssItems(items.slice(0, 20)); 
      setRssStatus(Status.Success);
    } catch (err) {
      console.error("Error fetching or parsing RSS feed:", err);
      let displayMessage = "An unknown error occurred while fetching news.";

      if (err instanceof Error) {
        if ((err.name === 'TypeError' && (err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("networkerror"))) || 
            err.message.toLowerCase().includes("networkerror when attempting to fetch resource")) {
          displayMessage = "Could not connect to the news server. This might be due to network connectivity issues or access restrictions (CORS) on the server. Please check your internet connection. If the issue persists, the news server may be temporarily unavailable or not configured to allow access from this application.";
        } else {
          displayMessage = `Failed to load news: ${err.message}`;
        }
      }
      
      setRssError(displayMessage);
      setRssStatus(Status.Error);
    }
  }, []);

  const handleSelectNewsItem = (item: RssItem) => {
    setUserInput(`Based on the news titled "${item.title}" (Source: ${item.link}):\n\n${item.description}\n\nPlease craft an engaging LinkedIn post. Focus on key insights or implications related to AI.`);
    const contentIdeaSection = document.getElementById('content-idea-section');
    if (contentIdeaSection) {
      contentIdeaSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
    }
  };

  const handleGeneratePost = useCallback(async () => {
    if (isApiKeyMissing) {
        setError("Cannot generate post: API Key is missing. Please configure it.");
        setStatus(Status.Error);
        return;
    }

    setStatus(Status.Loading);
    setError(null);
    setGeneratedContent(null);
    setCopySuccess('');

    try {
      const postText = await generateLinkedInPostText(userInput, selectedPersona);
      setGeneratedContent({ text: postText }); 
      setStatus(Status.Success);
    } catch (err) {
      console.error("Generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during post generation.";
      setError(errorMessage);
      setStatus(Status.Error);
    }
  }, [userInput, isApiKeyMissing, selectedPersona]); 

  const handleCopyText = useCallback(() => {
    if (generatedContent?.text) {
      navigator.clipboard.writeText(generatedContent.text)
        .then(() => {
          setCopySuccess('Post text copied!');
          setTimeout(() => setCopySuccess(''), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          setCopySuccess('Failed to copy.');
           setTimeout(() => setCopySuccess(''), 2000);
        });
    }
  }, [generatedContent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <header className="w-full max-w-3xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">
          AI LinkedIn Post Crafter
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Generate engaging posts with AI-powered content, optionally inspired by recent AI news and tailored to a chosen persona.
        </p>
      </header>

      { isApiKeyMissing && status === Status.Error && (
         <div className="w-full max-w-xl mb-6 p-4 bg-red-800/50 border border-red-700 rounded-lg text-center" role="alert">
            <p className="font-semibold text-red-300">Configuration Error:</p>
            <p className="text-red-400">{error}</p>
        </div>
      )}

      <main className="w-full max-w-3xl space-y-8">
        <section aria-labelledby="news-inspiration-heading" className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700">
          <h2 id="news-inspiration-heading" className="text-2xl font-semibold text-sky-300 mb-1">1. Get Inspired (Optional)</h2>
          <p className="text-slate-400 mb-4 text-sm">Select a recent AI news item to use as a base for your post.</p>
          {rssStatus === Status.Loading && (
            <div className="flex flex-col items-center justify-center h-40">
              <LoadingSpinner />
              <p className="mt-2 text-slate-400" aria-live="polite">Fetching latest AI news...</p>
            </div>
          )}
          {rssStatus === Status.Error && rssError && (
            <div className="p-3 bg-amber-800/40 border border-amber-700 rounded-md text-amber-300" role="alert">
              <p className="font-semibold">Could not load news:</p>
              <p className="text-sm">{rssError}</p>
            </div>
          )}
          {rssStatus === Status.Success && rssItems.length === 0 && (
             <p className="text-slate-500">No news items found in the feed, or the feed is empty.</p>
          )}
          {rssStatus === Status.Success && rssItems.length > 0 && (
            <div className="max-h-72 overflow-y-auto space-y-3 pr-2 rounded-md bg-slate-900/50 p-3 border border-slate-700/50" role="list">
              {rssItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectNewsItem(item)}
                  className="w-full text-left p-3 bg-slate-700/70 hover:bg-sky-700/50 rounded-md transition-colors duration-150 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label={`Use news: ${item.title}`}
                  role="listitem"
                >
                  <h3 className="font-semibold text-sky-400 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                  {item.pubDate && <p className="text-xs text-slate-500 mt-1">{new Date(item.pubDate).toLocaleDateString()}</p>}
                </button>
              ))}
            </div>
          )}
        </section>
        
        <section id="content-idea-section" aria-labelledby="content-idea-heading" className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700">
          <h2 id="content-idea-heading" className="text-2xl font-semibold text-sky-300 mb-4">2. Your Content Idea</h2>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Based on selected news, or paste links, notes, or a topic. Leave blank for an AI-suggested daily topic..."
            className="w-full h-40 p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-slate-200 resize-y"
            disabled={status === Status.Loading || isApiKeyMissing}
            aria-label="Content idea for LinkedIn post"
            aria-describedby="content-idea-description"
          />
          <p id="content-idea-description" className="sr-only">Enter your content idea here, or it can be pre-filled by selecting a news item. If left blank, the AI will suggest a daily topic.</p>
        </section>

        <section aria-labelledby="persona-selection-heading" className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700">
          <h2 id="persona-selection-heading" className="text-2xl font-semibold text-sky-300 mb-4">3. Choose Your Persona (Optional)</h2>
            <div className="mb-4">
                <label htmlFor="persona-select" className="block text-sm font-medium text-slate-300 mb-1">
                    Select Persona:
                </label>
                <select
                    id="persona-select"
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value as Persona)}
                    disabled={status === Status.Loading || isApiKeyMissing}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-200"
                    aria-describedby="persona-select-description"
                >
                    {personaOptions.map(persona => (
                        <option key={persona.id} value={persona.id}>{persona.name} - <span className="text-xs italic text-slate-400">{persona.description}</span></option>
                    ))}
                </select>
                <p id="persona-select-description" className="mt-1 text-xs text-slate-400">
                    {personaOptions.find(p => p.id === selectedPersona)?.description}
                </p>
            </div>
          
          <button
            onClick={handleGeneratePost}
            disabled={status === Status.Loading || isApiKeyMissing}
            className={`w-full flex items-center justify-center px-6 py-3 text-lg font-semibold rounded-md transition-colors duration-150
                        ${isApiKeyMissing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 
                         status === Status.Loading 
                            ? 'bg-sky-700 text-sky-300 cursor-wait' 
                            : 'bg-sky-600 hover:bg-sky-500 text-white focus:ring-4 focus:ring-sky-400/50'}`}
            aria-live="polite"
            aria-describedby={isApiKeyMissing ? "apikey-missing-message" : status === Status.Loading ? "loading-message" : "generate-post-action-description"}
          >
            {status === Status.Loading ? (
              <>
                <LoadingSpinner size="w-6 h-6" color="text-sky-300" />
                <span className="ml-2">Generating...</span>
                <span id="loading-message" className="sr-only">Generating post, please wait.</span>
              </>
            ) : (
              <>
              '✨ Generate Post'
              <span id="generate-post-action-description" className="sr-only">Click to generate LinkedIn post based on your input and selected persona.</span>
              </>
            )}
          </button>
           {isApiKeyMissing && <p id="apikey-missing-message" className="sr-only">Button is disabled because API Key is missing.</p>}
        </section>

        {status === Status.Error && error && !isApiKeyMissing && (
          <section className="bg-red-800/50 p-4 rounded-lg border border-red-700 text-red-300" role="alert">
            <p className="font-semibold">Oops! Something went wrong:</p>
            <p>{error}</p>
          </section>
        )}

        {status === Status.Success && generatedContent && (
          <section className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700 space-y-6" aria-labelledby="generated-post-heading">
            <div>
              <h2 id="generated-post-heading" className="text-2xl font-semibold text-sky-300 mb-3">4. Your AI-Generated LinkedIn Post</h2>
              <div className="bg-slate-700 p-4 rounded-md border border-slate-600">
                <pre className="whitespace-pre-wrap text-slate-200 text-sm sm:text-base leading-relaxed">{generatedContent.text}</pre>
              </div>
              <button
                onClick={handleCopyText}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors duration-150 focus:ring-2 focus:ring-emerald-400"
                aria-live="polite"
              >
                {copySuccess ? copySuccess : 'Copy Post Text'}
              </button>
            </div>
          </section>
        )}
      </main>
      
      <footer className="w-full max-w-3xl mt-12 pt-6 border-t border-slate-700 text-center">
        <p className="text-sm text-slate-500">
          Powered by Google Gemini API. News feed from custom RSS.
          {isApiKeyMissing ? " API Key not configured." : ""}
        </p>
      </footer>
    </div>
  );
};

export default App;
