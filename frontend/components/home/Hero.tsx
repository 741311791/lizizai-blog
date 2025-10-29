'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              Purpose & Profit – A Guide To Discovering Your Life's Work
            </h1>
            <p className="text-lg text-muted-foreground">
              The full book, for free
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              READ THE LATEST
            </Button>
          </div>

          {/* Right side - Book cover image */}
          <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg" />
            <div className="relative h-full flex items-center justify-center p-8">
              <div className="w-full aspect-[3/4] bg-muted rounded-lg shadow-2xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full border-2 border-foreground/20 flex items-center justify-center">
                    <div className="text-sm">Book Cover</div>
                  </div>
                  <p className="text-sm text-muted-foreground">purpose & profit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
