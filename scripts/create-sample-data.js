const STRAPI_URL = 'https://lizizai-blog.onrender.com';
const API_TOKEN = '4a832ae375d58281039b58ac5f939dd46ec09c3e764c7ad4bbb3bc365f7aa0e94fe5cd40a229dacfc4bfbf3d54f98bc091675fda56c94b057855529af36e04a2ad7a74046dd09f0a6c662d669f624635345945c16958d453e9e7b02cbf02652fbafb84d93373258eef3e48a0e976ee859410fa24dd70d7d5a67c2d4135cb1127';

async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function createCategories() {
  console.log('\n📁 Creating categories...');
  
  const categories = [
    { name: 'Featured', slug: 'featured', description: 'Featured articles and highlights' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and personal development' },
    { name: 'AI & Prompts', slug: 'ai-prompts', description: 'Artificial Intelligence and prompt engineering' },
    { name: 'Marketing Strategies', slug: 'marketing-strategies', description: 'Marketing tips and strategies' },
    { name: 'HUMAN 3.0', slug: 'human-3-0', description: 'Future of humanity and technology' },
  ];

  const created = [];
  for (const category of categories) {
    try {
      const result = await apiRequest('/categories', 'POST', { data: category });
      console.log(`✓ Created category: ${category.name}`);
      created.push(result.data);
    } catch (error) {
      console.error(`✗ Failed to create category ${category.name}:`, error.message);
    }
  }

  return created;
}

async function createAuthors() {
  console.log('\n👤 Creating authors...');
  
  const authors = [
    {
      name: 'DAN KOE',
      slug: 'dan-koe',
      bio: 'Entrepreneur, writer, and digital creator focused on personal development and online business.',
      email: 'dan@example.com',
      website: 'https://example.com',
      twitter: '@dankoe',
    },
    {
      name: 'Sarah Johnson',
      slug: 'sarah-johnson',
      bio: 'Tech writer and AI enthusiast exploring the intersection of technology and humanity.',
      email: 'sarah@example.com',
    },
  ];

  const created = [];
  for (const author of authors) {
    try {
      const result = await apiRequest('/authors', 'POST', { data: author });
      console.log(`✓ Created author: ${author.name}`);
      created.push(result.data);
    } catch (error) {
      console.error(`✗ Failed to create author ${author.name}:`, error.message);
    }
  }

  return created;
}

async function createTags() {
  console.log('\n🏷️  Creating tags...');
  
  const tags = [
    { name: 'AI', slug: 'ai' },
    { name: 'Productivity', slug: 'productivity' },
    { name: 'Business', slug: 'business' },
    { name: 'Personal Growth', slug: 'personal-growth' },
    { name: 'Technology', slug: 'technology' },
    { name: 'Marketing', slug: 'marketing' },
    { name: 'Entrepreneurship', slug: 'entrepreneurship' },
  ];

  const created = [];
  for (const tag of tags) {
    try {
      const result = await apiRequest('/tags', 'POST', { data: tag });
      console.log(`✓ Created tag: ${tag.name}`);
      created.push(result.data);
    } catch (error) {
      console.error(`✗ Failed to create tag ${tag.name}:`, error.message);
    }
  }

  return created;
}

async function createArticles(categories, authors, tags) {
  console.log('\n📝 Creating articles...');
  
  const articles = [
    {
      title: 'You have about 36 months to make it',
      subtitle: 'why everyone is racing to get rich',
      slug: 'you-have-36-months-to-make-it',
      content: `# The Race Against Time

In today's fast-paced world, there's an undeniable sense of urgency. Everyone seems to be racing against an invisible clock, trying to "make it" before time runs out.

## Why 36 Months?

The concept of 36 months isn't arbitrary. It represents a critical window of opportunity in the modern economy. Here's why:

### 1. Technological Acceleration

Technology is evolving at an unprecedented rate. What's cutting-edge today might be obsolete tomorrow. This creates a narrow window for early adopters to gain an advantage.

### 2. Market Saturation

As more people recognize opportunities, markets become saturated quickly. The first movers often capture the majority of the value.

### 3. Personal Development

36 months is enough time to:
- Master a new skill
- Build a substantial online presence
- Launch and iterate on a business idea
- Create multiple income streams

## The Doers vs. The Dreamers

There's a fundamental difference between those who succeed and those who don't: **action**.

> "The best time to plant a tree was 20 years ago. The second best time is now."

### Characteristics of Doers:

1. **Bias towards action** - They start before they're ready
2. **Embrace failure** - Each setback is a learning opportunity
3. **Consistent execution** - Small daily actions compound over time
4. **Adaptability** - They pivot when necessary

## Your 36-Month Plan

Here's how to make the most of your window:

### Months 1-12: Foundation
- Identify your niche
- Build core skills
- Create initial content/products
- Establish online presence

### Months 13-24: Growth
- Scale what works
- Build audience
- Monetize strategically
- Network with peers

### Months 25-36: Optimization
- Automate processes
- Diversify income
- Build team
- Plan next phase

## The Cost of Waiting

Every day you wait is a day someone else is building. The opportunity cost of inaction compounds just like interest.

## Conclusion

You don't need to have everything figured out. You just need to start. The clock is ticking, but 36 months is more than enough time if you use it wisely.

The question isn't whether you have time. It's whether you'll use it.`,
      excerpt: 'In today\'s fast-paced world, there\'s an undeniable sense of urgency. Everyone seems to be racing against an invisible clock, trying to "make it" before time runs out.',
      category: categories[0]?.id,
      author: authors[0]?.id,
      tags: [tags[1]?.id, tags[2]?.id, tags[3]?.id],
      likes: 142,
      views: 1250,
      readTime: 8,
    },
    {
      title: 'The Future of AI in Content Creation',
      subtitle: 'How artificial intelligence is reshaping the creative landscape',
      slug: 'future-of-ai-content-creation',
      content: `# The AI Revolution in Content Creation

Artificial Intelligence is no longer a futuristic concept—it's here, and it's transforming how we create content.

## The Current State

AI tools like GPT-4, Midjourney, and others have democratized content creation. What once required teams of specialists can now be done by individuals.

### Key Capabilities:

- **Text Generation**: From blog posts to marketing copy
- **Image Creation**: Photorealistic images from text descriptions
- **Video Production**: Automated editing and effects
- **Audio Synthesis**: Voice cloning and music generation

## The Human Element

Despite AI's capabilities, human creativity remains irreplaceable. The best results come from human-AI collaboration.

> "AI is a tool, not a replacement. It amplifies human creativity rather than replacing it."

## Practical Applications

### 1. Content Ideation
Use AI to brainstorm topics and angles you might not have considered.

### 2. First Drafts
Let AI create initial drafts that you refine and personalize.

### 3. Optimization
Use AI to analyze and improve existing content for better engagement.

## The Future

As AI continues to evolve, we'll see:
- More sophisticated personalization
- Real-time content adaptation
- Seamless multi-modal creation
- Enhanced collaboration tools

## Conclusion

The future belongs to those who learn to work with AI, not against it. Start experimenting today.`,
      excerpt: 'Artificial Intelligence is no longer a futuristic concept—it\'s here, and it\'s transforming how we create content.',
      category: categories[2]?.id,
      author: authors[1]?.id,
      tags: [tags[0]?.id, tags[4]?.id],
      likes: 89,
      views: 756,
      readTime: 6,
    },
    {
      title: 'Building a Personal Brand in 2025',
      subtitle: 'Essential strategies for standing out in a crowded digital world',
      slug: 'building-personal-brand-2025',
      content: `# Personal Branding in the Digital Age

Your personal brand is your most valuable asset. Here's how to build one that lasts.

## Why Personal Branding Matters

In a world where everyone is online, differentiation is key. Your personal brand is what makes you memorable and trustworthy.

## The Foundation

### 1. Clarity of Purpose
Know what you stand for and communicate it consistently.

### 2. Authentic Voice
Don't try to be someone you're not. Authenticity resonates.

### 3. Value First
Focus on providing value before asking for anything in return.

## Building Your Platform

### Content Strategy
- Choose 1-2 primary platforms
- Post consistently
- Engage authentically
- Share your journey

### Visual Identity
- Professional photos
- Consistent color scheme
- Clean, recognizable design

## Monetization

Once you've built an audience:
1. Digital products
2. Consulting services
3. Sponsorships
4. Speaking engagements

## Conclusion

Building a personal brand takes time, but it's worth it. Start today, stay consistent, and watch it grow.`,
      excerpt: 'Your personal brand is your most valuable asset. Here\'s how to build one that lasts in 2025 and beyond.',
      category: categories[3]?.id,
      author: authors[0]?.id,
      tags: [tags[2]?.id, tags[5]?.id, tags[6]?.id],
      likes: 67,
      views: 543,
      readTime: 5,
    },
  ];

  const created = [];
  for (const article of articles) {
    try {
      const result = await apiRequest('/articles', 'POST', { data: article });
      console.log(`✓ Created article: ${article.title}`);
      created.push(result.data);
    } catch (error) {
      console.error(`✗ Failed to create article ${article.title}:`, error.message);
    }
  }

  return created;
}

async function publishContent(contentType, ids) {
  console.log(`\n📤 Publishing ${contentType}...`);
  
  for (const id of ids) {
    try {
      await apiRequest(`/${contentType}/${id}`, 'PUT', {
        data: { publishedAt: new Date().toISOString() }
      });
      console.log(`✓ Published ${contentType} ID: ${id}`);
    } catch (error) {
      console.error(`✗ Failed to publish ${contentType} ${id}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting sample data creation...\n');
  console.log('API URL:', STRAPI_URL);
  
  try {
    // Create categories
    const categories = await createCategories();
    if (categories.length > 0) {
      await publishContent('categories', categories.map(c => c.id));
    }
    
    // Create authors
    const authors = await createAuthors();
    if (authors.length > 0) {
      await publishContent('authors', authors.map(a => a.id));
    }
    
    // Create tags
    const tags = await createTags();
    if (tags.length > 0) {
      await publishContent('tags', tags.map(t => t.id));
    }
    
    // Create articles
    const articles = await createArticles(categories, authors, tags);
    if (articles.length > 0) {
      await publishContent('articles', articles.map(a => a.id));
    }
    
    console.log('\n✅ Sample data creation completed!');
    console.log('\nSummary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Authors: ${authors.length}`);
    console.log(`- Tags: ${tags.length}`);
    console.log(`- Articles: ${articles.length}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
