import { useState, useMemo } from 'react';
import { useStore, HarvestRecord } from '../store/useStore';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Wheat, Calendar, Search, Filter, X, PieChart, CheckCircle2, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

import { HeaderActions } from '../components/HeaderActions';

export default function Harvests() {
  const { harvests, users, families, plants, updateHarvest, setIsNotificationsModalOpen, tasks, currentUser, logs, dismissedLogs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlantFamily, setFilterPlantFamily] = useState<string>('all');
  const [filterUserFamily, setFilterUserFamily] = useState<string>('all');
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo === currentUser?.id)).length;
  const unreadLogsCount = logs.filter(l => l.userId !== currentUser?.id && (!currentUser || !dismissedLogs[currentUser.id]?.includes(l.id))).length;
  const notificationsCount = activeTasksCount + unreadLogsCount;
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestRecord | null>(null);
  const [distribution, setDistribution] = useState<Record<string, number>>({});

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

  const getUser = (id: string | null) => users.find(u => u.id === id);
  const getPlant = (id: string | null) => plants.find(p => p.id === id);

  const handleOpenDistribution = (harvest: HarvestRecord) => {
    const initialDist: Record<string, number> = {};
    if (harvest.distributedTo) {
      harvest.distributedTo.forEach(d => {
        initialDist[d.familyId] = d.quantity;
      });
    }
    setDistribution(initialDist);
    setSelectedHarvest(harvest);
  };

  const handleSaveDistribution = () => {
    if (selectedHarvest) {
      const distArray = (Object.entries(distribution) as [string, number][])
        .filter(([_, q]) => q > 0)
        .map(([familyId, quantity]) => ({ familyId, quantity }));
        
      updateHarvest(selectedHarvest.id, {
        distributedTo: distArray
      });
      setSelectedHarvest(null);
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
  const remainingQuantity = selectedHarvest ? selectedHarvest.yieldQuantity - totalDistributed : 0;
  const isOverDistributed = remainingQuantity < 0;

  return (
    <div className="p-6 max-w-md md:max-w-6xl mx-auto space-y-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2E1A] flex items-center space-x-3">
            <Wheat className="w-8 h-8 text-amber-500" />
            <span>Mijn Oogsten</span>
          </h1>
          <p className="text-stone-500 mt-2">Overzicht van alles wat je hebt geoogst en verdeeld.</p>
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
                  const isFullyDistributed = distributedSum >= harvest.yieldQuantity;
                  
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
                        <div className="bg-amber-50 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[3.5rem] relative shrink-0">
                          <span className="text-sm font-bold text-amber-600">{harvest.yieldQuantity}</span>
                          <span className="text-[10px] font-bold text-amber-600/70 uppercase">{harvest.yieldUnit}</span>
                        </div>
                      </div>
                      
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
                      <th className="px-6 py-4 font-bold rounded-tr-2xl">Verdeling</th>
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
      {selectedHarvest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[90vh]">
            <button 
              onClick={() => setSelectedHarvest(null)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Oogst Verdelen</h2>
            <p className="text-sm text-stone-500 mb-6">
              Verdeel de {selectedHarvest.yieldQuantity} {selectedHarvest.yieldUnit} {selectedHarvest.plantName.toLowerCase()} over de families.
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
                      <span className="text-xs font-bold text-stone-500">{selectedHarvest.yieldUnit}</span>
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
              <span className="text-lg font-bold">{remainingQuantity} {selectedHarvest.yieldUnit}</span>
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
    </div>
  );
}