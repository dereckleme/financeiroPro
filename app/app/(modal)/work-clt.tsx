import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCLTConfig, useSaveCLTConfig, useRegisterSalario } from '../../src/hooks/useCLT';
import { useAccounts } from '../../src/hooks/useAccounts';
import { useCategories } from '../../src/hooks/useCategories';
import { calcSalarioLiquido, proximoPagamento } from '../../src/utils/clt';
import { formatCurrency, currentMonthKey } from '../../src/utils/formatters';
import { CLTConfig } from '../../src/types';

function Field({ label, value, onChangeText, keyboardType = 'numeric', prefix }: {
  label: string; value: string; onChangeText: (t: string) => void;
  keyboardType?: 'numeric' | 'default'; prefix?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, prefix && { paddingLeft: 4 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor="#475569"
          placeholder="0"
        />
      </View>
    </View>
  );
}

export default function WorkCLTScreen() {
  const { data: config, isLoading } = useCLTConfig();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories('receita');
  const saveConfig = useSaveCLTConfig();
  const registerSalario = useRegisterSalario();

  const [form, setForm] = useState<Record<string, string>>({});
  const [contaId, setContaId] = useState('');

  useEffect(() => {
    if (config) {
      setForm({
        salario_bruto:    String(config.salario_bruto),
        vr_diario:        String(config.vr_diario),
        dias_uteis:       String(config.dias_uteis),
        va_mensal:        String(config.va_mensal),
        vt_mensal:        String(config.vt_mensal),
        inss_override:    String(config.inss_override),
        ir_override:      String(config.ir_override),
        outros_descontos: String(config.outros_descontos),
        dia_pagamento:    String(config.dia_pagamento),
      });
      setContaId(config.conta_id || (accounts?.[0]?.id ?? ''));
    }
  }, [config, accounts]);

  function n(key: string) { return parseFloat(form[key] || '0'); }

  const calc = calcSalarioLiquido({
    salario_bruto:    n('salario_bruto'),
    vr_diario:        n('vr_diario'),
    dias_uteis:       n('dias_uteis'),
    va_mensal:        n('va_mensal'),
    vt_mensal:        n('vt_mensal'),
    inss_override:    n('inss_override'),
    ir_override:      n('ir_override'),
    outros_descontos: n('outros_descontos'),
  });

  async function handleSave() {
    const updated: CLTConfig = {
      salario_bruto:    n('salario_bruto'),
      vr_diario:        n('vr_diario'),
      dias_uteis:       n('dias_uteis') || 22,
      va_mensal:        n('va_mensal'),
      vt_mensal:        n('vt_mensal'),
      inss_override:    n('inss_override'),
      ir_override:      n('ir_override'),
      outros_descontos: n('outros_descontos'),
      dia_pagamento:    n('dia_pagamento') || 5,
      conta_id:         contaId,
    };
    await saveConfig.mutateAsync(updated);
    Alert.alert('Salvo!', 'Configuração do CLT atualizada.');
  }

  async function handleRegister() {
    if (calc.liquido <= 0) {
      Alert.alert('Configure o salário', 'Informe o salário bruto primeiro.');
      return;
    }
    if (!contaId) {
      Alert.alert('Selecione a conta', 'Escolha a conta que receberá o salário.');
      return;
    }
    const catSalario = categories?.find(c => c.nome.toLowerCase().includes('salário') || c.nome.toLowerCase().includes('salario'));
    if (!catSalario) {
      Alert.alert('Categoria não encontrada', 'Crie uma categoria "Salário" na lista de categorias.');
      return;
    }
    Alert.alert(
      'Registrar salário',
      `Registrar ${formatCurrency(calc.liquido)} de salário líquido em ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: async () => {
            await registerSalario.mutateAsync({
              liquido: calc.liquido,
              conta_id: contaId,
              categoriaId: catSalario.id,
              mes: currentMonthKey(),
            });
            Alert.alert('Registrado!', 'Salário lançado nas transações.');
          },
        },
      ],
    );
  }

  function set(key: string) {
    return (val: string) => setForm(f => ({ ...f, [key]: val }));
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👨‍💼 Dereck — CLT</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Resumo */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Salário líquido estimado</Text>
            <Text style={styles.summaryValue}>{formatCurrency(calc.liquido)}</Text>
            <View style={styles.summaryRow}>
              <SummaryItem label="Bruto"       value={calc.bruto}      />
              <SummaryItem label="+ Benefícios" value={calc.beneficios} color="#22c55e" />
              <SummaryItem label="- INSS"       value={calc.inss}       color="#f97316" minus />
              <SummaryItem label="- IR"         value={calc.ir}         color="#ef4444" minus />
            </View>
          </View>

          {/* Salário */}
          <SectionTitle title="Salário" />
          <Field label="Salário bruto (R$)" value={form.salario_bruto ?? '0'} onChangeText={set('salario_bruto')} prefix="R$" />
          <Field label="Dia de pagamento"   value={form.dia_pagamento ?? '5'} onChangeText={set('dia_pagamento')} />

          {/* Benefícios */}
          <SectionTitle title="Benefícios" />
          <Field label="Vale Refeição (R$/dia)" value={form.vr_diario ?? '0'} onChangeText={set('vr_diario')} prefix="R$" />
          <Field label="Dias úteis no mês"      value={form.dias_uteis ?? '22'} onChangeText={set('dias_uteis')} />
          <Field label="Vale Alimentação (R$/mês)" value={form.va_mensal ?? '0'} onChangeText={set('va_mensal')} prefix="R$" />
          <Field label="Vale Transporte (R$/mês)"  value={form.vt_mensal ?? '0'} onChangeText={set('vt_mensal')} prefix="R$" />

          {/* Descontos */}
          <SectionTitle title="Descontos (deixe 0 para cálculo automático)" />
          <Field label={`INSS (auto: ${formatCurrency(calc.inss)})`} value={form.inss_override ?? '0'} onChangeText={set('inss_override')} prefix="R$" />
          <Field label={`IR (auto: ${formatCurrency(calc.ir)})`}     value={form.ir_override ?? '0'}   onChangeText={set('ir_override')} prefix="R$" />
          <Field label="Outros descontos (R$)"                        value={form.outros_descontos ?? '0'} onChangeText={set('outros_descontos')} prefix="R$" />

          {/* Conta */}
          <SectionTitle title="Conta de depósito" />
          <View style={styles.accountRow}>
            {accounts?.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.accChip, contaId === acc.id && styles.accChipActive]}
                onPress={() => setContaId(acc.id)}
              >
                <Text style={[styles.accLabel, contaId === acc.id && styles.accLabelActive]}>
                  {acc.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 8 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saveConfig.isPending}>
            {saveConfig.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Salvar configuração</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={registerSalario.isPending}>
            {registerSalario.isPending
              ? <ActivityIndicator color="#22c55e" />
              : <Text style={styles.registerBtnText}>Registrar salário do mês</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SummaryItem({ label, value, color, minus }: {
  label: string; value: number; color?: string; minus?: boolean;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={[styles.summaryItemValue, color ? { color } : {}]}>
        {minus ? '-' : ''}{formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  loading: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  content: { padding: 16, gap: 10, paddingBottom: 8 },

  summaryCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, gap: 8, marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryValue: { fontSize: 30, fontWeight: '800', color: '#f8fafc' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  summaryItem: { gap: 1 },
  summaryItemLabel: { fontSize: 10, color: '#64748b' },
  summaryItemValue: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#4f46e5', letterSpacing: 0.8, marginTop: 8 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 12, color: '#64748b' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12 },
  prefix: { color: '#475569', fontSize: 14 },
  input: { flex: 1, padding: 12, fontSize: 15, color: '#f8fafc' },

  accountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'transparent' },
  accChipActive: { borderColor: '#4f46e5', backgroundColor: '#4f46e520' },
  accLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  accLabelActive: { color: '#818cf8' },

  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  saveBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  registerBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#22c55e' },
  registerBtnText: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
});
