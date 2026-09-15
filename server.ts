import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory secure OTP store (keyed by 10-digit mobile number)
interface OtpRecord {
  hash: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

// Periodic cleanup of expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (now > record.expiresAt + 60000) {
      otpStore.delete(phone);
    }
  }
}, 60000);

// Helper to strip any raw SVG, XML, or HTML tags from AI responses
export function sanitizeAiText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/```(?:svg|xml|html)[\s\S]*?```/gi, "")
    .replace(/\b(?:svg|<\/?svg>)\b/gi, "")
    .trim();
}

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI:", err);
    }
  }
  return geminiClient;
}

// Health check endpoint (reports exact online/offline capability)
app.get("/api/health", (_req: Request, res: Response) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
  res.json({
    status: "ok",
    appName: "MediMitra",
    version: "1.0.0",
    hasGeminiKey: hasGemini,
    hasTwilioKey: hasTwilio,
    onlineAiAvailable: hasGemini,
  });
});

// ============================================================
// SECURE PHONE + OTP AUTHENTICATION ENDPOINTS
// ============================================================

// 1. Send OTP
app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        error: "INVALID_PHONE",
        message: "Mobile number is required.",
      });
    }

    // Clean phone number (extract digits only, take last 10 digits for Indian numbers)
    const digitsOnly = phone.replace(/\D/g, "");
    const cleanedPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    if (cleanedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PHONE",
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Rate-limiting / Resend cooldown (30 seconds)
    const existing = otpStore.get(cleanedPhone);
    const now = Date.now();
    if (existing && now - existing.lastSentAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: "COOLDOWN_ACTIVE",
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
      });
    }

    // Generate secure 6-digit OTP (100000 to 999999)
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP with SHA-256 (Never store plaintext OTP)
    const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

    // Store hashed OTP with 5-minute expiry
    otpStore.set(cleanedPhone, {
      hash: otpHash,
      expiresAt: now + 5 * 60 * 1000,
      lastSentAt: now,
      attempts: 0,
    });

    const maskedPhone = "******" + cleanedPhone.slice(-4);

    // Check if SMS Gateway (Twilio) is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const isTwilioConfigured = Boolean(twilioSid && twilioAuth && twilioFrom);

    if (isTwilioConfigured) {
      try {
        const authHeader = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
        const bodyParams = new URLSearchParams({
          To: `+91${cleanedPhone}`,
          From: twilioFrom!,
          Body: `Your MediMitra verification OTP is ${otpCode}. Valid for 5 minutes. Do not share this OTP with anyone.`,
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }
        );

        if (!twilioRes.ok) {
          const errData = await twilioRes.json().catch(() => ({}));
          console.error("Twilio SMS delivery failed:", errData);
          return res.status(502).json({
            success: false,
            error: "SMS_DELIVERY_FAILED",
            message: "Failed to deliver SMS to your mobile carrier. Please verify phone number and try again.",
          });
        }

        // Return success with ONLY the masked phone. NEVER expose OTP or unmasked data.
        return res.json({
          success: true,
          maskedPhone,
          message: "OTP sent to your mobile number.",
        });
      } catch (smsError: any) {
        console.error("SMS gateway network error:", smsError);
        return res.status(502).json({
          success: false,
          error: "SMS_DELIVERY_FAILED",
          message: "SMS gateway error occurred while dispatching verification message.",
        });
      }
    }

    // If SMS Provider is NOT configured:
    // Strictly per requirements: Do NOT fake delivery, do NOT show demo OTP, return clear configuration error.
    return res.status(400).json({
      success: false,
      error: "SMS_PROVIDER_NOT_CONFIGURED",
      message: "SMS Provider is not configured. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Settings/environment to deliver OTPs to mobile phones.",
    });
  } catch (err: any) {
    console.error("Error in /api/auth/send-otp:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal error occurred while processing OTP request.",
    });
  }
});

// 2. Verify OTP
app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "MISSING_DATA",
        message: "Phone number and OTP code are required.",
      });
    }

    const digitsOnly = phone.replace(/\D/g, "");
    const cleanedPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    const trimmedOtp = String(otp).trim();

    const record = otpStore.get(cleanedPhone);
    if (!record) {
      return res.status(400).json({
        success: false,
        error: "NO_OTP_FOUND",
        message: "No active OTP request found for this mobile number. Please request an OTP.",
      });
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      otpStore.delete(cleanedPhone);
      return res.status(400).json({
        success: false,
        error: "OTP_EXPIRED",
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanedPhone);
      return res.status(429).json({
        success: false,
        error: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Verify hash
    const inputHash = crypto.createHash("sha256").update(trimmedOtp).digest("hex");
    if (inputHash !== record.hash) {
      record.attempts += 1;
      return res.status(400).json({
        success: false,
        error: "INCORRECT_OTP",
        message: "Incorrect OTP. Please try again.",
      });
    }

    // OTP matched successfully! Invalidate it so it cannot be reused.
    otpStore.delete(cleanedPhone);

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    return res.json({
      success: true,
      token: sessionToken,
      phone: `+91 ${cleanedPhone}`,
      message: "Mobile number verified successfully.",
    });
  } catch (err: any) {
    console.error("Error in /api/auth/verify-otp:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal error occurred while verifying OTP.",
    });
  }
});

// AI Health Assistant endpoint
app.post("/api/assistant/chat", async (req: Request, res: Response) => {
  try {
    const { message, messages, language = "en-IN", userContext = {} } = req.body;
    const userMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content || messages[messages.length - 1].text : "");

    const client = getGeminiClient();

    const langName = language === "te-IN" ? "Telugu" : language === "hi-IN" ? "Hindi" : "English";

    // System instruction strictly adhering to medical safety rules & natural localized Telugu
    const systemPrompt = `You are MediMitra, a caring, respectful, and medically accurate AI Health Companion.
Target Patient: ${userContext.name || "Patient"}, Age: ${userContext.age || "Adult"}, Location: ${userContext.userLocationArea || "Telangana / Andhra Pradesh, India"}.
Selected Language: ${langName} (${language}).

STRICT LANGUAGE INTEGRITY RULE:
- Generate your entire response SOLELY in ${langName}.
- If language is Telugu: Write PURELY in Telugu. Do NOT append English text, do NOT append Hindi text.
- If language is Hindi: Write PURELY in Hindi. Do NOT append English text, do NOT append Telugu text.
- If language is English: Write PURELY in English. Do NOT append Telugu or Hindi text.
- NEVER concatenate translations together. NEVER output dual-language answers.

STRICT NO-RAW-SVG / NO-MARKUP RULE:
- ABSOLUTELY NEVER output raw SVG, <svg>, </svg>, XML, or HTML tags.
- NEVER write words like "svg", "<svg>", or icon source markup in your text.
- Provide clean, beautifully formatted plain text with markdown bullet points only.

TELUGU TONE MANDATE (if language is Telugu):
- Sound like a loving, caring family doctor or elder from Andhra Pradesh / Telangana.
- Use everyday spoken Telugu that is clear and natural for rural and elderly patients.
- Use natural medical terms familiar in conversational Telugu: 'షుగర్' (sugar), 'బీపీ' (BP), 'టాబ్లెట్' (tablet), 'రిపోర్ట్' (report), 'హాస్పిటల్' (hospital), 'ఫీవర్' (fever), 'రెస్ట్' (rest).
- Use respectful honorifics: 'చెప్పండి', 'తీసుకోండి', 'కంగారు పడకండి', 'జాగ్రత్తగా ఉండండి'.
- Never use archaic, textbook, or awkward literal translations.

SYMPTOM GUIDANCE STRUCTURE (When the user mentions symptoms, complaints, or health issues, structure your response with these exact 6 sections in ${langName}):
1. What the symptom may commonly be related to (Common reasons, non-conclusive)
2. What you can safely do now (Immediate, safe self-care, hydration, rest)
3. Things to avoid (Triggers, heavy exertion, skipping meals, etc.)
4. When to see a doctor (Warning thresholds, duration, high temperature)
5. Emergency warning signs (Signs requiring 108/emergency attention)
6. Doctor Advice (Specify which medical specialist is appropriate, why, and a reminder that only a doctor can evaluate and prescribe treatment)

MEDICAL SAFETY RULES:
- Never claim a confirmed diagnosis.
- Never generate a fake prescription or recommend prescription-only medications.
- If mentioning minor OTC relief (e.g. Paracetamol, ORS), clearly note that it is general OTC information, NOT a prescription, and to consult a doctor or pharmacist.
- For severe symptoms (chest pain, severe breathlessness, sudden weakness), immediately advise calling 108.`;

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nPatient Query: ${userMessage}\n\nMediMitra response (in ${language === 'te-IN' ? 'Telugu only' : language === 'hi-IN' ? 'Hindi only' : 'English only'}):`,
                },
              ],
            },
          ],
        });

        const cleanText = sanitizeAiText(response.text || "");
        if (cleanText) {
          return res.json({ reply: cleanText });
        }
      } catch (geminiError) {
        console.error("Gemini 3.8 Flash chat generation error:", geminiError);
      }
    }

    // High quality intelligent fallback if API key is not configured or in offline mode
    let fallbackReply = "";
    const lower = (userMessage || "").toLowerCase();

    if (lower.includes("chest pain") || lower.includes("heart") || lower.includes("breathing") || lower.includes("ఛాతీ") || lower.includes("శ్వాస") || lower.includes("सीने में दर्द")) {
      fallbackReply = language === "te-IN"
        ? `⚠️ అత్యవసర హెచ్చరిక (EMERGENCY)
1. ఏమి అర్థమైంది: ఛాతీ నొప్పి లేదా శ్వాస తీసుకోవడంలో తీవ్రమైన ఇబ్బందిని మీరు చెప్పారు.
2. తక్షణ సూచన: వెంటనే ప్రశాంతంగా కూర్చోండి, వదులుగా ఉండే బట్టలు వేసుకోండి. ఒంటరిగా డ్రైవ్ చేయకండి.
3. ఎమర్జెన్సీ చర్య: దయచేసి ఆలస్యం చేయకుండా 108 లేదా 112 కి వెంటనే కాల్ చేయండి లేదా సమీప ఎమర్జెన్సీ హాస్పిటల్‌కు వెళ్ళండి.
Doctor Advice: కార్డియాలజిస్ట్ (Cardiologist) లేదా ఎమర్జెన్సీ మెడిసిన్ డాక్టర్‌ను వెంటనే సంప్రదించండి. డాక్టర్ మాత్రమే తగిన పరీక్షలు చేసి చికిత్స అందిస్తారు.`
        : language === "hi-IN"
        ? `⚠️ आपातकालीन चेतावनी (EMERGENCY)
1. क्या समझा गया: आपने सीने में दर्द या सांस लेने में कठिनाई बताई है।
2. तत्काल मार्गदर्शन: तुरंत शांत होकर बैठें, किसी भी तनाव से बचें। खुद वाहन न चलाएं।
3. आपातकालीन कार्रवाई: कृपया बिना देरी किए 108 या 112 पर तुरंत कॉल करें या नजदीकी आपातकालीन अस्पताल जाएं।
Doctor Advice: हृदय रोग विशेषज्ञ (Cardiologist) या आपातकालीन चिकित्सक से तुरंत संपर्क करें। एक डॉक्टर ही लक्षणों का सही मूल्यांकन कर उपचार कर सकते हैं।`
        : `⚠️ EMERGENCY ADVISORY
1. WHAT MEDIMITRA UNDERSTOOD: You reported chest pain or acute difficulty breathing.
2. IMMEDIATE GUIDANCE: Sit upright in a comfortable, ventilated position. Loosen tight clothing. Do not attempt to drive yourself.
3. EMERGENCY ACTION: Please call emergency services (108 / 112) or go to the nearest emergency hospital trauma center immediately. MediMitra is an informational guide, not an emergency doctor.
Doctor Advice: Emergency Physician or Cardiologist evaluation is urgently required. A doctor can evaluate your symptoms and prescribe treatment if needed.`;
    } else if (lower.includes("headache") || lower.includes("తలనొప్పి") || lower.includes("सिरदर्द") || lower.includes("head ache")) {
      fallbackReply = language === "te-IN"
        ? `1. ఏమి అర్థమైంది: మీరు తలనొప్పి గురించి చెప్పారు. ఇది ఎంత సమయం నుండి ఉంది? తీవ్రత ఎలా ఉంది?
2. సాధారణ సూచనలు: ఒక గ్లాసు నీరు త్రాగండి, ప్రశాంతమైన చల్లని గదిలో కొద్దిసేపు విశ్రాంతి తీసుకోండి. మొబైల్ లేదా టీవీ స్క్రీన్లు చూడటం ఆపండి.
3. General OTC Information:
సాధారణ తలనొప్పికి పారాసిటమాల్ (Paracetamol) వంటి ఓవర్-ది-కౌంటర్ మందులను సాధారణంగా ఉపయోగిస్తారు. ఇది డాక్టర్ ప్రిస్క్రిప్షన్ కాదు. ప్యాకేజీ లేబుల్ సూచనలను చదవండి లేదా ఫార్మసిస్ట్‌ను అడగండి.
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: తలనొప్పి 2 రోజుల కంటే ఎక్కువ ఉన్నా, తీవ్రమైన జ్వరం లేదా మెడ పట్టేయడం ఉన్నా వెంటనే చూపించాలి.
5. Doctor Advice:
జనరల్ ఫిజీషియన్ (General Physician) లేదా న్యూరాలజిస్ట్‌ను సంప్రదించవచ్చు. డాక్టర్ పరీక్షించి సరైన చికిత్స అందించగలరు.`
        : language === "hi-IN"
        ? `1. क्या समझा गया: आपने सिरदर्द के बारे में बताया है। क्या यह दर्द कितने समय से है?
2. सरल मार्गदर्शन: पर्याप्त पानी पिएं, शांत व ठंडे कमरे में विश्राम करें। मोबाइल/स्क्रीन से ब्रेक लें।
3. General OTC Information:
हल्के सिरदर्द के लिए पैरासिटामोल (Paracetamol) जैसी ओवर-द-काउंटर दवाएं सामान्यतः उपयोग की जाती हैं। यह डॉक्टर का पर्चा नहीं है। दवा के पैकेट पर लिखे निर्देश पढ़ें या फार्मासिस्ट से पूछें।
4. डॉक्टर को कब दिखाएं: यदि दर्द 2 दिनों से अधिक रहे, बहुत तेज हो, या उल्टी/धुंधलापन हो तो तुरंत डॉक्टर को दिखाएं।
5. Doctor Advice:
जनरल फिजिशियन (General Physician) से परामर्श लें। डॉक्टर आपके लक्षणों की जांच कर सही उपचार लिख सकते हैं।`
        : `1. WHAT MEDIMITRA UNDERSTOOD:
You reported having a headache. (Follow-up: How long have you experienced this, and is it accompanied by nausea or sensitivity to light?)

2. SIMPLE GUIDANCE:
- Drink a tall glass of water to ensure proper hydration.
- Rest in a quiet, dimly lit room with cool ventilation.
- Take a 20-minute break from phone, computer, or television screens.
- Apply a cool damp cloth gently across your forehead.

3. General OTC Information:
For common tension or mild headaches, adults frequently use basic over-the-counter pain relievers such as Paracetamol.
Note: This is general OTC information, not a doctor's prescription. Always check the package label for instructions and consult a pharmacist, parent/guardian, or doctor before taking any medicine.

4. WHEN TO SEE A DOCTOR:
Seek prompt medical evaluation if the headache is sudden and unusually severe ("thunderclap"), persists beyond 2 days, or is accompanied by fever, stiff neck, vomiting, or vision changes.

5. Doctor Advice:
Recommended Specialist: General Physician or Neurologist.
Why this specialty: A physician can examine your blood pressure, sinus pressure, or neurological signs and determine underlying causes.
"A doctor can evaluate your symptoms and prescribe treatment if needed."`;
    } else if (lower.includes("fever") || lower.includes("జ్వరం") || lower.includes("बुखार") || lower.includes("temparature")) {
      fallbackReply = language === "te-IN"
        ? `1. ఏమి అర్థమైంది: మీరు జ్వరం గురించి చెప్పారు. థర్మామీటర్‌తో ఉష్ణోగ్రత చూశారా? (ఎంత ఉందో చెప్పండి).
2. సాధారణ సూచనలు: పుష్కలంగా మంచినీరు, ఓఆర్ఎస్ లేదా కొబ్బరినీళ్ళు త్రాగండి. వదులుగా ఉండే కాటన్ దుస్తులు ధరించండి. గోరువెచ్చని నీటితో స్పాంజ్ చేయండి.
3. General OTC Information:
జ్వరాన్ని తగ్గించడానికి పారాసిటమాల్ (Paracetamol) సాధారణంగా లభించే OTC మందు. ఇది డాక్టర్ ప్రిస్క్రిప్షన్ కాదు. ఎల్లప్పుడూ లేబుల్ సూచనలను గమనించండి మరియు ఫార్మసిస్ట్ లేదా డాక్టర్‌ను అడగండి. పిల్లలకు ఇచ్చేటప్పుడు డాక్టర్ సలహా తప్పనిసరి.
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: జ్వరం 102°F కంటే ఎక్కువ ఉన్నా, 3 రోజుల కంటే ఎక్కువ కొనసాగినా, లేదా తీవ్రమైన వణుకు, వాంతులు ఉంటే వెంటనే చూపించండి.
5. Doctor Advice:
జనరల్ ఫిజీషియన్ (General Physician) ను సంప్రదించండి. అవసరమైతే రక్త పరీక్షలు చేసి సరైన యాంటీబయాటిక్స్ లేదా చికిత్సను డాక్టర్ మాత్రమే నిర్ణయిస్తారు.`
        : language === "hi-IN"
        ? `1. क्या समझा गया: आपने बुखार के बारे में बताया है। क्या आपने थर्मामीटर से तापमान मापा है?
2. सरल मार्गदर्शन: खूब पानी, ओआरएस या नारियल पानी पिएं। हल्के सूती कपड़े पहनें। गुनगुने पानी की पट्टी माथे पर रख सकते हैं।
3. General OTC Information:
हल्के बुखार को कम करने के लिए पैरासिटामोल (Paracetamol) एक सामान्य ओवर-द-काउंटर विकल्प है। यह डॉक्टर का पर्चा नहीं है। दवा के पैकेट के निर्देशों का पालन करें और फार्मासिस्ट या डॉक्टर से सलाह लें।
4. डॉक्टर को कब दिखाएं: यदि बुखार 102°F से अधिक हो, 3 दिनों से ज्यादा रहे, या सांस में तकलीफ हो तो तुरंत अस्पताल जाएं।
5. Doctor Advice:
जनरल फिजिशियन (General Physician) से परामर्श लें। डॉक्टर आपके लक्षणों की जांच कर सही दवा और उपचार लिख सकते हैं।`
        : `1. WHAT MEDIMITRA UNDERSTOOD:
You reported having a fever. (Follow-up: Have you measured your body temperature with a thermometer, and do you have chills or body aches?)

2. SIMPLE GUIDANCE:
- Stay well hydrated: drink clean water, electrolyte fluids (ORS), or warm clear soups.
- Wear light, breathable cotton clothing and rest in a comfortable room.
- You may use a damp lukewarm cloth for forehead sponge cooling (avoid cold ice water).
- Avoid heavy physical exertion.

3. General OTC Information:
For common fever, Paracetamol is a widely used over-the-counter antipyretic.
Note: This is general OTC information, not a doctor's prescription. Always follow package instructions and ask a pharmacist or healthcare provider. Never give aspirin to children or teenagers without a doctor.

4. WHEN TO SEE A DOCTOR:
Consult a physician if temperature exceeds 102°F (38.9°C), persists for more than 3 days, or is accompanied by stiff neck, shortness of breath, or rash.

5. Doctor Advice:
Recommended Specialist: General Physician or Pediatrician (for children).
Why this specialty: A physician can identify if the fever stems from a viral or bacterial source and order relevant lab tests if needed.
"A doctor can evaluate your symptoms and prescribe treatment if needed."`;
    } else if (lower.includes("cough") || lower.includes("దగ్గు") || lower.includes("खांसी")) {
      fallbackReply = language === "te-IN"
        ? `1. ఏమి అర్థమైంది: మీరు దగ్గు గురించి చెప్పారు. ఇది పొడి దగ్గా లేదా కఫం వస్తుందా?
2. సాధారణ సూచనలు: గోరువెచ్చని నీటిలో కొద్దిగా ఉప్పు వేసి గార్గిల్ చేయండి. గోరువెచ్చని నీరు త్రాగండి, ఆవిరి పట్టండి. చల్లని పానీయాలు, ఐస్ క్రీములు నివారించండి.
3. General OTC Information:
గొంతు గరగరకు తేనెతో కూడిన కాఫ్ లోజెంజెస్ (Cough Lozenges) వంటివి సాధారణంగా ఉపశమనం ఇస్తాయి. ఇది డాక్టర్ ప్రిస్క్రిప్షన్ కాదు. లేబుల్ వివరాలు చూడండి లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి.
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: దగ్గుతో పాటు రక్తం వచ్చినా, శ్వాస తీసుకోవడంలో శబ్దం (వీజింగ్) వచ్చినా, లేదా వారం రోజులకంటే ఎక్కువ కొనసాగినా ఆలస్యం చేయవద్దు.
5. Doctor Advice:
పల్మోనాలజిస్ట్ (Pulmonologist) లేదా జనరల్ ఫిజీషియన్‌ను సంప్రదించండి. డాక్టర్ మీ ఊపిరితిత్తులను స్టెతస్కోప్‌తో పరీక్షించి చికిత్స చేస్తారు.`
        : language === "hi-IN"
        ? `1. क्या समझा गया: आपने खांसी की शिकायत की है। क्या यह सूखी खांसी है या कफ वाली?
2. सरल मार्गदर्शन: गुनगुने पानी में थोड़ा नमक डालकर गरारे करें। भाप लें और पर्याप्त गुनगुना पानी पिएं। ठंडी चीजों से परहेज करें।
3. General OTC Information:
गले की खराश के लिए कफ लोजेंजेस (Cough Lozenges) या सामान्य हर्बल कफ सिरप सहायक हो सकते हैं। यह डॉक्टर का पर्चा नहीं है। पैकेट के निर्देश पढ़ें या फार्मासिस्ट से सलाह लें।
4. डॉक्टर को कब दिखाएं: यदि खांसी में खून आए, सांस फूलने लगे, या खांसी 1 सप्ताह से अधिक रहे तो तुरंत डॉक्टर से मिलें।
5. Doctor Advice:
जनरल फिजिशियन या पल्मोनोलॉजिस्ट (Pulmonologist) से परामर्श लें। डॉक्टर आपकी छाती की जांच कर सही दवा लिख सकते हैं।`
        : `1. WHAT MEDIMITRA UNDERSTOOD:
You reported having a cough. (Follow-up: Is this a dry, tickling cough or is it producing phlegm/mucus?)

2. SIMPLE GUIDANCE:
- Gargle with warm salt water 2-3 times daily to soothe irritated throat tissues.
- Inhale gentle steam from a bowl of hot water for 5-10 minutes.
- Drink warm fluids such as warm water with lemon or herbal tea.
- Avoid cigarette smoke, dust, and chilled iced drinks.

3. General OTC Information:
Mild throat tickle can often be relieved with over-the-counter cough lozenges, throat sprays, or simple saline drops.
Note: This is general OTC information, not a doctor's prescription. Follow the product packaging instructions and consult a pharmacist or doctor.

4. WHEN TO SEE A DOCTOR:
Seek prompt medical care if you cough up blood, experience shortness of breath, audible wheezing, or if the cough lasts longer than 1-2 weeks.

5. Doctor Advice:
Recommended Specialist: General Physician or Pulmonologist.
Why this specialty: A physician can auscultate your lungs, check oxygen saturation, and determine whether a bacterial infection or allergy is present.
"A doctor can evaluate your symptoms and prescribe treatment if needed."`;
    } else if (lower.includes("cold") || lower.includes("జలుబు") || lower.includes("सर्दी") || lower.includes("runny nose") || lower.includes("ముక్కు")) {
      fallbackReply = language === "te-IN"
        ? `1. ఏమి అర్థమైంది: మీరు జలుబు మరియు ముక్కు కారడం గురించి చెప్పారు.
2. సాధారణ సూచనలు: తగినంత నిద్ర, విశ్రాంతి తీసుకోండి. రోజుకు 1-2 సార్లు వేడి నీటి ఆవిరి పట్టండి. చేతులు శుభ్రంగా కడుక్కోండి.
3. General OTC Information:
ముక్కు దిబ్బడ కోసం సెలైన్ నాసల్ స్ప్రే (Saline Nasal Drops) సురక్షితమైన సాధారణ OTC ఎంపిక. ఇది ప్రిస్క్రిప్షన్ కాదు. లేబుల్ సూచనలను గమనించండి.
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: ముఖంలో లేదా కళ్ళ చుట్టూ తీవ్రమైన నొప్పి, చెవి నొప్పి, లేదా తీవ్రమైన జ్వరం ఉంటే డాక్టర్‌ను సంప్రదించండి.
5. Doctor Advice:
ఈఎన్‌టీ స్పెషలిస్ట్ (ENT Specialist) లేదా జనరల్ ఫిజీషియన్‌ను కలవండి. డాక్టర్ మీ ముక్కు, గొంతు పరీక్షించి తగిన చికిత్స ఇస్తారు.`
        : language === "hi-IN"
        ? `1. क्या समझा गया: आपने सर्दी और बंद नाक के बारे में बताया है।
2. सरल मार्गदर्शन: पूरा आराम करें, गर्म पानी पिएं, और दिन में 1-2 बार भाप लें।
3. General OTC Information:
नाक खोलने के लिए सामान्य सलाइन नेजल ड्रॉप्स (Saline Drops) उपयोगी हो सकते हैं। यह डॉक्टर का पर्चा नहीं है। उपयोग से पहले फार्मासिस्ट से परामर्श लें।
4. डॉक्टर को कब दिखाएं: कान में दर्द, चेहरे पर तेज दबाव, या 7 दिनों से अधिक लक्षण रहने पर डॉक्टर से मिलें।
5. Doctor Advice:
ईएनटी विशेषज्ञ (ENT Specialist) या जनरल फिजिशियन से परामर्श लें। एक डॉक्टर ही लक्षणों का सही मूल्यांकन कर उपचार लिख सकते हैं।`
        : `1. WHAT MEDIMITRA UNDERSTOOD:
You reported having a common cold or nasal congestion. (Follow-up: Do you also have a sore throat or sinus pressure?)

2. SIMPLE GUIDANCE:
- Get ample rest and sleep to support your immune system.
- Drink warm water, clear broths, and hot ginger/tulsi water.
- Use facial steam inhalation to relieve nasal blockage naturally.
- Keep a clean handkerchief and wash hands frequently.

3. General OTC Information:
Saline nasal sprays or drops provide non-medicated, soothing relief for congested sinuses.
Note: This is general OTC information, not a doctor's prescription. Always follow package directions and ask a pharmacist before combining cold medications.

4. WHEN TO SEE A DOCTOR:
Consult a doctor if you develop high fever, sinus facial pain around the eyes, earache, or symptoms lasting over 7-10 days.

5. Doctor Advice:
Recommended Specialist: General Physician or ENT (Ear, Nose, Throat) Specialist.
Why this specialty: An ENT or physician can inspect your sinus passages and check for secondary sinus or ear infections.
"A doctor can evaluate your symptoms and prescribe treatment if needed."`;
    } else if (lower.includes("stomach") || lower.includes("acidity") || lower.includes("కడుపు") || lower.includes("ఎసిడిటీ") || lower.includes("गैस") || lower.includes("पेट")) {
      fallbackReply = language === "te-IN"
        ? `1. ఏమి అర్థమైంది: మీరు తేలికపాటి కడుపు నొప్పి లేదా ఎసిడిటీ/గ్యాస్ గురించి చెప్పారు.
2. సాధారణ సూచనలు: కారం, మసాలా, నూనె వస్తువులు తినకండి. ఒకేసారి ఎక్కువగా కాకుండా తక్కువ పరిమాణంలో భోజనం చేయండి. భోజనం చేసిన వెంటనే పడుకోకండి.
3. General OTC Information:
ఎసిడిటీకి సాధారణంగా యాంటాసిడ్ జెల్ లేదా టాబ్లెట్లు (Antacid) ఉపయోగిస్తారు. ఇది డాక్టర్ ప్రిస్క్రిప్షన్ కాదు. లేబుల్ చూసి మాత్రమే వాడండి లేదా ఫార్మసిస్ట్‌ను అడగండి.
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: తీవ్రమైన ఆకస్మిక నొప్పి, నల్లటి మల విసర్జన, వాంతులు, లేదా నొప్పి భరించలేనంతగా ఉంటే వెంటనే ఎమర్జెన్సీ హాస్పిటల్‌కు వెళ్ళాలి.
5. Doctor Advice:
గ్యాస్ట్రోఎంటరాలజిస్ట్ (Gastroenterologist) లేదా జనరల్ ఫిజీషియన్‌ను సంప్రదించండి. డాక్టర్ మీ కడుపుని పరీక్షించి సరైన చికిత్సను అందిస్తారు.`
        : language === "hi-IN"
        ? `1. क्या समझा गया: आपने पेट में हल्का दर्द या एसिडिटी/गैस के बारे में बताया है।
2. सरल मार्गदर्शन: मसालेदार व तला-भुना खाना न खाएं। थोड़ा-थोड़ा खाना खाएं और भोजन के तुरंत बाद न सोएं।
3. General OTC Information:
एसिडिटी के लिए सामान्य एंटासिड (Antacid) सिरप या टैबलेट का उपयोग किया जाता है। यह डॉक्टर का पर्चा नहीं है। दवा के पैकेट के निर्देश पढ़ें या फार्मासिस्ट से पूछें।
4. डॉक्टर को कब दिखाएं: यदि दर्द अचानक बहुत तेज हो, उल्टी में खून आए, या दर्द पीठ तक जाए तो तुरंत अस्पताल जाएं।
5. Doctor Advice:
गैस्ट्रोएंटेरोलॉजिस्ट (Gastroenterologist) या जनरल फिजिशियन से परामर्श लें। डॉक्टर लक्षणों का सही मूल्यांकन कर उपचार लिख सकते हैं।`
        : `1. WHAT MEDIMITRA UNDERSTOOD:
You reported experiencing mild stomach discomfort or acidity/gas. (Follow-up: Is the pain burning in your upper chest/stomach, and does it worsen before or after meals?)

2. SIMPLE GUIDANCE:
- Avoid spicy, oily, fried, or highly acidic foods (like citrus, sodas, and excess caffeine).
- Eat smaller, regular meals rather than large heavy portions.
- Remain sitting or standing upright for at least 2 hours after eating; do not lie down flat immediately.
- Sip room-temperature water or buttermilk.

3. General OTC Information:
Over-the-counter antacids (liquid suspensions or chewable tablets) can provide temporary relief from excess stomach acid.
Note: This is general OTC information, not a doctor's prescription. Always follow package label directions and ask a pharmacist or doctor.

4. WHEN TO SEE A DOCTOR:
Seek immediate medical attention if stomach pain is sharp, severe, or radiates to the back/shoulder, or if accompanied by repeated vomiting, black stools, or fever.

5. Doctor Advice:
Recommended Specialist: Gastroenterologist or General Physician.
Why this specialty: A specialist can assess digestive health, evaluate for gastritis or ulcers, and prescribe appropriate therapy.
"A doctor can evaluate your symptoms and prescribe treatment if needed."`;
    } else {
      fallbackReply = language === "te-IN"
        ? `నమస్కారం! నేను మీ మెడిమిత్ర ఆరోగ్య సహాయకుడిని. మీకు ఎలాంటి ఆరోగ్య లక్షణాలు లేదా అసౌకర్యం ఉందో వివరంగా చెప్పండి (ఉదాహరణకు: తలనొప్పి, జ్వరం, దగ్గు, జలుబు, కడుపు నొప్పి). నేను మీకు తగిన సురక్షితమైన మార్గదర్శకత్వం అందిస్తాను.
గమనిక: ఇది సమాచార సూచన మాత్రమే, వైద్య నిర్ధారణ కాదు.`
        : language === "hi-IN"
        ? `नमस्ते! मैं आपका मेडीमित्र स्वास्थ्य सहायक हूँ। आपको जो भी स्वास्थ्य लक्षण या परेशानी हो (जैसे: सिरदर्द, बुखार, खांसी, सर्दी, पेट दर्द), बताएं। मैं सुरक्षित और उपयोगी मार्गदर्शन दूंगा।
नोट: यह केवल सामान्य जानकारी है, डॉक्टरी निदान नहीं।`
        : `Hello! I am your MediMitra health companion. Please describe any symptoms you are experiencing (for example: headache, fever, cough, cold, mild stomach discomfort, or acidity). I will provide clear, relevant guidance, general OTC facts, and doctor recommendations.
(Note: This is informational wellness guidance, not a medical diagnosis.)`;
    }

    return res.json({ reply: fallbackReply });
  } catch (err: any) {
    console.error("Error in /api/assistant/chat:", err);
    return res.status(500).json({
      reply: "MediMitra assistant is currently operating in offline mode. Please feel free to check your health tracking dashboard.",
      error: err?.message,
    });
  }
});

// AI Health Assistant Streaming endpoint (Server-Sent Events)
app.post("/api/assistant/chat-stream", async (req: Request, res: Response) => {
  const { message, messages, language = "en-IN", userContext = {} } = req.body;
  const userMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content || messages[messages.length - 1].text : "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const client = getGeminiClient();

  if (!client) {
    // If no client, return safe localized fallback via SSE
    const fallback = language === "te-IN"
      ? `నమస్కారం! నేను మీ మెడిమిత్ర ఆరోగ్య సహాయకుడిని. మీ ప్రశ్నను పరిశీలించాను.
1. అర్థం చేసుకున్న లక్షణాలు: మీరు తెలిపిన ఆరోగ్య లక్షణాలు సాధారణ అలసట లేదా వాతావరణ మార్పులతో రావచ్చు.
2. సూచన: తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు తాగండి.
3. డాక్టర్ సలహా: లక్షణాలు 2-3 రోజులకు మించి ఉంటే సాధారణ వైద్యులను (General Physician) సంప్రదించండి.`
      : language === "hi-IN"
      ? `नमस्ते! मैं आपका मेडीमित्र स्वास्थ्य साथी हूं।
1. क्या समझा गया: आपके लक्षण सामान्य थकान या मौसम के बदलाव से हो सकते हैं।
2. सलाह: पर्याप्त आराम करें और पानी पिएं।
3. डॉक्टर की सलाह: लक्षण 2-3 दिनों से अधिक रहें तो सामान्य चिकित्सक से परामर्श लें।`
      : `Hello! I am your MediMitra health companion.
1. What was understood: Your reported symptoms may be related to temporary strain or dehydration.
2. Immediate guidance: Rest well and hydrate continuously.
3. Doctor advice: If symptoms persist beyond 2-3 days, please consult a General Physician.`;

    res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  try {
    const langName = language === "te-IN" ? "Telugu" : language === "hi-IN" ? "Hindi" : "English";
    const systemPrompt = `You are MediMitra, a caring, respectful, and medically accurate AI Health Companion.
Target Patient: ${userContext.name || "Patient"}, Age: ${userContext.age || "Adult"}, Location: ${userContext.userLocationArea || "Telangana / Andhra Pradesh, India"}.
Selected Language: ${langName} (${language}).

STRICT LANGUAGE INTEGRITY:
- Respond SOLELY in ${langName}.
- NEVER combine or concatenate translations from other languages.

STRICT NO-MARKUP RULE:
- ABSOLUTELY NEVER output raw SVG, <svg>, XML, or HTML tags.

TELUGU TONE (if Telugu):
- Warm, caring family doctor or elder. Simple spoken Telugu with natural medical words (షుగర్, బీపీ, టాబ్లెట్, హాస్పిటల్).

6-POINT GUIDANCE:
1. What the symptom may commonly be related to
2. What you can safely do now (Immediate self-care, hydration, rest)
3. Things to avoid
4. When to see a doctor
5. Emergency warning signs
6. Doctor Advice (Specialist recommendation and reminder that only a doctor diagnoses/prescribes)`;

    const stream = await client.models.generateContentStream({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nPatient Query: ${userMessage}\n\nMediMitra response:`,
            },
          ],
        },
      ],
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        const cleaned = sanitizeAiText(chunk.text);
        if (cleaned) {
          res.write(`data: ${JSON.stringify({ text: cleaned })}\n\n`);
        }
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (streamErr: any) {
    console.error("Stream generation failed, falling back:", streamErr);
    res.write(`data: ${JSON.stringify({ text: "MediMitra is currently in offline mode. Please consult a doctor for urgent care." })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

// Smart Symptom Guidance endpoint
app.post("/api/symptom/check", async (req: Request, res: Response) => {
  try {
    const { symptoms, duration, severity, notes, language = "en-IN" } = req.body;
    const client = getGeminiClient();
    const langName = language === "te-IN" ? "Telugu" : language === "hi-IN" ? "Hindi" : "English";

    const prompt = `Analyze these reported symptoms for general wellness guidance:
Symptoms: ${symptoms}
Duration: ${duration || 'Not specified'}
Severity: ${severity || 'Moderate'}
Additional Notes: ${notes || 'None'}
Language: ${langName}

Format output as JSON with this exact structure:
{
  "summary": "Brief empathetic summary in ${langName}",
  "possibleGeneralExplanations": ["Point 1", "Point 2", "Point 3"],
  "recommendedNextSteps": ["Step 1", "Step 2", "Step 3"],
  "followUpQuestions": ["Question 1", "Question 2"],
  "urgencyLevel": "Low" | "Moderate" | "High" | "Emergency",
  "disclaimer": "This information is for general guidance and is not a medical diagnosis. Please consult a licensed medical professional."
}
Only output valid JSON.`;

    if (client) {
      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
      });

      if (response.text) {
        try {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        } catch (e) {
          // fallback to standard json
        }
      }
    }

    // Default robust response
    const isEmergency = (symptoms || "").toLowerCase().includes("chest pain") ||
      (symptoms || "").toLowerCase().includes("unconscious") ||
      (symptoms || "").toLowerCase().includes("bleeding");

    return res.json({
      summary: `Guidance for reported symptoms: ${symptoms}`,
      possibleGeneralExplanations: [
        "Common physiological response to environmental fatigue, dehydration, or seasonal changes.",
        "Temporary muscular or metabolic strain from daily physical exertion.",
        "Routine body response that typically stabilizes with hydration, balanced nutrition, and rest."
      ],
      recommendedNextSteps: isEmergency
        ? ["Urgent: Contact emergency services (108/112) immediately.", "Proceed to the nearest emergency medical hospital.", "Do not drive yourself."]
        : [
            "Monitor symptom intensity and record any changes in your MediMitra health log.",
            "Maintain optimal hydration (2.5L+ water daily) and get 7-8 hours of restful sleep.",
            "Schedule a routine consultation with a general physician if symptoms persist beyond 48 hours."
          ],
      followUpQuestions: [
        "Did these symptoms appear suddenly or develop gradually over several days?",
        "Are they associated with fever, chills, nausea, or dizziness?"
      ],
      urgencyLevel: isEmergency ? "Emergency" : severity === "Severe" ? "High" : "Moderate",
      disclaimer: "This information is for general guidance and is not a medical diagnosis. Always consult a qualified medical professional."
    });
  } catch (err: any) {
    console.error("Error in /api/symptom/check:", err);
    return res.status(500).json({ error: "Failed to generate symptom guidance" });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediMitra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
