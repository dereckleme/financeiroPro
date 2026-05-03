import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../types';

interface Props {
  category: Category;
  selected?: boolean;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, selected, size = 'md' }: Props) {
  const isSm = size === 'sm';
  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        selected && { backgroundColor: category.cor + '30', borderColor: category.cor },
        !selected && styles.unselected,
      ]}
    >
      <Text style={isSm ? styles.emojiSm : styles.emoji}>{category.icone}</Text>
      <Text style={[styles.label, isSm && styles.labelSm, selected && { color: category.cor }]}>
        {category.nome}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unselected: {
    backgroundColor: '#1e293b',
  },
  emoji: {
    fontSize: 16,
  },
  emojiSm: {
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  labelSm: {
    fontSize: 12,
  },
});
