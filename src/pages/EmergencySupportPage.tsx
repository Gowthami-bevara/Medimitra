import React, { useState } from 'react';
import {
  Siren,
  PhoneCall,
  MapPin,
  Building2,
  ShieldAlert,
  ArrowRight,
  Clock,
  Compass,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  Edit3,
  Trash2,
  Copy,
  Check,
  HeartPulse,
  User,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { EmergencyContact } from '../types';

export const EmergencySupportPage: React.FC = () => {
  const {
    hospitals,
    dispatchEmergencyAmbulance,
    emergencyContacts,
    addEmergencyContact,
    editEmergencyContact,
    deleteEmergencyContact,
    userLocation,
    user,
    healthProfile,
    language,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Modals state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Form states for Add Contact
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Form states for Edit Contact
  const [editName, setEditName] = useState('');
  const [editRel, setEditRel] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsPrimary, setEditIsPrimary] = useState(false);

  // Copy SOS feedback state
  const [copiedSos, setCopiedSos] = useState(false);

  const nearestHospital = hospitals[0] || {
    id: 'hosp-default',
    name: 'Apollo Health City - Emergency Trauma Centre',
    address: 'Jubilee Hills, Hyderabad, Telangana',
    distanceKm: 2.1,
    traumaLevel: 'Level 1 Trauma Care',
    icuBedsAvailable: 8,
    emergencyContact: '108',
  };

  // Generate real Google Maps link and SOS Message
  const mapsUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
  const sosMessage = `🚨 EMERGENCY MEDICAL SOS from ${user?.name || 'MediMitra User'} (${user?.phone || ''})!
I require urgent medical assistance.
Current Location: ${userLocation.area}, ${userLocation.city}
Coordinates: ${userLocation.lat.toFixed(4)}° N, ${userLocation.lng.toFixed(4)}° E
Live Map Location: ${mapsUrl}
${healthProfile?.bloodGroup ? `Blood Group: ${healthProfile.bloodGroup}` : ''}
${healthProfile?.chronicConditions ? `Conditions: ${healthProfile.chronicConditions}` : ''}
Please send help or contact 108 immediately.`;

  // Handle Add Contact Submit
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addEmergencyContact({
      name: name.trim(),
      relationship: relationship.trim() || 'Family',
      phone: phone.trim(),
      isPrimary,
    });

    setName('');
    setPhone('');
    setIsPrimary(false);
    setIsAddContactOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: EmergencyContact) => {
    setEditingContact(c);
    setEditName(c.name);
    setEditRel(c.relationship);
    setEditPhone(c.phone);
    setEditIsPrimary(!!c.isPrimary);
  };

  // Handle Edit Contact Submit
  const handleEditContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editName.trim() || !editPhone.trim()) return;

    editEmergencyContact(editingContact.id, {
      name: editName.trim(),
      relationship: editRel.trim() || 'Family',
      phone: editPhone.trim(),
      isPrimary: editIsPrimary,
    });

    setEditingContact(null);
  };

  // Copy SOS to clipboard
  const handleCopySos = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sosMessage);
      setCopiedSos(true);
      setTimeout(() => setCopiedSos(false), 3000);
    }
  };

  // National & State Helplines
  const emergencyHelplines = [
    { number: '112', title: 'National Emergency', desc: 'Police, Fire, Ambulance 24/7', color: 'from-rose-600 to-red-700' },
    { number: '108', title: 'Free Medical Ambulance', desc: 'Immediate Trauma & ALS Transport', color: 'from-red-600 to-rose-600' },
    { number: '102', title: 'Pregnancy & Infant Transport', desc: 'Maternal & Neonatal Ambulance', color: 'from-pink-600 to-rose-600' },
    { number: '104', title: 'Health Info Helpline', desc: 'Doctor Advice & Blood Bank (AP/TS)', color: 'from-blue-600 to-indigo-600' },
    { number: '100', title: 'Police Assistance', desc: 'Rapid Police Response Unit', color: 'from-slate-700 to-slate-900' },
    { number: '1091', title: 'Women Helpline', desc: 'Women in Distress 24/7 Safety', color: 'from-purple-600 to-indigo-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* High-Visibility Emergency Header */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
              <Siren className="w-4 h-4 animate-bounce" />
              <span>Immediate Assistance & Crisis Hub</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-white">
              {t.emergencyTitle}
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm max-w-xl font-medium">
              {t.emergencySubtitle}
            </p>
          </div>

          {/* Quick 1-Tap National Emergency Dialers */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <a
              id="emergency-call-108-btn"
              href="tel:108"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 font-black text-base flex items-center justify-center gap-3 shadow-lg hover:scale-102 active:scale-98 transition-all"
            >
              <PhoneCall className="w-5 h-5 text-rose-600 animate-pulse" />
              <span>{t.call108}</span>
            </a>

            <a
              id="emergency-call-112-btn"
              href="tel:112"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-rose-950/80 hover:bg-rose-950 text-white font-bold text-base flex items-center justify-center gap-2 border border-white/20 transition-colors"
            >
              <PhoneCall className="w-5 h-5 text-rose-300" />
              <span>{t.call112}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Safety Compliance Notice */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-950">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Notice:</strong> MediMitra provides quick access to certified emergency hotlines, family SOS alerts, and live Smart Ambulance traffic coordination. In a life-threatening crisis, dial <strong>108</strong> or <strong>112</strong> without delay.
        </p>
      </div>

      {/* Grid Layout: Location & Smart Ambulance (Left) + Emergency Contacts & SOS (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: GPS Location & Smart Ambulance Corridor */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Real-time Location Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                Live Incident GPS Location
              </h2>
              <button
                id="btn-calibrate-gps"
                onClick={userLocation.detectLocation}
                disabled={userLocation.isDetecting}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors"
              >
                <Compass className={`w-3.5 h-3.5 ${userLocation.isDetecting ? 'animate-spin' : ''}`} />
                <span>{userLocation.isDetecting ? 'Detecting...' : 'Detect GPS Location'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Incident Coordinates & Area
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  GPS Ready
                </span>
              </div>
              <div className="font-display font-bold text-sm sm:text-base text-slate-900">
                {userLocation.area}, {userLocation.city}
              </div>
              <div className="font-mono text-xs text-slate-600">
                Lat: {userLocation.lat.toFixed(4)}° N, Lng: {userLocation.lng.toFixed(4)}° E
              </div>
              <div className="pt-1 flex items-center gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Smart Traffic Ambulance Coordination */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Nearest Designated Trauma Facility
              </span>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                {nearestHospital.icuBedsAvailable} ICU Beds Open
              </span>
            </div>

            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900">
                {nearestHospital.name}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                {nearestHospital.address} • <strong className="text-slate-800">{nearestHospital.distanceKm} km away</strong>
              </div>
              <div className="text-xs font-semibold text-rose-700 mt-1">
                {nearestHospital.traumaLevel} • 24/7 Resuscitation Bay
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Estimated Ambulance Transit</div>
                  <div className="text-[11px] text-slate-500">With AI Green Corridor Pre-emption</div>
                </div>
              </div>
              <div className="font-display font-black text-2xl text-indigo-600">
                07 mins
              </div>
            </div>

            {/* Smart Ambulance Dispatch Button */}
            <div>
              <button
                id="btn-dispatch-smart-ambulance"
                onClick={dispatchEmergencyAmbulance}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-display font-black text-base sm:text-lg shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 transition-transform active:scale-98"
              >
                <Siren className="w-6 h-6 animate-pulse" />
                <span>Launch Smart Traffic Ambulance</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-2">
                Opens real-time Smart Ambulance Traffic Coordination telemetry dashboard.
              </p>
            </div>
          </div>

          {/* Medical ID Card for First Responders */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-600" />
              <h3 className="font-display font-bold text-base text-slate-900">
                Emergency Medical ID
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Blood Group</span>
                <span className="font-black text-rose-700 text-base">
                  {healthProfile?.bloodGroup || 'O+ Positive'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Allergies</span>
                <span className="font-bold text-slate-800 block truncate">
                  {healthProfile?.allergies || 'None recorded'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Chronic Conditions</span>
                <span className="font-bold text-slate-800 block truncate">
                  {healthProfile?.chronicConditions || 'Hypertension'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Emergency Contacts, SOS SMS, and National Helplines */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Emergency SOS SMS Broadcast Card */}
          <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Emergency SOS SMS with GPS
                </h2>
              </div>
              <button
                id="btn-copy-sos"
                onClick={handleCopySos}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 transition-colors"
              >
                {copiedSos ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSos ? 'Copied to Clipboard!' : 'Copy SOS Message'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-rose-950 font-mono whitespace-pre-wrap leading-relaxed">
              {sosMessage}
            </div>

            {/* Quick SMS Links to Primary / First Contact */}
            {emergencyContacts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`sms:${emergencyContacts[0].phone}?body=${encodeURIComponent(sosMessage)}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send SOS SMS to {emergencyContacts[0].name} ({emergencyContacts[0].phone})</span>
                </a>
              </div>
            )}
          </div>

          {/* Emergency Contacts List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Saved Emergency Contacts
                </h2>
                <p className="text-xs text-slate-500">
                  Family members or friends who will be notified in emergencies.
                </p>
              </div>

              <button
                id="btn-add-contact"
                onClick={() => setIsAddContactOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            {emergencyContacts.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No emergency contacts saved yet. Add trusted family members or doctors.
                </p>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  + Add Emergency Contact
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    id={`contact-card-${contact.id}`}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-slate-900">
                          {contact.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {contact.relationship}
                        </span>
                        {contact.isPrimary && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-600 mt-0.5">
                        {contact.phone}
                      </div>
                    </div>

                    {/* Contact Action Buttons */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${contact.phone}`}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Call Contact"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`sms:${contact.phone}?body=${encodeURIComponent(sosMessage)}`}
                        className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Send SOS SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </a>

                      <button
                        onClick={() => handleOpenEdit(contact)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
                        title="Edit Contact"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingContactId(contact.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* National & State Emergency Hotlines Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-600" />
              Direct Emergency Helpline Hotlines
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyHelplines.map((line) => (
                <a
                  key={line.number}
                  href={`tel:${line.number}`}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 bg-slate-50 hover:bg-rose-50/40 flex items-center justify-between gap-3 group transition-all"
                >
                  <div>
                    <div className="font-display font-black text-xl text-slate-900 group-hover:text-rose-600 transition-colors">
                      {line.number}
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      {line.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {line.desc}
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:bg-rose-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Add Emergency Contact Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-bold text-lg text-blue-950">
                  Add Emergency Contact
                </h3>
              </div>
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar, Sunita Devi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Son / Daughter">Son / Daughter</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Family Doctor">Family Doctor</option>
                    <option value="Neighbor">Neighbor</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                  <span className="font-bold text-slate-700">
                    Set as primary emergency contact
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Emergency Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-bold text-lg text-blue-950">
                  Edit Emergency Contact
                </h3>
              </div>
              <button
                onClick={() => setEditingContact(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditContactSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={editRel}
                    onChange={(e) => setEditRel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Son / Daughter">Son / Daughter</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Family Doctor">Family Doctor</option>
                    <option value="Neighbor">Neighbor</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPrimary}
                    onChange={(e) => setEditIsPrimary(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                  <span className="font-bold text-slate-700">
                    Set as primary emergency contact
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation Modal */}
      {deletingContactId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Delete Contact?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove this emergency contact from your SOS alert list?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingContactId(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteEmergencyContact(deletingContactId);
                  setDeletingContactId(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
