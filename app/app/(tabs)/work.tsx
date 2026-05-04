import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCLTConfig } from '../../src/hooks/useCLT';
import { useAutonomoReceitas } from '../../src/hooks/useAutonomoIncome';
import { calcSalarioLiquido, proximoPagamento } from '../../src/utils/clt';
import { formatCurrency, currentMonthKey } from '../../src/utils/formatters';

export default function WorkScreen() {
  const { data: clt, isLoading: loadingCLT, refetch: refetchCLT } = useCLTConfig();
  const { data: receitas, isLoading: loadingAut, refetch: refetchAut } = useAutonomoReceitas();

  const monthKey = currentMonthKey();
  const mesReceitas = receitas?.filter(r => r.data.startsWith(monthKey)) ?? [];
  const recebido = mesReceitas.filter(r => r.status === 'recebido').reduce((s, r) => s + r.valor, 0);
  const pendente = mesReceitas.filter(r => r.status === 'pendente').reduce((s, r) => s + r.valor, 0);

  const cltCalc = clt ? calcSalarioLiquido(clt) : null;
  const proximoPag = clt ? proximoPagamento(clt.dia_pagamento) : '—';

  function onRefresh() {
    refetchCLT();
    refetchAut();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        <Text style={styles.pageTitle}>Área de Trabalho</Text>

        {/* Card Dereck - CLT */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.emoji}>👨‍💼</Text>
              <View>
                <Text style={styles.personName}>Dereck</Text>
                <View style={[styles.badge, { backgroundColor: '#4f46e520' }]}>
                  <Text style={[styles.badgeText, { color: '#818cf8' }]}>CLT</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(modal)/work-clt')}
            >
              <Ionicons name="settings-outline" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loadingCLT ? (
            <ActivityIndicator color="#4f46e5" style={{ marginVertical: 16 }} />
          ) : cltCalc && cltCalc.bruto > 0 ? (
            <>
              <Text style={styles.salaryLabel}>Salário líquido</Text>
              <Text style={styles.salaryValue}>{formatCurrency(cltCalc.liquido)}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>Bruto {formatCurrency(cltCalc.bruto)}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.infoText}>Próximo pagamento {proximoPag}</Text>
              </View>
              <View style={styles.deductionRow}>
                <DeductionBadge label="INSS" value={cltCalc.inss} color="#f97316" />
                <DeductionBadge label="IR" value={cltCalc.ir} color="#ef4444" />
                {cltCalc.beneficios > 0 && (
                  <DeductionBadge label="Benefícios" value={cltCalc.beneficios} color="#22c55e" plus />
                )}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Configure seu salário CLT</Text>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(modal)/work-clt')}
          >
            <Text style={styles.actionBtnText}>
              {cltCalc && cltCalc.bruto > 0 ? 'Registrar recebimento' : 'Configurar'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#818cf8" />
          </TouchableOpacity>
        </View>

        {/* Card Maynara - Autônoma */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.emoji}>👩‍💼</Text>
              <View>
                <Text style={styles.personName}>Maynara</Text>
                <View style={[styles.badge, { backgroundColor: '#22c55e20' }]}>
                  <Text style={[styles.badgeText, { color: '#22c55e' }]}>Autônoma</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(modal)/work-autonomo')}
            >
              <Ionicons name="open-outline" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loadingAut ? (
            <ActivityIndicator color="#22c55e" style={{ marginVertical: 16 }} />
          ) : (
            <>
              <Text style={styles.salaryLabel}>Este mês</Text>
              <Text style={[styles.salaryValue, { color: '#22c55e' }]}>{formatCurrency(recebido)}</Text>
              {pendente > 0 && (
                <View style={styles.pendingRow}>
                  <Ionicons name="time-outline" size={14} color="#f59e0b" />
                  <Text style={styles.pendingText}>Pendente: {formatCurrency(pendente)}</Text>
                </View>
              )}
              <Text style={styles.infoText}>
                {mesReceitas.length} serviço{mesReceitas.length !== 1 ? 's' : ''} este mês
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: '#22c55e30' }]}
            onPress={() => router.push('/(modal)/work-autonomo')}
          >
            <Text style={[styles.actionBtnText, { color: '#22c55e' }]}>Ver serviços</Text>
            <Ionicons name="arrow-forward" size={16} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeductionBadge({ label, value, color, plus }: {
  label: string; value: number; color: string; plus?: boolean
}) {
  return (
    <View style={[styles.deductionBadge, { backgroundColor: color + '15' }]}>
      <Text style={[styles.deductionText, { color }]}>
        {plus ? '+' : '-'} {label} {formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },

  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 18, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 32 },
  personName: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  editBtn: { padding: 4 },

  salaryLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  salaryValue: { fontSize: 28, fontWeight: '800', color: '#f8fafc' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#64748b' },
  dot: { color: '#334155' },
  deductionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deductionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deductionText: { fontSize: 11, fontWeight: '600' },

  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingText: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },

  emptyText: { fontSize: 14, color: '#475569', paddingVertical: 8 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#818cf8' },
});
