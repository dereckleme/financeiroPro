import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useAccounts } from '../../src/hooks/useAccounts';
import BalanceCard from '../../src/components/BalanceCard';
import TransactionItem from '../../src/components/TransactionItem';
import { currentMonthKey } from '../../src/utils/formatters';

const SHORTCUTS = [
  { label: 'Combustível', emoji: '⛽', tipo: 'despesa', categoria_nome: 'Transporte',  descricao: 'Combustível'  },
  { label: 'Mercado',     emoji: '🛒', tipo: 'despesa', categoria_nome: 'Alimentação', descricao: 'Mercado'      },
  { label: 'Restaurante', emoji: '🍔', tipo: 'despesa', categoria_nome: 'Alimentação', descricao: 'Restaurante'  },
  { label: 'Farmácia',    emoji: '💊', tipo: 'despesa', categoria_nome: 'Saúde',        descricao: 'Farmácia'    },
  { label: 'Transporte',  emoji: '🚌', tipo: 'despesa', categoria_nome: 'Transporte',  descricao: 'Transporte'   },
  { label: 'Lazer',       emoji: '🎬', tipo: 'despesa', categoria_nome: 'Lazer',        descricao: ''            },
  { label: 'Salário',     emoji: '💰', tipo: 'receita', categoria_nome: 'Salário',      descricao: 'Salário'     },
  { label: 'Outro',       emoji: '➕', tipo: 'despesa', categoria_nome: '',             descricao: ''            },
] as const;

function openNew(params: { tipo: string; categoria_nome: string; descricao: string }) {
  router.push({ pathname: '/(modal)/new-transaction', params });
}

export default function DashboardScreen() {
  const { data: transactions, isLoading: loadingTx, refetch: refetchTx } = useTransactions();
  const { data: accounts,    isLoading: loadingAcc, refetch: refetchAcc } = useAccounts();

  const isLoading = loadingTx || loadingAcc;

  const totalBalance = accounts?.reduce((s, a) => s + a.saldo_atual, 0) ?? 0;
  const monthKey = currentMonthKey();
  const monthTxs = transactions?.filter(t => t.data.startsWith(monthKey)) ?? [];
  const totalIncome  = monthTxs.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalExpense = monthTxs.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const recent = transactions?.slice(0, 8) ?? [];

  async function onRefresh() {
    await Promise.all([refetchTx(), refetchAcc()]);
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#4f46e5" />
        }
      >
        <BalanceCard balance={totalBalance} income={totalIncome} expense={totalExpense} />

        {/* Atalhos rápidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registro rápido</Text>
          <View style={styles.shortcutsGrid}>
            {SHORTCUTS.map(s => (
              <TouchableOpacity
                key={s.label}
                style={styles.shortcut}
                onPress={() => openNew({ tipo: s.tipo, categoria_nome: s.categoria_nome, descricao: s.descricao })}
                activeOpacity={0.75}
              >
                <Text style={styles.shortcutEmoji}>{s.emoji}</Text>
                <Text style={styles.shortcutLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Últimas transações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas transações</Text>
          {recent.length === 0 ? (
            <Text style={styles.empty}>Nenhuma transação ainda. Use os atalhos acima!</Text>
          ) : (
            recent.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openNew({ tipo: 'despesa', categoria_nome: '', descricao: '' })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#0f172a' },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 100 },
  loading: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  empty:        { color: '#475569', textAlign: 'center', paddingVertical: 24, fontSize: 14 },

  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shortcut: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexGrow: 1,
  },
  shortcutEmoji: { fontSize: 22 },
  shortcutLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
