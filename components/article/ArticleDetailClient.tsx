'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AuthorCard from './AuthorCard';
import ArticleActions from './ArticleActions';
import ArticleContent from './ArticleContent';
import MobileToc from './MobileToc';
import MobileChapterList from './MobileChapterList';
import MobileSlideNav from './MobileSlideNav';
import ContentTypeBadge from './ContentTypeBadge';
import ArticleBreadcrumb from './ArticleBreadcrumb';
import ContentComingSoon from './ContentComingSoon';
import ContentTypeSwitcher from './ContentTypeSwitcher';
import ReadingProgress from './ReadingProgress';
import RelatedArticles from './RelatedArticles';
import ArticleSidebar from './ArticleSidebar';
import type { Article } from '@/types/index';

const AudioPlayer = dynamic(() => import('./AudioPlayer'), {
  loading: () => <div className="h-20 rounded-lg bg-muted animate-pulse mb-8" />,
});

const PodcastList = dynamic(() => import('./PodcastList'), {
  loading: () => <div className="h-40 rounded-lg bg-muted animate-pulse mb-8" />,
});

const SlideViewer = dynamic(() => import('./SlideViewer'), {
  loading: () => <div className="aspect-video rounded-lg bg-muted animate-pulse" />,
});

const HtmlViewer = dynamic(() => import('./HtmlViewer'), {
  loading: () => <div className="h-[500px] rounded-lg bg-muted animate-pulse" />,
})

const sidebarLoading = () => <div className="h-64 rounded-lg bg-muted animate-pulse" />;

const PodcastSidebar = dynamic(() => import('./PodcastSidebar'), {
  loading: sidebarLoading,
});

const SlidesSidebar = dynamic(() => import('./SlidesSidebar'), {
  loading: sidebarLoading,
});

const ImageLightbox = dynamic(() => import('./ImageLightbox'), {
  ssr: false,
});

const CommentSection = dynamic(() => import('./CommentSection'), {
  loading: () => (
    <div className="mt-12 space-y-4">
      <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
      <div className="h-24 rounded-lg bg-muted animate-pulse" />
    </div>
  ),
});

interface ArticleDetailClientProps {
  article: Article;
  likes: number;
  views: number;
  relatedArticles: Article[];
}

/**
 * 文章详情页 Client Component
 * 渲染完整页面布局，根据 contentTypes/contentType 条件渲染不同内容区和侧边栏
 *
 * 注：HTML 内容类型的目录已由 HTML 自带（HtmlViewer 内 iframe 的浮动目录），
 * 不再在此处维护 TOC 状态与 scroll 高亮。
 */
export default function ArticleDetailClient({
  article,
  likes,
  views,
  relatedArticles,
}: ArticleDetailClientProps) {
  const realContentType = article.contentType || 'article';
  // 默认展示文章主内容类型（有 html 时默认 html，符合"HTML 为第一阅读类型"的产品定位）
  const [activeContentType, setActiveContentType] = useState<string>(realContentType);

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
  const hasHtmlData = ct
    ? !!ct.html
    : (realContentType === 'html' && !!article.htmlUrl);

  // 判断幻灯片是否为 HTML 模式
  const isHtmlSlides = ct?.slides?.source === 'html_slides';

  // HTML 内容 URL
  const htmlUrl = ct?.html?.htmlUrl || article.htmlUrl || '';

  // 切换内容类型
  const handleTypeChange = useCallback((type: string) => {
    setActiveContentType(type);
  }, []);

  // 是否显示兜底页：用户切到了 podcast/slides/html 但实际没有数据
  const showComingSoon =
    (activeContentType === 'podcast' && !hasPodcastData) ||
    (activeContentType === 'slides' && !hasSlidesData) ||
    (activeContentType === 'html' && !hasHtmlData);

  // HTML 模式下主内容区不限制宽度（沉浸阅读，目录由 HTML 自带）
  const isFullWidth = activeContentType === 'html' && hasHtmlData;

  // 渲染主内容区
  const renderMainContent = () => {
    // 兜底页
    if (showComingSoon) {
      return <ContentComingSoon type={activeContentType as 'podcast' | 'slides'} />;
    }

    switch (activeContentType) {
      case 'podcast':
        // 多播客列表（新格式）
        if (article.podcasts && article.podcasts.length > 0) {
          return (
            <PodcastList
              podcasts={article.podcasts}
              articleTitle={article.title}
            />
          );
        }
        // 单播客回退（旧格式）
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
              manifest={ct?.slides?.manifest}
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

      case 'html':
        return <HtmlViewer htmlUrl={htmlUrl} />;

      default:
        return (
          <>
            <ArticleContent html={article.renderedContent || ''} />
            <div className="mt-8">
              <MobileToc headings={article.headings ?? []} />
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
          headings={article.headings ?? []}
        />
      );
    }

    switch (activeContentType) {
      case 'podcast':
        // 多播客列表：简化侧边栏，仅显示数据统计
        if (article.podcasts && article.podcasts.length > 0) {
          return (
            <ArticleSidebar
              article={article}
              likes={likes}
              views={views}
              headings={article.headings ?? []}
            />
          );
        }
        return (
          <PodcastSidebar
            article={article}
            activeChapterIndex={activeChapterIndex}
            onChapterClick={handleChapterClick}
            currentTime={podcastCurrentTime}
          />
        );

      case 'slides':
        return (
          <SlidesSidebar
            slides={article.slidesData || []}
            currentIndex={currentSlideIndex}
            onSlideClick={setCurrentSlideIndex}
            article={article}
          />
        );

      case 'html':
        // HTML 目录由内容自带，侧边栏仅展示文章元信息
        return (
          <ArticleSidebar
            article={article}
            likes={likes}
            views={views}
            headings={article.headings ?? []}
          />
        );

      default:
        return (
          <ArticleSidebar
            article={article}
            likes={likes}
            views={views}
            headings={article.headings ?? []}
          />
        );
    }
  };

  // 移动端类型切换条（仅在有多类型时显示）
  const ctOptions = ct
    ? ['article', ct.podcast && 'podcast', ct.slides && 'slides', ct.html && 'html'].filter(Boolean)
    : undefined;
  const showMobileSwitcher = ctOptions ? ctOptions.length > 1 : false;

  return (
    <>
      <ReadingProgress />
      <ImageLightbox />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <ArticleBreadcrumb article={article} />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
          {/* 左栏：头部 + 内容 */}
          <article
            className={`transition-[max-width] duration-200 ${
              isFullWidth ? 'max-w-none' : 'max-w-3xl'
            }`}
          >
            {/* 文章头部（所有类型共用） */}
            <header className="mb-8 space-y-4">
              <ContentTypeBadge
                article={article}
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

              {/* 移动端类型切换条 */}
              {showMobileSwitcher && (
                <div className="lg:hidden pt-2">
                  <ContentTypeSwitcher
                    contentTypes={ct}
                    activeType={activeContentType}
                    onTypeChange={handleTypeChange}
                  />
                </div>
              )}
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
