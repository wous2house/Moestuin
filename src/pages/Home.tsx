import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore, GridCell, Plant } from '../store/useStore';
import { useWeather } from '../lib/weather';
import { format, addDays, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CloudRain, Sun, Cloud, Snowflake, CloudLightning, CloudFog, Droplets, Leaf, LayoutGrid, Plus, Minus, MoreVertical, Trash2, Calendar, User, Info, CheckCircle2, XCircle, AlertCircle, X, Camera, Bell, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

import { HeaderActions } from '../components/HeaderActions';

const getWeatherIcon = (code: number, className: string = "w-6 h-6") => {
  if (code <= 3) return <Sun className={cn(className, "text-[#5A8F5A]")} />;
  if (code <= 49) return <CloudFog className={cn(className, "text-stone-400")} />;
  if (code <= 69) return <CloudRain className={cn(className, "text-blue-400")} />;
  if (code <= 79) return <Snowflake className={cn(className, "text-sky-300")} />;
  if (code <= 99) return <CloudLightning className={cn(className, "text-purple-500")} />;
  return <Cloud className={cn(className, "text-stone-400")} />;
};

export default function Home() {
  const { currentUser, users, grid, plants, setGridCell, gridWidth, gridHeight, updateGridSize, logs, addLog, tasks, addHarvest, setIsNotificationsModalOpen, dismissedLogs, families, logout } = useStore();
  const { weather, loading } = useWeather();
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(grid[0] || null);
  
  useEffect(() => {
    if (!selectedCell && grid.length > 0) {
      setSelectedCell(grid[0]);
    }
  }, [grid, selectedCell]);

  const [isSelectingPlant, setIsSelectingPlant] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo === currentUser?.id)).length;
  const unreadLogsCount = logs.filter(l => l.userId !== currentUser?.id && (!currentUser || !dismissedLogs[currentUser.id]?.includes(l.id))).length;
  const notificationsCount = activeTasksCount + unreadLogsCount;
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [harvestQuantity, setHarvestQuantity] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('stuks');
  
  const [isWateredModalOpen, setIsWateredModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const getPlant = (id: string | null) => plants.find(p => p.id === id);
  const getUser = (id: string | null) => users.find(u => u.id === id);

  const selectedPlant = getPlant(selectedCell?.plantId || null);
  
  const plantLogs = logs.filter(l => l.cellId === selectedCell?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastWateredLog = plantLogs.find(l => l.type === 'Wateren');
  
  let needsWater = false;
  if (selectedPlant) {
    const waterDays = selectedPlant.waterNeeds === 'Hoog' ? 1 : selectedPlant.waterNeeds === 'Gemiddeld' ? 3 : 7;
    if (!lastWateredLog) {
      needsWater = true;
    } else {
      const daysSinceWater = differenceInDays(new Date(), new Date(lastWateredLog.date));
      needsWater = daysSinceWater >= waterDays;
    }
  }

  const handleWater = () => {
    if (selectedCell && needsWater) {
      addLog({
        cellId: selectedCell.id,
        date: new Date().toISOString(),
        type: 'Wateren',
        note: 'Water gegeven',
        userId: currentUser?.id || null
      });
    }
  };

  const handleAddNote = () => {
    if (selectedCell && noteText.trim()) {
      addLog({
        cellId: selectedCell.id,
        date: new Date().toISOString(),
        type: 'Notitie',
        note: noteText.trim(),
        userId: currentUser?.id || null
      });
      setNoteText('');
      setIsNoteModalOpen(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCell) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addLog({
          cellId: selectedCell.id,
          date: new Date().toISOString(),
          type: 'Notitie',
          note: 'Foto toegevoegd',
          userId: currentUser?.id || null,
          imageUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignPlant = (plantId: string) => {
    if (selectedCell) {
      setGridCell(selectedCell.id, {
        plantId,
        plantedDate: format(new Date(), 'yyyy-MM-dd'),
        plantedBy: currentUser?.id || null,
        plantType: 'Zaad',
      });
      addLog({
        cellId: selectedCell.id,
        date: new Date().toISOString(),
        type: 'Planten',
        note: `Geplant als Zaad`,
        userId: currentUser?.id || null
      });
      setIsSelectingPlant(false);
      setSelectedCell(grid.find(c => c.id === selectedCell.id) || null);
    }
  };

  const handleRemovePlant = () => {
    if (selectedCell) {
      addLog({
        cellId: selectedCell.id,
        date: new Date().toISOString(),
        type: 'Verwijderd',
        note: 'Gewas verwijderd',
        userId: currentUser?.id || null
      });
      setGridCell(selectedCell.id, {
        plantId: null,
        plantedDate: null,
        plantedBy: null,
        plantType: null,
      });
      setSelectedCell(grid.find(c => c.id === selectedCell.id) || null);
    }
  };

  const handlePotPlant = () => {
    if (selectedCell) {
      setGridCell(selectedCell.id, {
        plantType: 'Plant'
      });
      addLog({
        cellId: selectedCell.id,
        date: new Date().toISOString(),
        type: 'Ompoten',
        note: 'Omgepoot naar vaste plant',
        userId: currentUser?.id || null
      });
      setSelectedCell(grid.find(c => c.id === selectedCell.id) || null);
    }
  };

  const plantedByUser = getUser(selectedCell?.plantedBy || null);
  const harvestDate = selectedCell?.plantedDate && selectedPlant 
    ? addDays(new Date(selectedCell.plantedDate), selectedPlant.daysToHarvest) 
    : null;

  const isHarvestTime = harvestDate ? (
    differenceInDays(new Date(), harvestDate) >= -7
  ) : false;

  const handleHarvest = () => {
    if (selectedCell && selectedPlant && harvestQuantity) {
      addHarvest({
        plantId: selectedPlant.id,
        plantName: selectedPlant.name,
        date: new Date().toISOString(),
        userId: currentUser?.id || null,
        yieldQuantity: parseFloat(harvestQuantity),
        yieldUnit: harvestUnit
      });
      addLog({
        cellId: selectedCell.id,
        date: new Date().toISOString(),
        type: 'Oogst',
        note: `Geoogst: ${harvestQuantity} ${harvestUnit}`,
        userId: currentUser?.id || null
      });
      setGridCell(selectedCell.id, {
        plantId: null,
        plantedDate: null,
        plantedBy: null,
        plantType: null,
      });
      setIsHarvestModalOpen(false);
      setHarvestQuantity('');
      setSelectedCell(grid.find(c => c.id === selectedCell.id) || null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Goedemorgen';
    if (hour >= 12 && hour < 18) return 'Goedemiddag';
    if (hour >= 18 && hour < 24) return 'Goedenavond';
    return 'Goedenacht';
  };

  return (
    <div className="p-6 max-w-md md:max-w-6xl mx-auto flex flex-col h-full space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center shrink-0">
        <div>
          <p className="text-sm text-stone-500">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-[#1A2E1A]">{currentUser?.name}</h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Weather Widget */}
          <button 
            onClick={() => setIsWeatherModalOpen(true)}
            className="bg-white rounded-2xl p-2 px-3 shadow-sm flex items-center space-x-3 border border-stone-100 hover:bg-stone-50 transition-colors text-left"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Weer</p>
              <p className="text-sm font-bold text-[#1A2E1A]">
                {loading ? '--' : Math.round(weather?.temperature || 0)}°C <span className="font-normal text-stone-500 hidden sm:inline">{weather?.isRaining ? 'Regen' : 'Zonnig'}</span>
              </p>
            </div>
            {weather?.isRaining ? <CloudRain className="w-6 h-6 text-blue-400" /> : <Sun className="w-6 h-6 text-[#5A8F5A]" />}
          </button>
          
          <HeaderActions />
        </div>
      </header>

      <div className="md:grid md:grid-cols-12 md:gap-8 md:items-start flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0">
        {/* Grid Section */}
        <section className="md:col-span-7 lg:col-span-8 mb-8 md:mb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#1A2E1A]">Moestuin Grid</h2>
            <button 
              onClick={() => { setIsEditingLayout(!isEditingLayout); setLayoutError(null); }}
              className={cn(
                "text-sm font-bold flex items-center transition-colors px-3 py-1.5 rounded-lg",
                isEditingLayout ? "bg-[#5A8F5A] text-white" : "text-[#5A8F5A] hover:bg-[#E8F0E8]"
              )}
            >
              {isEditingLayout ? 'Klaar' : 'Bewerk Layout'} <LayoutGrid className="w-4 h-4 ml-1" />
            </button>
          </div>

          {isEditingLayout && (
            <div className="bg-[#F5F7F4] rounded-2xl p-4 mb-4 border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1A2E1A]">Rijen (Hoogte)</span>
                <div className="flex items-center space-x-3 bg-white rounded-lg border border-stone-200 p-1">
                  <button 
                    onClick={async () => { const res = await updateGridSize(gridWidth, gridHeight - 1); if (!res.success) setLayoutError(res.message || null); else setLayoutError(null); }}
                    className="p-1 rounded-md hover:bg-stone-100 text-stone-600"
                  ><Minus className="w-4 h-4" /></button>
                  <span className="text-sm font-bold w-4 text-center">{gridHeight}</span>
                  <button 
                    onClick={() => { updateGridSize(gridWidth, gridHeight + 1); setLayoutError(null); }}
                    className="p-1 rounded-md hover:bg-stone-100 text-stone-600"
                  ><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1A2E1A]">Kolommen (Breedte)</span>
                <div className="flex items-center space-x-3 bg-white rounded-lg border border-stone-200 p-1">
                  <button 
                    onClick={async () => { const res = await updateGridSize(gridWidth - 1, gridHeight); if (!res.success) setLayoutError(res.message || null); else setLayoutError(null); }}
                    className="p-1 rounded-md hover:bg-stone-100 text-stone-600"
                  ><Minus className="w-4 h-4" /></button>
                  <span className="text-sm font-bold w-4 text-center">{gridWidth}</span>
                  <button 
                    onClick={() => { updateGridSize(gridWidth + 1, gridHeight); setLayoutError(null); }}
                    className="p-1 rounded-md hover:bg-stone-100 text-stone-600"
                  ><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              {layoutError && (
                <div className="mt-3 bg-red-50 text-red-600 text-xs font-bold p-2 rounded-lg flex items-start">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 mt-0.5" />
                  <span>{layoutError}</span>
                </div>
              )}
            </div>
          )}

          <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
            <div 
              className="grid gap-3 md:gap-4 lg:gap-6 min-w-max md:min-w-0 bg-[#E6D5B8] p-4 md:p-6 rounded-[2.5rem] border-8 border-[#C19A6B]/20 shadow-inner" 
              style={{ gridTemplateColumns: `repeat(${gridWidth}, minmax(4.5rem, 1fr))` }}
            >
              {grid?.map(cell => {
                const plant = getPlant(cell.plantId);
                const isSelected = selectedCell?.id === cell.id;
                
                let cellIsHarvestTime = false;
                if (plant && cell.plantedDate) {
                  const hDate = addDays(new Date(cell.plantedDate), plant.daysToHarvest);
                  cellIsHarvestTime = differenceInDays(new Date(), hDate) >= -7;
                }

                return (
                  <button
                    key={cell.id}
                    onClick={() => {
                      setSelectedCell(cell);
                      if (!cell.plantId) setIsSelectingPlant(true);
                    }}
                    className={cn(
                      "relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all",
                      isSelected 
                        ? "bg-[#E8F0E8] border-2 border-[#5A8F5A] shadow-md z-10 scale-105" 
                        : plant 
                          ? "bg-white border border-stone-100 hover:border-[#5A8F5A]/30 shadow-sm"
                          : "bg-[#8B7355]/10 border-2 border-dashed border-[#8B7355]/20 hover:bg-[#8B7355]/20 w-[4.5rem] md:w-auto shadow-inner",
                      !isSelected && cellIsHarvestTime && "border-2 border-[#5A8F5A] animate-pulse shadow-[0_0_10px_rgba(90,143,90,0.3)]"
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
                    <span className={cn(
                      "backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md",
                      isHarvestTime ? "bg-amber-500/90" : "bg-[#5A8F5A]/90"
                    )}>
                      {isHarvestTime ? 'RIJP' : 'GROEIEND'}
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
                <div 
                  className={cn(
                    "rounded-xl p-4 mb-6 flex items-center justify-between transition-all",
                    isHarvestTime 
                      ? "bg-[#E8F0E8] border-2 border-[#5A8F5A] cursor-pointer shadow-md hover:bg-[#D0E0D0]" 
                      : "bg-[#E8F0E8]"
                  )}
                  onClick={isHarvestTime ? () => setIsHarvestModalOpen(true) : undefined}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A8F5A]">Verwachte Oogst</p>
                    <p className="text-sm font-bold text-[#1A2E1A] flex items-center">
                      {format(harvestDate, 'd MMMM yyyy', { locale: nl })}
                      {isHarvestTime && <span className="ml-2 text-[10px] text-white bg-[#5A8F5A] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">Oogst Tijd!</span>}
                    </p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors",
                    isHarvestTime ? "bg-[#5A8F5A] text-white" : "bg-white text-lg"
                  )}>
                    <span>🧺</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={needsWater ? handleWater : () => setIsWateredModalOpen(true)}
                  className={cn(
                    "rounded-xl py-3 font-bold flex items-center justify-center space-x-2 transition-colors",
                    needsWater 
                      ? "bg-[#5A8F5A] text-white hover:bg-[#4A7A4A]" 
                      : "bg-[#E8F0E8] text-[#5A8F5A] hover:bg-[#D0E0D0]"
                  )}
                >
                  {needsWater ? (
                    <>
                      <Droplets className="w-4 h-4" />
                      <span>Wateren</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Gewaterd</span>
                    </>
                  )}
                </button>
                {selectedCell.plantType === 'Zaad' && (
                  <button 
                    onClick={handlePotPlant}
                    className="bg-amber-500 text-white rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-amber-600 transition-colors"
                  >
                    <Leaf className="w-4 h-4" />
                    <span>Ompoten</span>
                  </button>
                )}
                <button 
                  onClick={() => setIsNoteModalOpen(true)}
                  className={cn(
                    "bg-[#F5F7F4] text-[#1A2E1A] rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-[#E8F0E8] transition-colors",
                    selectedCell.plantType !== 'Zaad' && "col-span-1"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span>Notitie</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "bg-[#F5F7F4] text-[#1A2E1A] rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-[#E8F0E8] transition-colors",
                    selectedCell.plantType === 'Zaad' && "col-span-2"
                  )}
                >
                  <Camera className="w-4 h-4" />
                  <span>Foto</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                />
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
                        <span className="text-xs font-bold text-[#5A8F5A]">Goede buren</span>
                      </div>
                      <p className="text-xs text-stone-500 pl-6">
                        {selectedPlant.goodNeighbors.map(id => {
                          const p = getPlant(id);
                          return p ? `${p.icon} ${p.name}` : null;
                        }).filter(Boolean).join(', ') || 'Geen specifieke voorkeur'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-500">Slechte buren</span>
                      </div>
                      <p className="text-xs text-stone-500 pl-6">
                        {selectedPlant.badNeighbors.map(id => {
                          const p = getPlant(id);
                          return p ? `${p.icon} ${p.name}` : null;
                        }).filter(Boolean).join(', ') || 'Geen specifieke afkeur'}
                      </p>
                    </div>
                  </div>
                </div>

                {plantLogs.length > 0 && (
                  <div className="bg-[#F5F7F4] rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">Geschiedenis</p>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                      {plantLogs.map(log => {
                        const user = getUser(log.userId);
                        return (
                          <div key={log.id} className="flex items-start space-x-3 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-[#1A2E1A]">{log.type}</p>
                                <span className="text-[10px] text-stone-400">{format(new Date(log.date), 'd MMM HH:mm', { locale: nl })}</span>
                              </div>
                              <p className="text-[10px] text-stone-500 mt-1">{log.note}</p>
                              {log.imageUrl && (
                                <img 
                                  src={log.imageUrl} 
                                  alt="Log" 
                                  onClick={() => setSelectedPhotoUrl(log.imageUrl as string)}
                                  className="mt-2 w-full h-32 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-90 transition-opacity" 
                                />
                              )}
                              {user && <p className="text-[9px] font-bold text-[#5A8F5A] mt-1">Door: {user.name}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="text-center py-4">
                <p className="text-stone-500 mb-6 font-medium">Dit vak is nog leeg.</p>
                <button 
                  onClick={() => setIsSelectingPlant(true)}
                  className="bg-[#5A8F5A] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#4A7A4A] transition-colors shadow-sm w-full flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Plant Toevoegen</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      </div>

      {/* Weather Forecast Modal */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl flex flex-col relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsWeatherModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Weersverwachting</h2>
            <p className="text-sm text-stone-500 mb-6">Komende 7 dagen</p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              {weather?.forecast?.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#F5F7F4] p-3 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center space-x-3 w-1/3">
                    <span className="text-sm font-bold text-[#1A2E1A] capitalize">
                      {idx === 0 ? 'Vandaag' : idx === 1 ? 'Morgen' : format(new Date(day.date), 'EEEE', { locale: nl })}
                    </span>
                  </div>
                  <div className="flex justify-center items-center w-1/3">
                    {getWeatherIcon(day.weatherCode, "w-6 h-6")}
                    {day.rainSum > 0 && <span className="ml-1 text-[10px] font-bold text-blue-500">{day.rainSum}mm</span>}
                  </div>
                  <div className="flex justify-end space-x-2 text-sm font-bold w-1/3">
                    <span className="text-[#1A2E1A]">{Math.round(day.maxTemp)}°</span>
                    <span className="text-stone-400">{Math.round(day.minTemp)}°</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setIsWeatherModalOpen(false)}
              className="mt-6 w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl flex flex-col relative animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-4">Notitie Toevoegen</h2>
            
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Typ je notitie hier..."
              className="w-full bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none min-h-[120px] resize-none mb-6"
              autoFocus
            />
            
            <div className="flex space-x-3">
              <button 
                onClick={() => { setIsNoteModalOpen(false); setNoteText(''); }}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
              >
                Annuleren
              </button>
              <button 
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Watered Info Modal */}
      {isWateredModalOpen && lastWateredLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-[#E8F0E8] rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-[#5A8F5A]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-2">Gewaterd</h2>
            <p className="text-sm text-stone-500 mb-6">
              Dit gewas heeft voldoende water gekregen door <span className="font-bold text-[#5A8F5A]">{getUser(lastWateredLog.userId)?.name || 'Onbekend'}</span> op {format(new Date(lastWateredLog.date), "d MMM 'om' HH:mm", { locale: nl })}.
            </p>            <button 
              onClick={() => setIsWateredModalOpen(false)}
              className="w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors"
            >
              Begrepen
            </button>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {isHarvestModalOpen && selectedPlant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl flex flex-col relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsHarvestModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Oogst Afronden</h2>
            <p className="text-sm text-stone-500 mb-6">Hoeveel {selectedPlant.name} heb je geoogst?</p>

            <div className="space-y-4 mb-6">
              <div className="flex space-x-3">
                <input
                  type="number"
                  value={harvestQuantity}
                  onChange={(e) => setHarvestQuantity(e.target.value)}
                  placeholder="Aantal/Hoeveelheid"
                  className="w-2/3 bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none"
                  autoFocus
                />
                <select
                  value={harvestUnit}
                  onChange={(e) => setHarvestUnit(e.target.value)}
                  className="w-1/3 bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none"
                >
                  <option value="stuks">Stuks</option>
                  <option value="gram">Gram</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={handleHarvest}
              disabled={!harvestQuantity}
              className="w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
            >
              <span>🧺 Opslaan & Vak Legen</span>
            </button>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhotoUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedPhotoUrl(null)}>
          <button 
            onClick={() => setSelectedPhotoUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={selectedPhotoUrl} alt="Volledige weergave" className="max-w-full max-h-full rounded-2xl object-contain animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Plant Selection Modal */}
      {isSelectingPlant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[90vh]">
            <button 
              onClick={() => setIsSelectingPlant(false)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Plant Toevoegen</h2>
            <p className="text-sm text-stone-500 mb-6">Kies een gewas voor vak {selectedCell && `${String.fromCharCode(65 + selectedCell.y)}${selectedCell.x + 1}`}</p>
            
            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 no-scrollbar">
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
        </div>
      )}
    </div>
  );
}
