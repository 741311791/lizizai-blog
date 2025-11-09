'use client';

import Image from 'next/image';
import { Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';

export default function AboutMe() {
  return (
    <section className="relative py-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase">About Me</p>
          <h1 className="text-5xl md:text-6xl font-bold">Who Is Zizai Li?</h1>
          <p className="text-xl text-muted-foreground">
            Just a human exploring the intersection of technology and creativity.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start mb-12">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-8">
            <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-border">
              <Image
                src="/avator/avatar_smile.png"
                alt="Zizai Li"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Social Icons */}
            <div className="flex gap-6 justify-center">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={28} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={28} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={28} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={28} />
              </a>
            </div>
          </div>

          {/* Bio Text */}
          <div className="space-y-6 text-lg leading-relaxed">
            <h2 className="text-4xl font-bold mb-6">Hey, I'm Zizai.</h2>

            <p className="text-foreground/80">
              I'm a creator, developer, and writer obsessed with the mind, technology, and the art of building meaningful digital experiences.
            </p>

            <p className="text-foreground/80">
              Previously, I worked as a software engineer and product designer, helping teams build products that people love. Now I write about creativity, productivity, and the future of work in the AI era.
            </p>

            <p className="text-foreground font-semibold">
              For those wondering, I am not accepting consulting clients or "quick chats to pick my brain" at the moment. If you'd like to learn from me, explore my articles and courses above.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
