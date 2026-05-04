import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useCategories } from '../../src/hooks/useCategories';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useAddTransaction } from '../../src/hooks/useTransactions';
import { TransactionType } from '../../src/types';
import { todayISO, formatCurrency } from '../../src/utils/formatters';
import { Ionicons } from '@expo/vector-icons';

function toDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function toISODate(display: string): string | null {
  const parts = display.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{
    tipo?: string;
    categoria_nome?: string;
    descricao?: string;
  }>();

  const [tipo, setTipo] = useState<TransactionType>(
    (params.tipo as TransactionType) ?? 'despesa',
  );
  const [amountCents, setAmountCents] = useState('0');
  const [descricao, setDescricao] = useState(params.descricao ?? '');
  const [displayDate, setDisplayDate] = useState(toDisplayDate(todayISO()));
  const [categoriaId, setCategoriaId] = useState('');
  const [contaId, setContaId] = useState('');
  const [observacao, setObservacao] = useState('');

  const { data: categories } = useCategories(tipo);
  const { data: accounts } = useAccounts();
  const addTransaction = useAddTransaction();

  // Seleciona primeira conta automaticamente
  useEffect(() => {
    if (accounts?.length && !contaId) {
      setContaId(accounts[0].id);
    }
  }, [accounts]);

  // Pre-seleciona categoria pelo nome (vindo dos atalhos)
  useEffect(() => {
    if (params.categoria_nome && categories?.length) {
      const match = categories.find(c =>
        c.nome.toLowerCase().includes(params.categoria_nome!.toLowerCase()),
      );
      if (match) setCategoriaId(match.id);
    }
  }, [categories, params.categoria_nome]);

  // Reset categoria ao trocar tipo
  useEffect(() => {
    setCategoriaId('');
  }, [tipo]);

  const amountValue = parseInt(amountCents || '0') / 100;
  const isIncome = tipo === 'receita';

  function handleAmountInput(text: string) {
    const digits = text.replace(/\D/g, '');
    setAmountCents(digits || '0');
  }

  async function handleSave() {
    if (amountValue <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }
    if (!descricao.trim()) {
      Alert.alert('Descrição obrigatória', 'Informe uma descrição.');
      return;
    }
    if (!categoriaId) {
      Alert.alert('Categoria obrigatória', 'Selecione uma categoria.');
      return;
    }
    if (!contaId) {
      Alert.alert('Conta obrigatória', 'Selecione uma conta.');
      return;
    }
    const isoDate = toISODate(displayDate);
    if (!isoDate) {
      Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }

    await addTransaction.mutateAsync({
      data: isoDate,
      descricao: descricao.trim(),
      valor: amountValue,
      tipo,
      categoria_id: categoriaId,
      conta_id: contaId,
      observacao: observacao.trim(),
    });

    router.back();
  }

  const accentColor = isIncome ? '#22c55e' : '#ef4444';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Transação</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Tipo toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, !isIncome && { backgroundColor: '#ef444420', borderColor: '#ef4444' }]}
              onPress={() => setTipo('despesa')}
            >
              <Text style={[styles.typeBtnText, !isIncome && { color: '#ef4444' }]}>
                Despesa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, isIncome && { backgroundColor: '#22c55e20', borderColor: '#22c55e' }]}
              onPress={() => setTipo('receita')}
            >
              <Text style={[styles.typeBtnText, isIncome && { color: '#22c55e' }]}>
                Receita
              </Text>
            </TouchableOpacity>
          </View>

          {/* Valor */}
          <View style={styles.amountBox}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: accentColor }]}
              value={(parseInt(amountCents || '0') / 100)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              onChangeText={handleAmountInput}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          {/* Descrição */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Combustível no posto"
              placeholderTextColor="#475569"
              value={descricao}
              onChangeText={setDescricao}
              returnKeyType="done"
            />
          </View>

          {/* Data */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Data</Text>
            <View style={styles.dateRow}>
              {['Hoje', 'Ontem'].map((label, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const iso = d.toISOString().split('T')[0];
                const display = toDisplayDate(iso);
                const active = displayDate === display;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    onPress={() => setDisplayDate(display)}
                  >
                    <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                      {label}
                    </Text>
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

          {/* Categorias */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {categories?.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    categoriaId === cat.id && { backgroundColor: cat.cor + '25', borderColor: cat.cor },
                  ]}
                  onPress={() => setCategoriaId(cat.id)}
                >
                  <Text style={styles.catEmoji}>{cat.icone}</Text>
                  <Text style={[styles.catLabel, categoriaId === cat.id && { color: cat.cor }]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Conta */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Conta</Text>
            {accounts?.length === 0 ? (
              <Text style={styles.noAccountText}>
                Nenhuma conta cadastrada. Adicione uma conta primeiro.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
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
            )}
          </View>

          {/* Observação */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Observação (opcional)</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
              placeholder="Alguma nota?"
              placeholderTextColor="#475569"
              value={observacao}
              onChangeText={setObservacao}
              multiline
            />
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Botão salvar */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor }, addTransaction.isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={addTransaction.isPending}
          >
            {addTransaction.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isIncome ? 'Registrar Receita' : 'Registrar Despesa'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  content: { padding: 20, gap: 20 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  currencySymbol: { fontSize: 24, fontWeight: '700', color: '#64748b' },
  amountInput: { fontSize: 42, fontWeight: '800', minWidth: 120, textAlign: 'center' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#f8fafc',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  dateChipActive: { backgroundColor: '#4f46e520', borderWidth: 1, borderColor: '#4f46e5' },
  dateChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  dateChipTextActive: { color: '#818cf8' },
  dateInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#f8fafc',
  },
  chipsScroll: { flexGrow: 0 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  catEmoji: { fontSize: 15 },
  catLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  accChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
    alignItems: 'center',
    gap: 2,
  },
  accChipActive: { borderColor: '#4f46e5', backgroundColor: '#4f46e520' },
  accLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  accLabelActive: { color: '#818cf8' },
  accBalance: { fontSize: 11, color: '#475569' },
  noAccountText: { color: '#475569', fontSize: 14 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
