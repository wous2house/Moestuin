import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, PlantType, SunPreference } from '../store/useStore';
import { format } from 'date-fns';
import { ArrowLeft, Check, Sun, Search, Info, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateHarvestDate } from '../lib/gemini';

import { HeaderActions } from '../components/HeaderActions';

export default function AddPlant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCell = searchParams.get('cell');

  const { plants, grid, setGridCell, currentUser, addLog, seedBox, updateSeed, deleteSeed } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PlantType>('Zaad');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(initialCell || null);
  const [sunExposure, setSunExposure] = useState<SunPreference>('Zon');
  const [isSaving, setIsSaving] = useState(false);
  const [seedsUsed, setSeedsUsed] = useState<number | ''>('');

  // If initialCell is provided but invalid (e.g. already occupied), deselect it
  useEffect(() => {
    if (initialCell) {
      const cell = grid.find(c => c.id === initialCell);
      if (!cell || cell.plantId) {
        setSelectedCellId(null);
      } else if (cell.sunExposure) {
        setSunExposure(cell.sunExposure);
      }
    }
  }, [initialCell, grid]);

  // Update sunExposure when selecting a cell
  useEffect(() => {
    if (selectedCellId) {
      const cell = grid.find(c => c.id === selectedCellId);
      if (cell && cell.sunExposure) {
        setSunExposure(cell.sunExposure);
      }
    }
  }, [selectedCellId, grid]);

  const getPlant = (id: string | null | string[]) => {
    const searchId = Array.isArray(id) ? id[0] : id;
    return plants.find(p => p.id === searchId);
  };

  const handleSave = async () => {
    if (!selectedPlantId || !selectedCellId) {
      console.error("Missing plant or cell ID", { selectedPlantId, selectedCellId });
      return;
    }

    setIsSaving(true);
    try {
      const plant = getPlant(selectedPlantId);
      const plantedDate = new Date().toISOString();
      
      let customDaysToHarvest = plant?.daysToHarvest || 60;
      
      try {
        if (plant) {
          const aiResult = await calculateHarvestDate(plant.name, selectedType, sunExposure, plantedDate);
          if (aiResult && typeof aiResult.expectedHarvestDays === 'number') {
            customDaysToHarvest = aiResult.expectedHarvestDays;
          }
        }
      } catch (aiErr) {
        console.error("Error calculating harvest date with AI, using default", aiErr);
        // Fallback already set to plant.daysToHarvest
      }

      console.log("Updating grid cell", selectedCellId, {
        plantId: selectedPlantId,
        plantType: selectedType,
        plantedDate: plantedDate,
        plantedBy: currentUser?.id || "",
        sunExposure: sunExposure,
        customDaysToHarvest: customDaysToHarvest
      });

      await setGridCell(selectedCellId, {
        plantId: selectedPlantId,
        plantType: selectedType,
        plantedDate: plantedDate,
        plantedBy: currentUser?.id || "",
        sunExposure: sunExposure,
        customDaysToHarvest: customDaysToHarvest
      });

      if (selectedType === 'Zaad' && typeof seedsUsed === 'number' && seedsUsed > 0) {
        const seedRecord = seedBox.find(s => s.plantId === selectedPlantId);
        if (seedRecord && seedRecord.id) {
           const newQuantity = seedRecord.quantity - seedsUsed;
           if (newQuantity <= 0) {
              deleteSeed(seedRecord.id);
           } else {
              updateSeed(seedRecord.id, { quantity: newQuantity });
           }
        }
      }

      const nameToLog = plant ? plant.name : "Gewas";

      await addLog({
        cellId: selectedCellId,
        plantId: selectedPlantId || "",
        date: new Date().toISOString(),
        type: 'Planten',
        note: `${nameToLog} geplant als ${selectedType} in ${sunExposure}`,
        userId: currentUser?.id || ""
      });

      navigate('/');
    } catch (err) {
      console.error("Failed to save plant", err);
      alert("Er is een fout opgetreden bij het opslaan van de plant. Probeer het opnieuw.");
    } finally {
      setIsSaving(false);
    }
  };

  const availableCells = grid.filter(c => !c.plantId || c.id === selectedCellId);

  const filteredPlants = plants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedPlants = searchTerm.trim() === '' 
    ? [...plants].reverse().slice(0, 10) 
    : filteredPlants;

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto h-full flex flex-col bg-white rounded-3xl md:my-6 md:shadow-sm md:border md:border-stone-100 relative space-y-6">
      <header className="flex justify-between items-center shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} disabled={isSaving} className="p-2 -ml-2 text-stone-400 hover:text-stone-600 disabled:opacity-50">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#1A2E1A] ml-2">Nieuwe Plant</h1>
        </div>
        <div className="flex items-center space-x-3">
          <HeaderActions />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-6 space-y-8 no-scrollbar">
        <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start">
          <div className="space-y-8">
            {/* Plant Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">1. Wat wil je planten?</h2>
              
              <div className="relative w-full mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Zoek een gewas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#F5F7F4] border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]/20 transition-all font-bold text-[#1A2E1A] disabled:opacity-50"
                />
              </div>

              {searchTerm.trim() === '' && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Meest recent toegevoegd</p>
              )}

              <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                {displayedPlants.map(plant => (
                  <button
                    key={plant.id}
                    onClick={() => !isSaving && setSelectedPlantId(plant.id)}
                    disabled={isSaving}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all flex flex-col",
                      selectedPlantId === plant.id 
                        ? "border-[#5A8F5A] bg-[#E8F0E8] shadow-sm" 
                        : "border-stone-100 bg-white hover:border-[#5A8F5A]/30",
                      isSaving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{plant.icon}</span>
                        <div>
                          <span className="font-bold text-[#1A2E1A] block">{plant.name}</span>
                          <span className="text-[10px] font-bold text-[#5A8F5A] uppercase">{plant.family}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-md">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-700">{plant.sunPreference}</span>
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-stone-500 space-y-1 mt-2">
                      <p><span className="font-bold text-[#5A8F5A]">✓ Goed met:</span> {plant.goodNeighbors.map(id => {
                        const p = getPlant(id);
                        return p ? `${p.icon} ${p.name}` : null;
                      }).filter(Boolean).join(', ') || 'Alles'}</p>
                      <p><span className="font-bold text-red-400">✗ Slecht met:</span> {plant.badNeighbors.map(id => {
                        const p = getPlant(id);
                        return p ? `${p.icon} ${p.name}` : null;
                      }).filter(Boolean).join(', ') || 'Niets'}</p>
                    </div>
                  </button>
                ))}
                {displayedPlants.length === 0 && (
                  <p className="text-sm text-stone-500 text-center py-4">Geen gewassen gevonden.</p>
                )}
              </div>
            </section>

            {/* Type Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">2. Hoe plant je het?</h2>
              <div className="flex space-x-3">
                {(['Zaad', 'Plant', 'Bol'] as PlantType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => !isSaving && setSelectedType(type)}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all border",
                      selectedType === type
                        ? "border-[#5A8F5A] bg-[#E8F0E8] text-[#1A2E1A]"
                        : "border-stone-100 bg-white text-stone-500 hover:bg-stone-50",
                      isSaving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {selectedType === 'Zaad' && selectedPlantId && seedBox.find(s => s.plantId === selectedPlantId) && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-amber-800 block mb-2">Hoeveel zaden gebruik je?</label>
                  <p className="text-xs text-amber-700 mb-3">
                    Je hebt <strong>{seedBox.find(s => s.plantId === selectedPlantId)?.quantity} {seedBox.find(s => s.plantId === selectedPlantId)?.unit}</strong> beschikbaar in je zadenbox.
                  </p>
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      min="1"
                      max={seedBox.find(s => s.plantId === selectedPlantId)?.quantity}
                      value={seedsUsed}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const max = seedBox.find(s => s.plantId === selectedPlantId)?.quantity || 0;
                        if (!isNaN(val)) {
                           setSeedsUsed(val > max ? max : val);
                        } else {
                           setSeedsUsed('');
                        }
                      }}
                      className="flex-1 bg-white border border-amber-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-900"
                      placeholder="Aantal"
                    />
                    <button
                      onClick={() => setSeedsUsed(seedBox.find(s => s.plantId === selectedPlantId)?.quantity || '')}
                      className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                    >
                      Alles
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8 mt-8 md:mt-0">
            {/* Location Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">3. Waar in de tuin?</h2>
              {availableCells.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl">De tuin is momenteel vol. Verwijder eerst een plant om ruimte te maken.</p>
              ) : (
                <div 
                  className="grid gap-2 md:gap-3 bg-[#E6D5B8] p-4 rounded-2xl border-4 border-[#C19A6B]/20"
                  style={{ gridTemplateColumns: `repeat(${useStore.getState().gridWidth}, minmax(0, 1fr))` }}
                >
                  {grid.map(cell => {
                    const isAvailable = !cell.plantId || selectedCellId === cell.id;
                    const isSelected = selectedCellId === cell.id;
                    const plant = plants.find(p => p.id === (Array.isArray(cell.plantId) ? cell.plantId[0] : cell.plantId));
                    
                    return (
                      <button
                        key={cell.id}
                        disabled={!isAvailable || isSaving}
                        onClick={() => setSelectedCellId(cell.id)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-[10px] font-bold relative",
                          !isAvailable 
                            ? "bg-white/50 text-stone-400 cursor-not-allowed border border-stone-200" 
                            : isSelected 
                              ? "bg-[#5A8F5A] text-white shadow-md border-2 border-white scale-105 z-10" 
                              : "bg-white border border-stone-200 text-stone-500 hover:border-[#5A8F5A] hover:bg-stone-50",
                          isSaving && "opacity-50"
                        )}
                      >
                        {plant ? (
                          <span className="text-lg mb-0.5">{plant.icon}</span>
                        ) : (
                          <span className="opacity-40 mb-0.5">🕳️</span>
                        )}
                        <span>{String.fromCharCode(65 + cell.y)}{cell.x + 1}</span>
                        
                        {!isAvailable && !isSelected && (
                          <div className="absolute inset-0 bg-stone-100/20 rounded-xl" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sun Exposure Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">4. Hoeveel zonlicht krijgt dit vak?</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['Zon', 'Halfschaduw', 'Schaduw', 'Duisternis'] as SunPreference[]).map(sun => (
                  <button
                    key={sun}
                    onClick={() => !isSaving && setSunExposure(sun)}
                    disabled={isSaving}
                    className={cn(
                      "py-3 rounded-xl font-bold transition-all border",
                      sunExposure === sun
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-stone-100 bg-white text-stone-500 hover:bg-stone-50",
                      isSaving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {sun}
                  </button>
                ))}
              </div>
            </section>
            
            {/* Desktop Action Button */}
            <div className="hidden md:block pt-6">
              <button
                onClick={handleSave}
                disabled={!selectedPlantId || !selectedCellId || isSaving}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm",
                  selectedPlantId && selectedCellId && !isSaving
                    ? "bg-[#5A8F5A] text-white hover:bg-[#4A7A4A]"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Oogsttijd berekenen & opslaan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Toevoegen aan Tuin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={!selectedPlantId || !selectedCellId || isSaving}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm",
              selectedPlantId && selectedCellId && !isSaving
                ? "bg-[#5A8F5A] text-white hover:bg-[#4A7A4A]"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Oogsttijd berekenen...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Toevoegen aan Tuin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
