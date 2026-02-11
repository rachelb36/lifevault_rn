import React, { useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Pressable, ScrollView, Modal, Alert } from "react-native";
import { ChevronRight, Edit, Plus, MoreVertical } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import { PassportItem, LoyaltyProgram } from "@/features/profiles/domain/types";
import { parseDate, formatDateLabel } from "@/shared/utils/date";

// types and date helpers moved to shared libs

type TravelModuleProps = {
  isEditing: boolean;
  onEdit: () => void;
  passports: PassportItem[];
  setPassports: React.Dispatch<React.SetStateAction<PassportItem[]>>;
  loyaltyPrograms: LoyaltyProgram[];
  setLoyaltyPrograms: React.Dispatch<React.SetStateAction<LoyaltyProgram[]>>;
  notes: string;
  setNotes: (value: string) => void;
  hideEmptyRows: boolean;
  setHideEmptyRows: React.Dispatch<React.SetStateAction<boolean>>;
  markDirty: () => void;
  dirty: boolean;
  onSave: () => void;
  onCancel: () => void;
  countryOptions: string[];
};

export default function TravelModule({
  isEditing,
  onEdit,
  passports,
  setPassports,
  loyaltyPrograms,
  setLoyaltyPrograms,
  notes,
  setNotes,
  hideEmptyRows,
  setHideEmptyRows,
  markDirty,
  dirty,
  onSave,
  onCancel,
  countryOptions,
}: TravelModuleProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryTargetId, setCountryTargetId] = useState<string | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrDraft, setOcrDraft] = useState<PassportItem | null>(null);
  const [showOcrConfirm, setShowOcrConfirm] = useState(false);
  const [datePickerState, setDatePickerState] = useState<{
    visible: boolean;
    title: string;
    value: Date | null;
  }>({
    visible: false,
    title: "Select date",
    value: null,
  });
  const datePickerOnConfirmRef = useRef<(date: Date) => void>(() => {});
  const hasPassportData = useMemo(
    () =>
      passports.some(
        (p) => p.country || p.fullName || p.passportNumber || p.issueDate || p.expiryDate
      ),
    [passports]
  );
  const hasLoyaltyData = useMemo(
    () => loyaltyPrograms.some((p) => p.providerName || p.memberNumber),
    [loyaltyPrograms]
  );
  const hasTravelData = hasPassportData || hasLoyaltyData || !!notes?.trim();

  const apiBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (process.env.EXPO_PUBLIC_GRAPHQL_URL
      ? process.env.EXPO_PUBLIC_GRAPHQL_URL.replace(/\/graphql$/, "")
      : "http://127.0.0.1:4000");

  const openDatePicker = (
    title: string,
    currentValue: Date | string | null | undefined,
    onConfirm: (date: Date) => void
  ) => {
    setDatePickerState({
      visible: true,
      title,
      value: parseDate(currentValue),
    });
    datePickerOnConfirmRef.current = (date: Date) => onConfirm(date);
  };

  const closeDatePicker = () => {
    setDatePickerState((prev) => ({ ...prev, visible: false }));
  };

  const handleDateConfirm = (date: Date) => {
    datePickerOnConfirmRef.current(date);
    closeDatePicker();
  };

  const visiblePassports = useMemo(() => {
    const list = hideEmptyRows
      ? passports.filter((p) => p.country || p.fullName || p.passportNumber || p.issueDate || p.expiryDate)
      : passports;
    return list.slice().sort((a, b) => {
      const ak = `${a.country || ""}::${a.fullName || ""}::${a.passportNumber || ""}`.toLowerCase();
      const bk = `${b.country || ""}::${b.fullName || ""}::${b.passportNumber || ""}`.toLowerCase();
      return ak.localeCompare(bk);
    });
  }, [passports, hideEmptyRows]);

  const visibleLoyalty = useMemo(() => {
    const list = hideEmptyRows
      ? loyaltyPrograms.filter((p) => p.providerName || p.memberNumber)
      : loyaltyPrograms;
    return list.slice().sort((a, b) => a.providerName.localeCompare(b.providerName));
  }, [loyaltyPrograms, hideEmptyRows]);

  const updatePassport = (id: string, patch: Partial<PassportItem>) => {
    setPassports((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    markDirty();
  };

  const updateLoyalty = (id: string, patch: Partial<LoyaltyProgram>) => {
    setLoyaltyPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    markDirty();
  };

  const confirmDeletePassport = (id: string) => {
    Alert.alert("Delete Passport", "Are you sure you want to delete this passport?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setPassports((prev) => prev.filter((p) => p.id !== id));
          markDirty();
          if (!isEditing) onEdit();
        },
      },
    ]);
  };

  const confirmDeleteLoyalty = (id: string) => {
    Alert.alert("Delete Program", "Are you sure you want to delete this loyalty program?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setLoyaltyPrograms((prev) => prev.filter((p) => p.id !== id));
          markDirty();
          if (!isEditing) onEdit();
        },
      },
    ]);
  };

  const startManualAdd = () => {
    const id = `passport-${Date.now()}`;
    setPassports((prev) => [
      ...prev,
      {
        id,
        country: "",
        fullName: "",
        passportNumber: "",
        issueDate: null,
        expiryDate: null,
        isCard: false,
      },
    ]);
    markDirty();
    setShowAddOptions(false);
    if (!isEditing) onEdit();
  };

  const runOcr = async (uri: string, name: string, mimeType: string) => {
    try {
      setIsOcrLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");
      const form = new FormData();
      form.append("file", {
        uri,
        name,
        type: mimeType,
      } as any);

      const res = await fetch(`${apiBase}/travel/ocr`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "OCR failed");
      }

      const data = await res.json();
      const draft: PassportItem = {
        id: `passport-${Date.now()}`,
        country: data.country || "",
        fullName: data.fullName || "",
        passportNumber: data.passportNumber || "",
        issueDate: data.issueDate ? parseDate(data.issueDate) : null,
        expiryDate: data.expiryDate ? parseDate(data.expiryDate) : null,
        isCard: !!data.isCard,
      };
      setOcrDraft(draft);
      setShowOcrConfirm(true);
    } catch (err: any) {
      Alert.alert("OCR failed", err?.message || "Unable to scan document.");
    } finally {
      setIsOcrLoading(false);
      setShowAddOptions(false);
    }
  };

  const handleUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file?.uri) return;
    await runOcr(file.uri, file.name || "document", file.mimeType || "application/octet-stream");
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const name = asset.fileName || "photo.jpg";
    const type = asset.mimeType || "image/jpeg";
    await runOcr(asset.uri, name, type);
  };

  return (
    <View className="gap-4 pt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">Travel details</Text>
        {hasTravelData && (
          <TouchableOpacity onPress={onEdit} className="flex-row items-center gap-2">
            <Edit size={16} className="text-primary" />
            <Text className="text-primary font-medium text-sm">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Passports */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">Passports</Text>
          {isEditing && (
            <TouchableOpacity
              onPress={() => setShowAddOptions(true)}
              className="flex-row items-center gap-2"
            >
              <Plus size={16} className="text-primary" />
              <Text className="text-primary font-medium text-sm">Add Passport</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isEditing && visiblePassports.length === 0 && (
          <Pressable
            onPress={() => setShowAddOptions(true)}
            className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg"
          >
            <Plus size={16} className="text-primary" />
            <Text className="text-primary font-medium">Add Passport</Text>
          </Pressable>
        )}

        {!isEditing && visiblePassports.length > 0 && (
          <View className="gap-3">
            {visiblePassports.map((passport) => (
              <Pressable
                key={passport.id}
                onPress={onEdit}
                className="p-3 bg-muted/50 rounded-lg gap-1"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-foreground">
                      {passport.fullName || (passport.isCard ? "Card Holder" : "Passport Holder")}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {passport.country || "Country not set"}
                      {passport.isCard ? " · Card" : ""}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {(passport.country ||
                      passport.fullName ||
                      passport.passportNumber ||
                      passport.issueDate ||
                      passport.expiryDate) && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert("Passport", "Choose an action", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Edit", onPress: onEdit },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => confirmDeletePassport(passport.id),
                            },
                          ]);
                        }}
                        hitSlop={10}
                      >
                        <MoreVertical size={18} className="text-muted-foreground" />
                      </TouchableOpacity>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground mt-0.5" />
                  </View>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {passport.passportNumber ? `# ${passport.passportNumber}` : "Passport number missing"}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {passport.issueDate && passport.expiryDate
                    ? `Issued ${formatDateLabel(passport.issueDate)} · Expires ${formatDateLabel(passport.expiryDate)}`
                    : "Issue/expiry dates not set"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {isEditing &&
          visiblePassports.map((passport) => (
            <View key={passport.id} className="p-3 bg-muted/50 rounded-lg gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">
                  {passport.isCard ? "Passport Card" : "Passport"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setCountryTargetId(passport.id);
                  setShowCountryPicker(true);
                }}
                className="bg-background border border-border rounded-lg px-3 py-2 flex-row items-center justify-between"
              >
                <Text className={passport.country ? "text-foreground" : "text-muted-foreground"}>
                  {passport.country || "Select country"}
                </Text>
                <ChevronRight size={16} className="text-muted-foreground" />
              </TouchableOpacity>

              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                placeholder="Full name"
                placeholderTextColor="rgb(113 113 122)"
                value={passport.fullName}
                onChangeText={(text) => updatePassport(passport.id, { fullName: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                placeholder="Passport number"
                placeholderTextColor="rgb(113 113 122)"
                value={passport.passportNumber}
                onChangeText={(text) => updatePassport(passport.id, { passportNumber: text })}
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() =>
                    openDatePicker("Issue date", passport.issueDate, (date) =>
                      updatePassport(passport.id, { issueDate: date })
                    )
                  }
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2"
                >
                  <Text className={passport.issueDate ? "text-foreground" : "text-muted-foreground"}>
                    {formatDateLabel(passport.issueDate, "Issue date")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    openDatePicker("Expiry date", passport.expiryDate, (date) =>
                      updatePassport(passport.id, { expiryDate: date })
                    )
                  }
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2"
                >
                  <Text className={passport.expiryDate ? "text-foreground" : "text-muted-foreground"}>
                    {formatDateLabel(passport.expiryDate, "Expiry date")}
                  </Text>
                </Pressable>
              </View>

              <TouchableOpacity
                onPress={() => updatePassport(passport.id, { isCard: !passport.isCard })}
                className="flex-row items-center gap-2"
              >
                <View
                  className={`w-5 h-5 rounded-md border ${
                    passport.isCard ? "bg-primary border-primary" : "bg-transparent border-border"
                  } items-center justify-center`}
                >
                  {passport.isCard ? <View className="w-2.5 h-2.5 bg-primary-foreground rounded-sm" /> : null}
                </View>
                <Text className="text-sm text-muted-foreground">Passport card</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>

      {/* Loyalty Programs */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">Loyalty Programs</Text>
          {isEditing && (
            <TouchableOpacity
              onPress={() => {
                setLoyaltyPrograms((prev) => [
                  ...prev,
                  {
                    id: `loyalty-${Date.now()}`,
                    programType: "airline",
                    providerName: "",
                    memberNumber: "",
                  },
                ]);
                markDirty();
              }}
              className="flex-row items-center gap-2"
            >
              <Plus size={16} className="text-primary" />
              <Text className="text-primary font-medium text-sm">Add Program</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isEditing && loyaltyPrograms.length === 0 && (
          <Pressable
            onPress={() => {
              onEdit();
              setLoyaltyPrograms((prev) => [
                ...prev,
                {
                  id: `loyalty-${Date.now()}`,
                  programType: "airline",
                  providerName: "",
                  memberNumber: "",
                },
              ]);
              markDirty();
            }}
            className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg"
          >
            <Plus size={16} className="text-primary" />
            <Text className="text-primary font-medium">Add Loyalty Program</Text>
          </Pressable>
        )}

        {!isEditing && (
          <View className="gap-4">
            {visibleLoyalty.map((program) => (
              <Pressable
                key={program.id}
                onPress={onEdit}
                className="p-3 bg-muted/50 rounded-lg gap-1"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-foreground">
                      {program.providerName || "Loyalty Program"}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {program.memberNumber || "Member # missing"}
                      {program.programType ? ` · ${program.programType}` : ""}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {(program.providerName || program.memberNumber) && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert("Loyalty Program", "Choose an action", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Edit", onPress: onEdit },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => confirmDeleteLoyalty(program.id),
                            },
                          ]);
                        }}
                        hitSlop={10}
                      >
                        <MoreVertical size={18} className="text-muted-foreground" />
                      </TouchableOpacity>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground mt-0.5" />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {isEditing &&
          visibleLoyalty.map((program) => (
            <View key={program.id} className="p-3 bg-muted/50 rounded-lg gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">Loyalty Program</Text>
              </View>

              <View className="flex-row gap-2 flex-wrap">
                {(["airline", "hotel", "car", "other"] as LoyaltyProgram["programType"][]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => updateLoyalty(program.id, { programType: type })}
                    className={`px-3 py-1.5 rounded-full border ${
                      program.programType === type ? "bg-primary border-primary" : "bg-background border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        program.programType === type ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                placeholder="Provider name"
                placeholderTextColor="rgb(113 113 122)"
                value={program.providerName}
                onChangeText={(text) => updateLoyalty(program.id, { providerName: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                placeholder="Member number"
                placeholderTextColor="rgb(113 113 122)"
                value={program.memberNumber}
                onChangeText={(text) => updateLoyalty(program.id, { memberNumber: text })}
              />
            </View>
          ))}
      </View>

      {/* Notes */}
      <View className="gap-2">
        <Text className="text-base font-semibold text-foreground">Notes</Text>
        {isEditing ? (
          <TextInput
            className="bg-background border border-border rounded-lg px-3 py-2 text-foreground min-h-[100px]"
            placeholder="Add seating, food preferences, and other travel notes"
            placeholderTextColor="rgb(113 113 122)"
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
              markDirty();
            }}
            multiline
          />
        ) : (
          <View className="p-3 bg-muted/50 rounded-lg">
            <Text className="text-sm text-muted-foreground">
              {notes ? notes : "No travel notes added yet."}
            </Text>
          </View>
        )}
      </View>

      {isEditing && (
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => {
              setHideEmptyRows((prev) => !prev);
              markDirty();
            }}
            className="flex-row items-center gap-2"
          >
            <View
              className={`w-5 h-5 rounded-md border ${
                hideEmptyRows ? "bg-primary border-primary" : "bg-transparent border-border"
              } items-center justify-center`}
            >
              {hideEmptyRows ? <View className="w-2.5 h-2.5 bg-primary-foreground rounded-sm" /> : null}
            </View>
            <Text className="text-sm text-muted-foreground">Hide empty rows</Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onSave}
              className="flex-1 bg-primary rounded-xl py-2 items-center"
              disabled={!dirty}
              style={{ opacity: dirty ? 1 : 0.6 }}
            >
              <Text className="text-primary-foreground font-semibold">Save Travel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} className="flex-1 border border-border rounded-xl py-2 items-center">
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showAddOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddOptions(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Add Passport</Text>
            <View className="gap-3">
              <TouchableOpacity
                onPress={startManualAdd}
                className="bg-card border border-border rounded-xl px-4 py-3"
              >
                <Text className="text-foreground font-medium">Enter manually</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUploadFile}
                className="bg-card border border-border rounded-xl px-4 py-3"
              >
                <Text className="text-foreground font-medium">Upload a file</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="bg-card border border-border rounded-xl px-4 py-3"
              >
                <Text className="text-foreground font-medium">Add/Take a photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAddOptions(false)}
                className="border border-border rounded-xl px-4 py-3"
              >
                <Text className="text-muted-foreground font-medium text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
            {isOcrLoading && (
              <Text className="text-xs text-muted-foreground mt-3">Scanning document…</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showOcrConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOcrConfirm(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-background rounded-3xl p-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Confirm Passport Details</Text>
            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">Country: {ocrDraft?.country || "Not detected"}</Text>
              <Text className="text-sm text-muted-foreground">Full name: {ocrDraft?.fullName || "Not detected"}</Text>
              <Text className="text-sm text-muted-foreground">
                Passport #: {ocrDraft?.passportNumber || "Not detected"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Issue date: {ocrDraft?.issueDate ? formatDateLabel(ocrDraft.issueDate, "Not detected") : "Not detected"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Expiry date: {ocrDraft?.expiryDate ? formatDateLabel(ocrDraft.expiryDate, "Not detected") : "Not detected"}
              </Text>
            </View>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  if (ocrDraft) {
                    setPassports((prev) => [...prev, ocrDraft]);
                    markDirty();
                    if (!isEditing) onEdit();
                  }
                  setShowOcrConfirm(false);
                  setOcrDraft(null);
                }}
                className="flex-1 bg-primary rounded-xl py-3 items-center"
              >
                <Text className="text-primary-foreground font-semibold">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowOcrConfirm(false);
                  setOcrDraft(null);
                }}
                className="flex-1 border border-border rounded-xl py-3 items-center"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {countryOptions.map((country) => (
                <TouchableOpacity
                  key={country}
                  onPress={() => {
                    if (countryTargetId) updatePassport(countryTargetId, { country });
                    setShowCountryPicker(false);
                    setCountryTargetId(null);
                  }}
                  className="py-3 border-b border-border"
                >
                  <Text className="text-foreground">{country}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <DatePickerModal
        visible={datePickerState.visible}
        value={datePickerState.value}
        title={datePickerState.title}
        onConfirm={handleDateConfirm}
        onCancel={closeDatePicker}
      />
    </View>
  );
}
