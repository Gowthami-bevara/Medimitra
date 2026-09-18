import React, { useState } from 'react';
import {
  UserCheck,
  MapPin,
  Phone,
  Star,
  Clock,
  Compass,
  Search,
  Filter,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';

export const DoctorFinderPage: React.FC = () => {
  const { doctors, language, userLocation, detectUserLocation } = useApp();
  const t = TRANSLATIONS[language];

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionsDoctor, setDirectionsDoctor] = useState<string | null>(null);

  const specialties = ['All', 'General Physician', 'Cardiologist', 'Pediatrician', 'Orthopedic', 'Dermatologist'];

  const handleRequestLocation = () => {
    detectUserLocation();
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-blue-100 text-blue-800">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800">
              Verified Healthcare Providers
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-blue-950 tracking-tight">
            {t.doctorFinder}
          </h1>
          <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-2xl font-medium">
            Locate experienced medical physicians and outpatient specialists in your vicinity with verified clinics and contact information.
          </p>
        </div>

        {/* Location Permission Button */}
        <button
          id="btn-request-doctor-location"
          onClick={handleRequestLocation}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-colors ${
            userLocation
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Compass className={`w-4 h-4 ${userLocation ? 'text-blue-600' : 'text-slate-500'}`} />
          <span>{userLocation ? `${userLocation.area} (GPS Active)` : 'Calibrate Location'}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-blue-100 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, clinic, or specialty..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {specialties.map((spec) => (
              <button
                key={spec}
                id={`filter-spec-${spec.toLowerCase().replace(' ', '-')}`}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedSpecialty === spec
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directions modal simulation */}
      {directionsDoctor && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950">
                Turn-by-turn Navigation Simulation to {directionsDoctor}
              </div>
              <p className="text-[11px] text-blue-800">
                Route plotted via Green Glen Road & Expressway • Optimal traffic • 6 mins travel time.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDirectionsDoctor(null)}
            className="px-3 py-1 bg-white border border-blue-300 text-blue-900 text-xs font-bold rounded-lg hover:bg-blue-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            id={`doctor-card-${doc.id}`}
            className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-blue-950">
                    {doc.name}
                  </h3>
                  <div className="text-xs font-semibold text-blue-700 mt-0.5">
                    {doc.specialty}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold text-amber-900">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{doc.rating}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 py-3 border-y border-slate-100">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{doc.clinic}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-5">
                  {doc.address} • <strong className="text-slate-700">{doc.distanceKm} km away</strong>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{doc.experienceYears} Years Exp • Available for Consultations</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 pl-5">
                  <span>Languages: {doc.languages.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center gap-2">
              <a
                href={`tel:${doc.phone.replace(/[^0-9+]/g, '')}`}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Clinic</span>
              </a>

              <button
                id={`btn-directions-${doc.id}`}
                onClick={() => setDirectionsDoctor(doc.name)}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
