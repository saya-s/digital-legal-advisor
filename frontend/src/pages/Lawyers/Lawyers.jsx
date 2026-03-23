import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Scale, 
  Star, 
  Briefcase, 
  Clock,
  Filter,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Award,
  BookOpen,
  ThumbsUp
} from "lucide-react";

export default function Lawyers() {
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showFilters, setShowFilters] = useState(false);

 
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/lawyers');
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setLawyers(data);
      } catch (err) {
        console.error("Error fetching lawyers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, []);


  const cities = [...new Set(lawyers.map(l => l.city))].filter(Boolean);
  const specialties = [...new Set(lawyers.map(l => l.specialty))].filter(Boolean);

  const filteredLawyers = lawyers.filter((lawyer) => {
    const matchesSearch = 
      lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === "" || lawyer.city === selectedCity;
    const matchesSpecialty = selectedSpecialty === "" || lawyer.specialty === selectedSpecialty;

    return matchesSearch && matchesCity && matchesSpecialty;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading experts...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F2]">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-[#1A2035] hover:text-[#D4AF37] transition"
            >
              <ChevronRight size={20} className="rotate-180" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-[#1A2035]">Find a Lawyer</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="bg-[#1A2035] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Scale size={48} className="text-[#D4AF37]" />
            <h2 className="text-4xl font-bold">Connect with Expert Lawyers</h2>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl">
            Find trusted legal professionals. Filter by specialty, city, 
            and ratings to find the perfect match for your legal needs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, specialty, or firm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-3 bg-[#1A2035] text-white rounded-xl"
            >
              <Filter size={20} /> Filters
            </button>

            <div className="hidden md:flex gap-4">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
              >
                <option value="">All Cities</option>
                {cities.map((city, index) => <option key={index} value={city}>{city}</option>)}
              </select>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
              >
                <option value="">All Specialties</option>
                {specialties.map((spec, index) => <option key={index} value={spec}>{spec}</option>)}
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 md:hidden space-y-4">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              >
                <option value="">All Cities</option>
                {cities.map((city, index) => <option key={index} value={city}>{city}</option>)}
              </select>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Found <span className="font-bold text-[#1A2035]">{filteredLawyers.length}</span> lawyers
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="relative h-32 bg-gradient-to-r from-[#1A2035] to-[#303658]">
                <div className="absolute -bottom-12 left-6">
                  <img
                    src={lawyer.image_url || "https://via.placeholder.com/150"}
                    alt={lawyer.name}
                    className="w-24 h-24 rounded-xl border-4 border-white shadow-lg object-cover"
                  />
                </div>
              </div>

              <div className="pt-14 p-6">
                <h3 className="text-xl font-bold text-[#1A2035] mb-1">{lawyer.name}</h3>
                <p className="text-[#D4AF37] font-medium mb-2">{lawyer.firm}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-[#D4AF37] fill-current" />
                  <span className="font-bold">{lawyer.rating}</span>
                  <span className="text-sm text-gray-500">({lawyer.reviews} reviews)</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase size={16} className="text-[#D4AF37]" />
                    <span className="text-sm">{lawyer.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} className="text-[#D4AF37]" />
                    <span className="text-sm">{lawyer.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-[#D4AF37]" />
                    <span className="text-sm">{lawyer.experience} experience</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-sm text-gray-500">Hourly Rate</span>
                    <p className="text-xl font-bold text-[#1A2035]">{lawyer.hourly_rate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.location.href = `tel:${lawyer.phone}`} className="p-2 bg-gray-100 rounded-lg"><Phone size={18} /></button>
                    <button onClick={() => window.location.href = `mailto:${lawyer.email}`} className="p-2 bg-gray-100 rounded-lg"><Mail size={18} /></button>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/lawyer/${lawyer.id}`)}
                  className="w-full mt-4 py-2 bg-[#1A2035] text-white rounded-xl font-medium hover:bg-[#303658] transition flex items-center justify-center gap-2"
                >
                  <BookOpen size={16} /> View Full Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLawyers.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg mt-8">
            <h3 className="text-2xl font-bold text-[#1A2035]">No Experts Found</h3>
            <p className="text-gray-600 mt-2">Try clearing your filters to see all available lawyers.</p>
          </div>
        )}
      </div>
    </div>
  );
}