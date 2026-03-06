import { useState } from 'react';
import { useStore, Plant } from '../store/useStore';
import { Search, Info, Droplets, Sun, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PlantIndex() {
  const { plants, seedBox } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'index' | 'zaden'>('index');

  const filteredPlants = plants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-[#1A2E1A]">Planten & Zaden</h1>
        <p className="text-sm text-stone-500">Ontdek alles over je gewassen</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4 bg-stone-200 p-1 rounded-xl w-full md:w-64">
        <button
          onClick={() => setActiveTab('index')}
          className={cn(
            "flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
            activeTab === 'index' ? "bg-white text-[#5A8F5A] shadow-sm" : "text-stone-500 hover:text-stone-700"
          )}
        >
          Index
        </button>
        <button
          onClick={() => setActiveTab('zaden')}
          className={cn(
            "flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
            activeTab === 'zaden' ? "bg-white text-[#5A8F5A] shadow-sm" : "text-stone-500 hover:text-stone-700"
          )}
        >
          Zadenbox
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Zoek plant of familie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]/20 focus:border-[#5A8F5A] transition-all shadow-sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        {activeTab === 'index' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlants.map(plant => (
              <div key={plant.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A2E1A]">{plant.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A8F5A] mt-0.5">{plant.family}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-[#F5F7F4] rounded-lg p-2 flex flex-col items-center justify-center text-center">
                    <Sun className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold text-stone-600">{plant.sunPreference}</span>
                  </div>
                  <div className="bg-[#F5F7F4] rounded-lg p-2 flex flex-col items-center justify-center text-center">
                    <Droplets className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold text-stone-600">{plant.waterNeeds} Water</span>
                  </div>
                  <div className="bg-[#F5F7F4] rounded-lg p-2 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-4 h-4 text-[#5A8F5A] mb-1" />
                    <span className="text-[10px] font-bold text-stone-600">{plant.daysToHarvest} Dagen</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-start space-x-2 flex-1">
                  <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Goede buren: {plant.goodNeighbors.map(id => plants.find(p => p.id === id)?.name).join(', ') || 'Geen'}.<br/>
                    Slechte buren: {plant.badNeighbors.map(id => plants.find(p => p.id === id)?.name).join(', ') || 'Geen'}.
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seedBox.map(seed => {
              const plant = plants.find(p => p.id === seed.plantId);
              if (!plant) return null;
              return (
                <div key={seed.plantId} className="bg-white border border-stone-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E8F0E8] rounded-xl flex items-center justify-center">
                      <span className="text-lg">🌱</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1A2E1A]">{plant.name}</h3>
                      <p className="text-xs text-stone-500">{plant.family}</p>
                    </div>
                  </div>
                  <div className="bg-[#F5F7F4] px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-bold text-stone-700">{seed.quantity} st.</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
