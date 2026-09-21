import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  MapPin,
  Phone,
  Star,
  Clock,
  Compass,
  Search,
  Filter,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Key,
  ShieldCheck,
  Building2,
  Stethoscope,
  ExternalLink,
  LocateFixed,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';

export const DoctorFinderPage: React.FC = () => {
  const {
    doctors,
    nearbyDoctorsLoading,
    nearbyDoctorsError,
    nearbyDoctorsConfigRequired,
    nearbyDoctorsProvider,
    setNearbyDoctorsProvider,
    fetchNearbyDoctors,
    refreshNearbyDoctors,
    language,
    userLocation,
    detectUserLocation,
    startLiveLocationTracking,
  } = useApp();

  const t = TRANSLATIONS[language];

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Ask user for browser/device location permission on mount and begin watchPosition tracking
  useEffect(() => {
    startLiveLocationTracking();
  }, []);

  const specialties = [
    'All',
    'General Practice',
    'Medical Clinic',
    'Hospital',
    'Cardiology',
    'Pediatrics',
    'Dental',
    'Physiotherapy',
  ];

  const handleRequestLocation = async () => {
    await refreshNearbyDoctors();
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec =
      selectedSpecialty === 'All' ||
      (doc.specialty && doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())) ||
      (doc.type && doc.type.toLowerCase().includes(selectedSpecialty.toLowerCase()));

    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.address && doc.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.type && doc.type.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSpec && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-blue-100 text-blue-800">
              <Stethoscope className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800">
              Verified Healthcare Providers (5 km Radius)
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-blue-950 tracking-tight">
            {t.doctorFinder}
          </h1>
          <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-2xl font-medium">
            Discover real, licensed doctors, clinics, and hospitals within 5 km of your live GPS coordinates. No simulated or fake provider data.
          </p>
        </div>

        {/* Action Buttons: Calibrate GPS & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-request-doctor-location"
            onClick={handleRequestLocation}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-colors ${
              userLocation.isGpsDetected
                ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LocateFixed className={`w-4 h-4 ${userLocation.isGpsDetected ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>{userLocation.isGpsDetected ? 'Recalibrate GPS' : 'Request Location Permission'}</span>
          </button>

          <button
            id="btn-refresh-nearby-doctors"
            onClick={() => refreshNearbyDoctors()}
            disabled={nearbyDoctorsLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${nearbyDoctorsLoading ? 'animate-spin' : ''}`} />
            <span>{nearbyDoctorsLoading ? 'Searching...' : 'Refresh Nearby Doctors'}</span>
          </button>
        </div>
      </div>

      {/* REQUIRED BEHAVIOR 3: Current GPS Coordinates Testing & Telemetry Panel */}
      <div id="gps-telemetry-panel" className="bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Live GPS Coordinates & Geolocation Telemetry
                </h2>
                <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                  userLocation.trackingStatus === 'tracking'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : userLocation.trackingStatus === 'requesting'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                    : userLocation.trackingStatus === 'denied'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : userLocation.trackingStatus === 'unavailable' || userLocation.trackingStatus === 'timeout'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}>
                  {userLocation.trackingStatus === 'tracking'
                    ? '🟢 GPS Active (watchPosition)'
                    : userLocation.trackingStatus === 'requesting'
                    ? '🟡 Requesting Permission...'
                    : userLocation.trackingStatus === 'denied'
                    ? '🔴 Permission Denied'
                    : userLocation.trackingStatus === 'unavailable'
                    ? '🟠 Signal Unavailable'
                    : userLocation.trackingStatus === 'timeout'
                    ? '⏱️ GPS Timeout'
                    : userLocation.trackingStatus === 'unsupported'
                    ? '❌ Unsupported'
                    : '⚪ Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Required verification: Real device GPS coordinates are used directly to bound search queries within 5.0 km.
              </p>
            </div>
          </div>

          {/* Provider Selector / Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Search Engine:</span>
            <div className="inline-flex p-1 bg-slate-800/80 rounded-xl border border-slate-700">
              <button
                id="toggle-provider-google"
                onClick={() => {
                  setNearbyDoctorsProvider('google');
                  fetchNearbyDoctors(userLocation.lat, userLocation.lng, 'google', true);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  nearbyDoctorsProvider === 'google'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Google Places API (New)
              </button>
              <button
                id="toggle-provider-osm"
                onClick={() => {
                  setNearbyDoctorsProvider('osm');
                  fetchNearbyDoctors(userLocation.lat, userLocation.lng, 'osm', true);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  nearbyDoctorsProvider === 'osm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                OpenStreetMap (Live)
              </button>
            </div>
          </div>
        </div>

        {/* REQUIRED BEHAVIOR 4: Display Latitude, Longitude, GPS Accuracy, and GPS Tracking Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Current Latitude
            </span>
            <span id="display-latitude" className="font-mono font-bold text-sm sm:text-base text-blue-300 truncate block">
              {userLocation.lat != null ? `${userLocation.lat.toFixed(6)}°` : 'Pending GPS Fix'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">WGS84 Real GPS</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Current Longitude
            </span>
            <span id="display-longitude" className="font-mono font-bold text-sm sm:text-base text-blue-300 truncate block">
              {userLocation.lng != null ? `${userLocation.lng.toFixed(6)}°` : 'Pending GPS Fix'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">WGS84 Real GPS</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              GPS Accuracy
            </span>
            <span id="display-accuracy" className="font-mono font-bold text-sm sm:text-base text-emerald-300 truncate block">
              {userLocation.accuracy != null ? `±${Math.round(userLocation.accuracy)} meters` : 'Acquiring...'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Radius: 5.0 km</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              GPS Tracking Status
            </span>
            <span id="display-tracking-status" className="font-mono font-bold text-xs sm:text-sm text-cyan-300 truncate block">
              {userLocation.trackingStatus === 'tracking'
                ? 'Active (watchPosition)'
                : userLocation.trackingStatus === 'requesting'
                ? 'Requesting Access'
                : userLocation.trackingStatus === 'denied'
                ? 'Permission Denied'
                : userLocation.trackingStatus === 'unavailable'
                ? 'Signal Unavailable'
                : userLocation.trackingStatus === 'timeout'
                ? 'Request Timeout'
                : userLocation.trackingStatus === 'unsupported'
                ? 'Browser Unsupported'
                : 'Standby / Idle'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {userLocation.lastUpdated ? `Sync: ${userLocation.lastUpdated}` : 'Live stream'}
            </span>
          </div>
        </div>
      </div>

      {/* REQUIRED BEHAVIOR 10: Handle error conditions with clear, simple messages */}
      {(userLocation.trackingStatus === 'denied' || userLocation.permissionDenied) && (
        <div id="permission-denied-alert" className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-rose-950">
                Location Permission Denied
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Location permission was denied by your browser. Please allow location access in your browser settings (or click the lock icon in your browser address bar) to search for nearby doctors, clinics, and hospitals.
              </p>
            </div>
          </div>
          <button
            onClick={() => detectUserLocation()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            Allow & Retry Permission
          </button>
        </div>
      )}

      {userLocation.trackingStatus === 'unavailable' && (
        <div id="gps-unavailable-alert" className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-950">
                GPS Position Unavailable
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Unable to retrieve your current location. Please verify that your device Location / GPS service is turned ON and you have network connectivity.
              </p>
            </div>
          </div>
          <button
            onClick={() => detectUserLocation()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            Retry GPS Fix
          </button>
        </div>
      )}

      {userLocation.trackingStatus === 'timeout' && (
        <div id="gps-timeout-alert" className="p-4 sm:p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-orange-950">
                GPS Acquisition Timed Out
              </h3>
              <p className="text-xs text-orange-800 mt-0.5">
                GPS signal timed out while waiting for a satellite or network location fix. Tap retry to acquire a fresh signal.
              </p>
            </div>
          </div>
          <button
            onClick={() => detectUserLocation()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            Retry GPS
          </button>
        </div>
      )}

      {userLocation.trackingStatus === 'unsupported' && (
        <div id="gps-unsupported-alert" className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Geolocation Not Supported by Browser
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Your browser does not support HTML5 Geolocation. Please access MedMitra using a modern web browser such as Google Chrome, Apple Safari, or Microsoft Edge.
            </p>
          </div>
        </div>
      )}

      {/* REQUIRED BEHAVIOR 10: If no API is configured, DO NOT show fake results. Clearly state which API & API key are required */}
      {nearbyDoctorsConfigRequired && (
        <div id="api-key-required-card" className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-200/70 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-amber-800" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                  Real API Required
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  Zero Fake Data Policy Enforced
                </span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-amber-950">
                Google Places API Key Required for Live Searches
              </h2>
              <p className="text-xs sm:text-sm text-amber-900/90 font-medium max-w-3xl leading-relaxed">
                In strict adherence to requirements, MediMitra does not create or display fabricated doctor data. To query live licensed doctors, clinics, and hospitals within 5 km of your GPS coordinates, you must configure your backend environment variable.
              </p>
            </div>
          </div>

          {/* Configuration Requirements Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/80 rounded-2xl p-4 border border-amber-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Required API Service
              </span>
              <span className="font-bold text-slate-900 text-sm">
                Google Places API (New)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Google Maps Platform</span>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Backend Environment Variable
              </span>
              <code className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                GOOGLE_MAPS_API_KEY
              </code>
              <span className="text-[11px] text-slate-500 block mt-0.5">Stored in backend .env file</span>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Your Live GPS Coordinates Ready
              </span>
              <span className="font-mono font-bold text-blue-900 text-xs block">
                {userLocation.lat != null && userLocation.lng != null
                  ? `${userLocation.lat.toFixed(6)}° N, ${userLocation.lng.toFixed(6)}° E`
                  : 'Awaiting device GPS lock...'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">Ready to search within 5.0 km</span>
            </div>
          </div>

          {/* Instant Alternative: Test OpenStreetMap Real Data */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Want to verify GPS coordinates immediately with real data?
                </h3>
                <p className="text-[11px] text-slate-600">
                  OpenStreetMap Overpass provides real, live, open-access hospital, clinic, and doctor data worldwide without requiring an API key.
                </p>
              </div>
            </div>

            <button
              id="btn-test-osm-real-data"
              onClick={() => {
                setNearbyDoctorsProvider('osm');
                fetchNearbyDoctors(userLocation.lat, userLocation.lng, 'osm', true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
            >
              Test with OpenStreetMap Live Data
            </button>
          </div>
        </div>
      )}

      {/* Error Message if API Call Failed */}
      {nearbyDoctorsError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{nearbyDoctorsError}</span>
          </div>
          <button
            onClick={() => refreshNearbyDoctors()}
            className="px-3 py-1.5 bg-white border border-rose-300 rounded-lg font-bold text-rose-900 hover:bg-rose-100"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-blue-100 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor or clinic name, specialty, or address..."
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

        {/* Results summary counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredDoctors.length}</strong> real healthcare providers within 5.0 km of your GPS location
          </span>
          <span className="text-[11px] text-slate-400">
            Source: {nearbyDoctorsProvider === 'osm' ? 'OpenStreetMap Live Overpass' : 'Google Places API (New)'}
          </span>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {nearbyDoctorsLoading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-blue-100 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <h3 className="font-display font-bold text-base text-blue-950">
            Searching Real Providers Nearby...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Querying active healthcare establishments within a 5 km circular radius around coordinates ({userLocation.lat != null ? `${userLocation.lat.toFixed(5)}°` : 'Live GPS'}, {userLocation.lng != null ? `${userLocation.lng.toFixed(5)}°` : 'Live GPS'})...
          </p>
        </div>
      )}

      {/* No Results Empty State */}
      {!nearbyDoctorsLoading && !nearbyDoctorsConfigRequired && filteredDoctors.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-blue-100 shadow-xs space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-display font-bold text-base text-slate-800">
            No Healthcare Providers Found Within 5 km
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No clinics, doctors, or hospitals were returned within a 5 km radius of your coordinates ({userLocation.lat != null ? userLocation.lat.toFixed(4) : 'GPS'}, {userLocation.lng != null ? userLocation.lng.toFixed(4) : 'GPS'}). Try refreshing or clearing your specialty search filter.
          </p>
          <button
            onClick={() => {
              setSelectedSpecialty('All');
              setSearchQuery('');
              refreshNearbyDoctors();
            }}
            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            Clear Filters & Refresh
          </button>
        </div>
      )}

      {/* REQUIRED BEHAVIOR 7: Doctor Cards with Name, Type, Specialty, Address, Distance, Phone, Call button, Directions button */}
      {!nearbyDoctorsLoading && filteredDoctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => {
            const hasPhone = Boolean(doc.phone && doc.phone.trim().length > 0);
            const cleanPhone = hasPhone ? doc.phone!.replace(/[^0-9+]/g, '') : '';
            const directionsUrl =
              doc.directionsUrl ||
              (doc.lat != null && doc.lng != null
                ? `https://www.google.com/maps/dir/?api=1&destination=${doc.lat},${doc.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.name + ' ' + (doc.address || ''))}`);

            return (
              <div
                key={doc.id}
                id={`doctor-card-${doc.id}`}
                className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div>
                  {/* Top: Facility/Doctor Name & Type */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base text-blue-950 truncate">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800">
                          {doc.type || 'Doctor / Clinic'}
                        </span>
                        {doc.source && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.source === 'google_places' ? 'Google Places' : 'OSM'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating if available */}
                    {doc.rating !== null && doc.rating !== undefined && (
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold text-amber-900 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{doc.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Specialty if available */}
                  {doc.specialty && (
                    <div className="text-xs font-semibold text-blue-700 mb-2">
                      Specialty: {doc.specialty}
                    </div>
                  )}

                  {/* Details section: Address, Distance, Phone */}
                  <div className="space-y-2 text-xs text-slate-600 py-3 border-y border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-700 leading-snug">
                        {doc.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Navigation className="w-3 h-3" />
                        <span>{doc.distanceKm} km from you</span>
                      </div>

                      {doc.isOpenNow !== null && doc.isOpenNow !== undefined && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          doc.isOpenNow ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {doc.isOpenNow ? '● Open Now' : 'Closed'}
                        </span>
                      )}
                    </div>

                    {/* Phone display */}
                    <div className="flex items-center gap-2 text-[11px] pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {hasPhone ? (
                        <span className="font-mono text-slate-800 font-medium">{doc.phone}</span>
                      ) : (
                        <span className="text-slate-400 italic">Phone number not listed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons: Call Button (if phone exists) & Directions Button */}
                <div className="mt-4 pt-3 flex items-center gap-2">
                  {hasPhone ? (
                    <a
                      id={`btn-call-${doc.id}`}
                      href={`tel:${cleanPhone}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Provider</span>
                    </a>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 text-slate-400 text-center font-medium text-xs border border-slate-200">
                      No Phone Listed
                    </div>
                  )}

                  <a
                    id={`btn-directions-${doc.id}`}
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
