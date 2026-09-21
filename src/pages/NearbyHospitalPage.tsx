import React, { useState } from 'react';
import {
  Building2,
  PhoneCall,
  MapPin,
  ShieldCheck,
  Bed,
  Navigation as NavIcon,
  Search,
  ExternalLink,
  Siren,
  Clock,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { Hospital } from '../types';

export const NearbyHospitalPage: React.FC = () => {
  const {
    hospitals,
    userLocation,
    detectUserLocation,
    language,
    setActiveTab,
    dispatchEmergencyAmbulance,
  } = useApp();

  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [only24x7, setOnly24x7] = useState(false);

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.traumaLevel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmergency = only24x7 ? h.emergency24x7 : true;
    return matchesSearch && matchesEmergency;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white/92 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-100/90 shadow-xl shadow-teal-950/5 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-teal-800">
              {language === 'te-IN' ? 'సమీప అత్యవసర ఆసుపత్రులు' : language === 'hi-IN' ? 'निकटतम आपातकालीन अस्पताल' : 'Verified Emergency Network'}
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {t.nearbyHospital}
          </h1>
          <p className="mt-1 text-slate-600 text-sm font-medium">
            {language === 'te-IN'
              ? 'తక్షణ వైద్య సేవల కోసం అందుబాటులో ఉన్న ఆసుపత్రులు, ICU పడకలు & అంబులెన్స్ వివరాలు.'
              : language === 'hi-IN'
              ? 'त्वरित चिकित्सा, आईसीयू बेड उपलब्धता और 24x7 आपातकालीन ट्रॉमा सेंटर।'
              : 'Real-time directory of verified multi-speciality trauma centers, ICU beds, and direct ambulance helplines.'}
          </p>
        </div>

        {/* GPS Location & Live Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-teal-50/70 p-3.5 rounded-2xl border border-teal-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">
                {userLocation.area ? `${userLocation.area}, ${userLocation.city}` : userLocation.city || 'Detected Location'}
              </span>
              <span className="text-[10px] text-teal-700">
                {userLocation.isGpsDetected ? 'GPS Active' : 'Default Area'}
              </span>
            </div>
          </div>
          <button
            onClick={() => detectUserLocation()}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 text-xs font-black border border-teal-200 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'te-IN' ? 'GPS అప్‌డేట్' : 'Refresh GPS'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-teal-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'te-IN'
                ? 'ఆసుపత్రి పేరు లేదా చిరునామా శోధించండి...'
                : language === 'hi-IN'
                ? 'अस्पताल का नाम या क्षेत्र खोजें...'
                : 'Search hospital name, trauma level, or address...'
            }
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold bg-white border border-teal-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800"
          />
        </div>

        <button
          onClick={() => setOnly24x7(!only24x7)}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            only24x7
              ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
              : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{language === 'te-IN' ? '24x7 అత్యవసర కేంద్రాలు మాత్రమే' : '24x7 Emergency Only'}</span>
        </button>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredHospitals.map((hospital: Hospital) => (
          <div
            key={hospital.id}
            className="bg-white/92 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-teal-100/90 shadow-md shadow-teal-950/5 hover:shadow-xl hover:border-teal-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Top Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                      {hospital.traumaLevel}
                    </span>
                    {hospital.emergency24x7 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        24x7 Trauma SOS
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900 leading-snug">
                    {hospital.name}
                  </h3>
                </div>

                <div className="text-right shrink-0 bg-teal-50/80 px-3 py-1.5 rounded-2xl border border-teal-100">
                  <span className="font-mono font-black text-base text-teal-800">
                    {hospital.distanceKm.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block">KM</span>
                </div>
              </div>

              {/* Address */}
              <p className="text-xs text-slate-600 mb-4 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{hospital.address}</span>
              </p>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-teal-700 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">ICU Beds</span>
                    <span className="text-xs font-black text-teal-900">{hospital.icuBedsAvailable} Available</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-50/50 border border-cyan-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Accreditation</span>
                    <span className="text-xs font-black text-cyan-900">NABH Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-teal-100/70 flex flex-wrap items-center gap-2">
              <a
                href={`tel:${hospital.ambulanceContact.split('/')[0].trim()}`}
                className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-display font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {hospital.ambulanceContact.split('/')[0].trim()}</span>
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  hospital.name + ' ' + hospital.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs flex items-center justify-center gap-1 border border-teal-200 transition-all cursor-pointer"
              >
                <NavIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Directions</span>
                <ExternalLink className="w-3 h-3 text-teal-500" />
              </a>

              <button
                onClick={() => {
                  dispatchEmergencyAmbulance(hospital);
                  setActiveTab('ambulance-traffic');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Initiate Green Corridor priority simulation"
              >
                <Siren className="w-3.5 h-3.5 text-amber-400" />
                <span>Green Corridor</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
