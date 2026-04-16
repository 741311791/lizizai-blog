'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container py-8 lg:py-12">
        {/* Main Content - Centered */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Top Label */}
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground">
            ZIZAI LI
          </p>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            Create More. Work Smarter. Live Better.
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join the AI-powered creators shaping the future. Learn how to leverage creativity and technology to build meaningful work in the age of artificial intelligence.
          </p>

          {/* CTA Button */}
          <div className="pt-2">
            <Link href="/subscribe">
              <Button
                size="lg"
                className="gap-2 px-8 py-6 text-base rounded-full"
              >
                <LinkIcon className="h-5 w-5" />
                Receive free insights weekly
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Section - Resources */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground/60">
            RESOURCES
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Join The AI Creative Movement
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Become future-proof with these tools and insights
          </p>
        </div>
      </div>
    </section>
  );
}
