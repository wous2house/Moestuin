import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# handleWater
content = re.sub(
    r'''  const handleWater = \(\) => \{
    if \(selectedCell && needsWater\) \{
      addLog\(\{
        cellId: selectedCell\.id,
        plantId: selectedCell\.plantId,
        date: new Date\(\)\.toISOString\(\),
        type: 'Wateren',
        note: 'Water gegeven',
        userId: currentUser\?\.id \|\| null
      \}\);
    \}
  \};''',
    '''  const handleWater = async () => {
    if (selectedCell && needsWater) {
      try {
        await addLog({
          cellId: selectedCell.id,
          plantId: selectedCell.plantId,
          date: new Date().toISOString(),
          type: 'Wateren',
          note: 'Water gegeven',
          userId: currentUser?.id || null
        });
      } catch (e: any) {
        alert(e.message);
      }
    }
  };''',
    content
)

# handleAddNote
content = re.sub(
    r'''  const handleAddNote = \(\) => \{
    if \(selectedCell && noteText\.trim\(\)\) \{
      addLog\(\{
        cellId: selectedCell\.id,
        plantId: selectedCell\.plantId,
        date: new Date\(\)\.toISOString\(\),
        type: 'Notitie',
        note: noteText\.trim\(\),
        userId: currentUser\?\.id \|\| null
      \}\);
      setNoteText\(''\);
      setIsNoteModalOpen\(false\);
    \}
  \};''',
    '''  const handleAddNote = async () => {
    if (selectedCell && noteText.trim()) {
      try {
        await addLog({
          cellId: selectedCell.id,
          plantId: selectedCell.plantId,
          date: new Date().toISOString(),
          type: 'Notitie',
          note: noteText.trim(),
          userId: currentUser?.id || null
        });
        setNoteText('');
        setIsNoteModalOpen(false);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };''',
    content
)

# handlePhotoUpload
content = re.sub(
    r'''  const handlePhotoUpload = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{
    const file = e\.target\.files\?\.\[0\];
    if \(file && selectedCell\) \{
      const reader = new FileReader\(\);
      reader\.onloadend = \(\) => \{
        addLog\(\{
          cellId: selectedCell\.id,
          plantId: selectedCell\.plantId,
          date: new Date\(\)\.toISOString\(\),
          type: 'Notitie',
          note: 'Foto toegevoegd',
          userId: currentUser\?\.id \|\| null,
          imageUrl: reader\.result as string
        \}\);
      \};
      reader\.readAsDataURL\(file\);
    \}
  \};''',
    '''  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCell) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await addLog({
            cellId: selectedCell.id,
            plantId: selectedCell.plantId,
            date: new Date().toISOString(),
            type: 'Notitie',
            note: 'Foto toegevoegd',
            userId: currentUser?.id || null,
            imageUrl: reader.result as string
          });
        } catch (err: any) {
          alert(err.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };''',
    content
)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
