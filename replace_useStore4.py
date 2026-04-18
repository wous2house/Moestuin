import re

with open('src/store/useStore.ts', 'r') as f:
    content = f.read()

# toggleTask
content = re.sub(
    r'''    \} catch \(e\) \{
      console\.error\("Failed to toggle task in PB", e\);
      // Fallback optimistic
      set\(\(state\) => \{
        const task = state\.tasks\.find\(t => t\.id === taskId\);
        if \(!task\) return state;

        const hasRecurring = task\.recurring \|\| task\.recurring_interval;
        const interval = task\.recurring\?\.interval \|\| task\.recurring_interval;
        const unit = task\.recurring\?\.unit \|\| task\.recurring_unit;

        if \(!task\.completed && hasRecurring && task\.dueDate\) \{
          const newDate = new Date\(task\.dueDate\);
          if \(unit === 'dagen'\) newDate\.setDate\(newDate\.getDate\(\) \+ interval\);
          else if \(unit === 'weken'\) newDate\.setDate\(newDate\.getDate\(\) \+ interval \* 7\);
          else if \(unit === 'maanden'\) newDate\.setMonth\(newDate\.getMonth\(\) \+ interval\);

          const newTask = \{
            \.\.\.task,
            id: `t-\$\{Date\.now\(\)\}`,
            dueDate: format\(newDate, 'yyyy-MM-dd'\),
            completed: false
          \};

          return \{
            tasks: state\.tasks\.map\(t => t\.id === taskId \? \{ \.\.\.t, completed: true, recurring: null, recurring_interval: null, recurring_unit: "" \} : t\)\.concat\(newTask\)
          \};
        \}

        return \{
          tasks: state\.tasks\.map\(\(t\) =>
            t\.id === taskId \? \{ \.\.\.t, completed: !t\.completed \} : t
          \),
        \};
      \}\);
    \}''',
    '''    } catch (e: any) {
      console.error("Failed to toggle task in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }''',
    content
)


with open('src/store/useStore.ts', 'w') as f:
    f.write(content)
