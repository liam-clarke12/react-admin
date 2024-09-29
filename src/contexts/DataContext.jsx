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

  const [recipes, setRecipes] = useState(() => {
    const savedRecipes = localStorage.getItem('recipes');
    return savedRecipes ? JSON.parse(savedRecipes) : [];
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
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

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
  };

  // Function to update an existing production log
  const updateProductionLog = (updatedLog) => {
    setProductionLogs((prevLogs) =>
      prevLogs.map((log) => (log.id === updatedLog.id ? updatedLog : log))
    );

    // Update recipeInventory based on the change in batchesProduced
    const existingRecipe = recipeInventory.find(item => item.recipe === updatedLog.recipe);
    if (existingRecipe) {
      const previousLog = productionLogs.find(log => log.id === updatedLog.id);
      if (previousLog) {
        const quantityChange = updatedLog.batchesProduced - (previousLog.batchesProduced || 0);
        const updatedInventory = recipeInventory.map(item =>
          item.recipe === updatedLog.recipe
            ? { ...item, quantity: item.quantity + quantityChange }
            : item
        );
        setRecipeInventory(updatedInventory);
      }
    }
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
      updateProductionLog, // Expose the update function
      clearProductionLogs,
      clearRecipeInventory,  // New function for clearing recipe inventory
      recipeInventory,
      setRecipeInventory,
      recipes,
      setRecipes,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
