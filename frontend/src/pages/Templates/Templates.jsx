import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter } from 'lucide-react';

const categories = ['All', 'Business', 'Employment', 'Real Estate', 'Personal'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

useEffect(() => {
    fetch(`http://localhost:5001/api/templates?category=${activeCategory}`)
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(text) });
        }
        return res.json();
      })
      .then(data => {
        setTemplates(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Frontend Fetch Error:", err.message);
        setTemplates([]); 
      });
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[#F8F7F2] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1A2035] mb-2">Template Library</h1>
        <p className="text-slate-600 mb-8">Verified contracts ready for your next big move.</p>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeCategory === cat 
                ? 'bg-[#D4AF37] text-white shadow-md' 
                : 'bg-white text-slate-600 border border-[#E5E5E0] hover:border-[#D4AF37]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(temp => (
            <div key={temp.id} className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#F8F7F2] rounded-xl flex items-center justify-center text-[#D4AF37] mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{temp.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{temp.description}</p>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-500 uppercase tracking-wider">
                  {temp.category}
                </span>
              </div>
              <button className="mt-6 w-full py-3 bg-[#1A2035] text-white rounded-xl font-bold hover:bg-[#303658] transition">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
