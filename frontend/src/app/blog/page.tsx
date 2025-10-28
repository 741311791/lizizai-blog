async function getBlogPosts() {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  
  try {
    const response = await fetch(`${strapiUrl}/api/posts`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main>
      <h1>Blog</h1>
      <nav>
        <a href="/">← Back to Home</a>
      </nav>
      <div className="blog-list">
        {posts.length === 0 ? (
          <p>No posts available yet.</p>
        ) : (
          <ul>
            {posts.map((post: any) => (
              <li key={post.id}>
                <h2>{post.attributes?.title || 'Untitled'}</h2>
                <p>{post.attributes?.excerpt || ''}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
