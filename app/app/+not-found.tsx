import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Não encontrado' }} />
      <View style={styles.container}>
        <Text style={styles.text}>Tela não encontrada</Text>
        <Link href="/" style={styles.link}>
          Voltar para o início
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  text: { fontSize: 18, color: '#f8fafc', marginBottom: 16 },
  link: { color: '#4f46e5', fontSize: 16 },
});
