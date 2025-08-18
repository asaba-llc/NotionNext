import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import dynamic from 'next/dynamic'
import TopBar from './components/TopBar'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import JumpToTopButton from './components/JumpToTopButton'
import { Style } from './style'
import { AdSlot } from '@/components/GoogleAdsense'

const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  { ssr: false }
)

const ThemeGlobalSimple = React.createContext()
export const useSimpleGlobal = () => React.useContext(ThemeGlobalSimple)

const LayoutBase = props => {
  const { children } = props
  const { onLoading } = useGlobal()
  const router = useRouter()
  const isHome = router.pathname === '/'

  const titleRef = useRef<HTMLDivElement>(null)
  const [imageTop, setImageTop] = useState(0)
  const searchModal = useRef(null)

  // 首页图片顶部与标题顶部始终对齐
  useEffect(() => {
    if (!isHome) return

    const updateImageTop = () => {
      if (titleRef.current) {
        const rect = titleRef.current.getBoundingClientRect()
        setImageTop(rect.top + window.scrollY) // 加上滚动偏移
      }
    }

    updateImageTop() // 初始计算
    window.addEventListener('scroll', updateImageTop)
    window.addEventListener('resize', updateImageTop)

    return () => {
      window.removeEventListener('scroll', updateImageTop)
      window.removeEventListener('resize', updateImageTop)
    }
  }, [isHome])

  return (
    <ThemeGlobalSimple.Provider value={{ searchModal }}>
      <div
        id="theme-typography"
        className={`${siteConfig('FONT_STYLE')} font-typography h-screen flex flex-col dark:text-gray-300 bg-white dark:bg-[#232222] overflow-hidden`}
      >
        <Style />
        {siteConfig('SIMPLE_TOP_BAR', null) && <TopBar {...props} />}

        <div className="flex flex-1 mx-auto overflow-hidden py-8 md:p-0 md:max-w-7xl md:px-24 w-screen">
          
          {/* 左侧固定图片 - 仅首页显示 */}
          {isHome && (
            <div
              className="hidden md:block fixed"
              style={{
                top: `${imageTop}px`,
                right: '20px',
                width: '300px',
              }}
            >
              <Image
                src="/images/left-photo.jpg"
                alt="浅羽合同会社"
                width={300}
                height={0}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {/* 文章区域 */}
          <div className={`flex-1 overflow-y-auto ${isHome ? 'md:ml-[320px]' : ''}`}>
            {/* 首页标题（用于对齐图片顶部） */}
            {isHome && (
              <div ref={titleRef} className="text-2xl font-bold mb-4">
                首页标题
              </div>
            )}

            {/* 移动端导航 */}
            <div className="md:hidden">
              <NavBar {...props} />
            </div>

            {/* 文章内容或加载动画 */}
            {onLoading ? (
              <div className="flex items-center justify-center min-h-[500px] w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              children
            )}

            <AdSlot type="native" />

            {/* 移动端页脚 */}
            <div className="md:hidden z-30">
              <Footer {...props} />
            </div>
          </div>

          {/* 右侧导航和页脚 - md及以上显示 */}
          <div className="hidden md:flex md:flex-col md:flex-shrink-0 md:h-[100vh] sticky top-20">
            <NavBar {...props} />
            <Footer {...props} />
          </div>
        </div>

        {/* 回到顶部按钮 */}
        <div className="fixed right-4 bottom-4 z-20">
          <JumpToTopButton />
        </div>

        {/* 搜索框 */}
        <AlgoliaSearchModal cRef={searchModal} {...props} />
      </div>
    </ThemeGlobalSimple.Provider>
  )
}

/**
 * 博客首页
 * 首页就是列表
 * @param {*} props
 * @returns
 */
const LayoutIndex = props => {
  return <LayoutPostList {...props} />
}
/**
 * 博客列表
 * @param {*} props
 * @returns
 */
const LayoutPostList = props => {
  return (
    <>
      <BlogPostBar {...props} />
      <BlogListPage {...props} />
    </>
  )
}

/**
 * 搜索页
 * 也是博客列表
 * @param {*} props
 * @returns
 */
const LayoutSearch = props => {
  const { keyword } = props

  useEffect(() => {
    if (isBrowser) {
      replaceSearchResult({
        doms: document.getElementById('posts-wrapper'),
        search: keyword,
        target: {
          element: 'span',
          className: 'text-red-500 border-b border-dashed'
        }
      })
    }
  }, [])

  return <LayoutPostList {...props} />
}

 function groupArticlesByYearArray(articles) {
  const grouped = {};

  for (const article of articles) {
    const year = new Date(article.publishDate).getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(article);
  }

  for (const year in grouped) {
    grouped[year].sort((a, b) => b.publishDate - a.publishDate);
  }

  // 转成数组并按年份倒序
  return Object.entries(grouped)
    .sort(([a], [b]) => b - a)
    .map(([year, posts]) => ({ year, posts }));
}



/**
 * 归档页
 * @param {*} props
 * @returns
 */
const LayoutArchive = props => {
  const { posts } = props
  const sortPosts = groupArticlesByYearArray(posts)
  return (
    <>
      <div className='mb-10 pb-20 md:pb-12 p-5  min-h-screen w-full'>
        {sortPosts.map(p => (
          <BlogArchiveItem
            key={p.year}
            archiveTitle={p.year}
            archivePosts={p.posts}
          />
        ))}
      </div>
    </>
  )
}

/**
 * 文章详情
 * @param {*} props
 * @returns
 */
const LayoutSlug = props => {
  const { post, lock, validPassword, prev, next, recommendPosts } = props
  const { fullWidth } = useGlobal()

  return (
    <>
      {lock && <ArticleLock validPassword={validPassword} />}

      {!lock && post && (
        <div
          className={`px-5 pt-3 ${fullWidth ? '' : 'xl:max-w-4xl 2xl:max-w-6xl'}`}>
          {/* 文章信息 */}
          <ArticleInfo post={post} />

          {/* 广告嵌入 */}
          {/* <AdSlot type={'in-article'} /> */}
          <WWAds orientation='horizontal' className='w-full' />

          <div id='article-wrapper'>
            {/* Notion 文章主体 */}
            {!lock && <NotionPage post={post} />}
          </div>

          {/* 分享 */}
          {/* <ShareBar post={post} /> */}

          {/* 广告嵌入 */}
          <AdSlot type={'in-article'} />

          {post?.type === 'Post' && (
            <>
              <ArticleAround prev={prev} next={next} />
              <RecommendPosts recommendPosts={recommendPosts} />
            </>
          )}

          {/* 评论区 */}
          <Comment frontMatter={post} />
        </div>
      )}
    </>
  )
}

/**
 * 404
 * @param {*} props
 * @returns
 */
const Layout404 = props => {
  const { post } = props
  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000
  useEffect(() => {
    // 404
    if (!post) {
      setTimeout(() => {
        if (isBrowser) {
          const article = document.querySelector(
            '#article-wrapper #notion-article'
          )
          if (!article) {
            router.push('/404').then(() => {
              console.warn('找不到页面', router.asPath)
            })
          }
        }
      }, waiting404)
    }
  }, [post])
  return <>404 Not found.</>
}

/**
 * 分类列表
 * @param {*} props
 * @returns
 */
const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  return (
    <>
      <div id='category-list' className='px-5 duration-200 flex flex-wrap'>
        {categoryOptions?.map(category => {
          return (
            <SmartLink
              key={category.name}
              href={`/category/${category.name}`}
              passHref
              legacyBehavior>
              <div
                className={
                  'hover:text-black dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-600 px-5 cursor-pointer py-2 hover:bg-gray-100'
                }>
                <i className='mr-4 fas fa-folder' />
                {category.name}({category.count})
              </div>
            </SmartLink>
          )
        })}
      </div>
    </>
  )
}

/**
 * 标签列表
 * @param {*} props
 * @returns
 */
const LayoutTagIndex = props => {
  const { tagOptions } = props
  return (
    <>
      <div id='tags-list' className='px-5 duration-200 flex flex-wrap'>
        {tagOptions.map(tag => {
          return (
            <div key={tag.name} className='p-2'>
              <SmartLink
                key={tag}
                href={`/tag/${encodeURIComponent(tag.name)}`}
                passHref
                className={`cursor-pointer inline-block rounded hover:bg-gray-500 hover:text-white duration-200  mr-2 py-1 px-2 text-xs whitespace-nowrap dark:hover:text-white text-gray-600 hover:shadow-xl dark:border-gray-400 notion-${tag.color}_background dark:bg-gray-800`}>
                <div className='font-light dark:text-gray-400'>
                  <i className='mr-1 fas fa-tag' />{' '}
                  {tag.name + (tag.count ? `(${tag.count})` : '')}{' '}
                </div>
              </SmartLink>
            </div>
          )
        })}
      </div>
    </>
  )
}

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
