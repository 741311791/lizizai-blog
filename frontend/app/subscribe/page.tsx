'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Mail, Sparkles, Zap, BookOpen, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/subscribers/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Subscription failed');
      }
      
      // 显示成功消息
      setSuccess(true);
      setEmail('');
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  if (success) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">You're all set! 🎉</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for subscribing to future/proof!
            </p>
          </div>
          
          <div className="p-6 rounded-lg border border-border bg-muted/50 text-left space-y-3">
            <p className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span>
                We've sent a welcome email to <strong>{email || 'your inbox'}</strong>. 
                Please check your email (and spam folder) to confirm your subscription.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span>
                Your first newsletter will arrive soon with exclusive insights and resources.
              </span>
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => {
                setSuccess(false);
                setEmail('');
                setName('');
              }}
            >
              Subscribe Another Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        ← Back to Home
      </Link>
      
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
            <p className="text-sm text-muted-foreground italic">
              "This newsletter changed how I think about building my business. The insights are pure gold."
            </p>
          </div>
        </div>

        {/* Right Column - Subscribe Form */}
        <div className="lg:sticky lg:top-8">
          <div className="p-8 rounded-lg border border-border bg-card shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Subscribe now</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of entrepreneurs building their future
            </p>

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
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Subscribing...' : 'Subscribe for Free'}
              </Button>

              <div className="space-y-2 pt-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </form>

            <Separator className="my-6" />

            <p className="text-xs text-center text-muted-foreground">
              Already subscribed?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>

            <p className="text-xs text-center text-muted-foreground mt-2">
              By subscribing, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
