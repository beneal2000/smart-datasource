/**
 * 儿童收藏页面
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAMPLE_FAVORITES = [
  { id: '1', title: '静夜思', emoji: '🌙', type: 'poem' },
  { id: '2', title: '小蝌蚪找妈妈', emoji: '🐸', type: 'story' },
  { id: '3', title: '咏鹅', emoji: '🦢', type: 'poem' },
];

export default function ChildFavoritesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {SAMPLE_FAVORITES.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyText}>还没有收藏哦</Text>
          <Text style={styles.emptyHint}>去故事屋找找喜欢的吧~</Text>
        </View>
      ) : (
        <FlatList
          data={SAMPLE_FAVORITES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardType}>
                  {item.type === 'poem' ? '古诗' : '故事'}
                </Text>
              </View>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  emptyHint: { fontSize: 14, color: '#999', marginTop: 4 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardEmoji: { fontSize: 32, marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardType: { fontSize: 12, color: '#999', marginTop: 2 },
  playIcon: { fontSize: 24 },
});
