import re

with open('src/store/useStore.ts', 'r') as f:
    content = f.read()

# setGridCell
content = re.sub(
    r'''    \} catch \(e: any\) \{
      console\.error\("Failed to update grid cell in PB", e\?\.response \|\| e\);
      // If needed, we could revert the optimistic update here,
      // but fetchDataFromDB via real-time subscription usually handles sync\.
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update grid cell in PB", e?.response || e);
      // Revert optimistic update
      set((state) => {
        const originalCell = state.grid.find(c => c.id === cellId);
        // We actually need the previous state to fully revert accurately, but we can just let realtime subscription re-sync
        // or throw error for now so caller can handle.
        return state;
      });
      // Fetch latest DB state to override the optimistic update
      get().fetchDataFromDB();
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updateGridSize
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update grid size in PB", e\);
      return \{ success: false, message: 'Fout bij opslaan van grid in database\.' \};
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update grid size in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# addTask
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to add task to PB", e\);
      set\(\(state\) => \(\{
        tasks: \[\.\.\.state\.tasks, \{ \.\.\.task, id: `t-\$\{Date\.now\(\)\}` \} as Task\]
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add task to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updateTask
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update task in PB", e\);
      set\(\(state\) => \(\{
        tasks: state\.tasks\.map\(t => t\.id === id \? \{ \.\.\.t, \.\.\.updates \} : t\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update task in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# deleteTask
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to delete task from PB", e\);
      set\(\(state\) => \(\{
        tasks: state\.tasks\.filter\(t => t\.id !== id\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to delete task from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# addPlant
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to add plant to PB", e\);
      const mockId = `p-\$\{Date\.now\(\)\}`;
      set\(\(state\) => \(\{
        plants: \[\.\.\.state\.plants, \{ \.\.\.plant, id: mockId \} as Plant\]
      \}\)\);
      return mockId;
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add plant to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updatePlant
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update plant in PB", e\);
      set\(\(state\) => \(\{
        plants: state\.plants\.map\(p => p\.id === id \? \{ \.\.\.p, \.\.\.updates \} : p\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update plant in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# deletePlant
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to delete plant from PB", e\);
      set\(\(state\) => \(\{
        plants: state\.plants\.filter\(p => p\.id !== id\),
        grid: state\.grid\.map\(c => c\.plantId === id \? \{ \.\.\.c, plantId: null, plantType: null, plantedDate: null, plantedBy: null \} : c\),
        seedBox: state\.seedBox\.filter\(s => s\.plantId !== id\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to delete plant from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)


with open('src/store/useStore.ts', 'w') as f:
    f.write(content)
