import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { User, Settings, LogOut, Bell, Shield, Plane, Users, Plus, Pencil, Trash2, Camera, Download, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { currentUser, users, families, vacationMode, setVacationMode, addFamily, updateFamily, deleteFamily, updateUserFamily, setCurrentUser, updateUser, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  
  const handleExportData = () => {
    const state = useStore.getState();
    const dataToExport = {
      plants: state.plants,
      grid: state.grid,
      gridWidth: state.gridWidth,
      gridHeight: state.gridHeight,
      tasks: state.tasks,
      users: state.users,
      families: state.families,
      seedBox: state.seedBox,
      logs: state.logs,
      vacationMode: state.vacationMode
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moestuin_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const importedData = JSON.parse(reader.result as string);
          importData(importedData);
          alert('Database succesvol geïmporteerd!');
        } catch (error) {
          alert('Ongeldig JSON bestand.');
        }
      };
      reader.readAsText(file);
    }
  };
  
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [editFamilyName, setEditFamilyName] = useState('');
  const [isDeletingFamily, setIsDeletingFamily] = useState(false);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Lid'>('Lid');
  const [newUserFamilyId, setNewUserFamilyId] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<'Admin' | 'Lid'>('Lid');
  const [editUserFamilyId, setEditUserFamilyId] = useState('');

  const currentFamily = families.find(f => f.id === currentUser?.familyId);
  const familyMembers = users.filter(u => u.familyId === currentUser?.familyId);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser(currentUser.id, { avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFamily = () => {
    if (newFamilyName.trim()) {
      addFamily(newFamilyName.trim());
      setNewFamilyName('');
      setIsAddingFamily(false);
    }
  };

  const handleUpdateFamily = () => {
    if (currentFamily && editFamilyName.trim()) {
      updateFamily(currentFamily.id, editFamilyName.trim());
      setIsEditingFamily(false);
    }
  };

  const handleDeleteFamily = () => {
    if (currentFamily) {
      deleteFamily(currentFamily.id);
      setIsDeletingFamily(false);
    }
  };

  const handleAddUser = () => {
    if (newUserName.trim() && newUserFamilyId) {
      useStore.getState().addUser({
        name: newUserName.trim(),
        role: newUserRole,
        familyId: newUserFamilyId
      });
      setNewUserName('');
      setNewUserRole('Lid');
      setIsAddingUser(false);
    }
  };

  const handleUpdateUser = (id: string) => {
    if (editUserName.trim() && editUserFamilyId) {
      useStore.getState().updateUser(id, {
        name: editUserName.trim(),
        role: editUserRole,
        familyId: editUserFamilyId
      });
      setEditingUserId(null);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
      useStore.getState().deleteUser(id);
    }
  };

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-[#1A2E1A]">Profiel</h1>
        <p className="text-sm text-stone-500">Beheer je account en gezin</p>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        <div className="md:grid md:grid-cols-12 md:gap-8 md:items-start">
          {/* Left Column: User Info & Actions */}
          <div className="md:col-span-5 lg:col-span-4 space-y-6 mb-6 md:mb-0 md:sticky md:top-6">
            {/* User Info */}
            <div className="bg-white border border-stone-100 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <div className="relative">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#5A8F5A] mb-4 shadow-sm object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#E8F0E8] flex items-center justify-center text-3xl font-bold text-[#5A8F5A] mb-4 shadow-sm">
                    {currentUser?.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full mb-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-[#1A2E1A]">{currentUser?.name}</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A8F5A] mt-1">{currentUser?.role}</p>
            </div>

            <button className="w-full bg-red-50 text-red-600 rounded-2xl p-4 flex items-center justify-center space-x-2 font-bold hover:bg-red-100 transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Uitloggen</span>
            </button>
          </div>

          {/* Right Column: Family & Settings */}
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            {/* Family Management */}
            <section>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Gezin / Groep</h3>
              </div>
              
              <div className="bg-white border border-stone-100 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[#5A8F5A]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Huidige groep</p>
                      <p className="text-sm font-bold text-[#1A2E1A]">{currentFamily?.name || 'Geen groep'}</p>
                    </div>
                  </div>
                  {currentFamily && currentUser?.role === 'Admin' && !isEditingFamily && !isDeletingFamily && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditFamilyName(currentFamily.name);
                          setIsEditingFamily(true);
                        }}
                        className="p-2 text-stone-400 hover:text-[#5A8F5A] hover:bg-[#E8F0E8] rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setIsDeletingFamily(true)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditingFamily && (
                  <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-stone-50 p-3 rounded-xl">
                    <input 
                      type="text" 
                      className="flex-1 bg-white border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                      value={editFamilyName}
                      onChange={(e) => setEditFamilyName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleUpdateFamily}
                        className="flex-1 bg-[#5A8F5A] text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-[#4A7A4A] transition-colors"
                      >
                        Opslaan
                      </button>
                      <button 
                        onClick={() => setIsEditingFamily(false)}
                        className="flex-1 bg-stone-200 text-stone-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-stone-300 transition-colors"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}

                {isDeletingFamily && (
                  <div className="bg-red-50 p-3 rounded-xl mb-4">
                    <p className="text-sm font-bold text-red-800 mb-2">Weet je zeker dat je deze groep wilt verwijderen?</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleDeleteFamily} 
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        Ja, verwijderen
                      </button>
                      <button 
                        onClick={() => setIsDeletingFamily(false)} 
                        className="bg-stone-200 text-stone-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-stone-300 transition-colors"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Wissel van groep</label>
                    <select 
                      className="w-full bg-[#F5F7F4] border-none rounded-xl p-3 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                      value={currentUser?.familyId || ''}
                      onChange={(e) => {
                        if (currentUser) {
                          updateUserFamily(currentUser.id, e.target.value);
                        }
                      }}
                    >
                      <option value="" disabled>Selecteer een groep</option>
                      {families.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {!isAddingFamily ? (
                    <button 
                      onClick={() => setIsAddingFamily(true)}
                      className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm font-bold text-stone-500 hover:border-[#5A8F5A] hover:text-[#5A8F5A] transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nieuwe groep aanmaken</span>
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Naam van de groep"
                        className="flex-1 bg-[#F5F7F4] border-none rounded-xl p-3 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddFamily}
                          className="flex-1 bg-[#5A8F5A] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => { setIsAddingFamily(false); setNewFamilyName(''); }}
                          className="flex-1 bg-stone-200 text-stone-600 px-4 py-3 rounded-xl font-bold hover:bg-stone-300 transition-colors"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  )}                </div>
              </div>

              {currentFamily && (
                <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm">
                  <div className="p-4 bg-stone-50 rounded-t-2xl">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Leden van {currentFamily.name}</p>
                  </div>
                  {familyMembers.map(user => (
                    <div key={user.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#F5F7F4] flex items-center justify-center text-sm font-bold text-stone-600">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[#1A2E1A]">{user.name}</p>
                          <p className="text-xs text-stone-500">{user.role}</p>
                        </div>
                      </div>
                      {user.role === 'Admin' && <Shield className="w-4 h-4 text-[#5A8F5A]" />}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* User Management (Admin Only) */}
            {currentUser?.role === 'Admin' && (
              <section>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Alle Gebruikers Beheren</h3>
                </div>
                <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm">
                  {users.map(user => (
                    <div key={user.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {editingUserId === user.id ? (
                        <div className="flex-1 flex flex-col md:flex-row gap-2 w-full">
                          <input 
                            type="text" 
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                            value={editUserName}
                            onChange={(e) => setEditUserName(e.target.value)}
                          />
                          <select 
                            className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value as 'Admin' | 'Lid')}
                          >
                            <option value="Lid">Lid</option>
                            <option value="Admin">Admin</option>
                          </select>
                          <select 
                            className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                            value={editUserFamilyId}
                            onChange={(e) => setEditUserFamilyId(e.target.value)}
                          >
                            <option value="" disabled>Selecteer groep</option>
                            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                          <div className="flex space-x-2">
                            <button onClick={() => handleUpdateUser(user.id)} className="flex-1 bg-[#5A8F5A] text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-[#4A7A4A]">Opslaan</button>
                            <button onClick={() => setEditingUserId(null)} className="flex-1 bg-stone-200 text-stone-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-stone-300">Annuleren</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#F5F7F4] flex items-center justify-center text-sm font-bold text-stone-600">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-[#1A2E1A]">{user.name}</p>
                              <p className="text-xs text-stone-500">{user.role} • {families.find(f => f.id === user.familyId)?.name || 'Geen groep'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditUserName(user.name);
                                setEditUserRole(user.role);
                                setEditUserFamilyId(user.familyId);
                              }}
                              className="p-2 text-stone-400 hover:text-[#5A8F5A] hover:bg-[#E8F0E8] rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {user.id !== currentUser?.id && (
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  <div className="p-4 bg-stone-50 rounded-b-2xl">
                    {!isAddingUser ? (
                      <button 
                        onClick={() => {
                          setIsAddingUser(true);
                          setNewUserFamilyId(currentFamily?.id || '');
                        }}
                        className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm font-bold text-stone-500 hover:border-[#5A8F5A] hover:text-[#5A8F5A] transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nieuwe gebruiker toevoegen</span>
                      </button>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="Naam"
                          className="flex-1 bg-white border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          autoFocus
                        />
                        <select 
                          className="bg-white border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'Admin' | 'Lid')}
                        >
                          <option value="Lid">Lid</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <select 
                          className="bg-white border border-stone-200 rounded-xl p-2 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A]"
                          value={newUserFamilyId}
                          onChange={(e) => setNewUserFamilyId(e.target.value)}
                        >
                          <option value="" disabled>Selecteer groep</option>
                          {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <div className="flex space-x-2">
                          <button onClick={handleAddUser} className="flex-1 bg-[#5A8F5A] text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-[#4A7A4A]">Opslaan</button>
                          <button onClick={() => setIsAddingUser(false)} className="flex-1 bg-stone-200 text-stone-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-stone-300">Annuleren</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Settings */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">Instellingen</h3>
              <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm">
                <button className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center space-x-3 text-stone-700">
                    <Bell className="w-5 h-5" />
                    <span className="text-sm font-bold text-[#1A2E1A]">Notificaties</span>
                  </div>
                </button>
                <button className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center space-x-3 text-stone-700">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-bold text-[#1A2E1A]">App Instellingen</span>
                  </div>
                </button>
                
                {currentUser?.role === 'Admin' && (
                  <>
                    <button onClick={handleExportData} className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                      <div className="flex items-center space-x-3 text-stone-700">
                        <Download className="w-5 h-5" />
                        <span className="text-sm font-bold text-[#1A2E1A]">Exporteer Database (.json)</span>
                      </div>
                    </button>
                    <button onClick={() => dataInputRef.current?.click()} className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                      <div className="flex items-center space-x-3 text-stone-700">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm font-bold text-[#1A2E1A]">Importeer Database (.json)</span>
                      </div>
                      <input type="file" ref={dataInputRef} className="hidden" accept=".json,application/json" onChange={handleImportData} />
                    </button>
                  </>
                )}

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-stone-700">
                    <Plane className="w-5 h-5" />
                    <div>
                      <span className="text-sm font-bold text-[#1A2E1A] block text-left">Vakantiemodus</span>
                      <span className="text-[10px] text-stone-500">Draag taken over aan anderen</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setVacationMode(!vacationMode)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      vacationMode ? "bg-[#5A8F5A]" : "bg-stone-200"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      vacationMode ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
