import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";
import type { Session } from "@supabase/supabase-js";

import {
  getInitialSession,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  subscribeToAuthChanges,
} from "@/lib/auth";
import {
  createLight as createRemoteLight,
  deleteLight as deleteRemoteLight,
  fetchLights,
  subscribeToLightChanges,
  toUserFacingError,
  updateLightStatus as updateRemoteLightStatus,
  type LightRow,
  type LightStatus,
} from "@/lib/lights";
import { isSupabaseConfigured } from "@/lib/supabase";

const statusOptions: {
  value: LightStatus;
  label: string;
  meaning: string;
  color: string;
}[] = [
  { value: "red", label: "Red", meaning: "Stop", color: "#dc2626" },
  { value: "yellow", label: "Yellow", meaning: "Wait", color: "#f59e0b" },
  { value: "green", label: "Green", meaning: "Go", color: "#16a34a" },
];

const now = new Date().toISOString();

const starterLights: LightRow[] = [
  {
    id: "demo-dinner",
    name: "Dinner",
    status: "yellow",
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-nap",
    name: "Nap",
    status: "red",
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-homework",
    name: "Homework",
    status: "green",
    sort_order: 3,
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-laundry",
    name: "Laundry",
    status: "yellow",
    sort_order: 4,
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-garage",
    name: "Garage",
    status: "green",
    sort_order: 5,
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-quiet-time",
    name: "Quiet Time",
    status: "red",
    sort_order: 6,
    created_at: now,
    updated_at: now,
  },
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

function getNextSortOrder(lights: LightRow[]) {
  return (
    lights.reduce((largest, light) => Math.max(largest, light.sort_order), 0) +
    1
  );
}

export default function StatusBoardScreen() {
  const [lights, setLights] = useState<LightRow[]>(
    isSupabaseConfigured ? [] : starterLights,
  );
  const [newLightName, setNewLightName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingSession, setIsCheckingSession] =
    useState(isSupabaseConfigured);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);

  const columns = getGridColumns(width);
  const isCompact = width < 640;
  const tileWidth = useMemo(() => `${100 / columns}%` as const, [columns]);
  const isAuthenticated = Boolean(session);

  const loadLights = useCallback(async () => {
    if (!isSupabaseConfigured || !isAuthenticated) {
      return;
    }

    try {
      const savedLights = await fetchLights();
      setLights(savedLights);
      setError("");
    } catch (loadError) {
      setError(toUserFacingError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const timer = setTimeout(() => {
      void getInitialSession()
        .then(setSession)
        .catch((sessionError) => {
          setError(toUserFacingError(sessionError));
        })
        .finally(() => {
          setIsCheckingSession(false);
        });
    }, 0);

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setLights([]);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && !isAuthenticated) {
      return;
    }

    const timer = setTimeout(() => {
      void loadLights();
    }, 0);
    const unsubscribe = subscribeToLightChanges(loadLights);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isAuthenticated, loadLights]);

  const submitAuth = async () => {
    const trimmedEmail = authEmail.trim();

    if (!trimmedEmail || !authPassword) {
      setError("Enter your email and password.");
      return;
    }

    if (authPassword.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    try {
      setIsAuthSubmitting(true);
      setError("");

      if (authMode === "sign-in") {
        await signInWithPassword(trimmedEmail, authPassword);
      } else {
        const nextSession = await signUpWithPassword(
          trimmedEmail,
          authPassword,
        );

        if (!nextSession) {
          setError("Check your email to confirm your account, then sign in.");
        }
      }
    } catch (authError) {
      setError(toUserFacingError(authError));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSaving(true);
      await signOut();
      setError("");
    } catch (signOutError) {
      setError(toUserFacingError(signOutError));
    } finally {
      setIsSaving(false);
    }
  };

  const createLight = async () => {
    const trimmedName = newLightName.trim();

    if (!trimmedName) {
      setError("Name a light first.");
      return;
    }

    const nameAlreadyExists = lights.some(
      (light) => light.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameAlreadyExists) {
      setError("That light already exists.");
      return;
    }

    try {
      setIsSaving(true);

      if (isSupabaseConfigured) {
        const savedLight = await createRemoteLight(trimmedName);
        setLights((currentLights) => [savedLight, ...currentLights]);
      } else {
        const createdAt = new Date().toISOString();
        setLights((currentLights) => [
          {
            id: `demo-${Date.now()}`,
            name: trimmedName,
            status: "yellow",
            sort_order: getNextSortOrder(currentLights),
            created_at: createdAt,
            updated_at: createdAt,
          },
          ...currentLights,
        ]);
      }

      setNewLightName("");
      setError("");
      Keyboard.dismiss();
    } catch (createError) {
      setError(toUserFacingError(createError));
    } finally {
      setIsSaving(false);
    }
  };

  const updateLightStatus = async (id: string, status: LightStatus) => {
    const previousLights = lights;
    setLights((currentLights) =>
      currentLights.map((light) =>
        light.id === id
          ? { ...light, status, updated_at: new Date().toISOString() }
          : light,
      ),
    );

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await updateRemoteLightStatus(id, status);
      setError("");
    } catch (updateError) {
      setLights(previousLights);
      setError(toUserFacingError(updateError));
    }
  };

  const removeLight = async (id: string) => {
    const previousLights = lights;
    setLights((currentLights) =>
      currentLights.filter((light) => light.id !== id),
    );

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      await deleteRemoteLight(id);
      setError("");
    } catch (deleteError) {
      setLights(previousLights);
      setError(toUserFacingError(deleteError));
    }
  };

  const syncText = isSupabaseConfigured
    ? !isAuthenticated
      ? "Sign in to sync with Supabase"
      : isLoading
        ? "Loading Supabase lights..."
        : "Synced with Supabase"
    : "Demo mode until Supabase env vars are set";

  if (isSupabaseConfigured && (isCheckingSession || !isAuthenticated)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.page, styles.authPage]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authPanel}>
            <Text style={styles.title}>Command Central</Text>
            <Text style={styles.subtitle}>
              Sign in to manage the shared status lights.
            </Text>

            <View style={styles.authTabs}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: authMode === "sign-in" }}
                onPress={() => setAuthMode("sign-in")}
                style={[
                  styles.authTab,
                  authMode === "sign-in" && styles.activeAuthTab,
                ]}
              >
                <Text
                  style={[
                    styles.authTabText,
                    authMode === "sign-in" && styles.activeAuthTabText,
                  ]}
                >
                  Sign in
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: authMode === "sign-up" }}
                onPress={() => setAuthMode("sign-up")}
                style={[
                  styles.authTab,
                  authMode === "sign-up" && styles.activeAuthTab,
                ]}
              >
                <Text
                  style={[
                    styles.authTabText,
                    authMode === "sign-up" && styles.activeAuthTabText,
                  ]}
                >
                  Sign up
                </Text>
              </Pressable>
            </View>

            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              onChangeText={(value) => {
                setAuthEmail(value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Email"
              placeholderTextColor="#8a94a6"
              style={styles.input}
              value={authEmail}
              left={<TextInput.Icon icon="email" />}
            />
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete={
                authMode === "sign-in" ? "current-password" : "new-password"
              }
              onChangeText={(value) => {
                setAuthPassword(value);
                if (error) {
                  setError("");
                }
              }}
              onSubmitEditing={submitAuth}
              placeholder="Password"
              placeholderTextColor="#8a94a6"
              secureTextEntry={!visible}
              style={styles.input}
              value={authPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={!visible ? "eye-off" : "eye"}
                  onPress={() => setVisible(!visible)}
                />
              }
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isAuthSubmitting || isCheckingSession}
              onPress={submitAuth}
              style={({ pressed }) => [
                styles.createButton,
                (isAuthSubmitting || isCheckingSession) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.createButtonText}>
                {isCheckingSession
                  ? "Checking session"
                  : isAuthSubmitting
                    ? "Working"
                    : authMode === "sign-in"
                      ? "Sign in"
                      : "Create account"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, isCompact && styles.headerCompact]}>
          <View>
            <Text style={styles.title}>Command Central</Text>
            <Text style={styles.subtitle}>
              Shared red, yellow, and green signals for home.
            </Text>
            <Text style={styles.syncStatus}>{syncText}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.summary}>
              {statusOptions.map((option) => {
                const count = lights.filter(
                  (light) => light.status === option.value,
                ).length;

                return (
                  <View key={option.value} style={styles.summaryItem}>
                    <View
                      style={[
                        styles.summaryDot,
                        { backgroundColor: option.color },
                      ]}
                    />
                    <Text style={styles.summaryText}>{count}</Text>
                  </View>
                );
              })}
            </View>
            {isSupabaseConfigured ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.signOutButtonText}>Sign out</Text>
              </Pressable>
            ) : null}
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
                setError("");
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
            disabled={isSaving}
            onPress={createLight}
            style={({ pressed }) => [
              styles.createButton,
              isCompact && styles.createButtonCompact,
              isSaving && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.createButtonIcon}>+</Text>
            <Text style={styles.createButtonText}>
              {isSaving ? "Saving" : "Create"}
            </Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.grid}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading lights...</Text>
          ) : null}
          {!isLoading && lights.length === 0 ? (
            <Text style={styles.loadingText}>
              No lights yet. Add the first one above.
            </Text>
          ) : null}
          {!isLoading &&
            lights.map((light) => {
              const activeOption = statusOptions.find(
                (option) => option.value === light.status,
              );

              return (
                <View
                  key={light.id}
                  style={[styles.tileWrap, { width: tileWidth }]}
                >
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
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed && styles.pressed,
                        ]}
                      >
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
                      <Text style={styles.meaning}>
                        {activeOption?.meaning}
                      </Text>
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
                            onPress={() =>
                              updateLightStatus(light.id, option.value)
                            }
                            style={({ pressed }) => [
                              styles.statusButton,
                              isActive && {
                                backgroundColor: option.color,
                                borderColor: option.color,
                              },
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                isActive && styles.activeStatusText,
                              ]}
                            >
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
    backgroundColor: "#f7f8fb",
  },
  page: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1180,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 36,
  },
  authPage: {
    flexGrow: 1,
    justifyContent: "center",
    maxWidth: 480,
  },
  authPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#e0e5ee",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  authTabs: {
    backgroundColor: "#eef2f7",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  authTab: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  activeAuthTab: {
    backgroundColor: "#ffffff",
  },
  authTabText: {
    color: "#536176",
    fontSize: 14,
    fontWeight: "800",
  },
  activeAuthTabText: {
    color: "#111827",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerCompact: {
    flexDirection: "column",
  },
  title: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    color: "#536176",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 4,
  },
  syncStatus: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 8,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  summary: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e3e7ee",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  summaryDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  summaryText: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "700",
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  signOutButtonText: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "800",
  },
  form: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  formCompact: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    flex: 1,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  inputCompact: {
    width: "100%",
  },
  createButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 18,
  },
  createButtonCompact: {
    width: "100%",
  },
  disabled: {
    opacity: 0.55,
  },
  createButtonIcon: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  loadingText: {
    color: "#536176",
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -7,
    paddingTop: 6,
  },
  tileWrap: {
    padding: 7,
  },
  tile: {
    backgroundColor: "#ffffff",
    borderColor: "#e0e5ee",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 220,
    padding: 14,
  },
  tileTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  lightName: {
    color: "#111827",
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  removeButton: {
    alignItems: "center",
    borderColor: "#d8dee8",
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  removeButtonText: {
    color: "#667085",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 18,
  },
  lampArea: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 18,
  },
  lamp: {
    borderColor: "#ffffff",
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
    color: "#536176",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 10,
    textTransform: "uppercase",
  },
  controls: {
    flexDirection: "row",
    gap: 6,
  },
  statusButton: {
    alignItems: "center",
    borderColor: "#d8dee8",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 6,
  },
  statusButtonText: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "800",
  },
  activeStatusText: {
    color: "#ffffff",
  },
  pressed: {
    opacity: 0.72,
  },
  iconContainer: {
    padding: 4,
  },
});
