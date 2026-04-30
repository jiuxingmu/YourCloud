import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { ScalePressable } from '../../ui/ScalePressable';
import { filesStyles as styles } from './filesStyles';

type FilesPathBarProps = {
  pathLabel: string;
  canGoBack: boolean;
  onBack: () => void;
};

export function FilesPathBar({ pathLabel, canGoBack, onBack }: FilesPathBarProps) {
  return (
    <View style={styles.pathBar}>
      <ScalePressable onPress={onBack} style={[styles.pathBack, !canGoBack && styles.pathBackDisabled]} disabled={!canGoBack}>
        <Feather name="chevron-left" size={14} color={!canGoBack ? '#A7B0BE' : '#4B5563'} />
      </ScalePressable>
      <Text style={styles.pathText} numberOfLines={1}>
        {pathLabel}
      </Text>
    </View>
  );
}
