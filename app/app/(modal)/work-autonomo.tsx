import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAutonomoReceitas, useMarcarRecebido } from '../../src/hooks/useAutonomoIncome';
import { useCategories } from '../../src/hooks/useCategories';
import { formatCurrency, formatDate, currentMonthKey } from '../../src/utils/formatters';
import { AutonomoReceita } from '../../src/types';

export default function WorkAutonomoScreen() {
  const { data: receitas, isLoading, refetch } = useAutonomoReceitas();
  const { data: categories } = useCategories('receita');
  const marcarRecebido = useMarcarRecebido();

  const monthKey = currentMonthKey();
  const mesReceitas = receitas?.filter(r => r.data.startsWith(monthKey)) ?? [];
  const recebido = mesReceitas.filter(r => r.status === 'recebido').reduce((s, r) => s + r.valor, 0);
  const pendente = mesReceitas.filter(r => r.status === 'pendente').reduce((s, r) => s + r.valor, 0);

  function handleMarcar(receita: AutonomoReceita, index: number) {
    if (receita.status === 'recebido') return;
    const catFreela = categories?.find(
      c => c.nome.toLowerCase().includes('freelance') || c.nome.toLowerCase().includes('autônom')
    ) ?? categories?.[0];

    Alert.alert(
      'Marcar como recebido',
      `Confirmar recebimento de ${formatCurrency(receita.valor)} de ${receita.cliente}?\n\nIsso vai lançar a receita automaticamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => marcarRecebido.mutate({
            receita,
            rowIndex: index,
            categoriaId: catFreela?.id ?? '',
          }),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👩‍💼 Maynara — Autônoma</Text>
        <TouchableOpacity
          onPress={() => router.push('/(modal)/new-autonomo-income')}
          hitSlop={12}
        >
          <Ionicons name="add-circle" size={26} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Resumo do mês */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Recebido</Text>
          <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{formatCurrency(recebido)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pendente</Text>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{formatCurrency(pendente)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(recebido + pendente)}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#22c55e" size="large" />
        </View>
      ) : (
        <FlatList
          data={receitas}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#22c55e" />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>💼</Text>
              <Text style={styles.emptyText}>Nenhum serviço registrado</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(modal)/new-autonomo-income')}
              >
                <Text style={styles.emptyBtnText}>Registrar primeiro serviço</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => (
            <IncomeCard
              receita={item}
              onMarcar={() => handleMarcar(item, index)}
              isPending={marcarRecebido.isPending}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(modal)/new-autonomo-income')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function IncomeCard({ receita, onMarcar, isPending }: {
  receita: AutonomoReceita;
  onMarcar: () => void;
  isPending: boolean;
}) {
  const isRecebido = receita.status === 'recebido';
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.statusDot, { backgroundColor: isRecebido ? '#22c55e' : '#f59e0b' }]} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardCliente}>{receita.cliente}</Text>
          <Text style={styles.cardDesc}>{receita.descricao}</Text>
          <Text style={styles.cardDate}>{formatDate(receita.data)}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardValue, { color: isRecebido ? '#22c55e' : '#f8fafc' }]}>
          {formatCurrency(receita.valor)}
        </Text>
        {!isRecebido ? (
          <TouchableOpacity
            style={styles.receberBtn}
            onPress={onMarcar}
            disabled={isPending}
          >
            <Text style={styles.receberBtnText}>Receber</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recebidoBadge}>
            <Text style={styles.recebidoText}>✓ Recebido</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },

  summary: {
    flexDirection: 'row', backgroundColor: '#1e293b',
    marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  summaryValue: { fontSize: 15, fontWeight: '800', color: '#f8fafc' },
  summaryDivider: { width: 1, backgroundColor: '#334155', marginHorizontal: 4 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardInfo: { flex: 1, gap: 2 },
  cardCliente: { fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  cardDesc: { fontSize: 12, color: '#64748b' },
  cardDate: { fontSize: 11, color: '#475569' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardValue: { fontSize: 15, fontWeight: '800' },

  receberBtn: { backgroundColor: '#22c55e20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  receberBtnText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  recebidoBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  recebidoText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },

  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: '#475569', fontSize: 15 },
  emptyBtn: { backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});
