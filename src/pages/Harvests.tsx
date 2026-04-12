import React, { useState, useMemo, useRef } from 'react';
import { useStore, HarvestRecord, GridCell } from '../store/useStore';
import { format, addDays, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Wheat, Calendar, Search, Filter, X, PieChart, Plus, CheckCircle2, Camera, FileText, Image as ImageIcon, Info } from 'lucide-react';
import { cn } from '../lib/utils';

import { HeaderActions } from '../components/HeaderActions';

export default function Harvests() {
  const { harvests, users, families, plants, grid, updateHarvest, addHarvest, addLog, setGridCell, setIsNotificationsModalOpen, tasks, currentUser, logs, dismissedLogs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlantFamily, setFilterPlantFamily] = useState<string>('all');
  const [filterUserFamily, setFilterUserFamily] = useState<string>('all');
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo.length === 0 || t.assignedTo.includes(currentUser?.id || ''))).length;
  const unreadLogsCount = logs.filter(l => l.userId !== currentUser?.id && (!currentUser || !dismissedLogs[currentUser.id]?.includes(l.id))).length;
  const notificationsCount = activeTasksCount + unreadLogsCount;
  
  const [selectedDistributionHarvest, setSelectedDistributionHarvest] = useState<HarvestRecord | null>(null);
  const [distribution, setDistribution] = useState<Record<string, number>>({});

  const [isAddHarvestModalOpen, setIsAddHarvestModalOpen] = useState(false);
  const [selectedCellToHarvest, setSelectedCellToHarvest] = useState<GridCell | null>(null);
  const [harvestQuantity, setHarvestQuantity] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('stuks');
  const [harvestNotes, setHarvestNotes] = useState('');
  const [harvestPhotoUrl, setHarvestPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedEditHarvest, setSelectedEditHarvest] = useState<HarvestRecord | null>(null);
  const [editHarvestNotes, setEditHarvestNotes] = useState('');
  const [editHarvestPhotoUrl, setEditHarvestPhotoUrl] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const sortedHarvests = useMemo(() => {
    let result = [...harvests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => {
        return h.plantName.toLowerCase().includes(q);
      });
    }

    if (filterPlantFamily !== 'all') {
      result = result.filter(h => {
        const plant = plants.find(p => p.id === h.plantId);
        return plant?.family === filterPlantFamily;
      });
    }
    
    return result;
  }, [harvests, searchQuery, filterPlantFamily, families, plants]);

  const undistributedHarvests = sortedHarvests.filter(h => {
    const distributedSum = (h.distributedTo || []).reduce((sum, d) => sum + d.quantity, 0);
    return distributedSum < h.yieldQuantity;
  });

  const fullyDistributedHarvests = sortedHarvests.filter(h => {
    const distributedSum = (h.distributedTo || []).reduce((sum, d) => sum + d.quantity, 0);
    return distributedSum >= h.yieldQuantity && h.yieldQuantity > 0;
  });

  const tableHarvests = useMemo(() => {
    if (filterUserFamily === 'all') return fullyDistributedHarvests;
    return fullyDistributedHarvests.filter(h => 
      (h.distributedTo || []).some(d => d.familyId === filterUserFamily && d.quantity > 0)
    );
  }, [fullyDistributedHarvests, filterUserFamily]);

  const getUser = (id: string | null | string[]) => {
    const searchId = Array.isArray(id) ? id[0] : id;
    return users.find(u => u.id === searchId);
  };
  const getPlant = (id: string | null | string[]) => {
    const searchId = Array.isArray(id) ? id[0] : id;
    return plants.find(p => p.id === searchId);
  };

  const handleOpenEdit = (e: React.MouseEvent, harvest: HarvestRecord) => {
    e.stopPropagation();
    setSelectedEditHarvest(harvest);
    setEditHarvestNotes(harvest.notes || '');
    setEditHarvestPhotoUrl(harvest.imageUrl || null);
  };

  const handleOpenDistribution = (harvest: HarvestRecord) => {
    const initialDist: Record<string, number> = {};
    if (harvest.distributedTo) {
      harvest.distributedTo.forEach(d => {
        initialDist[d.familyId] = d.quantity;
      });
    }
    setDistribution(initialDist);
    setSelectedDistributionHarvest(harvest);
  };

  const handleSaveDistribution = () => {
    if (selectedDistributionHarvest) {
      const distArray = (Object.entries(distribution) as [string, number][])
        .filter(([_, q]) => q > 0)
        .map(([familyId, quantity]) => ({ familyId, quantity }));
        
      updateHarvest(selectedDistributionHarvest.id, {
        distributedTo: distArray
      });
      setSelectedDistributionHarvest(null);
    }
  };

  const handleDistChange = (familyId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setDistribution(prev => ({
      ...prev,
      [familyId]: num
    }));
  };

  const totalDistributed = (Object.values(distribution) as number[]).reduce((sum, val) => sum + (val || 0), 0);
  const remainingQuantity = selectedDistributionHarvest ? selectedDistributionHarvest.yieldQuantity - totalDistributed : 0;
  const isOverDistributed = remainingQuantity < 0;

  const plantedCells = grid.filter(c => c.plantId);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditHarvestPhotoUrl(reader.result as string);
        } else {
          setHarvestPhotoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHarvest = () => {
    if (selectedCellToHarvest && harvestQuantity) {
      const plant = getPlant(selectedCellToHarvest.plantId);
      if (plant) {
        addHarvest({
          plantId: plant.id,
          plantName: plant.name,
          date: new Date().toISOString(),
          userId: currentUser?.id || null,
          yieldQuantity: parseFloat(harvestQuantity),
          yieldUnit: harvestUnit,
          notes: harvestNotes,
          imageUrl: harvestPhotoUrl || undefined
        });
        addLog({
          cellId: selectedCellToHarvest.id,
          plantId: plant.id,
          date: new Date().toISOString(),
          type: 'Oogst',
          note: `Geoogst: ${harvestQuantity} ${harvestUnit}`,
          userId: currentUser?.id || null
        });
        const updates = {
          plantId: "",
          plantedDate: "",
          plantedBy: "",
          plantType: "" as any,
        };
        setGridCell(selectedCellToHarvest.id, updates);
      }
      setSelectedCellToHarvest(null);
      setIsAddHarvestModalOpen(false);
      setHarvestQuantity('');
      setHarvestNotes('');
      setHarvestPhotoUrl(null);
    }
  };

  const handleSaveEditHarvest = () => {
    if (selectedEditHarvest) {
      updateHarvest(selectedEditHarvest.id, {
        notes: editHarvestNotes,
        imageUrl: editHarvestPhotoUrl || undefined
      });
      setSelectedEditHarvest(null);
    }
  };

  return (
    <div className="p-6 mw-2000 mx-auto space-y-8 pb-24 md:pb-6">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2E1A] flex items-center space-x-3">            
            <span>Oogsten</span>
          </h1>
          <p className="text-stone-500 mt-2">Overzicht van alles wat je hebt geoogst en verdeeld.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAddHarvestModalOpen(true)}
            className="bg-[#5A8F5A] text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#4A7A4A] transition-colors shadow-sm hidden md:flex"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuwe Oogst</span>
          </button>
          <HeaderActions />
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Zoek op gewas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8F5A] focus:border-transparent transition-shadow shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="relative md:w-48 shrink-0">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <select
              value={filterPlantFamily}
              onChange={(e) => setFilterPlantFamily(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8F5A] appearance-none cursor-pointer shadow-sm font-medium text-stone-600 truncate"
            >
              <option value="all">Alle categorieën</option>
              <option value="Groente">Groente</option>
              <option value="Fruit">Fruit</option>
              <option value="Zaden">Zaden</option>
              <option value="Bloemen">Bloemen</option>
              <option value="Overig">Overig</option>
            </select>
          </div>
        </div>
      </div>

      {sortedHarvests.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-stone-100">
          <div className="w-16 h-16 bg-[#E8F0E8] rounded-full flex items-center justify-center mx-auto mb-4">
            <Wheat className="w-8 h-8 text-[#5A8F5A]" />
          </div>
          <h3 className="text-lg font-bold text-[#1A2E1A] mb-2">Geen oogsten gevonden</h3>
          <p className="text-stone-500 text-sm">Probeer een andere zoekterm of voeg een nieuwe oogst toe vanuit de grid.</p>
        </div>
      ) : (
        <>
          {undistributedHarvests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#1A2E1A] mb-4">Nog te verdelen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {undistributedHarvests.map(harvest => {
                  const user = getUser(harvest.userId);
                  const plant = getPlant(harvest.plantId);
                  const distributedSum = (harvest.distributedTo || []).reduce((sum, d) => sum + d.quantity, 0);
                  
                  return (
                    <button 
                      key={harvest.id}
                      onClick={() => handleOpenDistribution(harvest)}
                      className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:border-[#5A8F5A]/50 transition-all text-left group hover:shadow-md flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4 w-full">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{plant?.icon || '🌱'}</span>
                          <div>
                            <h3 className="text-lg font-bold text-[#1A2E1A] group-hover:text-[#5A8F5A] transition-colors">{harvest.plantName}</h3>
                            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(harvest.date), 'd MMM yyyy', { locale: nl })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="bg-amber-50 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[3.5rem] relative shrink-0">
                            <span className="text-sm font-bold text-amber-600">{harvest.yieldQuantity}</span>
                            <span className="text-[10px] font-bold text-amber-600/70 uppercase">{harvest.yieldUnit}</span>
                          </div>
                          <button
                            onClick={(e) => handleOpenEdit(e, harvest)}
                            className="bg-stone-100 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
                            title="Bewerk notitie of foto"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {(harvest.imageUrl || harvest.notes) && (
                        <div className="mb-4 w-full flex space-x-3">
                          {harvest.imageUrl && (
                            <img src={harvest.imageUrl} alt={harvest.plantName} className="w-16 h-16 object-cover rounded-xl border border-stone-200 shrink-0" />
                          )}
                          {harvest.notes && (
                            <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-xl flex-1 border border-stone-100">
                              "{harvest.notes}"
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-stone-100 w-full flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[10px] font-bold text-[#5A8F5A]">
                              {user?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-xs text-stone-500 font-medium truncate max-w-[100px]"><span className="font-bold text-[#1A2E1A]">{user?.name || 'Onbekend'}</span></span>
                        </div>
                        
                        <div className="flex items-center space-x-1 px-2 py-1 bg-stone-100 rounded-md text-[10px] font-bold text-stone-500">
                          <PieChart className="w-3 h-3" />
                          <span>{distributedSum > 0 ? `${distributedSum}/${harvest.yieldQuantity} verdeeld` : 'Niet verdeeld'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h2 className="text-lg font-bold text-[#1A2E1A]">Alle Oogsten</h2>
              <div className="relative w-full sm:w-64 shrink-0">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <select
                  value={filterUserFamily}
                  onChange={(e) => setFilterUserFamily(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A8F5A] appearance-none cursor-pointer shadow-sm font-medium text-stone-600 truncate"
                >
                  <option value="all">Alle families tonen</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#F5F7F4] text-[#1A2E1A] border-b border-stone-100">
                    <tr>
                      <th className="px-6 py-4 font-bold rounded-tl-2xl">Gewas</th>
                      <th className="px-6 py-4 font-bold">Datum</th>
                      <th className="px-6 py-4 font-bold">{filterUserFamily !== 'all' ? 'Ontvangen' : 'Totale Opbrengst'}</th>
                      <th className="px-6 py-4 font-bold">Door</th>
                      <th className="px-6 py-4 font-bold">Verdeling</th>
                      <th className="px-6 py-4 font-bold rounded-tr-2xl text-right">Notities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-600">
                    {tableHarvests.map(harvest => {
                      const user = getUser(harvest.userId);
                      const plant = getPlant(harvest.plantId);

                      let displayedQuantity = harvest.yieldQuantity;
                      let displayedDistributions = harvest.distributedTo || [];
                      
                      if (filterUserFamily !== 'all') {
                        const familyDist = displayedDistributions.find(d => d.familyId === filterUserFamily);
                        displayedQuantity = familyDist ? familyDist.quantity : 0;
                        displayedDistributions = familyDist ? [familyDist] : [];
                      }

                      return (
                        <tr key={harvest.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{plant?.icon || '🌱'}</span>
                              <span className="font-bold text-[#1A2E1A]">{harvest.plantName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {format(new Date(harvest.date), 'd MMM yyyy', { locale: nl })}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#1A2E1A]">
                            {displayedQuantity} <span className="text-stone-400 font-normal uppercase text-xs">{harvest.yieldUnit}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[10px] font-bold text-[#5A8F5A]">
                                  {user?.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <span>{user?.name || 'Onbekend'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {displayedDistributions.map(d => {
                                const family = families.find(f => f.id === d.familyId);
                                return (
                                  <div key={d.familyId} className="flex items-center space-x-2 text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5A8F5A]"></span>
                                    <span className="font-bold text-[#1A2E1A]">{family?.name || 'Onbekend'}:</span>
                                    <span>{d.quantity} {harvest.yieldUnit}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => handleOpenEdit(e, harvest)}
                              className="bg-stone-100 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
                              title="Bekijk of bewerk notitie/foto"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Distribution Modal */}
      {selectedDistributionHarvest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 h-full">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[90vh]">
            <button 
              onClick={() => setSelectedDistributionHarvest(null)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Oogst Verdelen</h2>
            <p className="text-sm text-stone-500 mb-6">
              Verdeel de {selectedDistributionHarvest.yieldQuantity} {selectedDistributionHarvest.yieldUnit} {selectedDistributionHarvest.plantName.toLowerCase()} over de families.
            </p>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4 mb-6">
              {families.map(family => {
                const currentDist = distribution[family.id] || '';
                return (
                  <div key={family.id} className="flex items-center justify-between bg-[#F5F7F4] p-4 rounded-2xl border border-stone-200">
                    <span className="text-sm font-bold text-[#1A2E1A]">{family.name}</span>
                    <div className="flex items-center space-x-2 w-1/3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={currentDist}
                        onChange={(e) => handleDistChange(family.id, e.target.value)}
                        placeholder="0"
                        className={cn(
                          "w-full bg-white border border-stone-200 rounded-xl p-2 text-sm font-bold text-right focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none",
                          isOverDistributed && "border-red-300 text-red-600 focus:ring-red-500"
                        )}
                      />
                      <span className="text-xs font-bold text-stone-500">{selectedDistributionHarvest.yieldUnit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className={cn(
              "p-4 rounded-xl mb-6 flex justify-between items-center",
              isOverDistributed ? "bg-red-50 text-red-600" : "bg-[#E8F0E8] text-[#5A8F5A]"
            )}>
              <span className="text-sm font-bold uppercase tracking-wider">Restant</span>
              <span className="text-lg font-bold">{remainingQuantity} {selectedDistributionHarvest.yieldUnit}</span>
            </div>

            <button 
              onClick={handleSaveDistribution}
              disabled={isOverDistributed}
              className="w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
            >
              <PieChart className="w-5 h-5" />
              <span>Verdeling Opslaan</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Harvest Modal */}
      {isAddHarvestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 h-full">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[90vh]">
            <button 
              onClick={() => {
                setIsAddHarvestModalOpen(false);
                setSelectedCellToHarvest(null);
                setHarvestQuantity('');
              }}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Nieuwe Oogst Toevoegen</h2>
            
            {!selectedCellToHarvest ? (
              <>
                <p className="text-sm text-stone-500 mb-6">Selecteer het gewas dat je wilt oogsten uit de tuin.</p>
                
                <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                  {(() => {
                    if (plantedCells.length === 0) {
                      return <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl">Er staan momenteel geen gewassen in de tuin om te oogsten.</p>;
                    }

                    const cellsWithStatus = plantedCells.map(cell => {
                      const plant = getPlant(cell.plantId);
                      if (!plant) return { cell, plant: null, isHarvestTime: false, harvestDate: null };
                      
                      let effectiveDaysToHarvest = cell.customDaysToHarvest ?? plant.daysToHarvest ?? 0;
                      if (!cell.customDaysToHarvest) {
                        if (cell.plantType === 'Bol') effectiveDaysToHarvest = Math.max(1, Math.floor(effectiveDaysToHarvest * 0.75));
                        if (cell.plantType === 'Plant') effectiveDaysToHarvest = Math.max(1, Math.floor(effectiveDaysToHarvest * 0.70));
                      }

                      const harvestDate = cell.plantedDate ? addDays(new Date(cell.plantedDate), effectiveDaysToHarvest) : null;
                      const isHarvestTime = harvestDate ? differenceInDays(new Date(), harvestDate) >= -7 : false;

                      return { cell, plant, isHarvestTime, harvestDate };
                    }).filter(item => item.plant !== null) as { cell: GridCell, plant: any, isHarvestTime: boolean, harvestDate: Date | null }[];

                    const readyCells = cellsWithStatus.filter(c => c.isHarvestTime);
                    const growingCells = cellsWithStatus.filter(c => !c.isHarvestTime);

                    return (
                      <>
                        {readyCells.map(({ cell, plant }) => (
                          <button
                            key={cell.id}
                            onClick={() => setSelectedCellToHarvest(cell)}
                            className="p-4 rounded-2xl border border-[#5A8F5A] bg-[#E8F0E8] text-left transition-all flex flex-col shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{plant.icon}</span>
                                <div>
                                  <span className="font-bold text-[#1A2E1A] block">{plant.name}</span>
                                  <span className="text-[10px] font-bold text-[#5A8F5A] uppercase">Vak {String.fromCharCode(65 + cell.y)}{cell.x + 1}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 bg-[#5A8F5A] px-2 py-1 rounded-md text-white">
                                <span className="text-[10px] font-bold">RIJP</span>
                              </div>
                            </div>
                          </button>
                        ))}

                        {readyCells.length === 0 && growingCells.length > 0 && (
                          <>
                            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm mb-4">
                              <p className="font-bold mb-1">Geen gewassen oogstklaar</p>
                              <p>Hieronder zie je de groeiende gewassen en hun verwachte oogstdatum. Je kunt ze alvast oogsten als je wilt.</p>
                            </div>
                            
                            {growingCells.map(({ cell, plant, harvestDate }) => {
                              const daysLeft = harvestDate ? differenceInDays(harvestDate, new Date()) : 0;
                              return (
                                <button
                                  key={cell.id}
                                  onClick={() => setSelectedCellToHarvest(cell)}
                                  className="p-4 rounded-2xl border border-stone-100 bg-white hover:border-[#5A8F5A]/30 text-left transition-all flex flex-col shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl opacity-70">{plant.icon}</span>
                                      <div>
                                        <span className="font-bold text-[#1A2E1A] block opacity-70">{plant.name}</span>
                                        <span className="text-[10px] font-bold text-[#5A8F5A] uppercase">Vak {String.fromCharCode(65 + cell.y)}{cell.x + 1}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {harvestDate ? (
                                        <>
                                          <span className="block text-[10px] font-bold uppercase text-stone-400">Verwacht</span>
                                          <span className="block text-xs font-bold text-[#1A2E1A]">{format(harvestDate, 'd MMM yyyy', { locale: nl })}</span>
                                          <span className="block text-[9px] font-bold text-amber-500">Nog {daysLeft} dagen</span>
                                        </>
                                      ) : (
                                        <span className="text-xs text-stone-400">Onbekend</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-stone-50 flex justify-end">
                                    <span className="text-[10px] font-bold text-[#5A8F5A] flex items-center bg-[#E8F0E8] px-2 py-1 rounded-md hover:bg-[#D0E0D0] transition-colors">
                                      Toch Oogsten
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 mb-6">Hoeveel {getPlant(selectedCellToHarvest.plantId)?.name} heb je geoogst?</p>
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
                  <textarea
                    value={harvestNotes}
                    onChange={(e) => setHarvestNotes(e.target.value)}
                    placeholder="Notitie (optioneel)"
                    className="w-full bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none min-h-[80px] resize-none"
                  />
                  <div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-[#F5F7F4] text-[#1A2E1A] rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-[#E8F0E8] transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{harvestPhotoUrl ? 'Foto wijzigen' : 'Foto toevoegen (optioneel)'}</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handlePhotoUpload(e, false)} 
                    />
                    {harvestPhotoUrl && (
                      <div className="mt-2 relative inline-block">
                        <img src={harvestPhotoUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-stone-200" />
                        <button 
                          onClick={() => setHarvestPhotoUrl(null)}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 hover:bg-red-200 transition-colors shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setSelectedCellToHarvest(null)}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                  >
                    Terug
                  </button>
                  <button 
                    onClick={handleHarvest}
                    disabled={!harvestQuantity}
                    className="flex-1 py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
                  >
                    <span>🧺 Oogsten & Vak Legen</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Harvest Modal */}
      {selectedEditHarvest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 h-full">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[90vh]">
            <button 
              onClick={() => setSelectedEditHarvest(null)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Oogst Bewerken</h2>
            <p className="text-sm text-stone-500 mb-6">Bewerk de foto of notitie voor {selectedEditHarvest.plantName}.</p>

            <div className="space-y-4 mb-6 flex-1 overflow-y-auto pr-2 no-scrollbar">
              <textarea
                value={editHarvestNotes}
                onChange={(e) => setEditHarvestNotes(e.target.value)}
                placeholder="Notitie toevoegen..."
                className="w-full bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none min-h-[120px] resize-none"
              />
              <div>
                <button 
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full bg-[#F5F7F4] text-[#1A2E1A] rounded-xl py-3 font-bold flex items-center justify-center space-x-2 hover:bg-[#E8F0E8] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>{editHarvestPhotoUrl ? 'Foto wijzigen' : 'Foto toevoegen'}</span>
                </button>
                <input 
                  type="file" 
                  ref={editFileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handlePhotoUpload(e, true)} 
                />
                {editHarvestPhotoUrl && (
                  <div className="mt-3 relative inline-block">
                    <img src={editHarvestPhotoUrl} alt="Preview" className="max-h-40 max-w-full object-contain rounded-xl border border-stone-200" />
                    <button 
                      onClick={() => setEditHarvestPhotoUrl(null)}
                      className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1.5 hover:bg-red-200 transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleSaveEditHarvest}
              className="w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors flex justify-center items-center space-x-2"
            >
              <span>Opslaan</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Action (Mobile Only) */}
      <div className="md:hidden fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={() => setIsAddHarvestModalOpen(true)}
          className="bg-[#5A8F5A] text-white p-4 rounded-2xl shadow-lg shadow-[#5A8F5A]/40 hover:bg-[#4A7A4A] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
