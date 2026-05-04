import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAddAutonomoReceita } from '../../src/hooks/useAutonomoIncome';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useCategories } from '../../src/hooks/useCategories';
import { AutonomoStatus } from '../../src/types';
import { todayISO, formatCurrency } from '../../src/utils/formatters';

function toDisplay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function toISO(display: string) {
  const p = display.split('/');
  if (p.length !== 3 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1]}-${p[0]}`;
}

export default function NewAutonomoIncomeScreen() {
  const [descricao, setDescricao]   = useState('');
  const [cliente, setCliente]       = useState('');
  const [amountCents, setAmountCents] = useState('0');
  const [displayDate, setDisplayDate] = useState(toDisplay(todayISO()));
  const [contaId, setContaId]       = useState('');
  const [status, setStatus]         = useState<AutonomoStatus>('pendente');

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories('receita');
  const addReceita = useAddAutonomoReceita();

  useEffect(() => {
    if (accounts?.length && !contaId) setContaId(accounts[0].id);
  }, [accounts]);

  const valor = parseInt(amountCents || '0') / 100;

  function handleAmountInput(text: string) {
    setAmountCents(text.replace(/\D/g, '') || '0');
  }

  async function handleSave() {
    if (!cliente.trim()) { Alert.alert('Cliente obrigatório'); return; }
    if (!descricao.trim()) { Alert.alert('Descrição obrigatória'); return; }
    if (valor <= 0) { Alert.alert('Informe um valor maior que zero'); return; }
    if (!contaId) { Alert.alert('Selecione a conta'); return; }

    const isoDate = toISO(displayDate);
    if (!isoDate) { Alert.alert('Data inválida', 'Use DD/MM/AAAA'); return; }

    const catFreela = categories?.find(
      c => c.nome.toLowerCase().includes('freelance') || c.nome.toLowerCase().includes('autônom')
    ) ?? categories?.find(c => c.tipo === 'receita') ?? categories?.[0];

    await addReceita.mutateAsync({
      data: isoDate,
      descricao: descricao.trim(),
      cliente: cliente.trim(),
      valor,
      conta_id: contaId,
      status,
      categoriaId: catFreela?.id ?? '',
    });

    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Serviço</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Valor */}
          <View style={styles.amountBox}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={(parseInt(amountCents || '0') / 100)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              onChangeText={handleAmountInput}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          {/* Cliente */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do cliente ou empresa"
              placeholderTextColor="#475569"
              value={cliente}
              onChangeText={setCliente}
            />
          </View>

          {/* Descrição */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Serviço / Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Desenvolvimento de site, Consultoria..."
              placeholderTextColor="#475569"
              value={descricao}
              onChangeText={setDescricao}
            />
          </View>

          {/* Data */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Data</Text>
            <View style={styles.dateRow}>
              {['Hoje', 'Ontem'].map((label, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const display = toDisplay(d.toISOString().split('T')[0]);
                const active = displayDate === display;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDisplayDate(display)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TextInput
                style={styles.dateInput}
                value={displayDate}
                onChangeText={setDisplayDate}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Status */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Status do pagamento</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'pendente' && styles.statusPendente]}
                onPress={() => setStatus('pendente')}
              >
                <Ionicons name="time-outline" size={16} color={status === 'pendente' ? '#f59e0b' : '#475569'} />
                <Text style={[styles.statusBtnText, status === 'pendente' && { color: '#f59e0b' }]}>
                  Pendente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'recebido' && styles.statusRecebido]}
                onPress={() => setStatus('recebido')}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={status === 'recebido' ? '#22c55e' : '#475569'} />
                <Text style={[styles.statusBtnText, status === 'recebido' && { color: '#22c55e' }]}>
                  Já recebido
                </Text>
              </TouchableOpacity>
            </View>
            {status === 'recebido' && (
              <Text style={styles.statusHint}>
                A transação será lançada automaticamente ao salvar.
              </Text>
            )}
          </View>

          {/* Conta */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Conta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {accounts?.map(acc => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.accChip, contaId === acc.id && styles.accChipActive]}
                  onPress={() => setContaId(acc.id)}
                >
                  <Text style={[styles.accLabel, contaId === acc.id && styles.accLabelActive]}>
                    {acc.nome}
                  </Text>
                  <Text style={styles.accBalance}>{formatCurrency(acc.saldo_atual)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, addReceita.isPending && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={addReceita.isPending}
          >
            {addReceita.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Salvar serviço</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  content: { padding: 20, gap: 18 },

  amountBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1e293b', borderRadius: 16, padding: 20, gap: 8,
  },
  currencySymbol: { fontSize: 24, fontWeight: '700', color: '#64748b' },
  amountInput: { fontSize: 42, fontWeight: '800', color: '#22c55e', minWidth: 120, textAlign: 'center' },

  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', letterSpacing: 0.4 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, fontSize: 15, color: '#f8fafc' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b' },
  chipActive: { backgroundColor: '#4f46e520', borderWidth: 1, borderColor: '#4f46e5' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#818cf8' },
  dateInput: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#f8fafc',
  },

  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: 'transparent',
  },
  statusPendente: { borderColor: '#f59e0b', backgroundColor: '#f59e0b10' },
  statusRecebido: { borderColor: '#22c55e', backgroundColor: '#22c55e10' },
  statusBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  statusHint: { fontSize: 11, color: '#22c55e', marginTop: 4 },

  accChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'transparent',
    marginRight: 8, alignItems: 'center', gap: 2,
  },
  accChipActive: { borderColor: '#22c55e', backgroundColor: '#22c55e10' },
  accLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  accLabelActive: { color: '#22c55e' },
  accBalance: { fontSize: 11, color: '#475569' },

  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  saveBtn: { backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
