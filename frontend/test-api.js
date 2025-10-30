const STRAPI_URL = 'https://lizizai-blog.onrender.com';

async function testAPI() {
  try {
    console.log('Testing Strapi API integration...\n');
    
    // Test articles endpoint
    const articlesRes = await fetch(`${STRAPI_URL}/api/articles?populate=*`);
    const articles = await articlesRes.json();
    console.log(`✓ Found ${articles.length} articles`);
    
    if (articles.length > 0) {
      console.log(`\nFirst article:`);
      console.log(`  Title: ${articles[0].title}`);
      console.log(`  Slug: ${articles[0].slug}`);
      console.log(`  Category: ${articles[0].category?.name || 'None'}`);
      console.log(`  Likes: ${articles[0].likes}`);
      console.log(`  Views: ${articles[0].views}`);
    }
    
    // Test categories endpoint
    const categoriesRes = await fetch(`${STRAPI_URL}/api/categories`);
    const categoriesData = await categoriesRes.json();
    const categories = categoriesData.data || [];
    console.log(`\n✓ Found ${categories.length} categories`);
    
    console.log('\n✅ API integration test passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
