/**
 * 创建新的 categories 脚本
 *
 * 用于在 Strapi 数据库中创建 Premium Course 和 Portfolio 分类
 */

import { createStrapi } from '@strapi/strapi';

async function createCategories() {
  const strapi = await createStrapi().load();

  try {
    console.log('开始创建 categories...\n');

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

    // 创建每个 category
    for (const categoryData of categories) {
      // 检查 category 是否已存在
      const existingCategory = await strapi.db.query('api::category.category').findOne({
        where: { slug: categoryData.slug },
      });

      if (existingCategory) {
        console.log(`✓ Category "${categoryData.name}" 已存在，跳过创建`);
        continue;
      }

      // 创建新 category
      const category = await strapi.db.query('api::category.category').create({
        data: {
          ...categoryData,
          publishedAt: new Date(),
        },
      });

      console.log(`✓ 成功创建 category: ${category.name} (${category.slug})`);
    }

    console.log('\n✅ Categories 创建完成！');

    // 列出所有 categories
    const allCategories = await strapi.db.query('api::category.category').findMany({
      orderBy: { name: 'asc' },
    });

    console.log('\n📋 当前所有 categories:');
    allCategories.forEach((cat: any) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('❌ 创建 categories 时出错:', error);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

// 执行脚本
createCategories()
  .then(() => {
    console.log('\n脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
