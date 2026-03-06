import { useState } from 'react';
import { useStore, GridCell, Plant } from '../store/useStore';
import { useWeather } from '../lib/weather';
import { format, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CloudRain, Sun, Droplets, Leaf, LayoutGrid, Plus, MoreVertical, Trash2, Calendar, User, Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Home() {
  const { currentUser, users, grid, plants, setGridCell } = useStore();
  const { weather, loading } = useWeather();
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(grid[0]);
  const [isSelectingPlant, setIsSelectingPlant] = useState(false);

  const getPlant = (id: string | null) => plants.find(p => p.id === id);
  const getUser = (id: string | null) => users.find(u => u.id === id);

  const handleAssignPlant = (plantId: string) => {
    if (selectedCell) {
      setGridCell(selectedCell.id, {
        plantId,
        plantedDate: format(new Date(), 'yyyy-MM-dd'),
        plantedBy: currentUser?.id || null,
        plantType: 'Zaad',
      });
      setIsSelectingPlant(false);
      setSelectedCell(grid.find(c => c.id === selectedCell.id) || null);
    }
  };

  const handleRemovePlant = () => {
    if (selectedCell) {
      setGridCell(selectedCell.id, {
        plantId: null,
        plantedDate: null,
        plantedBy: null,
        plantType: null,
      });
      setSelectedCell(grid.find(c => c.id === selectedCell.id) || null);
    }
  };

  const selectedPlant = getPlant(selectedCell?.plantId || null);
  const plantedByUser = getUser(selectedCell?.plantedBy || null);
  const harvestDate = selectedCell?.plantedDate && selectedPlant 
    ? addDays(new Date(selectedCell.plantedDate), selectedPlant.daysToHarvest) 
    : null;

  return (
    <div className="p-6 max-w-md md:max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[#5A8F5A] font-bold text-lg shadow-sm">
              {currentUser?.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm text-stone-500">Goedemorgen,</p>
            <h1 className="text-lg font-bold text-[#1A2E1A]">{currentUser?.name}'s Tuin</h1>
          </div>
        </div>

        {/* Weather Widget */}
        <div className="bg-white rounded-2xl p-2 px-3 shadow-sm flex items-center space-x-3 border border-stone-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Weer</p>
            <p className="text-sm font-bold text-[#1A2E1A]">
              {loading ? '--' : Math.round(weather?.temperature || 0)}°C <span className="font-normal text-stone-500">{weather?.isRaining ? 'Regen' : 'Zonnig'}</span>
            </p>
          </div>
          {weather?.isRaining ? <CloudRain className="w-6 h-6 text-blue-400" /> : <Sun className="w-6 h-6 text-[#5A8F5A]" />}
        </div>
      </header>

      <div className="md:grid md:grid-cols-12 md:gap-8 md:items-start">
        {/* Grid Section */}
        <section className="md:col-span-7 lg:col-span-8 mb-8 md:mb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#1A2E1A]">Moestuin Grid</h2>
            <button className="text-[#5A8F5A] text-sm font-bold flex items-center hover:text-[#4A7A4A]">
              Bewerk Layout <LayoutGrid className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {grid.map(cell => {
              const plant = getPlant(cell.plantId);
              const isSelected = selectedCell?.id === cell.id;

              return (
                <button
                  key={cell.id}
                  onClick={() => setSelectedCell(cell)}
                  className={cn(
                    "relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all",
                    isSelected 
                      ? "bg-[#E8F0E8] border-2 border-[#5A8F5A] shadow-sm" 
                      : "bg-white border border-stone-100 hover:border-[#5A8F5A]/30 shadow-sm",
                    !plant && "border-dashed"
                  )}
                >
                  {plant ? (
                    <>
                      <span className="text-2xl md:text-4xl mb-1">{plant.icon}</span>
                      <span className={cn(
                        "text-[10px] md:text-xs font-bold",
                        isSelected ? "text-[#5A8F5A]" : "text-stone-400"
                      )}>
                        {String.fromCharCode(65 + cell.y)}{cell.x + 1}
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6 md:w-8 md:h-8 text-stone-300 mb-1" />
                      <span className="text-[10px] md:text-xs font-bold text-stone-300">NIEUW</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Detail Card */}
        {selectedCell && (
          <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100 relative md:col-span-5 lg:col-span-4 md:sticky md:top-6">
            <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6 absolute top-3 left-1/2 -translate-x-1/2 md:hidden" />
            
            {selectedPlant ? (
              <>
              {selectedPlant.imageUrl && (
                <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 relative">
                  <img src={selectedPlant.imageUrl} alt={selectedPlant.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex space-x-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[#1A2E1A] text-[10px] font-bold uppercase px-2 py-1 rounded-md">
                      RIJ {String.fromCharCode(65 + selectedCell.y)}{selectedCell.x + 1}
                    </span>
                    <span className="bg-[#5A8F5A]/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">
                      GROEIEND
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#1A2E1A] flex items-center space-x-2">
                    <span>{selectedPlant.name}</span>
                    <span className="text-xl">{selectedPlant.icon}</span>
                  </h3>
                  <p className="text-sm italic text-[#5A8F5A]">{selectedPlant.family}</p>
                </div>
                <button 
                  onClick={handleRemovePlant}
                  className="p-2 bg-red-50 rounded-full text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#F5F7F4] rounded-xl p-3 flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-[#5A8F5A]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Geplant</p>
                    <p className="text-xs font-bold text-[#1A2E1A]">
                      {selectedCell.plantedDate ? format(new Date(selectedCell.plantedDate), 'd MMM yyyy', { locale: nl }) : 'Onbekend'}
                    </p>
                  </div>
                </div>
                <div className="bg-[#F5F7F4] rounded-xl p-3 flex items-center space-x-3">
                  <User className="w-5 h-5 text-[#5A8F5A]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Door</p>
                    <p className="text-xs font-bold text-[#1A2E1A]">{plantedByUser?.name || 'Onbekend'}</p>
                  </div>
                </div>
              </div>

              {harvestDate && (
                <div className="bg-[#E8F0E8] rounded-xl p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A8F5A]">Verwachte Oogst</p>
                    <p className="text-sm font-bold text-[#1A2E1A]">
                      {format(harvestDate, 'MMMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-lg">🧺</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="bg-[#5A8F5A] text-white rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-[#4A7A4A] transition-colors">
                  <Droplets className="w-4 h-4" />
                  <span>Water Geven</span>
                </button>
                {selectedCell.plantType === 'Zaad' ? (
                  <button className="bg-amber-500 text-white rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-amber-600 transition-colors">
                    <Leaf className="w-4 h-4" />
                    <span>Ompoten</span>
                  </button>
                ) : (
                  <button className="bg-[#F5F7F4] text-[#1A2E1A] rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-[#E8F0E8] transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Notitie</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-[#F5F7F4] rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Zonlicht Behoefte</p>
                  <div className="flex items-center space-x-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-[#1A2E1A]">{selectedPlant.sunPreference}</span>
                  </div>
                </div>
                
                <div className="bg-[#F5F7F4] rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">Buren</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-[#5A8F5A]" />
                        <span className="text-xs font-bold text-[#1A2E1A]">Goede buren</span>
                      </div>
                      <p className="text-xs text-stone-500 pl-6">
                        {selectedPlant.goodNeighbors.map(id => getPlant(id)?.name).join(', ') || 'Geen specifieke voorkeur'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-[#1A2E1A]">Slechte buren</span>
                      </div>
                      <p className="text-xs text-stone-500 pl-6">
                        {selectedPlant.badNeighbors.map(id => getPlant(id)?.name).join(', ') || 'Geen specifieke afkeur'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4">
              {!isSelectingPlant ? (
                <div className="text-center py-4">
                  <p className="text-stone-500 mb-6 font-medium">Dit vak is nog leeg.</p>
                  <button 
                    onClick={() => setIsSelectingPlant(true)}
                    className="bg-[#5A8F5A] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#4A7A4A] transition-colors shadow-sm w-full"
                  >
                    Plant Toevoegen
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Kies een plant</h3>
                    <button 
                      onClick={() => setIsSelectingPlant(false)}
                      className="text-xs font-bold text-stone-400 hover:text-stone-600"
                    >
                      Annuleren
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                    {plants.map(plant => (
                      <button
                        key={plant.id}
                        onClick={() => handleAssignPlant(plant.id)}
                        className="p-4 rounded-2xl border border-stone-100 bg-white hover:border-[#5A8F5A]/30 hover:bg-[#F5F7F4] text-left transition-colors flex flex-col shadow-sm"
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
                          <p><span className="font-bold text-[#5A8F5A]">✓ Goed met:</span> {plant.goodNeighbors.map(id => getPlant(id)?.name).join(', ') || 'Alles'}</p>
                          <p><span className="font-bold text-red-400">✗ Slecht met:</span> {plant.badNeighbors.map(id => getPlant(id)?.name).join(', ') || 'Niets'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      </div>
    </div>
  );
}
