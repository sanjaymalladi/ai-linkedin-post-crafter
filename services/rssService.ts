import { RssItem } from '../types';

const RSS_ENDPOINT = 'https://rss-feed-aggrigator.onrender.com/rss';

interface RSSFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export const fetchRSSFeed = async (): Promise<RssItem[]> => {
  try {
    const response = await fetch(RSS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error');
    }

    const items = xmlDoc.querySelectorAll('item');
    const rssItems: RssItem[] = [];

    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const link = item.querySelector('link')?.textContent?.trim() || '';
      const description = item.querySelector('description')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
      const guid = item.querySelector('guid')?.textContent?.trim() || '';

      // Only include items that have at least title and link
      if (title && link) {
        rssItems.push({
          id: guid || `item-${index}`,
          title: cleanHtmlEntities(title),
          description: cleanHtmlEntities(description),
          link,
          pubDate,
        });
      }
    });

    // Filter for AI-related content and limit to 10 items
    const aiRelatedItems = rssItems.filter(item => 
      isAIRelated(item.title) || isAIRelated(item.description)
    ).slice(0, 10);

    // If we don't have enough AI-related items, fill with general tech news
    if (aiRelatedItems.length < 5) {
      const generalTechItems = rssItems.filter(item => 
        !aiRelatedItems.some(aiItem => aiItem.id === item.id)
      ).slice(0, 10 - aiRelatedItems.length);
      
      return [...aiRelatedItems, ...generalTechItems];
    }

    return aiRelatedItems;

  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    // Return fallback mock data if RSS fetch fails
    return getFallbackNews();
  }
};

const isAIRelated = (text: string): boolean => {
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural network', 'chatgpt', 'gpt', 'openai', 'gemini', 'claude', 'llm',
    'large language model', 'generative ai', 'automation', 'robotics', 'algorithm',
    'data science', 'computer vision', 'natural language processing', 'nlp'
  ];
  
  const lowerText = text.toLowerCase();
  return aiKeywords.some(keyword => lowerText.includes(keyword));
};

const cleanHtmlEntities = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\[&amp;#8230;\]/g, '...')
    .replace(/&amp;#160;/g, ' ')
    .replace(/&amp;#8221;/g, '"')
    .replace(/&amp;#8220;/g, '"')
    .trim();
};

const getFallbackNews = (): RssItem[] => {
  return [
    {
      id: "fallback-1",
      title: "AI Technology Continues to Transform Industries",
      description: "Latest developments in artificial intelligence are reshaping how businesses operate across various sectors, from healthcare to finance.",
      link: "https://example.com/ai-transformation",
      pubDate: new Date().toISOString()
    },
    {
      id: "fallback-2",
      title: "Machine Learning Breakthroughs in 2025",
      description: "Researchers announce significant advances in machine learning algorithms that could revolutionize data processing and analysis.",
      link: "https://example.com/ml-breakthroughs",
      pubDate: new Date().toISOString()
    },
    {
      id: "fallback-3",
      title: "The Future of Generative AI in Content Creation",
      description: "Exploring how generative AI tools are changing the landscape of content creation and creative industries.",
      link: "https://example.com/generative-ai-future",
      pubDate: new Date().toISOString()
    },
    {
      id: "fallback-4",
      title: "AI Ethics and Responsible Development",
      description: "Industry leaders discuss the importance of ethical AI development and responsible deployment of artificial intelligence systems.",
      link: "https://example.com/ai-ethics",
      pubDate: new Date().toISOString()
    },
    {
      id: "fallback-5",
      title: "Automation and the Future of Work",
      description: "How AI-powered automation is reshaping job markets and creating new opportunities for workers in the digital age.",
      link: "https://example.com/automation-future-work",
      pubDate: new Date().toISOString()
    }
  ];
}; 