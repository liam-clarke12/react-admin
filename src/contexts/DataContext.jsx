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

  const [productionLogs, setProductionLogs] = useState(() => {
    const savedLogs = localStorage.getItem('productionLogs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  const [recipeInventory, setRecipeInventory] = useState(() => {
    const savedInventory = localStorage.getItem('recipeInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const [stockUsage, setStockUsage] = useState(() => {
    const savedStockUsage = localStorage.getItem('stockUsage');
    return savedStockUsage ? JSON.parse(savedStockUsage) : [];
  });

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('goodsInRows', JSON.stringify(goodsInRows));
  }, [goodsInRows]);

  useEffect(() => {
    localStorage.setItem('ingredientInventory', JSON.stringify(ingredientInventory));
  }, [ingredientInventory]);

  useEffect(() => {
    localStorage.setItem('recipeRows', JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('productionLogs', JSON.stringify(productionLogs));
  }, [productionLogs]);

  useEffect(() => {
    localStorage.setItem('recipeInventory', JSON.stringify(recipeInventory));
  }, [recipeInventory]);

  useEffect(() => {
    localStorage.setItem('stockUsage', JSON.stringify(stockUsage));
  }, [stockUsage]);

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

    setRows(prevRows => {
      const updatedRows = [...prevRows, newRow];
      return updatedRows;
    });
  };

  // Function to add a new row to the Production Logs and update Recipe Inventory
  const addProductionLogRow = (log) => {
    if (!log.recipe || !log.batchesProduced || !log.date || !log.batchCode) {
      console.warn("Invalid log data:", log);
      return;
    }

    const newLog = { id: `${log.recipe}-${Date.now()}`, ...log };
    setProductionLogs(prevLogs => [...prevLogs, newLog]);

    // Update recipeInventory
    const existingRecipe = recipeInventory.find(item => item.recipe === log.recipe);
    if (existingRecipe) {
      const updatedInventory = recipeInventory.map(item =>
        item.recipe === log.recipe
          ? { ...item, quantity: item.quantity + log.batchesProduced, date: log.date, batchCode: log.batchCode }
          : item
      );
      setRecipeInventory(updatedInventory);
    } else {
      setRecipeInventory(prevInventory => [
        ...prevInventory,
        { recipe: log.recipe, quantity: log.batchesProduced, date: log.date, batchCode: log.batchCode }
      ]);
    }

    // Update Stock Usage with actual ingredients and quantities from the recipe
    const ingredientsForUsage = getIngredientsByRecipeName(log.recipe); // Get ingredients by recipe name
    const quantitiesForUsage = getQuantitiesByRecipeName(log.recipe); // Get quantities by recipe name

    // Create an array of objects with ingredient and corresponding quantity
    const stockUsageData = ingredientsForUsage.map((ingredient, index) => ({
      ingredient,
      quantity: quantitiesForUsage[index] * log.batchesProduced || 0 // Default to 0 if no quantity found
    }));

    addStockUsageRow({
      recipeName: log.recipe,
      date: log.date,
      ingredients: stockUsageData, // Use the array of objects
      batchCode: log.batchCode,
    });
  };

  // Function to add a new row to the Stock Usage table
  const addStockUsageRow = (row) => {
    setStockUsage(prevStockUsage => [...prevStockUsage, { ...row, id: `${row.recipeName}-${Date.now()}` }]);

    // New process to reduce ingredient inventory based on stock usage
    const updatedInventory = ingredientInventory.map(item => {
      const ingredientUsed = row.ingredients.find(ing => ing.ingredient === item.ingredient);
      if (ingredientUsed) {
        return { ...item, amount: item.amount - ingredientUsed.quantity };
      }
      return item;
    }).filter(item => item.amount > 0); // Remove items that have zero or negative stock

    setIngredientInventory(updatedInventory);
  };

  // Function to clear stock usage
  const clearStockUsage = () => {
    setStockUsage([]);
    localStorage.removeItem('stockUsage');
  };

  // Function to clear production logs
  const clearProductionLogs = () => {
    setProductionLogs([]);
    localStorage.removeItem('productionLogs');
  };

  // Function to clear recipe inventory
  const clearRecipeInventory = () => {
    setRecipeInventory([]);
    localStorage.removeItem('recipeInventory');
  };

  // Function to get quantities by recipe name
  const getQuantitiesByRecipeName = (recipeName) => {
    const recipeRow = rows.find(row => row.recipe === recipeName);
    return recipeRow ? recipeRow.quantities : []; // Return quantities if the recipe is found
  };

  // Function to get ingredients by recipe name
  const getIngredientsByRecipeName = (recipeName) => {
    const recipeRow = rows.find(row => row.recipe === recipeName);
    return recipeRow ? recipeRow.ingredients : []; // Return ingredients if the recipe is found
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
      setRows,
      productionLogs,
      addProductionLogRow,
      clearProductionLogs,
      recipeInventory,
      setRecipeInventory,
      clearRecipeInventory,
      stockUsage, // Expose stock usage state
      addStockUsageRow, // Expose function to add stock usage
      clearStockUsage,
      getQuantitiesByRecipeName, // Expose the function
      getIngredientsByRecipeName, // Expose the new function
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
