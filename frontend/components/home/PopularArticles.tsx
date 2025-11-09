'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

// Mock data for popular articles
const mockArticles = [
  {
    id: '1',
    title: 'You have about 36 months to make it',
    date: 'JUL 21',
    author: 'DAN KOE',
    image: 'https://picsum.photos/seed/pop1/200/200',
    slug: 'you-have-36-months',
    isLocked: false,
  },
  {
    id: '2',
    title: 'A dopamine detox to reset your life in 30 days',
    date: 'OCT 16',
    author: 'DAN KOE',
    image: 'https://picsum.photos/seed/pop2/200/200',
    slug: 'dopamine-detox',
    isLocked: false,
  },
  {
    id: '3',
    title: 'A Prompt To Reset Your Life In 30 Days',
    date: 'JUL 26',
    author: 'DAN KOE',
    image: 'https://picsum.photos/seed/pop3/200/200',
    slug: 'prompt-reset-life',
    isLocked: true,
  },
  {
    id: '4',
    title: 'HUMAN 3.0 – A Map To Reach The Top 1%',
    date: 'AUG 26',
    author: 'DAN KOE',
    image: 'https://picsum.photos/seed/pop4/200/200',
    slug: 'human-3-0',
    isLocked: false,
  },
];

export default function PopularArticles() {
  return (
    <section className="relative py-12">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Most Popular</h2>
          <Link href="/archive">
            <Button variant="link" className="text-primary hover:text-primary/80">
              VIEW ALL
            </Button>
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockArticles.map((article) => (
            <Link key={article.id} href={`/article/${article.slug}`}>
              <div className="group flex gap-4 hover:opacity-80 transition-opacity">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base leading-tight mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {article.isLocked && <Lock className="h-3 w-3" />}
                    <span className="uppercase">{article.date}</span>
                    <span>·</span>
                    <span className="uppercase">{article.author}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
