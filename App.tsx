import React, { useState, useCallback, useEffect } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton, 
  useUser 
} from '@clerk/clerk-react';
import { generateLinkedInPostText, suggestPostImprovements } from './services/geminiService';
import { fetchRSSFeed } from './services/rssService';
import { GeneratedPost, Status, RssItem } from './types';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { 
  Copy, 
  Wand2, 
  RefreshCw, 
  User, 
  LogIn, 
  Zap, 
  Brain, 
  Lightbulb, 
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  ExternalLink,
  Newspaper,
  Clock,
  TrendingUp,
  Send,
  Edit3
} from 'lucide-react';

type Persona = "neutral" | "ethan-hunt" | "iron-man" | "mike-ross" | "harvey-specter";

interface PersonaOption {
  id: Persona;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const personaOptions: PersonaOption[] = [
  { 
    id: "neutral", 
    name: "Professional", 
    description: "Standard professional tone",
    icon: <User className="w-4 h-4" />
  },
  { 
    id: "ethan-hunt", 
    name: "Action-Oriented", 
    description: "Direct, mission-focused approach",
    icon: <Zap className="w-4 h-4" />
  },
  { 
    id: "iron-man", 
    name: "Innovative", 
    description: "Tech-savvy and forward-thinking",
    icon: <Brain className="w-4 h-4" />
  },
  { 
    id: "mike-ross", 
    name: "Analytical", 
    description: "Sharp, detailed, and insightful",
    icon: <Lightbulb className="w-4 h-4" />
  },
  { 
    id: "harvey-specter", 
    name: "Executive", 
    description: "Confident and results-driven",
    icon: <Sparkles className="w-4 h-4" />
  },
];



const App: React.FC = () => {
  const { user } = useUser();
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [editablePost, setEditablePost] = useState<string>('');
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [selectedPersona, setSelectedPersona] = useState<Persona>('neutral');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [customTopic, setCustomTopic] = useState<string>('');
  const [manualSuggestion, setManualSuggestion] = useState<string>('');
  const [showManualSuggestion, setShowManualSuggestion] = useState(false);
  const [newsItems, setNewsItems] = useState<RssItem[]>([]);
  const [selectedNewsItem, setSelectedNewsItem] = useState<RssItem | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // Load news items on component mount
  useEffect(() => {
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        const rssItems = await fetchRSSFeed();
        setNewsItems(rssItems);
      } catch (error) {
        console.error('Failed to load RSS feed:', error);
        // Fallback news will be handled by the RSS service
      } finally {
        setNewsLoading(false);
      }
    };

    loadNews();
  }, []);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  }, []);

  const handleNewsItemSelect = useCallback((item: RssItem) => {
    setSelectedNewsItem(item);
    setCustomTopic(`Based on this recent news: "${item.title}" - ${item.description}`);
  }, []);

  const handleReadFullArticle = useCallback((link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleGeneratePost = useCallback(async () => {
    if (!customTopic.trim()) return;

    setStatus(Status.Loading);
    setGeneratedPost('');
    setEditablePost('');
    setManualSuggestion('');
    setShowManualSuggestion(false);
    
    try {
      const result = await generateLinkedInPostText(customTopic, selectedPersona);
      setGeneratedPost(result);
      setEditablePost(result);
      setStatus(Status.Success);
    } catch (error) {
      console.error('Error generating post:', error);
      setStatus(Status.Error);
    }
  }, [customTopic, selectedPersona]);

  const handleShowManualSuggestion = useCallback(() => {
    setShowManualSuggestion(true);
    setManualSuggestion('');
  }, []);

  const handleApplyManualSuggestion = useCallback(() => {
    if (manualSuggestion.trim()) {
      // Apply the manual suggestion to the post
      setEditablePost(prev => {
        // You could implement more sophisticated logic here
        // For now, we'll append the suggestion as guidance
        return prev + '\n\n[Manual Suggestion Applied: ' + manualSuggestion + ']';
      });
      setManualSuggestion('');
      setShowManualSuggestion(false);
    }
  }, [manualSuggestion]);

  const handleCancelManualSuggestion = useCallback(() => {
    setManualSuggestion('');
    setShowManualSuggestion(false);
  }, []);

  const handleRefreshNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const rssItems = await fetchRSSFeed();
      setNewsItems(rssItems);
      setSelectedNewsItem(null); // Clear selection when refreshing
    } catch (error) {
      console.error('Failed to refresh RSS feed:', error);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                LinkedIn Post Generator
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create engaging LinkedIn posts with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button className="w-full" size="lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Continue
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <h1 className="ml-2 text-xl font-bold text-gray-900">
                      LinkedIn Post Generator
                    </h1>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.firstName || 'User'}
                  </span>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </div>
            </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* News Sources Section */}
              <div className="lg:col-span-1">
                <Card className="h-fit">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-orange-600" />
                        <CardTitle>Latest AI News</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshNews}
                        disabled={newsLoading}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${newsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <CardDescription>
                      Get inspired by recent AI developments for your posts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {newsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Loading latest news...</span>
                      </div>
                    ) : newsItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No news available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshNews}
                          className="mt-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      newsItems.map((item) => (
                      <div
                  key={item.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedNewsItem?.id === item.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleNewsItemSelect(item)}
                      >
                        <div className="space-y-2">
                          <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.pubDate || '')}
            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReadFullArticle(item.link);
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      ))
                    )}
                    
                    {/* Read More News Button */}
                    <div className="pt-4 border-t border-gray-200">

                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Input Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-blue-600" />
                      Create Your LinkedIn Post
                    </CardTitle>
                    <CardDescription>
                      Choose your writing style and topic to generate an engaging LinkedIn post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Writing Style
                        </label>
                        <Select value={selectedPersona} onValueChange={(value: Persona) => setSelectedPersona(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a writing style" />
                          </SelectTrigger>
                          <SelectContent>
                            {personaOptions.map((persona) => (
                              <SelectItem key={persona.id} value={persona.id}>
                                <div className="flex items-center gap-2">
                                  {persona.icon}
                                  <div>
                                    <div className="font-medium">{persona.name}</div>
                                    <div className="text-xs text-gray-500">{persona.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
            </div>
          
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Post Topic
                      </label>
                      {selectedNewsItem && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Inspired by:</span>
                            <span className="truncate">{selectedNewsItem.title}</span>
                          </div>
                        </div>
                      )}
                      <Textarea
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="What would you like to write about? (e.g., 'AI in healthcare', 'Remote work strategies', 'Career development tips') Or select a news item from the sidebar for inspiration."
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
            onClick={handleGeneratePost}
                      disabled={status === Status.Loading || !customTopic.trim()}
                      className="w-full"
                      size="lg"
          >
            {status === Status.Loading ? (
              <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating Post...
              </>
            ) : (
              <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate LinkedIn Post
              </>
            )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Generated Post Section */}
                {generatedPost && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Your Generated Post
                      </CardTitle>
                      <CardDescription>
                        Review and edit your post below, or provide manual suggestions for improvements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Edit Your Post
                        </label>
                        <Textarea
                          value={editablePost}
                          onChange={(e) => setEditablePost(e.target.value)}
                          className="min-h-[200px] resize-none"
                          placeholder="Your generated post will appear here..."
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleShowManualSuggestion}
                          disabled={!editablePost.trim() || showManualSuggestion}
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Add Manual Suggestion
                        </Button>
                        
                        <Button
                          onClick={() => handleCopy(editablePost, 'main')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copiedStates['main'] ? 'Copied!' : 'Copy to Clipboard'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Manual Suggestions Section */}
                {showManualSuggestion && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-900">
                        <Edit3 className="h-5 w-5" />
                        Manual Suggestion
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        Provide your own feedback or suggestions for improving the post
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-orange-900">
                          Your Suggestion
                        </label>
                        <Textarea
                          value={manualSuggestion}
                          onChange={(e) => setManualSuggestion(e.target.value)}
                          placeholder="Describe what changes you'd like to make to the post (e.g., 'Make it more engaging', 'Add a call-to-action', 'Shorten the content', etc.)"
                          className="min-h-[100px] resize-none bg-white border-orange-200"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleApplyManualSuggestion}
                          disabled={!manualSuggestion.trim()}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Apply Suggestion
                        </Button>
                        
                        <Button
                          onClick={handleCancelManualSuggestion}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error State */}
                {status === Status.Error && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-800">
                        <XCircle className="h-5 w-5" />
                        <p className="font-medium">
                          Error generating post. Please check your API key and try again.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
      </main>
        </div>
      </SignedIn>
    </div>
  );
};

export default App;
