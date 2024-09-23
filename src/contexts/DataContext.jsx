import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [rows, setRows] = useState(() => {
    // Initialize state from local storage if available
    const savedRows = localStorage.getItem('rows');
    return savedRows ? JSON.parse(savedRows) : [];
  });

  const [ingredientInventory, setIngredientInventory] = useState(() => {
    // Initialize ingredient inventory from local storage if available
    const savedInventory = localStorage.getItem('ingredientInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  useEffect(() => {
    // Save rows to local storage whenever rows change
    localStorage.setItem('rows', JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    // Save ingredient inventory to local storage whenever it changes
    localStorage.setItem('ingredientInventory', JSON.stringify(ingredientInventory));
  }, [ingredientInventory]);

  const addRow = (row) => {
    setRows(prevRows => [...prevRows, { id: prevRows.length + 1, ...row }]); // Ensure unique IDs
  };

  const addInventory = (ingredientUpdate) => {
    // Check if the ingredient already exists
    const existingIngredient = ingredientInventory.find(item => item.ingredientName === ingredientUpdate.ingredientName);
    
    let updatedInventory;
    if (existingIngredient) {
      // Update the stock on hand if the ingredient exists
      updatedInventory = ingredientInventory.map(item =>
        item.ingredientName === ingredientUpdate.ingredientName
          ? { ...item, stockOnHand: item.stockOnHand + ingredientUpdate.stockOnHand }
          : item
      );
    } else {
      // Add new ingredient if it doesn't exist
      updatedInventory = [...ingredientInventory, ingredientUpdate];
    }

    setIngredientInventory(updatedInventory);
  };

  return (
    <DataContext.Provider value={{ rows, addRow, setRows, ingredientInventory, setIngredientInventory, addInventory }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  return useContext(DataContext);
};
