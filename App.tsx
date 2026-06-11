
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import {
  Save,
  FilePlus,
  Download,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  History,
  Menu,
  X,
  Trash2,
} from "lucide-react-native";

// --- TYPESCRIPT INTERFACES ---
export interface FormData {
  id: string;
  patientId: string;
  formType: "pediatri" | "romatoloji";
  lastModified: string;
  [key: string]: any;
}

// --- HELPERS ---
const getTodayDate = () => new Date().toISOString().split("T")[0];

const calculateAge = (dob: string, targetDate: string) => {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const currentDate = targetDate ? new Date(targetDate) : new Date();

  let years = currentDate.getFullYear() - birthDate.getFullYear();
  let months = currentDate.getMonth() - birthDate.getMonth();
  let days = currentDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return "Geçersiz Tarih";
  if (years > 0) return `${years} yıl ${months > 0 ? months + " ay" : ""}`;
  if (months > 0) return `${months} ay ${days > 0 ? days + " gün" : ""}`;
  return `${days} gün`;
};

const normalizeText = (text: string | null | undefined) => {
  if (!text) return "";
  return String(text)
    .replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/İ/g, "I")
    .replace(/Ö/g, "O").replace(/Ç/g, "C").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c");
};

// --- INITIAL STATE ---
const initialFormData: FormData = {
  id: "", patientId: "", formType: "pediatri", lastModified: "",
  kimlik_adSoyad: "", kimlik_tc: "", kimlik_dosyaNo: "", kimlik_dogumTarihi: "",
  kimlik_yas: "", kimlik_yas_manuel: false, kimlik_cinsiyet: "", kimlik_adres: "",
  kimlik_gorusmeTarihi: getTodayDate(), kimlik_informant: "", kimlik_guvenilirlik: "",
  vital_genelDurum: "", vital_ates: "", vital_nabiz: "", vital_tansiyon: "", vital_solunum: "", vital_kilo: "", vital_boy: "", vital_basCevresi: "",
  ped_sikayet: "", ped_sure: "", ped_sonSaglikliZaman: "", ped_onset: "", ped_location: "", ped_duration: "", ped_character: "", ped_aggravating: "", ped_related: "", ped_timing: "", ped_severity: "", ped_agriSkoru: "",
  ped_gravidaPara: "", ped_gebelikHastalik: "", ped_prenatalTarama: "", ped_anneKanGrubu: "", ped_babaKanGrubu: "", ped_gebelikHaftasi: "", ped_dogumSekli: "", ped_apgar: "", ped_resusitasyon: "", ped_dogumKiloBoy: "", ped_mekonyum: "", ped_sarilik: "", ped_topukKani: "", ped_anneSutu: "", ped_formulMama: "", ped_ekGida: "", ped_asiUyum: "", ped_ozelAsi: "", ped_gecirilmisHastalik: "", ped_alerji: "",
  ped_motor: "", ped_dil: "", ped_bilissel: "", ped_akraba: "", ped_akraba_detay: "", ped_ebeveynSaglik: "", ped_aileKronik: "", ped_bebekOlum: "", ped_sosyalDurum: "",
  ped_rosGenel: "Hayır", ped_rosGenel_detay: "", ped_rosDeri: "Hayır", ped_rosDeri_detay: "", ped_rosHEENT: "Hayır", ped_rosHEENT_detay: "", ped_rosSolunum: "Hayır", ped_rosSolunum_detay: "", ped_rosKVS: "Hayır", ped_rosKVS_detay: "", ped_rosGI: "Hayır", ped_rosGI_detay: "", ped_rosGU: "Hayır", ped_rosGU_detay: "", ped_rosNorolojik: "Hayır", ped_rosNorolojik_detay: "",
  ped_fmCilt: "", ped_fmCilt_detay: "", ped_fmHEENT: "", ped_fmHEENT_detay: "", ped_fmSolunum: "", ped_fmSolunum_detay: "", ped_fmKVS: "", ped_fmKVS_detay: "", ped_fmBatin: "", ped_fmBatin_detay: "", ped_fmEndokrin: "", ped_fmEndokrin_detay: "", ped_fmKasIskelet: "", ped_fmKasIskelet_detay: "", ped_fmNoro: "", ped_fmNoro_detay: "",
  rom_anaYakinma: "", rom_toplamSure: "", rom_akutMuKornikMi: "", rom_baslangic: "", rom_belAgrisi: "", rom_inflamatuarMekanik: "", rom_sabahTutuklugu: "", rom_sabahTutukluguSuresi: "", rom_agriHafifleme: "", rom_mekanikSiddetlenme: "", rom_idiyopatikGece: "", rom_eklemSayisi: "", rom_simetrikMi: "", rom_migratuvarMi: "", rom_geceUykudanUyandiran: "", rom_tetikleyiciEnfeksiyon: "",
  rom_atesPaterni: "", rom_kiloKaybi: "", rom_kiloKaybi_detay: "", rom_ciltSLE: "", rom_ciltSLE_detay: "", rom_ciltHSP: "", rom_ciltHSP_detay: "", rom_ciltPsoriatik: "", rom_ciltPsoriatik_detay: "", rom_giSemptom: "", rom_giSemptom_detay: "", rom_gozSemptom: "", rom_gozSemptom_detay: "", rom_guSemptom: "", rom_guSemptom_detay: "",
  rom_kronikEnfeksiyon: "", rom_kronikEnfeksiyon_detay: "", rom_ilacKullanimi: "", rom_aileRomatizma: "", rom_aileRomatizma_detay: "", rom_aileDiyaliz: "", rom_aileDiyaliz_detay: "", rom_aileFMF: "", rom_aileFMF_detay: "",
  rom_fmLook: "", rom_fmLook_detay: "", rom_fmFeel: "", rom_fmFeel_detay: "", rom_fmMove: "", rom_fmMove_detay: "", rom_fmSistemik: "", rom_fmSistemik_detay: "",
};

const checkHasPed = (f: any) => Object.keys(initialFormData).some((k) => k.startsWith("ped_") && f[k] !== undefined && f[k] !== initialFormData[k] && f[k] !== "");
const checkHasRom = (f: any) => Object.keys(initialFormData).some((k) => k.startsWith("rom_") && f[k] !== undefined && f[k] !== initialFormData[k] && f[k] !== "");

const getFormTypeLabel = (f: FormData) => {
  const hasPed = checkHasPed(f);
  const hasRom = checkHasRom(f);
  if (hasPed && hasRom) return "Genel Pediatri + Romatoloji";
  if (hasRom) return "Çocuk Romatoloji";
  if (hasPed) return "Genel Pediatri";
  return f.formType === "romatoloji" ? "Çocuk Romatoloji" : "Genel Pediatri";
};

// --- STYLESHEET ---
const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f1f5f9", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  keyboardAvoid: { flex: 1 },
  container: { flex: 1 },
  sectionHeaderContainer: { backgroundColor: "#1e293b", padding: 10, marginTop: 20, marginBottom: 12, borderRadius: 6, elevation: 1 },
  sectionHeaderText: { color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", fontSize: 13 },
  subHeaderContainer: { marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 4 },
  subHeaderText: { fontWeight: "600", color: "#334155", fontSize: 14 },
  inputContainer: { padding: 4, flexShrink: 0 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 4 },
  inputField: { width: "100%", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: "#ffffff", color: "#1e293b", minHeight: 40, justifyContent: 'center' },
  textAreaField: { minHeight: 60, textAlignVertical: "top" },
  radioWrapper: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  radioItem: { flexDirection: "row", alignItems: "center", marginRight: 16, marginBottom: 8 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 6 },
  radioOuterSelected: { borderColor: "#2563eb" },
  radioOuterUnselected: { borderColor: "#94a3b8" },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#2563eb" },
  radioText: { fontSize: 13, color: "#334155" },
  row: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  card: { backgroundColor: "#ffffff", borderRadius: 12, padding: 12, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  innerCard: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 16 },
  yesNoBlock: { marginBottom: 12, padding: 12, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, width: "100%" },
  yesNoHeader: { flexDirection: "column", justifyContent: "space-between" },
  yesNoTitle: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 },
  rosBlock: { marginBottom: 12, padding: 16, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, width: "100%" },
  rosTitle: { fontSize: 13, fontWeight: "bold", color: "#1e293b" },
  rosDesc: { fontSize: 11, color: "#64748b", fontStyle: "italic", marginTop: 4, marginBottom: 12 },
  boxRed: { padding: 12, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fee2e2", borderRadius: 6, marginBottom: 8 },
  boxRedText: { fontSize: 12, fontWeight: "bold", color: "#991b1b", marginBottom: 4 },
  boxBlue: { padding: 12, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#dbeafe", borderRadius: 6, marginBottom: 8 },
  boxBlueText: { fontSize: 12, fontWeight: "bold", color: "#1e40af", marginBottom: 4 },
  boxGreen: { padding: 12, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#dcfce3", borderRadius: 6, marginBottom: 8 },
  boxGreenText: { fontSize: 12, fontWeight: "bold", color: "#166534", marginBottom: 4 },
  topBar: { backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: 12 },
  topBarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  topBarActions: { flexDirection: "row", gap: 8 },
  btnExport: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4f46e5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnSave: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#16a34a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: "#ffffff", fontSize: 12, fontWeight: "bold", marginLeft: 6 },
  tabWrapper: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 4, borderRadius: 8 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 6 },
  tabBtnActive: { backgroundColor: "#ffffff", elevation: 1 },
  tabBtnText: { fontSize: 12, fontWeight: "bold", color: "#64748b" },
  tabBtnTextActive: { color: "#1d4ed8" },
  sidebarOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 },
  sidebar: { position: "absolute", top: 0, bottom: 0, left: 0, width: SCREEN_WIDTH * 0.8, maxWidth: 300, backgroundColor: "#0f172a", zIndex: 50, elevation: 5 },
  sidebarHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155", backgroundColor: "#020617", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sidebarTitle: { fontSize: 18, fontWeight: "bold", color: "#ffffff", marginLeft: 8 },
  btnNewFile: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb", padding: 12, borderRadius: 6, margin: 16 },
  btnNewFileText: { color: "#ffffff", fontWeight: "bold", fontSize: 13, marginLeft: 8 },
  patientGroup: { backgroundColor: "rgba(30, 41, 59, 0.4)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(51, 65, 85, 0.5)", marginBottom: 8, overflow: "hidden" },
  patientHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  patientName: { fontSize: 13, fontWeight: "bold", color: "#e2e8f0" },
  patientNo: { fontSize: 10, color: "#94a3b8" },
  recordItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, paddingLeft: 36, borderLeftWidth: 2 },
  recordItemActive: { borderLeftColor: "#3b82f6", backgroundColor: "#1e293b" },
  recordItemInactive: { borderLeftColor: "transparent" },
  recordDate: { fontSize: 11, fontWeight: "500" },
  recordType: { fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { backgroundColor: "#ffffff", padding: 24, borderRadius: 12, width: "100%", maxWidth: 350, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 10, marginBottom: 16 },
  selectModalContent: { backgroundColor: "#ffffff", padding: 10, borderRadius: 12, width: "80%", maxHeight: "60%", elevation: 5 },
  selectOption: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  selectOptionText: { fontSize: 15, color: "#334155" },
  // BURASI EKSİKTİ, GERİ EKLENDİ!
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, marginRight: 10 },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 10 },
  modalBtnCancel: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8 },
  modalBtnExport: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#4f46e5", borderRadius: 8, flexDirection: "row", alignItems: "center" }
});

// --- PURE UI COMPONENTS WITH MEMO (Performans Optimizasyonu) ---
const arePropsEqual = (prev: any, next: any) => prev.value === next.value && prev.name === next.name && prev.label === next.label;

const SectionHeader = React.memo(({ title }: { title: string }) => (
  <View style={styles.sectionHeaderContainer}><Text style={styles.sectionHeaderText}>{title}</Text></View>
));

const SubHeader = React.memo(({ title }: { title: string }) => (
  <View style={styles.subHeaderContainer}><Text style={styles.subHeaderText}>{title}</Text></View>
));

const InputGroup = React.memo(({ label, name, value, onChange, keyboardType = "default", placeholder = "", width = "100%" }: any) => (
  <View style={[styles.inputContainer, { width }]}>
    <Text style={styles.inputLabel} numberOfLines={1}>{label}</Text>
    <TextInput keyboardType={keyboardType} value={value || ""} onChangeText={(text) => onChange(name, text)} placeholder={placeholder} placeholderTextColor="#94a3b8" style={styles.inputField} />
  </View>
), arePropsEqual);

const TextAreaGroup = React.memo(({ label, name, value, onChange, rows = 2, width = "100%" }: any) => (
  <View style={[styles.inputContainer, { width, marginTop: 4 }]}>
    <Text style={styles.inputLabel} numberOfLines={1}>{label}</Text>
    <TextInput multiline numberOfLines={rows} value={value || ""} onChangeText={(text) => onChange(name, text)} style={[styles.inputField, styles.textAreaField, { minHeight: rows * 30 }]} />
  </View>
), arePropsEqual);

// NATIVE DATE PICKER
const DateGroup = React.memo(({ label, name, value, onChange, width = "100%" }: any) => {
  const [show, setShow] = useState(false);
  const dateObj = value ? new Date(value) : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false); // Android kapanma davranışı
    if (selectedDate) {
      onChange(name, selectedDate.toISOString().split("T")[0]);
    }
  };

  return (
    <View style={[styles.inputContainer, { width }]}>
      <Text style={styles.inputLabel} numberOfLines={1}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} style={styles.inputField} activeOpacity={0.7}>
        <Text style={{ color: value ? "#1e293b" : "#94a3b8", fontSize: 13 }}>
          {value || "Tarih Seçin (YYYY-AA-GG)"}
        </Text>
      </TouchableOpacity>

      {/* iOS Modal Tipi Native Picker */}
      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" }}>
            <View style={{ backgroundColor: "white", paddingBottom: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={{ color: "#2563eb", fontWeight: "bold", fontSize: 16 }}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={dateObj} mode="date" display="spinner" onChange={handleDateChange} />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Native Picker */}
      {show && Platform.OS === 'android' && (
         <DateTimePicker value={dateObj} mode="date" display="default" onChange={handleDateChange} />
      )}
    </View>
  );
}, arePropsEqual);

// CUSTOM MODAL SELECT (iOS Çirkin Görünüm Düzeltildi)
const SelectGroup = React.memo(({ label, name, value, onChange, options, width = "100%" }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={[styles.inputContainer, { width }]}>
      <Text style={styles.inputLabel} numberOfLines={1}>{label}</Text>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.inputField} activeOpacity={0.7}>
        <Text style={{ color: value ? "#1e293b" : "#94a3b8", fontSize: 13 }}>{value || "Seçiniz..."}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.selectModalContent}>
            <Text style={{ fontWeight: "bold", marginBottom: 10, fontSize: 16, color: "#1e293b", textAlign: "center" }}>{label}</Text>
            <ScrollView>
              {options.map((opt: string) => (
                <TouchableOpacity key={opt} style={styles.selectOption} onPress={() => { onChange(name, opt); setModalVisible(false); }}>
                  <Text style={[styles.selectOptionText, value === opt && { color: "#2563eb", fontWeight: "bold" }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}, arePropsEqual);

const RadioGroup = React.memo(({ label, name, value, options, onChange, width = "100%" }: any) => (
  <View style={[styles.inputContainer, { width, marginTop: 4 }]}>
    {label && <Text style={styles.inputLabel} numberOfLines={2}>{label}</Text>}
    <View style={styles.radioWrapper}>
      {options.map((opt: any) => (
        <TouchableOpacity key={opt.value} onPress={() => onChange(name, opt.value)} style={styles.radioItem} activeOpacity={0.7}>
          <View style={[styles.radioOuter, value === opt.value ? styles.radioOuterSelected : styles.radioOuterUnselected]}>
            {value === opt.value && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioText}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
), arePropsEqual);

const YesNoDetail = React.memo(({ label, radioName, detailName, radioValue, detailValue, onChangeRadio, onChangeDetail, isExam = false }: any) => (
  <View style={styles.yesNoBlock}>
    <View style={styles.yesNoHeader}>
      <Text style={styles.yesNoTitle}>{label}</Text>
      <RadioGroup name={radioName} value={radioValue} width="100%" options={isExam ? [{ label: "Evet (Anormal)", value: "Evet" }, { label: "Hayır (Doğal)", value: "Hayır" }] : [{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={onChangeRadio} />
    </View>
    {radioValue === "Evet" && (
      <View style={{ marginTop: 8 }}>
        <TextAreaGroup label="Detaylar/Açıklama:" name={detailName} value={detailValue} onChange={onChangeDetail} rows={2} />
      </View>
    )}
  </View>
), (prev, next) => prev.radioValue === next.radioValue && prev.detailValue === next.detailValue);

const RosItem = React.memo(({ systemName, symptoms, radioName, detailName, radioValue, detailValue, onChangeRadio, onChangeDetail }: any) => (
  <View style={styles.rosBlock}>
    <Text style={styles.rosTitle}>{systemName}</Text>
    <Text style={styles.rosDesc}>{symptoms}</Text>
    <View style={{ borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12 }}>
      <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Bulgu var mı?</Text>
      <RadioGroup name={radioName} value={radioValue} options={[{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={onChangeRadio} />
    </View>
    {radioValue === "Evet" && (
      <View style={{ marginTop: 8 }}>
        <TextAreaGroup label="Pozitif Bulguları Detaylandırın:" name={detailName} value={detailValue} onChange={onChangeDetail} rows={2} />
      </View>
    )}
  </View>
), (prev, next) => prev.radioValue === next.radioValue && prev.detailValue === next.detailValue);

// --- MAIN APPLICATION COMPONENT ---
export default function HastaAnamnezMiniApp() {
  const [activeTab, setActiveTab] = useState<"pediatri" | "romatoloji">("pediatri");
  const [savedFiles, setSavedFiles] = useState<FormData[]>([]);
  const [formData, setFormData] = useState<FormData>({ ...initialFormData });
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState({ start: "", end: "", includeAll: false });

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem("klinikApp_files");
        if (stored) setSavedFiles(JSON.parse(stored));
      } catch (e: any) {
        console.error(e);
      }
    };
    loadStorage();
  }, []);

  // Performans için fonksiyonlar useCallback ile sarmalandı
  const handleInputChange = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "kimlik_yas") newData.kimlik_yas_manuel = true;
      if (name === "kimlik_dogumTarihi" || name === "kimlik_gorusmeTarihi") {
        newData.kimlik_yas_manuel = false;
        newData.kimlik_yas = calculateAge(newData.kimlik_dogumTarihi, newData.kimlik_gorusmeTarihi);
      }
      return newData;
    });
  }, []);

  const handleRadioChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNewFile = () => {
    Alert.alert("Yeni Dosya", "Kaydedilmemiş verileriniz silinecektir. Yeni dosya açmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Evet",
        onPress: () => {
          setFormData({ ...initialFormData, kimlik_gorusmeTarihi: getTodayDate() });
          setSidebarOpen(false);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!formData.kimlik_adSoyad && !formData.kimlik_dosyaNo) {
      Alert.alert("Hata", "Lütfen en azından hastanın 'Adı Soyadı' veya 'Dosya No' bilgisini giriniz.");
      return;
    }

    const newFiles = [...savedFiles];
    const now = new Date().toLocaleString("tr-TR");
    const pId = formData.kimlik_dosyaNo ? formData.kimlik_dosyaNo.trim() : formData.kimlik_adSoyad.trim().toLowerCase();
    const recordToSave = { ...formData, id: formData.id || Date.now().toString(), patientId: pId, lastModified: now, formType: activeTab };

    if (formData.id) {
      const index = newFiles.findIndex((f) => f.id === formData.id);
      if (index !== -1) newFiles[index] = recordToSave;
    } else {
      newFiles.push(recordToSave);
    }

    setSavedFiles(newFiles);
    setFormData(recordToSave);
    await AsyncStorage.setItem("klinikApp_files", JSON.stringify(newFiles));
    Alert.alert("Başarılı", "Dosya başarıyla kaydedildi.");
  };

  const loadFile = (file: FormData) => {
    if (formData.kimlik_adSoyad && formData.id !== file.id) {
      Alert.alert("Dosya Değiştir", "Mevcut formu kapatıp seçilen kaydı açmak istiyor musunuz?", [
        { text: "İptal", style: "cancel" },
        { text: "Evet", onPress: () => processLoad(file) },
      ]);
    } else {
      processLoad(file);
    }
  };

  const processLoad = (file: FormData) => {
    setFormData(file);
    if (checkHasRom(file) && !checkHasRom(file)) setActiveTab("romatoloji");
    else setActiveTab("pediatri");
    setSidebarOpen(false);
  };

  const deleteFile = (id: string) => {
    Alert.alert("Uyarı", "Bu kayıt kalıcı olarak silinecektir. Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const updated = savedFiles.filter((f) => f.id !== id);
          setSavedFiles(updated);
          await AsyncStorage.setItem("klinikApp_files", JSON.stringify(updated));
          if (formData.id === id) setFormData({ ...initialFormData });
        },
      },
    ]);
  };

  // --- NATIVE PDF EXPORT (Logo Entegreli) ---
  const exportPDF = async () => {
    if (!formData.patientId) {
      Alert.alert("Hata", "Öncelikle dışa aktarmak istediğiniz hastayı kaydedin.");
      return;
    }

    // 1. Logoyu Assets klasöründen okuma ve Base64'e çevirme
    let logoBase64 = "";
    try {
      // DİKKAT: assets klasöründe logo.png olduğundan emin olun
      const asset = Asset.fromModule(require('./assets/logo.png'));
      await asset.downloadAsync();
      if (asset.localUri) {
        logoBase64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
      }
    } catch (error) {
      console.log("Logo okunamadı, logosuz devam edilecek:", error);
    }

    let filesToExport = exportRange.includeAll
      ? savedFiles.filter((f) => {
          if (f.patientId !== formData.patientId) return false;
          if (!exportRange.start || !exportRange.end) return true;
          const date = new Date(f.kimlik_gorusmeTarihi);
          return date >= new Date(exportRange.start) && date <= new Date(exportRange.end);
        })
      : [formData];

    if (filesToExport.length === 0) {
      Alert.alert("Hata", "Seçilen aralıkta bu hastaya ait kaydedilmiş dosya bulunamadı.");
      return;
    }

    filesToExport.sort((a, b) => new Date(a.kimlik_gorusmeTarihi).getTime() - new Date(b.kimlik_gorusmeTarihi).getTime());

    const logoHtmlBlock = logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" width="40" height="40" style="position: absolute; left: 12px; top: 12px;" />` : "";

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; padding-top: 30px; color: #111; font-size: 11px; }
          .header { border-bottom: 3px solid #bedcff; padding-bottom: 10px; margin-bottom: 20px; padding-left: ${logoBase64 ? '50px' : '0px'}; position: relative; }
          .univ-title { font-size: 11px; color: #555; }
          .patient-info { font-weight: bold; font-size: 12px; margin-top: 5px; }
          .footer { margin-top: 30px; font-weight: bold; font-size: 10px; display: flex; justify-content: space-between; color: #333; }
          .page-break { page-break-after: always; }
          .row { display: flex; width: 100%; margin-bottom: 8px; }
          .col-left { width: 80px; flex-shrink: 0; font-weight: bold; font-size: 10px; color: #333; }
          .col-right { flex-grow: 1; padding-left: 10px; }
          .block-title { font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 4px; color: #000; }
          .block-content { font-size: 11px; line-height: 1.4; color: #222; }
        </style>
      </head>
      <body>
    `;

    filesToExport.forEach((f, index) => {
      if (index > 0) htmlContent += `<div class="page-break"></div>`;

      const hasPed = checkHasPed(f) || (!checkHasPed(f) && !checkHasRom(f) && f.formType === "pediatri");
      const hasRom = checkHasRom(f) || (!checkHasPed(f) && !checkHasRom(f) && f.formType === "romatoloji");

      const val = (k: string) => normalizeText(f[k] ? String(f[k]) : "");
      const ynVal = (r: string, d: string) => {
        if (!f[r]) return "";
        if (f[r] === "Hayır") return "Hayir";
        return normalizeText(`Evet${f[d] ? ` (${f[d]})` : ""}`);
      };
      const fmVal = (r: string, d: string) => {
        if (!f[r]) return "";
        if (f[r] === "Hayır") return "Dogal/Ozelliksiz";
        return normalizeText(f[d] ? String(f[d]) : "Anormal (Ayrinti belirtilmemis)");
      };

      const dateObj = f.kimlik_gorusmeTarihi ? new Date(f.kimlik_gorusmeTarihi) : new Date();
      const dateStr = normalizeText(dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }));
      const formTypeStr = normalizeText(getFormTypeLabel(f));

      htmlContent += `
        <div class="header">
           ${logoHtmlBlock}
           <div class="univ-title">HACETTEPE UNIVERSITESI HASTANELERI</div>
           <div class="patient-info">Dosya No: ${val("kimlik_dosyaNo") || "-"} &nbsp;|&nbsp; Hasta: ${val("kimlik_adSoyad").toUpperCase()}</div>
        </div>
        <div class="row" style="margin-bottom: 20px;">
          <div class="col-left">00:00<br/>Klinik Arsiv</div>
          <div class="col-right" style="font-weight: bold; font-size: 13px;">${formTypeStr}<br/>Muayene</div>
        </div>
      `;

      const addBlock = (title: string, lines: (string | null | undefined)[]) => {
        const validLines = lines.filter(Boolean);
        if (validLines.length === 0) return;
        htmlContent += `
          <div class="row">
            <div class="col-left"></div>
            <div class="col-right">
              <div class="block-title">${title}:</div>
              <div class="block-content">${validLines.join("<br/>")}</div>
            </div>
          </div>
        `;
      };

      if (hasPed) {
        addBlock("SIKAYET", [val("ped_sikayet")]);
        addBlock("HIKAYE", [
          val("ped_sure") ? `Sure: ${val("ped_sure")}` : null,
          val("ped_sonSaglikliZaman") ? `Son Saglikli Zaman: ${val("ped_sonSaglikliZaman")}` : null,
          val("ped_onset") ? `Baslangic: ${val("ped_onset")}` : null,
          val("ped_location") ? `Yerlesim: ${val("ped_location")}` : null,
          val("ped_duration") ? `Sure: ${val("ped_duration")}` : null,
          val("ped_character") ? `Karakter: ${val("ped_character")}` : null,
          val("ped_aggravating") ? `Artiran/Azaltan: ${val("ped_aggravating")}` : null,
          val("ped_related") ? `Iliskili Durumlar: ${val("ped_related")}` : null,
          val("ped_severity") ? `Siddet: ${val("ped_severity")} (Agri: ${val("ped_agriSkoru")})` : null,
        ]);
        addBlock("OZGECMIS", [
          val("ped_gravidaPara") ? `Gebelik (G/P): ${val("ped_gravidaPara")}` : null,
          val("ped_gebelikHastalik") ? `Gebelik Hastalik/Ilac: ${val("ped_gebelikHastalik")}` : null,
          val("ped_dogumSekli") ? `Dogum: ${val("ped_dogumSekli")}, ${val("ped_gebelikHaftasi")} hafta.` : null,
          val("ped_apgar") ? `APGAR/Resusitasyon: ${val("ped_apgar")} / ${val("ped_resusitasyon")}` : null,
          val("ped_dogumKiloBoy") ? `Olculer: ${val("ped_dogumKiloBoy")}` : null,
          val("ped_sarilik") ? `Sarilik/NICU: ${val("ped_sarilik")}` : null,
          val("ped_gecirilmisHastalik") ? `Gecirilmis Hastaliklar/Operasyon: ${val("ped_gecirilmisHastalik")}` : null,
          val("ped_alerji") ? `Alerjiler: ${val("ped_alerji")}` : null,
        ]);
        addBlock("BESLENME VE ASILAR", [
          val("ped_anneSutu") ? `Anne Sutu: ${val("ped_anneSutu")}` : null,
          val("ped_formulMama") ? `Mama/Ek Gida: ${val("ped_formulMama")} / ${val("ped_ekGida")}` : null,
          val("ped_asiUyum") ? `Asilar: ${val("ped_asiUyum")}` : null,
        ]);
        addBlock("GELISIM VE SOYGECMIS", [
          val("ped_motor") ? `Gelisim (Motor/Dil): ${val("ped_motor")} / ${val("ped_dil")}` : null,
          f.ped_akraba === "Evet" ? `Akraba Evliligi: Evet (${val("ped_akraba_detay")})` : null,
          val("ped_ebeveynSaglik") ? `Ebeveyn Sagligi: ${val("ped_ebeveynSaglik")}` : null,
          val("ped_aileKronik") ? `Ailede Kronik Hastalik: ${val("ped_aileKronik")}` : null,
        ]);
        addBlock("SISTEM SORGUSU", [
          ynVal("ped_rosGenel", "ped_rosGenel_detay") ? `Genel: ${ynVal("ped_rosGenel", "ped_rosGenel_detay")}` : null,
          ynVal("ped_rosSolunum", "ped_rosSolunum_detay") ? `Solunum: ${ynVal("ped_rosSolunum", "ped_rosSolunum_detay")}` : null,
          ynVal("ped_rosGI", "ped_rosGI_detay") ? `GI: ${ynVal("ped_rosGI", "ped_rosGI_detay")}` : null,
          ynVal("ped_rosNorolojik", "ped_rosNorolojik_detay") ? `Noro: ${ynVal("ped_rosNorolojik", "ped_rosNorolojik_detay")}` : null,
        ]);
        addBlock("FIZIK MUAYENE", [
          val("vital_ates") ? `Vitals: Ates ${val("vital_ates")}C, Nabiz ${val("vital_nabiz")}, TA ${val("vital_tansiyon")}` : null,
          fmVal("ped_fmCilt", "ped_fmCilt_detay") ? `Cilt: ${fmVal("ped_fmCilt", "ped_fmCilt_detay")}` : null,
          fmVal("ped_fmSolunum", "ped_fmSolunum_detay") ? `Solunum: ${fmVal("ped_fmSolunum", "ped_fmSolunum_detay")}` : null,
          fmVal("ped_fmKVS", "ped_fmKVS_detay") ? `KVS: ${fmVal("ped_fmKVS", "ped_fmKVS_detay")}` : null,
          fmVal("ped_fmBatin", "ped_fmBatin_detay") ? `Batin: ${fmVal("ped_fmBatin", "ped_fmBatin_detay")}` : null,
          fmVal("ped_fmNoro", "ped_fmNoro_detay") ? `Noro: ${fmVal("ped_fmNoro", "ped_fmNoro_detay")}` : null,
        ]);
      }

      if (hasRom) {
        addBlock("ROMATOLOJI SIKAYET / HIKAYE", [
          val("rom_anaYakinma") ? `Ana Yakinma: ${val("rom_anaYakinma")}` : null,
          val("rom_toplamSure") ? `Sure: ${val("rom_toplamSure")} (${val("rom_akutMuKornikMi")})` : null,
          val("rom_baslangic") ? `Baslangic: ${val("rom_baslangic")}` : null,
          val("rom_inflamatuarMekanik") ? `Karakteristik Tip: ${val("rom_inflamatuarMekanik")}` : null,
          val("rom_sabahTutuklugu") === "Evet" ? `Sabah Tutuklugu: Evet (${val("rom_sabahTutukluguSuresi")} dk)` : null,
          val("rom_eklemSayisi") ? `Eklem Tutulumu: ${val("rom_eklemSayisi")}, Simetrik: ${val("rom_simetrikMi")}` : null,
          val("rom_tetikleyiciEnfeksiyon") ? `Tetikleyici Enfeksiyon: ${val("rom_tetikleyiciEnfeksiyon")}` : null,
        ]);
        addBlock("SISTEMIK BULGULAR", [
          val("rom_atesPaterni") ? `Ates Paterni: ${val("rom_atesPaterni")}` : null,
          ynVal("rom_ciltSLE", "rom_ciltSLE_detay") ? `SLE Dokuntusu: ${ynVal("rom_ciltSLE", "rom_ciltSLE_detay")}` : null,
          ynVal("rom_giSemptom", "rom_giSemptom_detay") ? `GI Semptom: ${ynVal("rom_giSemptom", "rom_giSemptom_detay")}` : null,
          ynVal("rom_gozSemptom", "rom_gozSemptom_detay") ? `Goz Semptomu: ${ynVal("rom_gozSemptom", "rom_gozSemptom_detay")}` : null,
        ]);
        addBlock("OZEGECMIS / SOYGECMIS", [
          val("rom_ilacKullanimi") ? `Kullanilan Ilaclar: ${val("rom_ilacKullanimi")}` : null,
          ynVal("rom_aileRomatizma", "rom_aileRomatizma_detay") ? `Ailede Romatizma: ${ynVal("rom_aileRomatizma", "rom_aileRomatizma_detay")}` : null,
          ynVal("rom_aileFMF", "rom_aileFMF_detay") ? `Ailede FMF: ${ynVal("rom_aileFMF", "rom_aileFMF_detay")}` : null,
        ]);
        addBlock("KAS-ISKELET MUAYENESI", [
          fmVal("rom_fmLook", "rom_fmLook_detay") ? `Look (Inspeksiyon): ${fmVal("rom_fmLook", "rom_fmLook_detay")}` : null,
          fmVal("rom_fmFeel", "rom_fmFeel_detay") ? `Feel (Palpasyon): ${fmVal("rom_fmFeel", "rom_fmFeel_detay")}` : null,
          fmVal("rom_fmMove", "rom_fmMove_detay") ? `Move (Hareket): ${fmVal("rom_fmMove", "rom_fmMove_detay")}` : null,
          fmVal("rom_fmSistemik", "rom_fmSistemik_detay") ? `Sistemik: ${fmVal("rom_fmSistemik", "rom_fmSistemik_detay")}` : null,
        ]);
      }

      htmlContent += `
        <div class="footer">
          <span>${dateStr}</span>
          <span>Sayfa ${index + 1}</span>
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      setShowExportModal(false);
    } catch (error) {
      Alert.alert("Hata", "PDF dışa aktarılırken bir hata oluştu.");
      console.error(error);
    }
  };

  const groupedPatients = useMemo(() => {
    const groups: Record<string, FormData[]> = {};
    savedFiles.forEach((f) => {
      const key = f.patientId || "Bilinmeyen";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => new Date(b.kimlik_gorusmeTarihi).getTime() - new Date(a.kimlik_gorusmeTarihi).getTime());
    });
    return groups;
  }, [savedFiles]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          {/* SIDEBAR OVERLAY */}
          {sidebarOpen && <TouchableOpacity style={styles.sidebarOverlay} activeOpacity={1} onPress={() => setSidebarOpen(false)} />}
          
          {/* SIDEBAR MENU */}
          {sidebarOpen && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Stethoscope size={20} color="#60a5fa" />
                  <Text style={styles.sidebarTitle}>Klinik Arşiv</Text>
                </View>
                <TouchableOpacity onPress={() => setSidebarOpen(false)} style={{ padding: 4 }}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleNewFile} style={styles.btnNewFile} activeOpacity={0.8}>
                <FilePlus size={16} color="white" />
                <Text style={styles.btnNewFileText}>Yeni Hasta / Form</Text>
              </TouchableOpacity>

              <ScrollView style={{ flex: 1, padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Kayıtlı Hastalar</Text>
                {Object.keys(groupedPatients).length === 0 ? (
                  <Text style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Henüz kayıt yok.</Text>
                ) : (
                  <View>
                    {Object.entries(groupedPatients).map(([pId, records]: [string, FormData[]]) => {
                      const latestRecord = records[0];
                      const displayName = latestRecord.kimlik_adSoyad || "İsimsiz";
                      const isExpanded = expandedPatients[pId];

                      return (
                        <View key={pId} style={styles.patientGroup}>
                          <TouchableOpacity onPress={() => setExpandedPatients(prev => ({ ...prev, [pId]: !prev[pId] }))} style={styles.patientHeader}>
                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                              <FolderOpen size={16} color="#60a5fa" />
                              <View style={{ marginLeft: 8 }}>
                                <Text style={styles.patientName} numberOfLines={1}>{displayName}</Text>
                                <Text style={styles.patientNo}>Dosya No: {latestRecord.kimlik_dosyaNo || "-"}</Text>
                              </View>
                            </View>
                            {isExpanded ? <ChevronDown size={16} color="#94a3b8" /> : <ChevronRight size={16} color="#94a3b8" />}
                          </TouchableOpacity>

                          {isExpanded && (
                            <View style={{ borderTopWidth: 1, borderTopColor: "#334155" }}>
                              {records.map((record) => {
                                const isActive = formData.id === record.id;
                                return (
                                  <TouchableOpacity key={record.id} onPress={() => loadFile(record)} style={[styles.recordItem, isActive ? styles.recordItemActive : styles.recordItemInactive]}>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <History size={12} color={isActive ? "white" : "#94a3b8"} />
                                        <Text style={[styles.recordDate, { color: isActive ? "white" : "#94a3b8", marginLeft: 6 }]}>{record.kimlik_gorusmeTarihi}</Text>
                                      </View>
                                      <Text style={[styles.recordType, { color: isActive ? "#e2e8f0" : "#64748b" }]}>{getFormTypeLabel(record)}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => deleteFile(record.id)} style={{ padding: 8 }}>
                                      <Trash2 size={16} color="#f87171" />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* MAIN CONTENT */}
          <View style={{ flex: 1 }}>
            {/* TOP ACTION BAR */}
            <View style={styles.topBar}>
              <View style={styles.topBarRow}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)} style={{ padding: 4 }}>
                  <Menu size={24} color="#475569" />
                </TouchableOpacity>
                <View style={styles.topBarActions}>
                  <TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.btnExport} activeOpacity={0.8}>
                    <Download size={16} color="white" />
                    <Text style={styles.btnText}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.btnSave} activeOpacity={0.8}>
                    <Save size={16} color="white" />
                    <Text style={styles.btnText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.tabWrapper}>
                <TouchableOpacity onPress={() => setActiveTab("pediatri")} style={[styles.tabBtn, activeTab === "pediatri" && styles.tabBtnActive]}>
                  <Text style={[styles.tabBtnText, activeTab === "pediatri" && styles.tabBtnTextActive]}>Genel Pediatri</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab("romatoloji")} style={[styles.tabBtn, activeTab === "romatoloji" && styles.tabBtnActive]}>
                  <Text style={[styles.tabBtnText, activeTab === "romatoloji" && styles.tabBtnTextActive]}>Romatoloji</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SCROLLABLE FORM AREA */}
            <ScrollView style={{ flex: 1, padding: 8 }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
              <View style={styles.card}>
                
                {/* 1. ORTAK KİMLİK BİLGİLERİ */}
                <View style={styles.innerCard}>
                  <SectionHeader title="I. KİMLİK BİLGİLERİ VE DEMOGRAFİ" />
                  <View style={styles.row}>
                    <InputGroup label="Dosya / Hasta No" name="kimlik_dosyaNo" value={formData.kimlik_dosyaNo} onChange={handleInputChange} width="50%" />
                    <InputGroup label="Adı Soyadı" name="kimlik_adSoyad" value={formData.kimlik_adSoyad} onChange={handleInputChange} width="50%" />
                    <InputGroup label="TC Kimlik No" name="kimlik_tc" value={formData.kimlik_tc} onChange={handleInputChange} keyboardType="numeric" width="50%" />
                    <DateGroup label="Görüşme Tarihi" name="kimlik_gorusmeTarihi" value={formData.kimlik_gorusmeTarihi} onChange={handleInputChange} width="50%" />
                    <DateGroup label="Doğum Tarihi" name="kimlik_dogumTarihi" value={formData.kimlik_dogumTarihi} onChange={handleInputChange} width="50%" />
                    <InputGroup label="Kesin Yaşı" name="kimlik_yas" value={formData.kimlik_yas} onChange={handleInputChange} width="50%" />
                    <SelectGroup label="Cinsiyeti" name="kimlik_cinsiyet" value={formData.kimlik_cinsiyet} onChange={handleInputChange} options={["Kız", "Erkek"]} width="50%" />
                    <InputGroup label="Bilgiyi Veren Kişi" name="kimlik_informant" value={formData.kimlik_informant} onChange={handleInputChange} width="100%" />
                    <InputGroup label="Bilgi Güvenilirliği" name="kimlik_guvenilirlik" value={formData.kimlik_guvenilirlik} onChange={handleInputChange} width="100%" />
                    <InputGroup label="Doğum Yeri ve Adresi" name="kimlik_adres" value={formData.kimlik_adres} onChange={handleInputChange} width="100%" />
                  </View>
                </View>

                {/* TAB 1: PEDİATRİ */}
                {activeTab === "pediatri" && (
                  <View>
                    <View style={styles.innerCard}>
                      <SectionHeader title="II. BAŞVURU NEDENİ & III. HASTALIK ÖYKÜSÜ" />
                      <TextAreaGroup label="Şikayet (Ana Yakınma)" name="ped_sikayet" value={formData.ped_sikayet} onChange={handleInputChange} />
                      <View style={styles.row}>
                        <InputGroup label="Şikayetin Süresi" name="ped_sure" value={formData.ped_sure} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Son Sağlıklı Zaman" name="ped_sonSaglikliZaman" value={formData.ped_sonSaglikliZaman} onChange={handleInputChange} width="50%" />
                      </View>
                      <SubHeader title="OLD CARTS Analizi" />
                      <TextAreaGroup label="Başlangıç (Onset)" name="ped_onset" value={formData.ped_onset} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Yerleşim/Yayılım" name="ped_location" value={formData.ped_location} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Süre (Duration)" name="ped_duration" value={formData.ped_duration} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Karakter (Character)" name="ped_character" value={formData.ped_character} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Artıran/Azaltan Faktörler" name="ped_aggravating" value={formData.ped_aggravating} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="İlişkili Semptomlar" name="ped_related" value={formData.ped_related} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Zamanlama (Timing)" name="ped_timing" value={formData.ped_timing} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Şiddet (Severity)" name="ped_severity" value={formData.ped_severity} onChange={handleInputChange} rows={1} />
                      <InputGroup label="Ağrı Skoru (FACES/VAS)" name="ped_agriSkoru" value={formData.ped_agriSkoru} onChange={handleInputChange} width="50%" />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="IV. ÖZGEÇMİŞ (PMH)" />
                      <SubHeader title="Prenatal & Natal" />
                      <InputGroup label="Gebelik (Gravida, Para)" name="ped_gravidaPara" value={formData.ped_gravidaPara} onChange={handleInputChange} />
                      <View style={styles.row}>
                        <SelectGroup label="Anne Kan" name="ped_anneKanGrubu" value={formData.ped_anneKanGrubu} onChange={handleInputChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} width="50%" />
                        <SelectGroup label="Baba Kan" name="ped_babaKanGrubu" value={formData.ped_babaKanGrubu} onChange={handleInputChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} width="50%" />
                      </View>
                      <TextAreaGroup label="Hastalıklar ve İlaç Kullanımı" name="ped_gebelikHastalik" value={formData.ped_gebelikHastalik} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Tarama Testleri" name="ped_prenatalTarama" value={formData.ped_prenatalTarama} onChange={handleInputChange} rows={1} />
                      <View style={styles.row}>
                        <InputGroup label="Gebelik Haftası" name="ped_gebelikHaftasi" value={formData.ped_gebelikHaftasi} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Doğum Şekli" name="ped_dogumSekli" value={formData.ped_dogumSekli} onChange={handleInputChange} width="50%" />
                        <InputGroup label="APGAR" name="ped_apgar" value={formData.ped_apgar} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Resüsitasyon" name="ped_resusitasyon" value={formData.ped_resusitasyon} onChange={handleInputChange} width="50%" />
                      </View>
                      <SubHeader title="Postnatal, Beslenme ve Bağışıklama" />
                      <View style={styles.row}>
                        <InputGroup label="Doğum Ağırlığı/Boyu" name="ped_dogumKiloBoy" value={formData.ped_dogumKiloBoy} onChange={handleInputChange} width="50%" />
                        <InputGroup label="İlk İdrar/Mekonyum" name="ped_mekonyum" value={formData.ped_mekonyum} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Sarılık/NICU" name="ped_sarilik" value={formData.ped_sarilik} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Topuk Kanı/Tarama" name="ped_topukKani" value={formData.ped_topukKani} onChange={handleInputChange} width="50%" />
                      </View>
                      <TextAreaGroup label="Anne Sütü" name="ped_anneSutu" value={formData.ped_anneSutu} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Formül Mama" name="ped_formulMama" value={formData.ped_formulMama} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Ek Gıda / Tolerans" name="ped_ekGida" value={formData.ped_ekGida} onChange={handleInputChange} rows={1} />
                      <InputGroup label="Ulusal Aşı Uyumu" name="ped_asiUyum" value={formData.ped_asiUyum} onChange={handleInputChange} />
                      <InputGroup label="Özel Aşılar" name="ped_ozelAsi" value={formData.ped_ozelAsi} onChange={handleInputChange} />
                      <TextAreaGroup label="Geçirilmiş Hastalıklar/Cerrahi" name="ped_gecirilmisHastalik" value={formData.ped_gecirilmisHastalik} onChange={handleInputChange} rows={1} />
                      <TextAreaGroup label="Alerjiler" name="ped_alerji" value={formData.ped_alerji} onChange={handleInputChange} rows={1} />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="V. GELİŞİMSEL & VI. SOYGEÇMİŞ" />
                      <InputGroup label="Motor Gelişim" name="ped_motor" value={formData.ped_motor} onChange={handleInputChange} />
                      <InputGroup label="Dil Gelişimi" name="ped_dil" value={formData.ped_dil} onChange={handleInputChange} />
                      <InputGroup label="Bilişsel/Sosyal" name="ped_bilissel" value={formData.ped_bilissel} onChange={handleInputChange} />
                      <YesNoDetail label="Akraba Evliliği var mı?" radioName="ped_akraba" detailName="ped_akraba_detay" radioValue={formData.ped_akraba} detailValue={formData.ped_akraba_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <TextAreaGroup label="Ebeveyn/Kardeş Sağlık Durumu" name="ped_ebeveynSaglik" value={formData.ped_ebeveynSaglik} onChange={handleInputChange} />
                      <TextAreaGroup label="Ailedeki Kronik Hastalıklar" name="ped_aileKronik" value={formData.ped_aileKronik} onChange={handleInputChange} />
                      <InputGroup label="Bebek Ölümü/Düşük Öyküsü" name="ped_bebekOlum" value={formData.ped_bebekOlum} onChange={handleInputChange} />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="VII. SOSYAL ÖYKÜ & VIII. ROS" />
                      <TextAreaGroup label="Sosyal Çevre (IHELLP)" name="ped_sosyalDurum" value={formData.ped_sosyalDurum} onChange={handleInputChange} />
                      <SubHeader title="Sistemlerin Gözden Geçirilmesi (ROS)" />
                      <RosItem systemName="Genel" symptoms="Ateş, kilo kaybı, halsizlik vb." radioName="ped_rosGenel" detailName="ped_rosGenel_detay" radioValue={formData.ped_rosGenel} detailValue={formData.ped_rosGenel_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Deri" symptoms="Döküntü, sarılık vb." radioName="ped_rosDeri" detailName="ped_rosDeri_detay" radioValue={formData.ped_rosDeri} detailValue={formData.ped_rosDeri_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Baş-Boyun (HEENT)" symptoms="Baş ağrısı, görme sorunları vb." radioName="ped_rosHEENT" detailName="ped_rosHEENT_detay" radioValue={formData.ped_rosHEENT} detailValue={formData.ped_rosHEENT_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Solunum" symptoms="Öksürük, hırıltı vb." radioName="ped_rosSolunum" detailName="ped_rosSolunum_detay" radioValue={formData.ped_rosSolunum} detailValue={formData.ped_rosSolunum_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Kardiyovasküler" symptoms="Çarpıntı, göğüs ağrısı vb." radioName="ped_rosKVS" detailName="ped_rosKVS_detay" radioValue={formData.ped_rosKVS} detailValue={formData.ped_rosKVS_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Gastrointestinal" symptoms="Bulantı, kusma vb." radioName="ped_rosGI" detailName="ped_rosGI_detay" radioValue={formData.ped_rosGI} detailValue={formData.ped_rosGI_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Genitoüriner" symptoms="Sık idrara çıkma vb." radioName="ped_rosGU" detailName="ped_rosGU_detay" radioValue={formData.ped_rosGU} detailValue={formData.ped_rosGU_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <RosItem systemName="Kas-İskelet ve Nörolojik" symptoms="Eklem ağrısı, nöbet vb." radioName="ped_rosNorolojik" detailName="ped_rosNorolojik_detay" radioValue={formData.ped_rosNorolojik} detailValue={formData.ped_rosNorolojik_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="IX. FİZİK MUAYENE" />
                      <SubHeader title="Vital Bulgular" />
                      <View style={styles.row}>
                        <SelectGroup label="Genel Durum" name="vital_genelDurum" value={formData.vital_genelDurum} onChange={handleInputChange} options={["İyi", "Orta", "Toksik"]} width="100%" />
                        <InputGroup label="Ateş (°C)" name="vital_ates" value={formData.vital_ates} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Nabız (/dk)" name="vital_nabiz" value={formData.vital_nabiz} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Tansiyon" name="vital_tansiyon" value={formData.vital_tansiyon} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Solunum (/dk)" name="vital_solunum" value={formData.vital_solunum} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Ağırlık (kg/Z)" name="vital_kilo" value={formData.vital_kilo} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Boy (cm/Z)" name="vital_boy" value={formData.vital_boy} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Baş Çevresi" name="vital_basCevresi" value={formData.vital_basCevresi} onChange={handleInputChange} width="100%" />
                      </View>
                      <SubHeader title="Sistemik Muayene" />
                      <YesNoDetail isExam label="Cilt, Saç, Tırnak" radioName="ped_fmCilt" detailName="ped_fmCilt_detay" radioValue={formData.ped_fmCilt} detailValue={formData.ped_fmCilt_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Baş ve Boyun" radioName="ped_fmHEENT" detailName="ped_fmHEENT_detay" radioValue={formData.ped_fmHEENT} detailValue={formData.ped_fmHEENT_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Solunum Sistemi" radioName="ped_fmSolunum" detailName="ped_fmSolunum_detay" radioValue={formData.ped_fmSolunum} detailValue={formData.ped_fmSolunum_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Kardiyovasküler Sistem" radioName="ped_fmKVS" detailName="ped_fmKVS_detay" radioValue={formData.ped_fmKVS} detailValue={formData.ped_fmKVS_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Batın ve Genitalya" radioName="ped_fmBatin" detailName="ped_fmBatin_detay" radioValue={formData.ped_fmBatin} detailValue={formData.ped_fmBatin_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Endokrin Gelişim" radioName="ped_fmEndokrin" detailName="ped_fmEndokrin_detay" radioValue={formData.ped_fmEndokrin} detailValue={formData.ped_fmEndokrin_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Kas-İskelet Sistemi" radioName="ped_fmKasIskelet" detailName="ped_fmKasIskelet_detay" radioValue={formData.ped_fmKasIskelet} detailValue={formData.ped_fmKasIskelet_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Nörolojik Muayene" radioName="ped_fmNoro" detailName="ped_fmNoro_detay" radioValue={formData.ped_fmNoro} detailValue={formData.ped_fmNoro_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                    </View>
                  </View>
                )}

                {/* TAB 2: ROMATOLOJİ */}
                {activeTab === "romatoloji" && (
                  <View>
                    <View style={styles.innerCard}>
                      <SectionHeader title="I. BAŞVURU NEDENİ & VİTAL BULGULAR" />
                      <TextAreaGroup label="Ana Yakınma" name="rom_anaYakinma" value={formData.rom_anaYakinma} onChange={handleInputChange} />
                      <InputGroup label="Şikayetlerin Toplam Süresi" name="rom_toplamSure" value={formData.rom_toplamSure} onChange={handleInputChange} />
                      <RadioGroup label="Akut mu, >6 hafta mı?" name="rom_akutMuKornikMi" value={formData.rom_akutMuKornikMi} options={[{ label: "Akut (<6hf)", value: "Akut" }, { label: "Kronik (>6hf)", value: "Kronik" }]} onChange={handleRadioChange} />
                      
                      <SubHeader title="Vital Bulgular" />
                      <View style={styles.row}>
                        <InputGroup label="Ateş (°C)" name="vital_ates" value={formData.vital_ates} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Nabız (/dk)" name="vital_nabiz" value={formData.vital_nabiz} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Tansiyon" name="vital_tansiyon" value={formData.vital_tansiyon} onChange={handleInputChange} width="50%" />
                        <InputGroup label="Kilo (kg)" name="vital_kilo" value={formData.vital_kilo} onChange={handleInputChange} width="50%" />
                      </View>
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="II. EKLEM AĞRISI" />
                      <RadioGroup label="Başlangıç:" name="rom_baslangic" value={formData.rom_baslangic} options={[{ label: "Aniden", value: "Aniden" }, { label: "Sinsi", value: "Sinsi" }]} onChange={handleRadioChange} />
                      <RadioGroup label="Bel ağrısı şikayeti var mı?" name="rom_belAgrisi" value={formData.rom_belAgrisi} options={[{ label: "Var", value: "Var" }, { label: "Yok", value: "Yok" }, { label: "NA", value: "NA" }]} onChange={handleRadioChange} />

                      <SubHeader title="Ağrı Ayrımı" />
                      <RadioGroup label="Karakteristik Tip Şüphesi:" name="rom_inflamatuarMekanik" value={formData.rom_inflamatuarMekanik} options={[{ label: "İnflamatuar", value: "İnflamatuar" }, { label: "Mekanik", value: "Mekanik" }, { label: "İdiyopatik", value: "Idiyopatik" }]} onChange={handleRadioChange} />
                      
                      <View style={[styles.boxRed, { marginTop: 16 }]}>
                        <Text style={styles.boxRedText}>İnflamatuar:</Text>
                        <RadioGroup label="Sabahları şiddetli mi?" name="rom_sabahTutuklugu" value={formData.rom_sabahTutuklugu} options={[{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={handleRadioChange} />
                        <InputGroup label="Sabah tutukluğu (dk)" name="rom_sabahTutukluguSuresi" keyboardType="numeric" value={formData.rom_sabahTutukluguSuresi} onChange={handleInputChange} />
                        <RadioGroup label="Efor ile hafifliyor mu?" name="rom_agriHafifleme" value={formData.rom_agriHafifleme} options={[{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={handleRadioChange} />
                      </View>
                      <View style={styles.boxBlue}>
                        <Text style={styles.boxBlueText}>Mekanik:</Text>
                        <RadioGroup label="Eforla kötüleşip, istirahatle düzeliyor mu?" name="rom_mekanikSiddetlenme" value={formData.rom_mekanikSiddetlenme} options={[{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={handleRadioChange} />
                      </View>
                      <View style={styles.boxGreen}>
                        <Text style={styles.boxGreenText}>İdiyopatik:</Text>
                        <RadioGroup label="Akşam/gece çıkıp masajla hafifliyor mu?" name="rom_idiyopatikGece" value={formData.rom_idiyopatikGece} options={[{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={handleRadioChange} />
                      </View>

                      <SubHeader title="Tutulum Paterni" />
                      <SelectGroup label="Kaç eklem etkilenmiş?" name="rom_eklemSayisi" value={formData.rom_eklemSayisi} onChange={handleInputChange} options={["Monoartrit (1)", "Oligoartrit (1-4)", "Poliartrit (≥5)"]} />
                      <RadioGroup label="Simetrik mi?" name="rom_simetrikMi" value={formData.rom_simetrikMi} options={[{ label: "Simetrik", value: "Simetrik" }, { label: "Asimetrik", value: "Asimetrik" }]} onChange={handleRadioChange} />
                      <RadioGroup label="Gezici (migratuvar) mi?" name="rom_migratuvarMi" value={formData.rom_migratuvarMi} options={[{ label: "Evet", value: "Evet" }, { label: "Hayır", value: "Hayır" }]} onChange={handleRadioChange} />
                      <RadioGroup label="Gece uyandıran ağrı?" name="rom_geceUykudanUyandiran" value={formData.rom_geceUykudanUyandiran} options={[{ label: "Var", value: "Var" }, { label: "Yok", value: "Yok" }]} onChange={handleRadioChange} />
                      <TextAreaGroup label="Semptom öncesi enfeksiyon?" name="rom_tetikleyiciEnfeksiyon" value={formData.rom_tetikleyiciEnfeksiyon} onChange={handleInputChange} rows={1} />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="III. EKSTRA-ARTİKÜLER BULGULAR" />
                      <InputGroup label="Ateş paterni" name="rom_atesPaterni" value={formData.rom_atesPaterni} onChange={handleInputChange} />
                      <YesNoDetail label="Kilo kaybı var mı?" radioName="rom_kiloKaybi" detailName="rom_kiloKaybi_detay" radioValue={formData.rom_kiloKaybi} detailValue={formData.rom_kiloKaybi_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Yüz döküntüsü, aft? (SLE)" radioName="rom_ciltSLE" detailName="rom_ciltSLE_detay" radioValue={formData.rom_ciltSLE} detailValue={formData.rom_ciltSLE_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Gluteal döküntü? (HSP)" radioName="rom_ciltHSP" detailName="rom_ciltHSP_detay" radioValue={formData.rom_ciltHSP} detailValue={formData.rom_ciltHSP_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Tırnak çukurcuk/sedef?" radioName="rom_ciltPsoriatik" detailName="rom_ciltPsoriatik_detay" radioValue={formData.rom_ciltPsoriatik} detailValue={formData.rom_ciltPsoriatik_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Mide/Bağırsak sorunu?" radioName="rom_giSemptom" detailName="rom_giSemptom_detay" radioValue={formData.rom_giSemptom} detailValue={formData.rom_giSemptom_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Göz sorunu?" radioName="rom_gozSemptom" detailName="rom_gozSemptom_detay" radioValue={formData.rom_gozSemptom} detailValue={formData.rom_gozSemptom_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Üriner sorun?" radioName="rom_guSemptom" detailName="rom_guSemptom_detay" radioValue={formData.rom_guSemptom} detailValue={formData.rom_guSemptom_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="IV. ÖZGEÇMİŞ VE SOYGEÇMİŞ" />
                      <TextAreaGroup label="Kullanılan ilaçlar:" name="rom_ilacKullanimi" value={formData.rom_ilacKullanimi} onChange={handleInputChange} rows={1} />
                      <YesNoDetail label="Kronik enfeksiyon?" radioName="rom_kronikEnfeksiyon" detailName="rom_kronikEnfeksiyon_detay" radioValue={formData.rom_kronikEnfeksiyon} detailValue={formData.rom_kronikEnfeksiyon_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Ailede Romatizma vb.?" radioName="rom_aileRomatizma" detailName="rom_aileRomatizma_detay" radioValue={formData.rom_aileRomatizma} detailValue={formData.rom_aileRomatizma_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Ailede erken diyaliz?" radioName="rom_aileDiyaliz" detailName="rom_aileDiyaliz_detay" radioValue={formData.rom_aileDiyaliz} detailValue={formData.rom_aileDiyaliz_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail label="Ailede periyodik ateş (FMF)?" radioName="rom_aileFMF" detailName="rom_aileFMF_detay" radioValue={formData.rom_aileFMF} detailValue={formData.rom_aileFMF_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                    </View>

                    <View style={styles.innerCard}>
                      <SectionHeader title="V. KAS-İSKELET VE FİZİK MUAYENE" />
                      <YesNoDetail isExam label="Look (İnspeksiyon)" radioName="rom_fmLook" detailName="rom_fmLook_detay" radioValue={formData.rom_fmLook} detailValue={formData.rom_fmLook_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Feel (Palpasyon)" radioName="rom_fmFeel" detailName="rom_fmFeel_detay" radioValue={formData.rom_fmFeel} detailValue={formData.rom_fmFeel_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Move (Hareket)" radioName="rom_fmMove" detailName="rom_fmMove_detay" radioValue={formData.rom_fmMove} detailValue={formData.rom_fmMove_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                      <YesNoDetail isExam label="Sistemik Anormallik?" radioName="rom_fmSistemik" detailName="rom_fmSistemik_detay" radioValue={formData.rom_fmSistemik} detailValue={formData.rom_fmSistemik_detay} onChangeRadio={handleRadioChange} onChangeDetail={handleInputChange} />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* PDF İNDİRME MODALI */}
        <Modal visible={showExportModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>PDF İndirme Ayarları</Text>

              <TouchableOpacity onPress={() => setExportRange({ ...exportRange, includeAll: !exportRange.includeAll })} style={styles.checkboxRow} activeOpacity={0.7}>
                <View style={[styles.checkbox, { backgroundColor: exportRange.includeAll ? "#4f46e5" : "transparent", borderColor: exportRange.includeAll ? "#4f46e5" : "#94a3b8" }]} />
                <Text style={{ color: "#334155", fontWeight: "500" }}>Birden fazla kaydı birleştir</Text>
              </TouchableOpacity>

              {exportRange.includeAll && (
                <View style={{ backgroundColor: "#f8fafc", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>Tarih aralığı (boş bırakılırsa hepsi):</Text>
                  <View style={{ gap: 12 }}>
                    <DateGroup label="Başlangıç (İsteğe Bağlı)" name="start" value={exportRange.start} onChange={(n: any, v: any) => setExportRange(p => ({...p, start: v}))} />
                    <DateGroup label="Bitiş (İsteğe Bağlı)" name="end" value={exportRange.end} onChange={(n: any, v: any) => setExportRange(p => ({...p, end: v}))} />
                  </View>
                </View>
              )}

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setShowExportModal(false)} style={styles.modalBtnCancel}>
                  <Text style={{ color: "#475569", fontWeight: "600" }}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={exportPDF} style={styles.modalBtnExport}>
                  <Download size={16} color="white" />
                  <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>İndir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
