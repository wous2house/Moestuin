import re

with open('src/store/useStore.ts', 'r') as f:
    content = f.read()

# updateFamily
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update family in PB", e\);
      set\(\(state\) => \(\{
        families: state\.families\.map\(f => f\.id === id \? \{ \.\.\.f, name \} : f\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update family in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# deleteFamily
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to delete family from PB", e\);
      set\(\(state\) => \{
        const defaultFamilyId = state\.families\.find\(f => f\.id !== id\)\?\.id \|\| '';
        return \{
          families: state\.families\.filter\(f => f\.id !== id\),
          users: state\.users\.map\(u => u\.familyId === id \? \{ \.\.\.u, familyId: defaultFamilyId \} : u\),
          currentUser: state\.currentUser\?\.familyId === id \? \{ \.\.\.state\.currentUser, familyId: defaultFamilyId \} : state\.currentUser
        \};
      \}\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to delete family from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updateUserFamily
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update user family in PB", e\);
      set\(\(state\) => \(\{
        users: state\.users\.map\(u => u\.id === userId \? \{ \.\.\.u, familyId \} : u\),
        currentUser: state\.currentUser\?\.id === userId \? \{ \.\.\.state\.currentUser, familyId \} : state\.currentUser
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update user family in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# addUser
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to add user to PB", e\);
      set\(\(state\) => \(\{
        users: \[\.\.\.state\.users, \{ \.\.\.user, id: `u-\$\{Date\.now\(\)\}` \} as User\]
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to add user to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# updateUser
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to update user in PB", e\);
      set\(\(state\) => \(\{
        users: state\.users\.map\(u => u\.id === id \? \{ \.\.\.u, \.\.\.updates \} : u\),
        currentUser: state\.currentUser\?\.id === id \? \{ \.\.\.state\.currentUser, \.\.\.updates \} : state\.currentUser
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to update user in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)

# deleteUser
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to delete user from PB", e\);
      set\(\(state\) => \(\{
        users: state\.users\.filter\(u => u\.id !== id\)
      \}\)\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to delete user from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)


with open('src/store/useStore.ts', 'w') as f:
    f.write(content)
