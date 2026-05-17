/**
 * 会员订阅页面
 *
 * 展示免费版与付费版对比，支持选择月/年套餐。
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  { name: '古诗内容', free: '5首', premium: '329首全部', icon: '📜' },
  { name: '故事内容', free: '3篇', premium: '无限', icon: '📖' },
  { name: '声音克隆', free: '1个', premium: '4个(全家)', icon: '🎙️' },
  { name: '音质', free: '标准', premium: '高清', icon: '🔊' },
  { name: '离线播放', free: '✗', premium: '✓', icon: '📥' },
  { name: '声音相册导出', free: '✗', premium: '✓', icon: '💿' },
  { name: '互动绘本', free: '✗', premium: '✓', icon: '🎨' },
  { name: '情感韵律', free: '✗', premium: '✓', icon: '🎵' },
  { name: '背景白噪音', free: '✓', premium: '✓', icon: '🌙' },
  { name: '睡眠定时', free: '✓', premium: '✓', icon: '⏰' },
  { name: '语速调节', free: '✓', premium: '✓', icon: '🐢' },
];

export default function SubscriptionScreen({ navigation }: any) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = () => {
    Alert.alert(
      '确认订阅',
      selectedPlan === 'yearly'
        ? '年度会员 ¥198/年（¥16.5/月，5.9折）'
        : '月度会员 ¥28/月',
      [
        { text: '取消', style: 'cancel' },
        { text: '确认支付', onPress: () => {
          Alert.alert('支付', '模拟支付成功！会员已开通。');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>⭐</Text>
          <Text style={styles.headerTitle}>升级会员</Text>
          <Text style={styles.headerDesc}>解锁全部内容，让声音永远陪伴</Text>
        </View>

        {/* 套餐选择 */}
        <View style={styles.planCards}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('yearly')}
          >
            {selectedPlan === 'yearly' && (
              <View style={styles.bestValue}>
                <Text style={styles.bestValueText}>最划算</Text>
              </View>
            )}
            <Text style={styles.planName}>年度会员</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>¥</Text>
              <Text style={styles.priceAmount}>198</Text>
              <Text style={styles.pricePeriod}>/年</Text>
            </View>
            <Text style={styles.priceNote}>≈ ¥16.5/月 · 省¥138</Text>
            <Text style={styles.originalPrice}>原价 ¥336</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={styles.planName}>月度会员</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>¥</Text>
              <Text style={styles.priceAmount}>28</Text>
              <Text style={styles.pricePeriod}>/月</Text>
            </View>
            <Text style={styles.priceNote}>按月续费，随时取消</Text>
          </TouchableOpacity>
        </View>

        {/* 功能对比 */}
        <View style={styles.comparison}>
          <Text style={styles.compTitle}>功能对比</Text>
          <View style={styles.compHeader}>
            <Text style={[styles.compCol, { flex: 2 }]}>功能</Text>
            <Text style={styles.compCol}>免费版</Text>
            <Text style={[styles.compCol, styles.compColPremium]}>会员版</Text>
          </View>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.compRow, i % 2 === 0 && styles.compRowAlt]}>
              <Text style={[styles.compCell, { flex: 2 }]}>{f.icon} {f.name}</Text>
              <Text style={styles.compCell}>{f.free}</Text>
              <Text style={[styles.compCell, styles.compCellPremium]}>{f.premium}</Text>
            </View>
          ))}
        </View>

        {/* 订阅按钮 */}
        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
          <Text style={styles.subscribeBtnText}>
            立即开通{selectedPlan === 'yearly' ? '年度' : '月度'}会员
          </Text>
        </TouchableOpacity>

        {/* 说明 */}
        <Text style={styles.disclaimer}>
          · 支付后即时生效，可随时在设置中取消续费{'\n'}
          · 取消后权益保留至到期日{'\n'}
          · 如有疑问请联系客服
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  headerDesc: { fontSize: 14, color: '#888', marginTop: 4 },
  planCards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#EEE', elevation: 1 },
  planCardActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' },
  bestValue: { position: 'absolute', top: -10, backgroundColor: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  bestValueText: { fontSize: 11, color: '#FFF', fontWeight: 'bold' },
  planName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceCurrency: { fontSize: 16, color: '#FF6B6B', fontWeight: 'bold' },
  priceAmount: { fontSize: 32, fontWeight: 'bold', color: '#FF6B6B' },
  pricePeriod: { fontSize: 14, color: '#888' },
  priceNote: { fontSize: 12, color: '#4CAF50', marginTop: 6 },
  originalPrice: { fontSize: 12, color: '#BBB', textDecorationLine: 'line-through', marginTop: 2 },
  comparison: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20 },
  compTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  compHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  compCol: { flex: 1, fontSize: 12, fontWeight: 'bold', color: '#666', textAlign: 'center' },
  compColPremium: { color: '#FF6B6B' },
  compRow: { flexDirection: 'row', paddingVertical: 10 },
  compRowAlt: { backgroundColor: '#FAFAFA' },
  compCell: { flex: 1, fontSize: 13, color: '#555', textAlign: 'center' },
  compCellPremium: { color: '#FF6B6B', fontWeight: '500' },
  subscribeBtn: { backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 28, alignItems: 'center', elevation: 3, marginBottom: 16 },
  subscribeBtnText: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  disclaimer: { fontSize: 11, color: '#BBB', textAlign: 'center', lineHeight: 18 },
});
