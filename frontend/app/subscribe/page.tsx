'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Mail, Sparkles, Zap, BookOpen, Users } from 'lucide-react';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement subscription logic
    console.log('Subscribe:', { email, name });
  };

  const benefits = [
    {
      icon: Sparkles,
      title: 'Weekly Insights',
      description: 'Get exclusive articles on AI, productivity, and personal growth',
    },
    {
      icon: Zap,
      title: 'Early Access',
      description: 'Be the first to read new content and get special announcements',
    },
    {
      icon: BookOpen,
      title: 'Free Resources',
      description: 'Access to templates, guides, and tools to build your business',
    },
    {
      icon: Users,
      title: 'Community Access',
      description: 'Join discussions with 178,000+ like-minded entrepreneurs',
    },
  ];

  const features = [
    'No spam, ever',
    'Unsubscribe anytime',
    'Free forever',
    'Join 178,000+ subscribers',
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column - Benefits */}
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Join 178,000+ Subscribers
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              Stay ahead of the curve
            </h1>
            <p className="text-xl text-muted-foreground">
              Get weekly insights on building a one-person business, mastering AI tools, and designing your ideal lifestyle.
            </p>
          </div>

          <Separator />

          {/* Benefits Grid */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="p-6 rounded-lg border border-border bg-muted/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background"
                  />
                ))}
              </div>
              <div className="text-sm">
                <div className="font-semibold">178,000+ subscribers</div>
                <div className="text-muted-foreground">and growing daily</div>
              </div>
            </div>
            <p className="text-sm italic text-muted-foreground">
              "This newsletter changed how I think about building my business. The insights are pure gold."
            </p>
          </div>
        </div>

        {/* Right Column - Subscription Form */}
        <div className="lg:sticky lg:top-24">
          <div className="p-8 rounded-lg border border-border bg-card shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Subscribe now</h2>
                <p className="text-muted-foreground">
                  Join thousands of entrepreneurs building their future
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Subscribe for Free
                </Button>
              </form>

              <Separator />

              {/* Features List */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Already subscribed link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already subscribed? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground">
                By subscribing, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-primary">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
