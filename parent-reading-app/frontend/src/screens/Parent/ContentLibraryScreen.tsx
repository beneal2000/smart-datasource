/**
 * 内容库页面 - 古诗/故事浏览
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { id: 'poem', label: '古诗' },
  { id: 'story', label: '故事' },
];

export default function ContentLibraryScreen() {
  const [activeTab, setActiveTab] = useState('poem');
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索古诗或故事..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 内容列表 */}
      <FlatList
        data={[]}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>加载中...</Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  searchBar: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, fontSize: 14, borderWidth: 1, borderColor: '#EEE' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE' },
  tabActive: { backgroundColor: '#FF6B6B' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#FFF', fontWeight: 'bold' },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#999' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  cardTitle: { fontSize: 16, color: '#333' },
});
