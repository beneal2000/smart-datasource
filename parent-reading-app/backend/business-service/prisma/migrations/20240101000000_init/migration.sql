-- 亲子伴读 App - 初始数据库迁移
-- CreateTable: users, voice_profiles, poems, stories, favorites, play_history, background_music

-- 用户表
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar_url" TEXT,
    "children_age" INTEGER,
    "subscription_type" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 声音档案表
CREATE TABLE "voice_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "voice_name" TEXT NOT NULL,
    "voice_role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "model_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_profiles_pkey" PRIMARY KEY ("id")
);

-- 古诗表
CREATE TABLE "poems" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "dynasty" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinyin" TEXT,
    "translation" TEXT,
    "appreciation" TEXT,
    "grade" INTEGER,
    "tags" TEXT[],

    CONSTRAINT "poems_pkey" PRIMARY KEY ("id")
);

-- 故事表
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "age_range" TEXT NOT NULL,
    "duration_estimate" INTEGER NOT NULL,
    "cover_image" TEXT,
    "word_count" INTEGER NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- 收藏表
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "poem_id" TEXT,
    "story_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- 播放记录表
CREATE TABLE "play_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "poem_id" TEXT,
    "story_id" TEXT,
    "voice_id" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);

-- 背景音乐表
CREATE TABLE "background_music" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "file_url" TEXT NOT NULL,

    CONSTRAINT "background_music_pkey" PRIMARY KEY ("id")
);

-- 唯一索引
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "favorites_user_id_content_type_poem_id_key" ON "favorites"("user_id", "content_type", "poem_id");
CREATE UNIQUE INDEX "favorites_user_id_content_type_story_id_key" ON "favorites"("user_id", "content_type", "story_id");

-- 外键约束
ALTER TABLE "voice_profiles" ADD CONSTRAINT "voice_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_poem_id_fkey" FOREIGN KEY ("poem_id") REFERENCES "poems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_poem_id_fkey" FOREIGN KEY ("poem_id") REFERENCES "poems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 性能索引
CREATE INDEX "poems_grade_idx" ON "poems"("grade");
CREATE INDEX "poems_dynasty_idx" ON "poems"("dynasty");
CREATE INDEX "poems_author_idx" ON "poems"("author");
CREATE INDEX "stories_category_idx" ON "stories"("category");
CREATE INDEX "stories_age_range_idx" ON "stories"("age_range");
CREATE INDEX "play_history_user_id_idx" ON "play_history"("user_id");
CREATE INDEX "play_history_played_at_idx" ON "play_history"("played_at");
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");
