import { useState } from 'react';
import { useStore, Plant, PlantFamily, SunPreference } from '../store/useStore';
import { Search, Info, Droplets, Sun, Calendar, Plus, Loader2, Check, Pencil, Trash2, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { generatePlantData } from '../lib/gemini';

export default function PlantIndex() {
  const { plants, seedBox, addPlant, updatePlant, deletePlant, addSeed, currentUser, tasks, setIsNotificationsModalOpen } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'index' | 'zaden'>('index');
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo === currentUser?.id)).length;
  
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [newPlantInput, setNewPlantInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlantData, setGeneratedPlantData] = useState<Partial<Plant> | null>(null);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  
  const [addToSeedBox, setAddToSeedBox] = useState(false);
  const [seedQuantity, setSeedQuantity] = useState<number | ''>('');
  const [seedUnit, setSeedUnit] = useState<'stuks' | 'gram'>('stuks');

  const handleGenerate = async () => {
    if (!newPlantInput.trim()) return;
    setIsGenerating(true);
    setGeneratedPlantData(null);
    const data = await generatePlantData(newPlantInput);
    if (data) {
      setGeneratedPlantData(data);
    }
    setIsGenerating(false);
  };

  const handleSavePlant = () => {
    if (generatedPlantData && generatedPlantData.name) {
      if (editingPlantId) {
        updatePlant(editingPlantId, {
          name: generatedPlantData.name,
          family: (generatedPlantData.family as PlantFamily) || 'Overig',
          sunPreference: (generatedPlantData.sunPreference as SunPreference) || 'Zon',
          daysToHarvest: generatedPlantData.daysToHarvest || 60,
          waterNeeds: generatedPlantData.waterNeeds || 'Gemiddeld',
          icon: generatedPlantData.icon || '🌱',
          imageUrl: generatedPlantData.imageUrl,
        });
      } else {
        const newPlantId = addPlant({
          name: generatedPlantData.name,
          family: (generatedPlantData.family as PlantFamily) || 'Overig',
          goodNeighbors: [],
          badNeighbors: [],
          sunPreference: (generatedPlantData.sunPreference as SunPreference) || 'Zon',
          daysToHarvest: generatedPlantData.daysToHarvest || 60,
          waterNeeds: generatedPlantData.waterNeeds || 'Gemiddeld',
          icon: generatedPlantData.icon || '🌱',
          imageUrl: generatedPlantData.imageUrl,
        } as Omit<Plant, 'id'>);

        if (addToSeedBox && typeof seedQuantity === 'number' && seedQuantity > 0) {
          addSeed({
            plantId: newPlantId,
            quantity: seedQuantity,
            unit: seedUnit
          });
        }
      }

      closeModal();
    }
  };

  const closeModal = () => {
    setIsAddingModalOpen(false);
    setNewPlantInput('');
    setGeneratedPlantData(null);
    setEditingPlantId(null);
    setAddToSeedBox(false);
    setSeedQuantity('');
    setSeedUnit('stuks');
  };

  const handleEditPlant = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setGeneratedPlantData(plant);
    setIsAddingModalOpen(true);
  };

  const handleDeletePlant = (id: string) => {
    if (confirm('Weet je zeker dat je dit gewas wilt verwijderen? Dit zal het gewas overal in de app verwijderen, inclusief het grid en de zadenbox.')) {
      deletePlant(id);
    }
  };

  const filteredPlants = plants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-6 pt-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E1A]">Gewassen & Zaden</h1>
          <p className="text-sm text-stone-500">Ontdek alles over je gewassen</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAddingModalOpen(true)}
            className="bg-[#5A8F5A] text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#4A7A4A] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Nieuw Gewas</span>
          </button>
          <button 
            onClick={() => setIsNotificationsModalOpen(true)}
            className="hidden md:flex relative bg-white rounded-xl p-2.5 shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-stone-600" />
            {activeTasksCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                {activeTasksCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Add Plant Modal */}
      {isAddingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-4">{editingPlantId ? 'Gewas Bewerken' : 'Nieuw Gewas Toevoegen'}</h2>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
              {!editingPlantId && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">Wat wil je toevoegen?</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Bijv. Aardbei, Courgette..." 
                      className="flex-1 bg-[#F5F7F4] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none font-bold text-[#1A2E1A]"
                      value={newPlantInput}
                      onChange={(e) => setNewPlantInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !newPlantInput.trim()}
                      className="bg-amber-500 text-white px-4 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[5rem]"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Genereer'}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 flex items-center">
                    <span className="mr-1">✨</span> AI zoekt automatisch de eigenschappen op
                  </p>
                </div>
              )}

              {generatedPlantData && (
                <div className="bg-[#F5F7F4] rounded-2xl p-4 border border-stone-200 animate-in fade-in slide-in-from-bottom-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Naam</label>
                      <input 
                        type="text"
                        value={generatedPlantData.name || ''}
                        onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, name: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Icoon / Emoji</label>
                      <input 
                        type="text"
                        value={generatedPlantData.icon || ''}
                        onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, icon: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Type</label>
                      <select 
                        value={generatedPlantData.family || 'Overig'}
                        onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, family: e.target.value as PlantFamily })}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      >
                        {['Groente', 'Fruit', 'Zaden', 'Bloemen', 'Overig'].map(fam => (
                          <option key={fam} value={fam}>{fam}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Zonlicht</label>
                      <select 
                        value={generatedPlantData.sunPreference || 'Zon'}
                        onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, sunPreference: e.target.value as SunPreference })}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      >
                        {['Zon', 'Halfschaduw', 'Schaduw', 'Duisternis'].map(pref => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Oogsttijd (Dagen)</label>
                      <input 
                        type="number"
                        min="1"
                        value={generatedPlantData.daysToHarvest || ''}
                        onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, daysToHarvest: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Waterbehoefte</label>
                      <select 
                        value={generatedPlantData.waterNeeds || 'Gemiddeld'}
                        onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, waterNeeds: e.target.value as 'Laag' | 'Gemiddeld' | 'Hoog' })}
                        className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      >
                        <option value="Laag">Laag</option>
                        <option value="Gemiddeld">Gemiddeld</option>
                        <option value="Hoog">Hoog</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Afbeelding URL (Optioneel)</label>
                    <input 
                      type="text"
                      value={generatedPlantData.imageUrl || ''}
                      onChange={(e) => setGeneratedPlantData({ ...generatedPlantData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                    />
                  </div>

                  {generatedPlantData.imageUrl && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Afbeelding Preview</label>
                      <img src={generatedPlantData.imageUrl} alt="Preview" className="w-full h-32 rounded-xl object-cover shadow-sm border border-stone-200" />
                    </div>
                  )}

                  {/* Seedbox Option */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 mt-4">
                    <label className="flex items-center space-x-2 cursor-pointer mb-3">
                      <input 
                        type="checkbox" 
                        checked={addToSeedBox}
                        onChange={(e) => setAddToSeedBox(e.target.checked)}
                        className="rounded text-[#5A8F5A] focus:ring-[#5A8F5A] w-4 h-4"
                      />
                      <span className="text-sm font-bold text-[#1A2E1A]">Ook toevoegen aan Zadenbox</span>
                    </label>
                    
                    {addToSeedBox && (
                      <div className="flex items-center space-x-2 mt-2">
                        <input 
                          type="number" 
                          min="1"
                          placeholder="Hoeveelheid" 
                          value={seedQuantity}
                          onChange={(e) => setSeedQuantity(parseInt(e.target.value) || '')}
                          className="flex-1 bg-[#F5F7F4] border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#5A8F5A] font-bold"
                        />
                        <select 
                          value={seedUnit}
                          onChange={(e) => setSeedUnit(e.target.value as 'stuks' | 'gram')}
                          className="bg-[#F5F7F4] border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#5A8F5A] font-bold"
                        >
                          <option value="stuks">Stuks</option>
                          <option value="gram">Gram</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6 pt-4 border-t border-stone-100">
              <button 
                onClick={() => { setIsAddingModalOpen(false); setGeneratedPlantData(null); setNewPlantInput(''); }}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
              >
                Annuleren
              </button>
              <button 
                onClick={handleSavePlant}
                disabled={!generatedPlantData}
                className="flex-1 py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>Opslaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 space-y-4 md:space-y-0">
        {/* Tabs */}
        <div className="flex space-x-2 bg-stone-200 p-1 rounded-xl w-full md:w-64 shrink-0">
          <button
            onClick={() => setActiveTab('index')}
            className={cn(
              "flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
              activeTab === 'index' ? "bg-white text-[#5A8F5A] shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            Gewassen
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
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Zoek plant of type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]/20 focus:border-[#5A8F5A] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        {activeTab === 'index' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlants.map(plant => (
              <div key={plant.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{plant.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-[#1A2E1A]">{plant.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A8F5A] mt-0.5">{plant.family}</p>
                    </div>
                  </div>
                  {currentUser?.role === 'Admin' && (
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => handleEditPlant(plant)}
                        className="p-1.5 text-stone-400 hover:text-[#5A8F5A] hover:bg-[#E8F0E8] rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePlant(plant.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                    Goede buren: {plant.goodNeighbors.map(id => {
                      const p = plants.find(p => p.id === id);
                      return p ? `${p.icon} ${p.name}` : null;
                    }).filter(Boolean).join(', ') || 'Geen'}.<br/>
                    Slechte buren: {plant.badNeighbors.map(id => {
                      const p = plants.find(p => p.id === id);
                      return p ? `${p.icon} ${p.name}` : null;
                    }).filter(Boolean).join(', ') || 'Geen'}.
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
                      <span className="text-lg">{plant.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1A2E1A]">{plant.name}</h3>
                      <p className="text-xs text-stone-500">{plant.family}</p>
                    </div>
                  </div>
                  <div className="bg-[#F5F7F4] px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-bold text-stone-700">{seed.quantity} {seed.unit === 'gram' ? 'g' : 'st.'}</span>
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
