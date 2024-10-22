import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

    const newRow = { 
      ...row, 
      id: row.barCode, 
      stockRemaining: row.stockReceived // Set stockRemaining to the value of stockReceived
    };

    setGoodsInRows(prevRows => [...prevRows, newRow]);

    // Update ingredient inventory
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
    let updatedInventory = [...ingredientInventory]; // Clone the inventory for safe updates
    let updatedGoodsInRows = [...goodsInRows]; // Clone goodsInRows for safe updates
  
    // Loop through each ingredient used in the stock usage row
    row.ingredients.forEach((ingredientUsed) => {
      let quantityToSubtract = ingredientUsed.quantity;
  
      // Loop through the goodsInRows to find matching rows for the ingredient
      for (let i = 0; i < updatedGoodsInRows.length && quantityToSubtract > 0; i++) {
        let goodRow = updatedGoodsInRows[i];
  
        // Check if the ingredient in goodsInRows matches the ingredient used
        if (goodRow.ingredient === ingredientUsed.ingredient) {
          const stockRemaining = goodRow.stockRemaining;
  
          // If stock remaining is greater than or equal to the amount to subtract
          if (stockRemaining >= quantityToSubtract) {
            updatedGoodsInRows[i] = {
              ...goodRow,
              stockRemaining: stockRemaining - quantityToSubtract, // Subtract the required quantity
            };
            quantityToSubtract = 0; // Reset the quantity to subtract as it's fully subtracted
          } else {
            // If stock remaining is less than the amount to subtract, use all available stock and continue
            updatedGoodsInRows[i] = {
              ...goodRow,
              stockRemaining: 0, // Set stockRemaining to zero
            };
            quantityToSubtract -= stockRemaining; // Reduce the amount to subtract for the next matching row
          }
        }
      }
  
      // Update the inventory by subtracting from corresponding ingredients
      updatedInventory = updatedInventory.map(item =>
        item.ingredient === ingredientUsed.ingredient
          ? { ...item, amount: item.amount - ingredientUsed.quantity }
          : item
      ).filter(item => item.amount > 0); // Remove items with zero or negative stock
    });
  
    setIngredientInventory(updatedInventory);
    setGoodsInRows(updatedGoodsInRows);
  };

  const updateBarcodesAfterProcessing = useCallback(() => {
    console.log('Starting barcode update process...');
    let updatedInventory = [...ingredientInventory];
    let updatedGoodsInRows = [...goodsInRows];

    // Iterate over each ingredient in the inventory
    updatedInventory.forEach((inventoryItem) => {
      const matchingGoodsInRows = updatedGoodsInRows.filter(
        (row) => row.ingredient === inventoryItem.ingredient
      );

      // Find the first matching GoodsIn row with processed status "Yes"
      const currentRow = matchingGoodsInRows.find((row) => row.barCode === inventoryItem.barcode && row.processed === 'Yes');

      if (currentRow) {
        console.log(`Processing ingredient: ${inventoryItem.ingredient}, barcode: ${currentRow.barCode}`);

        // Find the next GoodsIn row with the same ingredient and processed as "No"
        const nextUnprocessedRow = matchingGoodsInRows.find((row) => row.processed === 'No');

        if (nextUnprocessedRow) {
          console.log(`Found next unprocessed row for ${inventoryItem.ingredient}, updating barcode to ${nextUnprocessedRow.barCode}`);

          // Update the barcode in the Ingredient Inventory
          updatedInventory = updatedInventory.map((item) =>
            item.ingredient === inventoryItem.ingredient
              ? { ...item, barcode: nextUnprocessedRow.barCode }
              : item
          );

          // Mark the next unprocessed row as processed
          updatedGoodsInRows = updatedGoodsInRows.map((row) =>
            row.id === nextUnprocessedRow.id
              ? { ...row, processed: 'Yes' }
              : row
          );
        }
      }
    });

    setIngredientInventory(updatedInventory);
    setGoodsInRows(updatedGoodsInRows);

    console.log('Barcode update process completed.');
  }, [ingredientInventory, goodsInRows]);

  useEffect(() => {
    if (stockUsage.length > 0) {
      const timeoutId = setTimeout(() => {
        updateBarcodesAfterProcessing();
      }, 2000);
  
      return () => clearTimeout(timeoutId); // Cleanup timeout on component unmount
    }
  }, [stockUsage,updateBarcodesAfterProcessing]);
  
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
      updateBarcodesAfterProcessing,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);