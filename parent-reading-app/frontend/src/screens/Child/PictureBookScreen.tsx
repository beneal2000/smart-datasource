/**
 * 互动绘本页面
 *
 * 核心功能：
 * - 翻页式绘本浏览（左右滑动）
 * - 每页包含：插图 + 文字 + 自动朗读
 * - 翻页时自动切换到对应段落的音频
 * - 支持手动点击文字高亮跟读
 * - 父母声音朗读 + 背景音乐
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoiceStore } from '../../store/voiceStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 绘本页面数据结构
interface BookPage {
  id: string;
  pageNumber: number;
  text: string;
  pinyin?: string;
  imageUrl?: string;
  imagePlaceholder: string; // emoji 占位
  backgroundColor: string;
}

// 示例绘本数据 - 小蝌蚪找妈妈
const SAMPLE_BOOK: BookPage[] = [
  {
    id: 'p1', pageNumber: 1,
    text: '暖和的春天来了。池塘里的冰融化了。',
    pinyin: 'nuǎn huo de chūn tiān lái le。chí táng lǐ de bīng róng huà le。',
    imagePlaceholder: '🌸🏞️',
    backgroundColor: '#E8F5E9',
  },
  {
    id: 'p2', pageNumber: 2,
    text: '青蛙妈妈在水草上生下了很多黑黑的圆圆的卵。',
    pinyin: 'qīng wā mā ma zài shuǐ cǎo shàng shēng xià le hěn duō hēi hēi de yuán yuán de luǎn。',
    imagePlaceholder: '🐸🥚',
    backgroundColor: '#E3F2FD',
  },
  {
    id: 'p3', pageNumber: 3,
    text: '春风轻轻地吹过，太阳光照着。池塘里的水越来越暖和了。',
    pinyin: 'chūn fēng qīng qīng de chuī guò，tài yáng guāng zhào zhe。',
    imagePlaceholder: '☀️🌊',
    backgroundColor: '#FFF3E0',
  },
  {
    id: 'p4', pageNumber: 4,
    text: '青蛙妈妈下的卵慢慢地都活了，变成了一群大脑袋长尾巴的蝌蚪。',
    imagePlaceholder: '🦠➡️🐛',
    backgroundColor: '#F3E5F5',
  },
  {
    id: 'p5', pageNumber: 5,
    text: '小蝌蚪你问我，我问你：\n"我们的妈妈是什么样的呀？"',
    imagePlaceholder: '🐛❓🐛',
    backgroundColor: '#E8EAF6',
  },
  {
    id: 'p6', pageNumber: 6,
    text: '鸭妈妈说："你们的妈妈头顶上有两只大眼睛，嘴巴又阔又大。"',
    imagePlaceholder: '🦆💬',
    backgroundColor: '#FFF9C4',
  },
  {
    id: 'p7', pageNumber: 7,
    text: '小蝌蚪游啊游，看见了一条大鱼。\n"妈妈！妈妈！"\n大鱼笑着说："我不是你们的妈妈。"',
    imagePlaceholder: '🐛🐟',
    backgroundColor: '#B2EBF2',
  },
  {
    id: 'p8', pageNumber: 8,
    text: '小蝌蚪继续游啊游。突然，一只大青蛙蹲在荷叶上"呱呱"地叫。',
    imagePlaceholder: '🐸🪷',
    backgroundColor: '#C8E6C9',
  },
  {
    id: 'p9', pageNumber: 9,
    text: '青蛙妈妈笑着说："好孩子，你们已经长大了，快跳上来吧！"',
    imagePlaceholder: '🐸❤️🐸',
    backgroundColor: '#FFECB3',
  },
  {
    id: 'p10', pageNumber: 10,
    text: '小蝌蚪已经长成了小青蛙。他们跟着妈妈，天天去捉害虫。',
    imagePlaceholder: '🐸🐸🐸🌿',
    backgroundColor: '#DCEDC8',
  },
];

type PlayState = 'idle' | 'playing' | 'paused';

export default function PictureBookScreen({ route, navigation }: any) {
  const [currentPage, setCurrentPage] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [autoPlay, setAutoPlay] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { activeVoiceId, activeRole } = useVoiceStore();

  const book = SAMPLE_BOOK; // TODO: from route.params

  // 翻页动画
  const animatePageTurn = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  // 翻页处理
  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < book.length) {
      setCurrentPage(pageIndex);
      flatListRef.current?.scrollToIndex({ index: pageIndex, animated: true });
      animatePageTurn();

      // 自动播放当前页文字
      if (autoPlay) {
        setPlayState('playing');
        // TODO: 调用 TTS API 合成当前页文字
        // playAPI.generateAudio({ ... })
      }
    }
  }, [book.length, autoPlay, animatePageTurn]);

  // 下一页
  const nextPage = () => goToPage(currentPage + 1);
  // 上一页
  const prevPage = () => goToPage(currentPage - 1);

  // 渲染单页
  const renderPage = ({ item, index }: { item: BookPage; index: number }) => (
    <View style={[styles.page, { backgroundColor: item.backgroundColor }]}>
      {/* 插图区域 */}
      <View style={styles.imageArea}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.pageImage} resizeMode="contain" />
        ) : (
          <Text style={styles.placeholderEmoji}>{item.imagePlaceholder}</Text>
        )}
      </View>

      {/* 文字区域 */}
      <Animated.View style={[styles.textArea, { opacity: fadeAnim }]}>
        {/* 注音 */}
        {showPinyin && item.pinyin && (
          <Text style={styles.pinyinText}>{item.pinyin}</Text>
        )}
        {/* 正文 */}
        <Text style={styles.contentText}>{item.text}</Text>
      </Animated.View>

      {/* 页码 */}
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{item.pageNumber} / {book.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.toolBtn}>
          <Text style={styles.toolBtnText}>← 返回</Text>
        </TouchableOpacity>

        <View style={styles.toolCenter}>
          <Text style={styles.bookTitle}>小蝌蚪找妈妈</Text>
        </View>

        <View style={styles.toolRight}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setShowPinyin(!showPinyin)}
          >
            <Text style={styles.toolBtnText}>{showPinyin ? '隐藏拼音' : '显示拼音'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 绘本内容 - 水平翻页 */}
      <FlatList
        ref={flatListRef}
        data={book}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (page !== currentPage) {
            goToPage(page);
          }
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* 底部控制栏 */}
      <View style={styles.bottomBar}>
        {/* 上一页 */}
        <TouchableOpacity
          style={[styles.navBtn, currentPage === 0 && styles.navBtnDisabled]}
          onPress={prevPage}
          disabled={currentPage === 0}
        >
          <Text style={styles.navBtnText}>◀ 上一页</Text>
        </TouchableOpacity>

        {/* 播放控制 */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => {
            if (playState === 'playing') {
              setPlayState('paused');
            } else {
              setPlayState('playing');
            }
          }}
        >
          <Text style={styles.playBtnText}>
            {playState === 'playing' ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>

        {/* 自动翻页开关 */}
        <TouchableOpacity
          style={[styles.autoBtn, autoPlay && styles.autoBtnActive]}
          onPress={() => setAutoPlay(!autoPlay)}
        >
          <Text style={[styles.autoBtnText, autoPlay && styles.autoBtnTextActive]}>
            {autoPlay ? '自动翻页 ✓' : '手动翻页'}
          </Text>
        </TouchableOpacity>

        {/* 下一页 */}
        <TouchableOpacity
          style={[styles.navBtn, currentPage === book.length - 1 && styles.navBtnDisabled]}
          onPress={nextPage}
          disabled={currentPage === book.length - 1}
        >
          <Text style={styles.navBtnText}>下一页 ▶</Text>
        </TouchableOpacity>
      </View>

      {/* 声音选择（紧凑模式） */}
      <View style={styles.voiceBar}>
        <Text style={styles.voiceLabel}>
          🎙️ {activeRole === 'mother' ? '妈妈' : activeRole === 'father' ? '爸爸' : '声音'}的声音
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  toolBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  toolBtnText: { fontSize: 13, color: '#666' },
  toolCenter: { flex: 1, alignItems: 'center' },
  bookTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  toolRight: {},
  page: { width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  imageArea: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  pageImage: { width: '80%', height: '100%' },
  placeholderEmoji: { fontSize: 80, textAlign: 'center' },
  textArea: { paddingVertical: 20, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, width: '100%', minHeight: 100 },
  pinyinText: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  contentText: { fontSize: 22, lineHeight: 36, color: '#333', textAlign: 'center', fontWeight: '500' },
  pageNumber: { position: 'absolute', bottom: 8, right: 16 },
  pageNumberText: { fontSize: 12, color: '#BBB' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F5F5F5' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 13, color: '#666' },
  playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF8C42', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  playBtnText: { fontSize: 22 },
  autoBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F0F0F0' },
  autoBtnActive: { backgroundColor: '#E8F5E9' },
  autoBtnText: { fontSize: 12, color: '#888' },
  autoBtnTextActive: { color: '#4CAF50' },
  voiceBar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF8E7', alignItems: 'center' },
  voiceLabel: { fontSize: 13, color: '#CC7722' },
});
