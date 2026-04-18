import re

with open('src/store/useStore.ts', 'r') as f:
    content = f.read()

# addSeed
content = re.sub(
    r'''    \} catch \(e: any\) \{
      console\.error\("Failed to add seed to PB", e\?\.response \|\| e\);
      if \(typeof window !== 'undefined' && e\?\.response\?\.data\) \{
        alert\("Oeps! PocketBase weigert de zaden\. Controleer of de velden exact kloppen: " \+ JSON\.stringify\(e\.response\.data\)\);
      \}
      set\(\(state\) => \{
        const existing = state\.seedBox\.find\(s => s\.plantId === seed\.plantId\);
        if \(existing\) \{
          return \{
            seedBox: state\.seedBox\.map\(s => s\.plantId === seed\.plantId
              \? \{ \.\.\.s, quantity: s\.quantity \+ seed\.quantity, unit: seed\.unit \|\| s\.unit \}
              : s\)
          \};
        \}
        return \{ seedBox: \[\.\.\.state\.seedBox, \{ \.\.\.seed, id: `s-\$\{Date\.now\(\)\}` \}\] \};
      \}\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add seed to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updateSeed
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update seed in PB", e\);
      set\(\(state\) => \(\{
        seedBox: state\.seedBox\.map\(s => s\.id === id \? \{ \.\.\.s, \.\.\.updates \} : s\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update seed in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# deleteSeed
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to delete seed from PB", e\);
      set\(\(state\) => \(\{
        seedBox: state\.seedBox\.filter\(s => s\.id !== idOrPlantId && s\.plantId !== idOrPlantId\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to delete seed from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# toggleTask
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to toggle task in PB", e\);
      const state = get\(\);
      const task = state\.tasks\.find\(t => t\.id === taskId\);
      if \(task\) \{
        set\(\(state\) => \(\{
          tasks: state\.tasks\.map\(\(t\) =>
            t\.id === taskId \? \{ \.\.\.t, completed: !t\.completed \} : t
          \),
        \}\)\);
      \}
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to toggle task in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)


# addLog
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to add log to PB", e\);
      set\(\(state\) => \(\{
        logs: \[\{ \.\.\.log, id: `l-\$\{Date\.now\(\)\}` \} as GrowthLog, \.\.\.state\.logs\]
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add log to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# addHarvest
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to add harvest to PB", e\);
      set\(\(state\) => \(\{
        harvests: \[\{ \.\.\.harvest, id: `h-\$\{Date\.now\(\)\}` \} as HarvestRecord, \.\.\.state\.harvests\]
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add harvest to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updateHarvest
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update harvest in PB", e\);
      set\(\(state\) => \(\{
        harvests: state\.harvests\.map\(h => h\.id === id \? \{ \.\.\.h, \.\.\.updates \} : h\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update harvest in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# addFamily
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to add family to PB", e\);
      const id = `f-\$\{Date\.now\(\)\}`;
      set\(\(state\) => \{
        const newFamilies = \[\.\.\.state\.families, \{ id, name \}\];
        let newUsers = state\.users;
        let newCurrentUser = state\.currentUser;

        if \(state\.currentUser\) \{
          newUsers = state\.users\.map\(u => u\.id === state\.currentUser!\.id \? \{ \.\.\.u, familyId: id \} : u\);
          newCurrentUser = \{ \.\.\.state\.currentUser, familyId: id \};
        \}

        return \{ families: newFamilies, users: newUsers, currentUser: newCurrentUser \};
      \}\);
      return id;
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add family to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

with open('src/store/useStore.ts', 'w') as f:
    f.write(content)
