import fs from "fs";
import path from "path";

export interface KaggleMedicine {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  manufacturer?: string;
  therapeuticClass: string;
  indication: string;
  basicInformation: string;
  source: string;
}

export interface MedicineLookupResult {
  found: boolean;
  query: string;
  detectedMedicineName?: string;
  medicine?: KaggleMedicine;
  summaryText: string;
  educationalDisclaimer: string;
  sourceDataset: string;
}

class KaggleMedicineService {
  private medicines: KaggleMedicine[] = [];
  private isLoaded = false;
  private datasetFilePath: string;

  constructor() {
    this.datasetFilePath = path.join(process.cwd(), "data", "kaggle_medicine_dataset.json");
    this.loadDataset();
  }

  public loadDataset(): void {
    try {
      if (fs.existsSync(this.datasetFilePath)) {
        const raw = fs.readFileSync(this.datasetFilePath, "utf-8");
        this.medicines = JSON.parse(raw);
        this.isLoaded = true;
        console.log(`[Kaggle Medicine Service] Loaded ${this.medicines.length} verified medicines from Kaggle dataset.`);
      } else {
        console.warn(`[Kaggle Medicine Service] Dataset file not found at ${this.datasetFilePath}`);
      }
    } catch (err) {
      console.error("[Kaggle Medicine Service] Failed to load Kaggle medicine dataset:", err);
    }
  }

  public getDatasetInfo() {
    return {
      name: "Indian Medicine Dataset with Uses & Indications",
      kaggleSlug: process.env.KAGGLE_DATASET || "shubhambathwal/medicine-dataset",
      kaggleCredentialsConfigured: Boolean(process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY),
      totalRecords: this.medicines.length,
      storage: "server-side persistent dataset (backend only)",
      safetyPolicy: "Educational information only; no prescription, no dosage advice.",
    };
  }

  public getAllMedicines(): KaggleMedicine[] {
    return this.medicines;
  }

  // Extracts potential medicine names from questions like:
  // "Dolo 650 is used for what?", "What is this medicine used for?", "what is pantoprazole 40 for?", "dolo 650 deniki vadatharu"
  public extractMedicineTerm(query: string): string {
    if (!query) return "";
    let clean = query.trim();

    // Remove common question prefixes and suffixes
    const patterns = [
      /what\s+is\s+(.+?)\s+(?:used\s+for|for|prescribed\s+for|taken\s+for)\??/i,
      /(.+?)\s+is\s+used\s+for\s+what\??/i,
      /(.+?)\s+tablet\s+is\s+for\s+what\??/i,
      /(.+?)\s+tablet\s+for\s+what\??/i,
      /tell\s+me\s+about\s+(.+?)(?:\s+tablet|\s+medicine)?\??/i,
      /what\s+does\s+(.+?)\s+do\??/i,
      /what\s+is\s+this\s+tablet\s+for\??/i,
      /what\s+is\s+this\s+medicine\s+used\s+for\??/i,
      /(.+?)\s+(?:దేనికి\s+వాడతారు|దేనికి\s+ఉపయోగపడుతుంది|ఎందుకు\s+వాడతారు)\??/i,
      /ఈ\s+(?:టాబ్లెట్|మందు)\s+(.+?)\s+(?:దేనికి|ఎందుకు)\??/i,
      /(.+?)\s+(?:किस\s+काम\s+आती\s+है|किस\s+लिए\s+उपयोग\s+किया\s+जाता\s+है|किसके\s+लिए\s+है)\??/i,
      /यह\s+दवा\s+(.+?)\s+किस\s+लिए\??/i,
    ];

    for (const pat of patterns) {
      const match = clean.match(pat);
      if (match && match[1]) {
        const candidate = match[1].replace(/^(this|the|a|an)\s+/i, "").trim();
        if (candidate.length >= 2 && candidate.toLowerCase() !== "medicine" && candidate.toLowerCase() !== "tablet") {
          return candidate;
        }
      }
    }

    // Direct match against known brand or generic names
    const lowerQuery = clean.toLowerCase();
    for (const med of this.medicines) {
      if (lowerQuery.includes(med.name.toLowerCase())) return med.name;
      for (const brand of med.brandNames) {
        if (lowerQuery.includes(brand.toLowerCase())) return brand;
      }
      const genericFirst = med.genericName.split(" ")[0].toLowerCase();
      if (genericFirst.length > 4 && lowerQuery.includes(genericFirst)) {
        return med.genericName.split(" ")[0];
      }
    }

    return clean;
  }

  // Search Kaggle dataset
  public search(query: string): KaggleMedicine[] {
    if (!query || !query.trim()) return [];
    const term = query.toLowerCase().trim();

    return this.medicines.filter((med) => {
      if (med.name.toLowerCase().includes(term)) return true;
      if (med.genericName.toLowerCase().includes(term)) return true;
      if (med.therapeuticClass.toLowerCase().includes(term)) return true;
      if (med.indication.toLowerCase().includes(term)) return true;
      if (med.brandNames.some((b) => b.toLowerCase().includes(term))) return true;
      return false;
    });
  }

  // Answer a user inquiry about medicine purpose with strict safety compliance
  public lookupMedicine(query: string, language = "en-IN"): MedicineLookupResult {
    const extractedTerm = this.extractMedicineTerm(query);
    const searchResults = this.search(extractedTerm);

    const educationalDisclaimer =
      language === "te-IN"
        ? "⚠️ వ్యక్తిగత వైద్య సలహా కోసం, అర్హత కలిగిన వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి. సొంతంగా మందులు ప్రారంభించడం లేదా మార్చడం చేయవద్దు."
        : language === "hi-IN"
        ? "⚠️ व्यक्तिगत चिकित्सा सलाह के लिए, योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें। अपनी मर्जी से दवा शुरू, बंद या खुराक में बदलाव न करें।"
        : "⚠️ For personal medical advice, consult a qualified doctor or pharmacist. MedMitra provides this educational information from medical datasets and does not prescribe or modify medications.";

    const sourceDataset = "Kaggle: shubhambathwal/medicine-dataset (Indian Medicine Dataset)";

    // Not found in dataset
    if (searchResults.length === 0) {
      const notFoundMessage =
        language === "te-IN"
          ? `కనెక్ట్ చేయబడిన డేటాసెట్‌లో ఈ మందు వివరాలు లభించలేదు.\n\nవ్యక్తిగత వైద్య సలహా కోసం, దయచేసి అర్హత కలిగిన వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి.`
          : language === "hi-IN"
          ? `कनेक्टेड डेटासेट में इस दवा की जानकारी नहीं मिली।\n\nव्यक्तिगत चिकित्सा सलाह के लिए, योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें।`
          : `Medicine information was not found in the connected dataset.\n\nFor personal medical advice, consult a qualified doctor or pharmacist.`;

      return {
        found: false,
        query,
        detectedMedicineName: extractedTerm,
        summaryText: notFoundMessage,
        educationalDisclaimer,
        sourceDataset,
      };
    }

    const matched = searchResults[0];

    // Format safe educational output
    let summary = "";
    if (language === "te-IN") {
      summary = `📋 మందు సమాచారం (Kaggle Medical Dataset):\n` +
        `• మందు పేరు: ${matched.name} (${matched.genericName})\n` +
        `• సాధారణ ఉపయోగం (Indication): ${matched.indication}\n` +
        `• ఔషధ వర్గం: ${matched.therapeuticClass}\n` +
        `• ప్రాథమిక వివరాలు: ${matched.basicInformation}\n` +
        `• మూలం: ${sourceDataset}\n\n` +
        `${educationalDisclaimer}`;
    } else if (language === "hi-IN") {
      summary = `📋 दवा की जानकारी (Kaggle Medical Dataset):\n` +
        `• दवा का नाम: ${matched.name} (${matched.genericName})\n` +
        `• मुख्य उपयोग (Indication): ${matched.indication}\n` +
        `• चिकित्सीय वर्ग: ${matched.therapeuticClass}\n` +
        `• बुनियादी जानकारी: ${matched.basicInformation}\n` +
        `• स्रोत: ${sourceDataset}\n\n` +
        `${educationalDisclaimer}`;
    } else {
      summary = `📋 Medicine Information (Kaggle Medical Dataset):\n` +
        `• Medicine: ${matched.name} (${matched.genericName})\n` +
        `• General Use / Indication: ${matched.indication}\n` +
        `• Therapeutic Category: ${matched.therapeuticClass}\n` +
        `• Basic Information: ${matched.basicInformation}\n` +
        `• Dataset Source: ${sourceDataset}\n\n` +
        `${educationalDisclaimer}`;
    }

    return {
      found: true,
      query,
      detectedMedicineName: matched.name,
      medicine: matched,
      summaryText: summary,
      educationalDisclaimer,
      sourceDataset,
    };
  }

  // Detects if a user question is asking about medicine purpose or usage
  public isMedicineInquiry(query: string): boolean {
    if (!query) return false;
    const q = query.toLowerCase();

    const enTriggers = [
      "used for",
      "what is this medicine",
      "what is this tablet",
      "what is dolo",
      "what is paracetamol",
      "what is metformin",
      "what is pantoprazole",
      "what is telmisartan",
      "what is cetirizine",
      "what is azithromycin",
      "what is combiflam",
      "is used for what",
      "tablet is for what",
      "tablet for what",
      "what is this tablet for",
      "what is this medicine used for",
      "medicine used for",
      "tablet used for",
      "dolo 650 is used for what",
      "dolo 650 for what",
      "what does this medicine do",
      "what does this tablet do",
    ];
    if (enTriggers.some((t) => q.includes(t))) return true;

    // Telugu triggers
    const teTriggers = [
      "దేనికి వాడతారు",
      "ఎందుకు వాడతారు",
      "దేనికి ఉపయోగపడుతుంది",
      "ఈ టాబ్లెట్",
      "ఈ మందు",
      "వాడకం ఏమిటి",
      "deniki vadatharu",
      "deniki vadutharu",
      "enduku vadatharu",
      "deniki upayogapaduthundi",
    ];
    if (teTriggers.some((t) => query.includes(t) || q.includes(t))) return true;

    // Hindi triggers
    const hiTriggers = [
      "किस काम आती है",
      "किस लिए उपयोग",
      "किस काम की है",
      "दवा किसके लिए",
      "kis kaam aati hai",
      "kis liye use",
      "kis kaam ke liye",
    ];
    if (hiTriggers.some((t) => query.includes(t) || q.includes(t))) return true;

    // Also check if any known medicine name is mentioned with "what is" or "for"
    const hasMedName = this.medicines.some(
      (m) =>
        q.includes(m.name.toLowerCase().split(" ")[0]) ||
        m.brandNames.some((b) => q.includes(b.toLowerCase()))
    );

    if (hasMedName && (q.includes("what") || q.includes("for") || q.includes("use") || q.includes("tablet") || q.includes("medicine"))) {
      return true;
    }

    return false;
  }
}

export const kaggleMedicineService = new KaggleMedicineService();
