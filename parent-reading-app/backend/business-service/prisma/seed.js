/**
 * Prisma Seed 脚本
 *
 * 将古诗、故事、背景音乐等初始数据导入 PostgreSQL。
 * 运行: npx prisma db seed 或 npm run prisma:seed
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库播种...\n');

  // ============================================================
  // 1. 导入古诗数据
  // ============================================================
  console.log('📜 导入古诗数据...');
  const poemsPath = path.resolve(__dirname, '../../content/poems.json');

  if (!fs.existsSync(poemsPath)) {
    console.warn('  ⚠️  poems.json 不存在，跳过');
  } else {
    const poemsRaw = JSON.parse(fs.readFileSync(poemsPath, 'utf-8'));

    let poemCount = 0;
    for (const poem of poemsRaw) {
      await prisma.poem.upsert({
        where: { id: poem.id },
        update: {
          title: poem.title,
          author: poem.author,
          dynasty: poem.dynasty,
          content: poem.content,
          pinyin: poem.pinyin || null,
          translation: poem.translation || null,
          appreciation: poem.appreciation || null,
          grade: poem.grade || null,
          tags: poem.tags || [],
        },
        create: {
          id: poem.id,
          title: poem.title,
          author: poem.author,
          dynasty: poem.dynasty,
          content: poem.content,
          pinyin: poem.pinyin || null,
          translation: poem.translation || null,
          appreciation: poem.appreciation || null,
          grade: poem.grade || null,
          tags: poem.tags || [],
        },
      });
      poemCount++;
    }
    console.log(`  ✅ 导入 ${poemCount} 首古诗`);
  }

  // ============================================================
  // 2. 导入故事数据
  // ============================================================
  console.log('📖 导入故事数据...');
  const storiesPath = path.resolve(__dirname, '../../content/stories.json');

  if (!fs.existsSync(storiesPath)) {
    console.warn('  ⚠️  stories.json 不存在，跳过');
  } else {
    const storiesRaw = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));

    let storyCount = 0;
    for (const story of storiesRaw) {
      await prisma.story.upsert({
        where: { id: story.id },
        update: {
          title: story.title,
          content: story.content,
          summary: story.summary,
          category: story.category,
          ageRange: story.age_range,
          durationEstimate: story.duration_estimate,
          coverImage: story.cover_image || null,
          wordCount: story.word_count,
        },
        create: {
          id: story.id,
          title: story.title,
          content: story.content,
          summary: story.summary,
          category: story.category,
          ageRange: story.age_range,
          durationEstimate: story.duration_estimate,
          coverImage: story.cover_image || null,
          wordCount: story.word_count,
        },
      });
      storyCount++;
    }
    console.log(`  ✅ 导入 ${storyCount} 篇故事`);
  }

  // ============================================================
  // 3. 导入背景音乐数据
  // ============================================================
  console.log('🎵 导入背景音乐数据...');

  const musicData = [
    { id: 'rain_01', name: '细雨绵绵', category: 'sleep', duration: 60.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/06/26/audio_13930a4d2b.mp3' },
    { id: 'rain_heavy_01', name: '暴雨白噪音', category: 'sleep', duration: 120.0, fileUrl: 'https://cdn.pixabay.com/audio/2023/07/27/audio_4abdf2a95d.mp3' },
    { id: 'white_noise_01', name: '纯白噪音', category: 'sleep', duration: 10.0, fileUrl: 'https://cdn.pixabay.com/audio/2023/03/30/audio_ae3e8e91dc.mp3' },
    { id: 'thunder_rain_01', name: '雷雨声', category: 'sleep', duration: 90.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/05/25/audio_2cebf1de06.mp3' },
    { id: 'ocean_waves_01', name: '海浪声', category: 'nature', duration: 60.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/01/20/audio_dfc1e066f0.mp3' },
    { id: 'birds_01', name: '清晨鸟鸣', category: 'nature', duration: 60.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_d65e686945.mp3' },
    { id: 'creek_01', name: '潺潺溪流', category: 'nature', duration: 60.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/08/31/audio_afa1fed498.mp3' },
    { id: 'night_insects_01', name: '夏夜虫鸣', category: 'nature', duration: 60.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/09/07/audio_96e0e27a6f.mp3' },
    { id: 'wind_01', name: '轻柔微风', category: 'peaceful', duration: 30.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/10/30/audio_f3e69c2c04.mp3' },
    { id: 'fire_01', name: '壁炉噼啪声', category: 'peaceful', duration: 60.0, fileUrl: 'https://cdn.pixabay.com/audio/2022/07/04/audio_a514c6f85c.mp3' },
  ];

  let musicCount = 0;
  for (const music of musicData) {
    await prisma.backgroundMusic.upsert({
      where: { id: music.id },
      update: {
        name: music.name,
        category: music.category,
        duration: music.duration,
        fileUrl: music.fileUrl,
      },
      create: {
        id: music.id,
        name: music.name,
        category: music.category,
        duration: music.duration,
        fileUrl: music.fileUrl,
      },
    });
    musicCount++;
  }
  console.log(`  ✅ 导入 ${musicCount} 首背景音乐`);

  // ============================================================
  // 4. 创建测试用户（开发环境）
  // ============================================================
  if (process.env.NODE_ENV !== 'production') {
    console.log('👤 创建测试用户...');

    await prisma.user.upsert({
      where: { phone: '13800000001' },
      update: {},
      create: {
        id: 'test-user-001',
        phone: '13800000001',
        nickname: '测试妈妈',
        subscriptionType: 'premium',
        childrenAge: 5,
      },
    });

    await prisma.user.upsert({
      where: { phone: '13800000002' },
      update: {},
      create: {
        id: 'test-user-002',
        phone: '13800000002',
        nickname: '测试爸爸',
        subscriptionType: 'free',
        childrenAge: 7,
      },
    });

    console.log('  ✅ 创建 2 个测试用户');

    // 为测试用户创建声音档案
    await prisma.voiceProfile.upsert({
      where: { id: 'test-voice-001' },
      update: {},
      create: {
        id: 'test-voice-001',
        userId: 'test-user-001',
        voiceName: '妈妈的声音',
        voiceRole: 'mother',
        status: 'ready',
        modelPath: 'test-model-path',
      },
    });

    console.log('  ✅ 创建测试声音档案');
  }

  console.log('\n🎉 数据库播种完成！');
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
