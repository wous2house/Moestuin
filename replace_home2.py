import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# handleRemovePlant
content = re.sub(
    r'''  const handleRemovePlant = \(\) => \{
    if \(selectedCell\) \{
      addLog\(\{
        cellId: selectedCell\.id,
        plantId: selectedCell\.plantId,
        date: new Date\(\)\.toISOString\(\),
        type: 'Verwijderd',
        note: 'Gewas verwijderd',
        userId: currentUser\?\.id \|\| null
      \}\);
      const updates = \{
        plantId: null,
        plantedDate: null,
        plantedBy: null,
        plantType: null,
      \};
      setGridCell\(selectedCell\.id, updates\);
      setSelectedCell(\{ \.\.\.selectedCell, \.\.\.updates \}\);
      setIsDeleteConfirmOpen\(false\);
    \}
  \};''',
    '''  const handleRemovePlant = async () => {
    if (selectedCell) {
      try {
        await addLog({
          cellId: selectedCell.id,
          plantId: selectedCell.plantId,
          date: new Date().toISOString(),
          type: 'Verwijderd',
          note: 'Gewas verwijderd',
          userId: currentUser?.id || null
        });
        const updates = {
          plantId: null,
          plantedDate: null,
          plantedBy: null,
          plantType: null,
        };
        await setGridCell(selectedCell.id, updates);
        setSelectedCell({ ...selectedCell, ...updates });
        setIsDeleteConfirmOpen(false);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };''',
    content
)


# handleHarvest
content = re.sub(
    r'''  const handleHarvest = \(\) => \{
    if \(selectedCell && selectedPlant && harvestQuantity\) \{
      addHarvest\(\{
        plantId: selectedPlant\.id,
        plantName: selectedPlant\.name,
        date: new Date\(\)\.toISOString\(\),
        userId: currentUser\?\.id \|\| null,
        yieldQuantity: parseFloat\(harvestQuantity\),
        yieldUnit: harvestUnit
      \}\);
      addLog\(\{
        cellId: selectedCell\.id,
        plantId: selectedPlant\.id,
        date: new Date\(\)\.toISOString\(\),
        type: 'Oogst',
        note: `Geoogst: \$\{harvestQuantity\} \$\{harvestUnit\}`,
        userId: currentUser\?\.id \|\| null
      \}\);
      const updates = \{
        plantId: null,
        plantedDate: null,
        plantedBy: null,
        plantType: null,
      \};
      setGridCell\(selectedCell\.id, updates\);
      setIsHarvestModalOpen\(false\);
      setHarvestQuantity\(''\);
      setSelectedCell(\{ \.\.\.selectedCell, \.\.\.updates \}\);
    \}
  \};''',
    '''  const handleHarvest = async () => {
    if (selectedCell && selectedPlant && harvestQuantity) {
      try {
        await addHarvest({
          plantId: selectedPlant.id,
          plantName: selectedPlant.name,
          date: new Date().toISOString(),
          userId: currentUser?.id || null,
          yieldQuantity: parseFloat(harvestQuantity),
          yieldUnit: harvestUnit
        });
        await addLog({
          cellId: selectedCell.id,
          plantId: selectedPlant.id,
          date: new Date().toISOString(),
          type: 'Oogst',
          note: `Geoogst: ${harvestQuantity} ${harvestUnit}`,
          userId: currentUser?.id || null
        });
        const updates = {
          plantId: null,
          plantedDate: null,
          plantedBy: null,
          plantType: null,
        };
        await setGridCell(selectedCell.id, updates);
        setIsHarvestModalOpen(false);
        setHarvestQuantity('');
        setSelectedCell({ ...selectedCell, ...updates });
      } catch (e: any) {
        alert(e.message);
      }
    }
  };''',
    content
)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
