/**
 * 直接通过数据库连接创建 categories
 *
 * 不依赖 Strapi 运行时，直接连接 PostgreSQL 数据库
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createCategories() {
  // 创建数据库连接
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'true'
    } : false,
  });

  try {
    await client.connect();
    console.log('✓ 数据库连接成功\n');

    // 定义要创建的 categories
    const categories = [
      {
        name: 'Premium Course',
        slug: 'premium-course',
        description: 'Unlock your full potential with our carefully curated premium courses. Deep dive into advanced topics and gain mastery over essential skills.',
      },
      {
        name: 'Portfolio',
        slug: 'portfolio',
        description: 'Showcase of projects, case studies, and creative works. Explore real-world applications and learn from practical examples.',
      },
    ];

    console.log('开始创建 categories...\n');

    for (const category of categories) {
      // 检查是否已存在
      const checkQuery = 'SELECT id, name FROM categories WHERE slug = $1';
      const checkResult = await client.query(checkQuery, [category.slug]);

      if (checkResult.rows.length > 0) {
        console.log(`✓ Category "${category.name}" 已存在，跳过创建`);
        continue;
      }

      // 插入新 category
      const insertQuery = `
        INSERT INTO categories (name, slug, description, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
        VALUES ($1, $2, $3, NOW(), NOW(), NOW(), NULL, NULL, 'en')
        RETURNING id, name, slug
      `;

      const insertResult = await client.query(insertQuery, [
        category.name,
        category.slug,
        category.description,
      ]);

      const createdCategory = insertResult.rows[0];
      console.log(`✓ 成功创建 category: ${createdCategory.name} (${createdCategory.slug})`);
    }

    console.log('\n✅ Categories 创建完成！');

    // 列出所有 categories
    const listQuery = 'SELECT id, name, slug FROM categories ORDER BY name ASC';
    const listResult = await client.query(listQuery);

    console.log('\n📋 当前所有 categories:');
    listResult.rows.forEach((cat: any) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

  } catch (error: any) {
    console.error('❌ 创建 categories 时出错:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✓ 数据库连接已关闭');
  }
}

// 执行脚本
createCategories()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  });
