import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LightStatus = 'red' | 'yellow' | 'green';

type StatusLight = {
  id: number;
  name: string;
  status: LightStatus;
};

const statusOptions: {
  value: LightStatus;
  label: string;
  meaning: string;
  color: string;
}[] = [
  { value: 'red', label: 'Red', meaning: 'Stop', color: '#dc2626' },
  { value: 'yellow', label: 'Yellow', meaning: 'Wait', color: '#f59e0b' },
  { value: 'green', label: 'Green', meaning: 'Go', color: '#16a34a' },
];

const starterLights: StatusLight[] = [
  { id: 1, name: 'Dinner', status: 'yellow' },
  { id: 2, name: 'Nap', status: 'red' },
  { id: 3, name: 'Homework', status: 'green' },
  { id: 4, name: 'Laundry', status: 'yellow' },
  { id: 5, name: 'Garage', status: 'green' },
  { id: 6, name: 'Quiet Time', status: 'red' },
];

function getGridColumns(width: number) {
  if (width >= 1100) {
    return 4;
  }

  if (width >= 760) {
    return 3;
  }

  return 2;
}

function getNextId(lights: StatusLight[]) {
  return lights.reduce((largest, light) => Math.max(largest, light.id), 0) + 1;
}

export default function StatusBoardScreen() {
  const [lights, setLights] = useState(starterLights);
  const [newLightName, setNewLightName] = useState('');
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();

  const columns = getGridColumns(width);
  const isCompact = width < 640;
  const tileWidth = useMemo(() => `${100 / columns}%` as const, [columns]);

  const createLight = () => {
    const trimmedName = newLightName.trim();

    if (!trimmedName) {
      setError('Name a light first.');
      return;
    }

    const nameAlreadyExists = lights.some(
      (light) => light.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameAlreadyExists) {
      setError('That light already exists.');
      return;
    }

    setLights((currentLights) => [
      { id: getNextId(currentLights), name: trimmedName, status: 'yellow' },
      ...currentLights,
    ]);
    setNewLightName('');
    setError('');
    Keyboard.dismiss();
  };

  const updateLightStatus = (id: number, status: LightStatus) => {
    setLights((currentLights) =>
      currentLights.map((light) => (light.id === id ? { ...light, status } : light)),
    );
  };

  const removeLight = (id: number) => {
    setLights((currentLights) => currentLights.filter((light) => light.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, isCompact && styles.headerCompact]}>
          <View>
            <Text style={styles.title}>Command Central</Text>
            <Text style={styles.subtitle}>Shared red, yellow, and green signals for home.</Text>
          </View>
          <View style={styles.summary}>
            {statusOptions.map((option) => {
              const count = lights.filter((light) => light.status === option.value).length;

              return (
                <View key={option.value} style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: option.color }]} />
                  <Text style={styles.summaryText}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.form, isCompact && styles.formCompact]}>
          <TextInput
            accessibilityLabel="New light name"
            autoCapitalize="words"
            enterKeyHint="done"
            onChangeText={(value) => {
              setNewLightName(value);
              if (error) {
                setError('');
              }
            }}
            onSubmitEditing={createLight}
            placeholder="Add a light, like Dinner or Nap"
            placeholderTextColor="#8a94a6"
            returnKeyType="done"
            style={[styles.input, isCompact && styles.inputCompact]}
            value={newLightName}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create light"
            onPress={createLight}
            style={({ pressed }) => [
              styles.createButton,
              isCompact && styles.createButtonCompact,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.createButtonIcon}>+</Text>
            <Text style={styles.createButtonText}>Create</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.grid}>
          {lights.map((light) => {
            const activeOption = statusOptions.find((option) => option.value === light.status);

            return (
              <View key={light.id} style={[styles.tileWrap, { width: tileWidth }]}>
                <View style={styles.tile}>
                  <View style={styles.tileTopRow}>
                    <Text numberOfLines={1} style={styles.lightName}>
                      {light.name}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${light.name}`}
                      onPress={() => removeLight(light.id)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                      <Text style={styles.removeButtonText}>x</Text>
                    </Pressable>
                  </View>

                  <View style={styles.lampArea}>
                    <View
                      accessibilityRole="image"
                      accessibilityLabel={`${light.name} is ${activeOption?.label ?? light.status}`}
                      style={[
                        styles.lamp,
                        {
                          backgroundColor: activeOption?.color,
                          shadowColor: activeOption?.color,
                        },
                      ]}
                    />
                    <Text style={styles.meaning}>{activeOption?.meaning}</Text>
                  </View>

                  <View style={styles.controls}>
                    {statusOptions.map((option) => {
                      const isActive = option.value === light.status;

                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          accessibilityLabel={`Set ${light.name} to ${option.label}`}
                          onPress={() => updateLightStatus(light.id, option.value)}
                          style={({ pressed }) => [
                            styles.statusButton,
                            isActive && {
                              backgroundColor: option.color,
                              borderColor: option.color,
                            },
                            pressed && styles.pressed,
                          ]}>
                          <Text style={[styles.statusButtonText, isActive && styles.activeStatusText]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fb',
  },
  page: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1180,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerCompact: {
    flexDirection: 'column',
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  subtitle: {
    color: '#536176',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 4,
  },
  summary: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e3e7ee',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  summaryDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  summaryText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '700',
  },
  form: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  formCompact: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    flex: 1,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  inputCompact: {
    width: '100%',
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  createButtonCompact: {
    width: '100%',
  },
  createButtonIcon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7,
    paddingTop: 6,
  },
  tileWrap: {
    padding: 7,
  },
  tile: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e5ee',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 220,
    padding: 14,
  },
  tileTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  lightName: {
    color: '#111827',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  removeButton: {
    alignItems: 'center',
    borderColor: '#d8dee8',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  removeButtonText: {
    color: '#667085',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  lampArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  lamp: {
    borderColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 6,
    elevation: 7,
    height: 78,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    width: 78,
  },
  meaning: {
    color: '#536176',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
  statusButton: {
    alignItems: 'center',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 6,
  },
  statusButtonText: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
  },
  activeStatusText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.72,
  },
});
