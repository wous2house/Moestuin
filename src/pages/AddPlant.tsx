import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, PlantType } from '../store/useStore';
import { format } from 'date-fns';
import { ArrowLeft, Check, Sun, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AddPlant() {
  const navigate = useNavigate();
  const { plants, grid, setGridCell, currentUser, tasks, setIsNotificationsModalOpen } = useStore();
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo === currentUser?.id)).length;
  
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PlantType>('Zaad');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const getPlant = (id: string | null) => plants.find(p => p.id === id);

  const handleSave = () => {
    if (selectedPlantId && selectedCellId) {
      setGridCell(selectedCellId, {
        plantId: selectedPlantId,
        plantType: selectedType,
        plantedDate: format(new Date(), 'yyyy-MM-dd'),
        plantedBy: currentUser?.id || null,
      });
      navigate('/');
    }
  };

  const availableCells = grid.filter(c => !c.plantId);

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto h-full flex flex-col bg-white rounded-3xl md:my-6 md:shadow-sm md:border md:border-stone-100 relative">
      <header className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#1A2E1A] ml-2">Nieuwe Plant</h1>
        </div>
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
      </header>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-6 space-y-8 no-scrollbar">
        <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start">
          <div className="space-y-8">
            {/* Plant Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">1. Wat wil je planten?</h2>
              <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                {plants.map(plant => (
                  <button
                    key={plant.id}
                    onClick={() => setSelectedPlantId(plant.id)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all flex flex-col",
                      selectedPlantId === plant.id 
                        ? "border-[#5A8F5A] bg-[#E8F0E8] shadow-sm" 
                        : "border-stone-100 bg-white hover:border-[#5A8F5A]/30"
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
              </div>
            </section>

            {/* Type Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">2. Hoe plant je het?</h2>
              <div className="flex space-x-3">
                {(['Zaad', 'Plant', 'Bol'] as PlantType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all border",
                      selectedType === type
                        ? "border-[#5A8F5A] bg-[#E8F0E8] text-[#1A2E1A]"
                        : "border-stone-100 bg-white text-stone-500 hover:bg-stone-50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8 mt-8 md:mt-0">
            {/* Location Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">3. Waar in de tuin? (Optioneel)</h2>
              {availableCells.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl">De tuin is momenteel vol. Verwijder eerst een plant om ruimte te maken.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                  {grid.map(cell => {
                    const isAvailable = !cell.plantId;
                    const isSelected = selectedCellId === cell.id;
                    
                    return (
                      <button
                        key={cell.id}
                        disabled={!isAvailable}
                        onClick={() => setSelectedCellId(cell.id)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-xs font-bold",
                          !isAvailable ? "bg-stone-100 text-stone-300 cursor-not-allowed" :
                          isSelected ? "bg-[#5A8F5A] text-white shadow-md" : "bg-white border border-stone-200 text-stone-500 hover:border-[#5A8F5A]"
                        )}
                      >
                        {String.fromCharCode(65 + cell.y)}{cell.x + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
            
            {/* Desktop Action Button */}
            <div className="hidden md:block pt-6">
              <button
                onClick={handleSave}
                disabled={!selectedPlantId || !selectedCellId}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm",
                  selectedPlantId && selectedCellId
                    ? "bg-[#5A8F5A] text-white hover:bg-[#4A7A4A]"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                )}
              >
                <Check className="w-5 h-5" />
                <span>Toevoegen aan Tuin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={!selectedPlantId || !selectedCellId}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm",
              selectedPlantId && selectedCellId
                ? "bg-[#5A8F5A] text-white hover:bg-[#4A7A4A]"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            <Check className="w-5 h-5" />
            <span>Toevoegen aan Tuin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
