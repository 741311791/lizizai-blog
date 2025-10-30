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

async function getCategories() {
  const response = await apiRequest('/categories');
  return response.data;
}

async function createArticles() {
  console.log('\n📝 Creating more articles...\n');
  
  const categories = await getCategories();
  console.log(`Found ${categories.length} categories\n`);

  const articles = [
    {
      title: 'A Dopamine Detox To Reset Your Life In 30 Days',
      subtitle: 'Because most of modern life has become a blur',
      slug: 'dopamine-detox-reset-life-30-days',
      content: `# The Dopamine Crisis

Modern life has become a blur of notifications, endless scrolling, and instant gratification. We're drowning in dopamine, and it's time for a reset.

## What is Dopamine?

Dopamine is a neurotransmitter that plays a major role in motivation, pleasure, and reward. It's what makes you feel good when you:
- Check your phone
- Get a like on social media
- Eat junk food
- Watch another episode

## The Problem

Our brains weren't designed for the constant dopamine hits of modern life. This overstimulation leads to:

### 1. Decreased Motivation
When everything gives you a quick dopamine hit, nothing feels rewarding anymore.

### 2. Inability to Focus
Your brain craves constant stimulation, making deep work nearly impossible.

### 3. Anxiety and Depression
The constant ups and downs of dopamine spikes and crashes take a toll on mental health.

## The 30-Day Reset

Here's how to reclaim your brain:

### Week 1: Awareness
- Track your dopamine triggers
- Notice when you reach for your phone
- Identify your escape behaviors

### Week 2: Elimination
- Remove social media apps
- Turn off all notifications
- Create phone-free zones

### Week 3: Replacement
- Start a morning routine
- Practice meditation
- Engage in creative work

### Week 4: Integration
- Slowly reintroduce technology
- Set strict boundaries
- Maintain new habits

## The Benefits

After 30 days, you'll experience:
- Improved focus and concentration
- Better sleep quality
- Increased creativity
- More genuine happiness
- Stronger relationships

## Conclusion

A dopamine detox isn't about deprivation—it's about recalibration. It's about rediscovering what truly matters and finding joy in the simple things.

Start today. Your future self will thank you.`,
      excerpt: 'Modern life has become a blur of notifications and instant gratification. Learn how a 30-day dopamine detox can reset your brain and reclaim your focus.',
      category: categories.find(c => c.slug === 'lifestyle')?.id || categories[1]?.id,
      likes: 2051,
      views: 3420,
      readTime: 7,
    },
    {
      title: 'A Prompt To Reset Your Life In 30 Days',
      subtitle: 'Use AI to design your ideal life',
      slug: 'prompt-reset-life-30-days',
      content: `# The Power of AI-Assisted Life Design

What if you could use AI to redesign your entire life in 30 days? Not just plan it, but actually execute on it with precision and clarity.

## The Prompt Framework

Here's the exact prompt I use to reset my life every quarter:

\`\`\`
I want to redesign my life over the next 30 days. Help me create a comprehensive plan that includes:

1. Current State Analysis
   - What's working well
   - What's not working
   - Key pain points
   - Wasted time and energy

2. Vision Definition
   - Ideal daily routine
   - Key goals and outcomes
   - Values and principles
   - Non-negotiables

3. Action Plan
   - Week-by-week breakdown
   - Daily habits to implement
   - Things to eliminate
   - Metrics to track

4. Accountability System
   - Check-in schedule
   - Progress indicators
   - Course correction triggers

My current situation: [describe your life]
My goals: [list your goals]
My constraints: [time, money, etc.]
\`\`\`

## How to Use This Prompt

### Step 1: Be Brutally Honest
Don't sugarcoat your current situation. The AI can only help if you're honest about where you are.

### Step 2: Think Big, Start Small
Your vision should be ambitious, but your first steps should be manageable.

### Step 3: Iterate Daily
Use AI to refine your plan as you go. What works? What doesn't? Adjust accordingly.

## Real Results

I've used this framework to:
- Build a 6-figure business
- Lose 30 pounds
- Write 100+ articles
- Learn a new language

## The AI Advantage

Unlike traditional planning, AI helps you:

1. **Spot Blind Spots**
   AI can see patterns you miss

2. **Generate Options**
   Get 10 different approaches to try

3. **Stay Accountable**
   Daily check-ins with your AI coach

4. **Adapt Quickly**
   Real-time adjustments based on results

## Advanced Techniques

### Prompt Chaining
Break big goals into smaller prompts:
1. Vision prompt
2. Strategy prompt
3. Tactics prompt
4. Review prompt

### Context Building
Feed AI your:
- Journal entries
- Previous plans
- Success patterns
- Failure lessons

### Personalization
The more you use it, the better it gets at understanding you.

## Common Mistakes

### 1. Too Vague
"Help me be better" → "Help me wake up at 5am consistently"

### 2. No Follow-Through
Planning is useless without execution

### 3. Ignoring Feedback
If something isn't working, adjust the plan

## The 30-Day Challenge

Try this for 30 days:
- Day 1: Run the prompt
- Days 2-29: Execute and iterate
- Day 30: Review and plan next month

## Conclusion

AI isn't going to do the work for you, but it can be the best thinking partner you've ever had.

The question isn't whether AI can help you reset your life. It's whether you're willing to put in the work.`,
      excerpt: 'Discover how to use AI as your personal life coach to redesign your entire life in just 30 days. Includes the exact prompt framework.',
      category: categories.find(c => c.slug === 'ai-prompts')?.id || categories[2]?.id,
      likes: 1418,
      views: 2890,
      readTime: 9,
    },
    {
      title: 'HUMAN 3.0 – A Map To Reach The Top 1%',
      subtitle: 'The evolution of human potential',
      slug: 'human-3-0-map-top-1-percent',
      content: `# The Evolution of Human Potential

We're witnessing the birth of Human 3.0—a new era where the top 1% isn't defined by wealth or status, but by consciousness and capability.

## The Three Versions of Humanity

### Human 1.0: Survival Mode
- Reactive to environment
- Driven by basic needs
- Limited by physical constraints
- Focused on security

### Human 2.0: Achievement Mode
- Goal-oriented
- Career-focused
- Seeking external validation
- Measuring success by metrics

### Human 3.0: Creation Mode
- Self-directed
- Purpose-driven
- Internally validated
- Measuring success by impact

## The Shift

The transition from 2.0 to 3.0 isn't automatic. It requires:

### 1. Consciousness Expansion
Understanding that you are not your thoughts, your job, or your achievements.

### 2. Skill Stacking
Building a unique combination of abilities that can't be replicated.

### 3. Value Creation
Focusing on creating value rather than extracting it.

### 4. Network Effects
Building relationships that compound over time.

## The Top 1% Mindset

What separates the top 1% from everyone else?

### They Think in Systems
Not tasks, but systems that generate results.

### They Embrace Uncertainty
They see change as opportunity, not threat.

### They Invest in Themselves
Time, money, and energy into continuous growth.

### They Play Long-Term Games
Building assets that compound over decades.

## The Path Forward

### Phase 1: Awareness (Months 1-3)
- Identify your current operating system
- Recognize limiting beliefs
- Study top performers

### Phase 2: Experimentation (Months 4-9)
- Try different approaches
- Fail fast and learn
- Build new habits

### Phase 3: Integration (Months 10-18)
- Solidify what works
- Eliminate what doesn't
- Develop your unique style

### Phase 4: Mastery (Years 2-5)
- Become known for your work
- Build a body of work
- Mentor others

### Phase 5: Legacy (Years 5+)
- Create lasting impact
- Build institutions
- Pass on knowledge

## The Skills That Matter

In the Human 3.0 era, these skills are non-negotiable:

1. **Clear Thinking**
   The ability to see through noise and find signal

2. **Effective Communication**
   Articulating ideas that move people to action

3. **Rapid Learning**
   Acquiring new skills faster than they become obsolete

4. **Emotional Intelligence**
   Understanding and working with human psychology

5. **Creative Problem-Solving**
   Finding novel solutions to complex challenges

## The Traps to Avoid

### The Busy Trap
Confusing activity with progress

### The Comparison Trap
Measuring yourself against others' highlight reels

### The Comfort Trap
Staying where it's safe instead of where you can grow

### The Perfection Trap
Waiting for perfect conditions that never come

## Your 12-Month Plan

### Quarter 1: Foundation
- Audit your life
- Set clear intentions
- Build core habits

### Quarter 2: Growth
- Learn new skills
- Build in public
- Connect with mentors

### Quarter 3: Momentum
- Launch projects
- Get feedback
- Iterate quickly

### Quarter 4: Scale
- Amplify what works
- Automate what doesn't
- Plan next year

## The Reality Check

Reaching the top 1% isn't about:
- Working 100-hour weeks
- Sacrificing relationships
- Becoming a robot

It's about:
- Working on the right things
- Building sustainable systems
- Becoming more human

## Conclusion

Human 3.0 isn't about being superhuman. It's about being fully human—conscious, capable, and committed to growth.

The question isn't whether you can reach the top 1%. It's whether you're willing to do what it takes.`,
      excerpt: 'Explore the evolution of human potential and discover the roadmap to joining the top 1% in the Human 3.0 era.',
      category: categories.find(c => c.slug === 'human-3-0')?.id || categories[4]?.id,
      likes: 1173,
      views: 2156,
      readTime: 11,
    },
    {
      title: '7 Marketing Strategies That Actually Work in 2025',
      subtitle: 'Stop wasting money on tactics that don\'t convert',
      slug: '7-marketing-strategies-2025',
      content: `# Marketing in 2025: What Actually Works

The marketing landscape has changed dramatically. What worked in 2020 doesn't work today. Here are the 7 strategies that actually drive results.

## 1. Personal Brand First, Company Second

People don't trust companies anymore. They trust people.

### Why It Works
- Authenticity beats polish
- Stories beat features
- Relationships beat transactions

### How to Implement
- Share your journey publicly
- Be consistent across platforms
- Provide value before asking for anything

## 2. Community Over Audience

Stop building an audience. Start building a community.

### The Difference
- **Audience**: One-way communication
- **Community**: Two-way relationships

### How to Build
- Create spaces for interaction
- Facilitate connections between members
- Reward participation and contribution

## 3. Content as Product

Your content should be so good people would pay for it.

### The Framework
1. Solve a specific problem
2. Provide actionable steps
3. Show real results
4. Make it easy to implement

### Content Types That Convert
- Case studies
- Step-by-step guides
- Behind-the-scenes
- Lessons from failures

## 4. Micro-Influencer Partnerships

Forget celebrity endorsements. Partner with micro-influencers in your niche.

### Why Micro-Influencers
- Higher engagement rates
- More authentic connections
- Better ROI
- Niche-specific audiences

### How to Find Them
- Search relevant hashtags
- Look at your competitors' followers
- Use influencer platforms
- Engage authentically first

## 5. SEO for Humans, Not Bots

Google's AI can detect content written for algorithms.

### The New SEO
- Write for people first
- Answer real questions
- Provide comprehensive coverage
- Build genuine backlinks

### Key Tactics
- Long-form content (2000+ words)
- Original research and data
- Expert interviews
- Multimedia integration

## 6. Email Still Wins

Social media platforms come and go. Email is forever.

### Why Email Works
- You own the list
- Direct access to inbox
- Higher conversion rates
- Personalization at scale

### Email Strategies
- Welcome sequences
- Value-first approach
- Segmentation
- Behavioral triggers

## 7. Video-First Everything

If you're not creating video, you're invisible.

### The Stats
- 80% of internet traffic is video
- Video content gets 1200% more shares
- People retain 95% of a message in video

### Video Types
- Short-form (TikTok, Reels, Shorts)
- Long-form (YouTube, podcasts)
- Live streaming
- Stories and behind-the-scenes

## The Implementation Plan

### Month 1: Foundation
- Choose your primary platform
- Define your personal brand
- Create content calendar

### Month 2: Consistency
- Post daily for 30 days
- Engage with your audience
- Test different formats

### Month 3: Optimization
- Analyze what works
- Double down on winners
- Cut what doesn't perform

### Month 4: Scale
- Repurpose top content
- Collaborate with others
- Automate what you can

## Common Mistakes

### 1. Trying Everything
Focus on one platform, one strategy at a time.

### 2. Inconsistency
Better to post 3x/week consistently than daily for a week then disappear.

### 3. Selling Too Soon
Provide value for months before asking for anything.

### 4. Ignoring Data
Track everything. Let data guide decisions.

## Conclusion

Marketing in 2025 isn't about tricks or hacks. It's about:
- Being genuinely helpful
- Building real relationships
- Creating exceptional content
- Staying consistent over time

Pick one strategy. Master it. Then move to the next.`,
      excerpt: 'Discover the 7 marketing strategies that actually drive results in 2025. Stop wasting money on tactics that don\'t convert.',
      category: categories.find(c => c.slug === 'marketing-strategies')?.id || categories[3]?.id,
      likes: 892,
      views: 1678,
      readTime: 10,
    },
    {
      title: 'The Creator Economy: How to Make $10K/Month',
      subtitle: 'A realistic roadmap for content creators',
      slug: 'creator-economy-10k-month',
      content: `# Building a Sustainable Creator Business

Making $10K/month as a creator isn't a pipe dream. It's a realistic goal if you follow the right strategy.

## The Math

To make $10K/month, you need:
- 100 customers at $100/month
- 50 customers at $200/month
- 20 customers at $500/month
- 10 customers at $1,000/month

Pick your model and work backwards.

## The Three Pillars

### 1. Audience Building
You need people who know, like, and trust you.

**Target**: 10,000 engaged followers

**Timeline**: 12-18 months

**Strategy**:
- Post daily valuable content
- Engage authentically
- Be consistent

### 2. Product Creation
You need something valuable to sell.

**Options**:
- Digital products ($27-$997)
- Cohort-based courses ($500-$2,000)
- Consulting/coaching ($1,000-$10,000)
- Membership community ($10-$100/month)

### 3. Sales System
You need a way to convert followers to customers.

**Components**:
- Email list
- Sales page
- Payment processor
- Delivery system

## The 12-Month Roadmap

### Months 1-3: Foundation
- Choose your niche
- Set up platforms
- Create 90 days of content
- Build email list

**Goal**: 1,000 followers, 100 email subscribers

### Months 4-6: Growth
- Post consistently
- Engage daily
- Start building product
- Test pricing

**Goal**: 3,000 followers, 500 email subscribers

### Months 7-9: Launch
- Finish product
- Pre-sell to email list
- Launch publicly
- Get testimonials

**Goal**: 5,000 followers, 1,000 subscribers, first $1K month

### Months 10-12: Scale
- Improve product based on feedback
- Create second offer
- Build sales funnel
- Hire help

**Goal**: 10,000 followers, 2,000 subscribers, $10K month

## The Products That Sell

### Digital Products
- Templates
- Guides
- Courses
- Tools

**Pros**: One-time creation, infinite scale
**Cons**: Lower price point, high competition

### Services
- Consulting
- Coaching
- Done-for-you

**Pros**: High price point, immediate income
**Cons**: Time-intensive, hard to scale

### Communities
- Membership sites
- Private groups
- Mastermind

**Pros**: Recurring revenue, network effects
**Cons**: High maintenance, slower growth

## The Content Strategy

### Content Pillars
1. **Educational**: Teach your expertise
2. **Inspirational**: Share your journey
3. **Entertainment**: Show personality
4. **Promotional**: Sell your offers

**Ratio**: 60% educational, 20% inspirational, 15% entertainment, 5% promotional

### Content Formats
- Long-form articles
- Short-form social posts
- Videos
- Podcasts
- Newsletters

**Start with one, master it, then expand.**

## The Sales Process

### Step 1: Awareness
Get people to know you exist.

**Tactics**:
- SEO
- Social media
- Guest posts
- Collaborations

### Step 2: Interest
Get people interested in your topic.

**Tactics**:
- Free valuable content
- Email sequences
- Webinars
- Lead magnets

### Step 3: Desire
Make people want your solution.

**Tactics**:
- Case studies
- Testimonials
- Behind-the-scenes
- Results

### Step 4: Action
Make it easy to buy.

**Tactics**:
- Clear call-to-action
- Simple checkout
- Payment plans
- Guarantees

## Common Pitfalls

### 1. Trying to Serve Everyone
Niche down. Specific beats generic.

### 2. Creating Before Validating
Sell before you build. Pre-sell to validate demand.

### 3. Underpricing
Charge what you're worth. You can always discount later.

### 4. Ignoring Email
Social media is rented land. Email is yours.

## The Reality Check

### What It Takes
- 1-2 years of consistent work
- 10-20 hours per week minimum
- $500-$2,000 initial investment
- Thick skin for rejection

### What You Get
- Location independence
- Time freedom
- Unlimited income potential
- Impact at scale

## Conclusion

Making $10K/month as a creator is achievable, but it's not easy. It requires:
- Clarity on your niche
- Consistency in content
- Courage to sell
- Commitment to the long game

Start today. Your future self will thank you.`,
      excerpt: 'A realistic 12-month roadmap to building a sustainable creator business that generates $10K/month.',
      category: categories.find(c => c.slug === 'marketing-strategies')?.id || categories[3]?.id,
      likes: 756,
      views: 1432,
      readTime: 12,
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

async function main() {
  console.log('🚀 Creating more sample articles...\n');
  
  try {
    const articles = await createArticles();
    
    console.log(`\n✅ Created ${articles.length} new articles!`);
    console.log('\nNew articles:');
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
