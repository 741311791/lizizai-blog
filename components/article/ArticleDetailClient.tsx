'use client';

import { useState, useCallback } from 'react';
import AuthorCard from './AuthorCard';
import ArticleActions from './ArticleActions';
import ArticleContent from './ArticleContent';
import MobileToc from './MobileToc';
import MobileChapterList from './MobileChapterList';
import MobileSlideNav from './MobileSlideNav';
import AudioPlayer from './AudioPlayer';
import PodcastSidebar from './PodcastSidebar';
import SlideViewer from './SlideViewer';
import SlidesSidebar from './SlidesSidebar';
import ContentTypeBadge from './ContentTypeBadge';
import ContentComingSoon from './ContentComingSoon';
import ContentTypeSwitcher from './ContentTypeSwitcher';
import ReadingProgress from './ReadingProgress';
import ImageLightbox from './ImageLightbox';
import CommentSection from './CommentSection';
import RelatedArticles from './RelatedArticles';
import ArticleSidebar from './ArticleSidebar';
import type { Article } from '@/types/index';

interface ArticleDetailClientProps {
  article: Article;
  likes: number;
  views: number;
  relatedArticles: Article[];
}

/**
 * 文章详情页 Client Component
 * 渲染完整页面布局，根据 contentTypes/contentType 条件渲染不同内容区和侧边栏
 */
export default function ArticleDetailClient({
  article,
  likes,
  views,
  relatedArticles,
}: ArticleDetailClientProps) {
  const realContentType = article.contentType || 'article';
  const [activeContentType, setActiveContentType] = useState('article');

  // 播客状态
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(-1);

  // 幻灯片状态（Markdown 模式）
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // 播客回调
  const handlePodcastTimeUpdate = useCallback((time: number) => {
    setPodcastCurrentTime(time);
  }, []);

  const handleChapterChange = useCallback((index: number) => {
    setActiveChapterIndex(index);
  }, []);

  const handleChapterClick = useCallback((startTime: number) => {
    window.dispatchEvent(new CustomEvent('podcast-seek', { detail: startTime }));
  }, []);

  // 判断是否有真实数据（优先用新架构 contentTypes，回退旧 contentType）
  const ct = article.contentTypes;
  const hasPodcastData = ct
    ? !!ct.podcast
    : (realContentType === 'podcast' && !!article.audioUrl);
  const hasSlidesData = ct
    ? !!ct.slides
    : (realContentType === 'slides' && !!article.slidesData && article.slidesData.length > 0);

  // 判断幻灯片是否为 HTML 模式
  const isHtmlSlides = ct?.slides?.source === 'html_slides';

  // 切换内容类型
  const handleTypeChange = useCallback((type: string) => {
    setActiveContentType(type);
  }, []);

  // 是否显示兜底页：用户切到了 podcast/slides 但实际没有数据
  const showComingSoon =
    (activeContentType === 'podcast' && !hasPodcastData) ||
    (activeContentType === 'slides' && !hasSlidesData);

  // 渲染主内容区
  const renderMainContent = () => {
    // 兜底页
    if (showComingSoon) {
      return <ContentComingSoon type={activeContentType as 'podcast' | 'slides'} />;
    }

    switch (activeContentType) {
      case 'podcast':
        return (
          <>
            <AudioPlayer
              audioUrl={article.audioUrl || ''}
              duration={article.audioDuration}
              title={article.title}
              onTimeUpdate={handlePodcastTimeUpdate}
              onChapterChange={handleChapterChange}
              chapters={article.chapters}
            />
            {article.scriptContent && (
              <ArticleContent content={article.scriptContent} />
            )}
            <div className="mt-8">
              <MobileChapterList
                chapters={article.chapters || []}
                activeIndex={activeChapterIndex}
                onChapterClick={handleChapterClick}
              />
            </div>
          </>
        );

      case 'slides':
        return (
          <>
            <SlideViewer
              mode={isHtmlSlides ? 'html' : 'markdown'}
              slides={article.slidesData || []}
              currentIndex={currentSlideIndex}
              onSlideChange={setCurrentSlideIndex}
              slidesBaseUrl={article.slidesBaseUrl}
            />
            {!isHtmlSlides && (
              <MobileSlideNav
                slides={article.slidesData || []}
                currentIndex={currentSlideIndex}
                onSlideClick={setCurrentSlideIndex}
              />
            )}
          </>
        );

      default:
        return (
          <>
            <ArticleContent content={article.content} />
            <div className="mt-8">
              <MobileToc content={article.content} />
            </div>
          </>
        );
    }
  };

  // 渲染侧边栏
  const renderSidebar = () => {
    // 兜底时显示文章侧边栏
    if (showComingSoon) {
      return (
        <ArticleSidebar
          article={article}
          likes={likes}
          views={views}
          content={article.content}
        />
      );
    }

    switch (activeContentType) {
      case 'podcast':
        return (
          <PodcastSidebar
            article={article}
            activeChapterIndex={activeChapterIndex}
            onChapterClick={handleChapterClick}
            currentTime={podcastCurrentTime}
          />
        );

      case 'slides':
        // HTML 模式的幻灯片不需要侧边栏导航（自带播放器）
        if (isHtmlSlides) {
          return (
            <ArticleSidebar
              article={article}
              likes={likes}
              views={views}
              content={article.content}
            />
          );
        }
        return (
          <SlidesSidebar
            slides={article.slidesData || []}
            currentIndex={currentSlideIndex}
            onSlideClick={setCurrentSlideIndex}
            article={article}
          />
        );

      default:
        return (
          <ArticleSidebar
            article={article}
            likes={likes}
            views={views}
            content={article.content}
          />
        );
    }
  };

  return (
    <>
      <ReadingProgress />
      <ImageLightbox />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
          {/* 左栏：头部 + 内容 */}
          <article className="max-w-3xl">
            {/* 文章头部（所有类型共用） */}
            <header className="mb-8 space-y-4">
              <ContentTypeBadge
                contentType={realContentType}
                categoryName={article.category?.name}
              />
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                {article.title}
              </h1>
              {article.subtitle && (
                <p className="text-lg text-muted-foreground leading-relaxed">{article.subtitle}</p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
                <AuthorCard
                  author={article.author}
                  publishedAt={article.publishedAt}
                />
                <ArticleActions
                  articleId={article.id}
                  likes={likes}
                  shares={0}
                  views={views}
                />
              </div>
            </header>

            {/* 内容区（根据类型渲染） */}
            {renderMainContent()}

            {/* 评论区和相关文章 */}
            <CommentSection slug={article.slug} />
            {relatedArticles.length > 0 && (
              <RelatedArticles articles={relatedArticles} />
            )}
          </article>

          {/* 右栏：侧边栏 */}
          <aside className="hidden lg:block sticky top-6 self-start border-l border-border pl-6">
            <div className="space-y-7">
              <ContentTypeSwitcher
                contentTypes={ct}
                activeType={activeContentType}
                onTypeChange={handleTypeChange}
              />
              {renderSidebar()}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
