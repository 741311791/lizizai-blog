import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Twitter, Linkedin, Youtube, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-6">
        <Avatar className="h-32 w-32 mx-auto">
          <AvatarImage src="https://picsum.photos/seed/author/400/400" alt="DAN KOE" />
          <AvatarFallback className="text-2xl">DK</AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          About future/proof
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A newsletter helping you stay relevant in a rapidly changing world
        </p>
      </div>

      <Separator className="my-12" />

      {/* Mission Statement */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-bold">Our Mission</h2>
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            In a world where artificial intelligence is reshaping every industry, where traditional career paths are becoming obsolete, and where the definition of "making it" is being radically transformed, we need a new approach to building our lives and careers.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            future/proof is dedicated to helping you navigate this transformation. We explore the intersection of technology, creativity, and entrepreneurship to help you build a one-person business that thrives in the age of AI.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our content focuses on three core pillars: learning (how to adapt and acquire new skills), persuasion (how to build an audience and attract opportunities), and execution (how to turn ideas into reality using modern tools and automation).
          </p>
        </div>
      </section>

      <Separator className="my-12" />

      {/* About the Author */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-bold">About DAN KOE</h2>
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            DAN KOE is an entrepreneur, writer, and creator who has built a thriving one-person business helping others do the same. With over 178,000 subscribers, he shares insights on building sustainable online businesses, mastering digital skills, and designing a life of purpose and profit.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            His work focuses on helping individuals leverage modern technology to create location-independent income streams while maintaining creative autonomy and personal freedom.
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap gap-4 pt-6">
          <Button variant="outline" size="lg" className="gap-2">
            <Twitter className="h-5 w-5" />
            Twitter
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Linkedin className="h-5 w-5" />
            LinkedIn
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Youtube className="h-5 w-5" />
            YouTube
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Globe className="h-5 w-5" />
            Website
          </Button>
        </div>
      </section>

      <Separator className="my-12" />

      {/* What You'll Learn */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-bold">What You'll Learn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">AI & Prompts</h3>
            <p className="text-muted-foreground">
              Master the art of working with AI tools to enhance your productivity and creativity. Learn prompt engineering and automation strategies.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">Writing Strategies</h3>
            <p className="text-muted-foreground">
              Develop your writing skills to create compelling content that attracts and engages your audience. From newsletters to long-form articles.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">Marketing Strategies</h3>
            <p className="text-muted-foreground">
              Build and grow your personal brand using proven marketing techniques. Learn how to attract opportunities and monetize your expertise.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">HUMAN 3.0</h3>
            <p className="text-muted-foreground">
              Explore the evolution of human potential in the age of AI. Discover how to thrive by embracing your unique human capabilities.
            </p>
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Subscribe CTA */}
      <section className="text-center space-y-6 py-12 px-6 rounded-lg bg-muted/50">
        <h2 className="text-3xl font-bold">Join 178,000+ Subscribers</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get weekly insights on building a one-person business, mastering AI tools, and designing your ideal lifestyle.
        </p>
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          Subscribe Now
        </Button>
      </section>
    </div>
  );
}
