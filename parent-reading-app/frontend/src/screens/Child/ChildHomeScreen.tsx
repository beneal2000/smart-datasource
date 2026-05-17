/**
 * 儿童首页 - 故事屋
 *
 * 展示推荐内容，大卡片设计，点击即可播放
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 内容分类
const CATEGORIES = [
  { id: 'poem', label: '古诗', emoji: '📜' },
  { id: 'story', label: '故事', emoji: '📖' },
  { id: 'bedtime', label: '睡前', emoji: '🌙' },
];

// 示例数据
const SAMPLE_ITEMS = [
  { id: '1', title: '静夜思', subtitle: '李白', emoji: '🌙', type: 'poem', color: '#E8F4FD' },
  { id: '2', title: '小蝌蚪找妈妈', subtitle: '经典故事', emoji: '🐸', type: 'story', color: '#E8FDE8' },
  { id: '3', title: '春晓', subtitle: '孟浩然', emoji: '🌸', type: 'poem', color: '#FDE8F4' },
  { id: '4', title: '龟兔赛跑', subtitle: '寓言故事', emoji: '🐢', type: 'story', color: '#FDF4E8' },
  { id: '5', title: '咏鹅', subtitle: '骆宾王', emoji: '🦢', type: 'poem', color: '#F4E8FD' },
  { id: '6', title: '三只小猪', subtitle: '童话故事', emoji: '🐷', type: 'story', color: '#FDE8E8' },
];

export default function ChildHomeScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('poem');

  const filteredItems = SAMPLE_ITEMS.filter(
    (item) => activeCategory === 'bedtime' || item.type === activeCategory
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* 欢迎语 */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>今天想听什么呀？ 🎵</Text>
        </View>

        {/* 分类选择 */}
        <View style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                activeCategory === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  activeCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 内容卡片列表 */}
        <View style={styles.cardGrid}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: item.color }]}
              onPress={() => {
                // 导航到播放页面
                navigation.navigate('ChildPlayer', { contentId: item.id });
              }}
            >
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              <View style={styles.playHint}>
                <Text style={styles.playHintText}>点击播放 ▶️</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    borderColor: '#FF8C42',
    backgroundColor: '#FFF3E6',
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#FF8C42',
    fontWeight: 'bold',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  card: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  playHint: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playHintText: {
    fontSize: 12,
    color: '#FF8C42',
    fontWeight: 'bold',
  },
});
