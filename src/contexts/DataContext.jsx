import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [goodsInRows, setGoodsInRows] = useState(() => {
    const savedRows = localStorage.getItem('goodsInRows');
    return savedRows ? JSON.parse(savedRows) : [];
  });

  const [ingredientInventory, setIngredientInventory] = useState(() => {
    const savedInventory = localStorage.getItem('ingredientInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const [rows, setRows] = useState(() => {
    const savedRecipeRows = localStorage.getItem('recipeRows');
    return savedRecipeRows ? JSON.parse(savedRecipeRows) : [];
  });

  useEffect(() => {
    localStorage.setItem('goodsInRows', JSON.stringify(goodsInRows));
  }, [goodsInRows]);

  useEffect(() => {
    localStorage.setItem('ingredientInventory', JSON.stringify(ingredientInventory));
  }, [ingredientInventory]);

  useEffect(() => {
    localStorage.setItem('recipeRows', JSON.stringify(rows));
  }, [rows]);

  // Function to add a new row to the Goods In table
  const addGoodsInRow = (row) => {
    if (!row.ingredient || !row.stockReceived) {
      console.warn("Invalid row data:", row);
      return;
    }

    const newRow = { ...row, id: row.barCode }; 

    setGoodsInRows(prevRows => [...prevRows, newRow]);

    const existingIngredient = ingredientInventory.find(item => item.ingredient === row.ingredient);
    if (existingIngredient) {
      const updatedInventory = ingredientInventory.map(item =>
        item.ingredient === row.ingredient
          ? { ...item, amount: item.amount + row.stockReceived }
          : item
      );
      setIngredientInventory(updatedInventory);
    } else {
      setIngredientInventory(prevInventory => [
        ...prevInventory,
        { ingredient: row.ingredient, amount: row.stockReceived, barcode: row.barCode }
      ]);
    }
  };

  // Function to add a new row to the Recipe table
  const addRow = (row) => {
    if (!row.recipe || !row.ingredients.length) {
      console.warn("Invalid row data:", row);
      return;
    }

    const newRow = {
      id: `${row.recipe}-${Date.now()}`, // Generate a unique ID
      recipe: row.recipe,
      ingredients: row.ingredients,
      quantities: row.quantities,
    };

    setRows(prevRows => [...prevRows, newRow]);
  };

  return (
    <DataContext.Provider value={{ 
      goodsInRows, 
      addGoodsInRow, 
      setGoodsInRows, 
      ingredientInventory, 
      setIngredientInventory, 
      rows, 
      addRow, 
      setRows 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
