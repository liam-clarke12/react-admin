import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {

  const [notifications, setNotifications] = useState([]);

  const [shouldUpdateBarcodes, setShouldUpdateBarcodes] = useState(false);

  const [rows, setRows] = useState(() => {
    const savedRecipeRows = localStorage.getItem('recipeRows');
    return savedRecipeRows ? JSON.parse(savedRecipeRows) : [];
  });

  const [productionLogs, setProductionLogs] = useState(() => {
    const savedLogs = localStorage.getItem('productionLogs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  const [GoodsOut, setGoodsOut] = useState(() => {
    try {
      const stored = localStorage.getItem("GoodsOut");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to parse localStorage GoodsOut:", error);
      return []; // Default to an empty array on failure
    }
  });  

  const prevExpiryDatesRef = useRef([]); // Define useRef outside the callback function

  const [recipeInventory, setRecipeInventory] = useState(() => {
    const savedInventory = localStorage.getItem('recipeInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const [stockUsage, setStockUsage] = useState(() => {
    const savedStockUsage = localStorage.getItem('stockUsage');
    return savedStockUsage ? JSON.parse(savedStockUsage) : [];
  });

  const [goodsInRows, setGoodsInRows] = useState(() => {
    const savedRows = localStorage.getItem('goodsInRows');
    return savedRows ? JSON.parse(savedRows) : [];
  });
  
  const [ingredientInventory, setIngredientInventory] = useState(() => {
    const savedInventory = localStorage.getItem('ingredientInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });
  
  useEffect(() => {
    console.log("Updated GoodsInRows:", goodsInRows);
  }, [goodsInRows]); // Track changes in GoodsInRows state
  
  useEffect(() => {
    localStorage.setItem("ingredientInventory", JSON.stringify(ingredientInventory));
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

  useEffect(() => {    
    const checkNotifications = () => {
      let hasNewNotifications = false;
  
      // Get the current expiry dates
      const currentExpiryDates = goodsInRows.map(row => row.expiryDate);
  
      // Compare previous and current expiry dates
      const isExpiryChanged = !currentExpiryDates.every((date, index) => date === prevExpiryDatesRef.current[index]);
  
      if (isExpiryChanged) {
        // If expiry dates have changed, check for expired rows
        const expiredRows = goodsInRows.filter(row => new Date(row.expiryDate) < new Date());
        console.log('Expired rows:', expiredRows);  // Log expired rows to check if they are correctly identified
  
        if (expiredRows.length > 0) {
          // Create a set of new notifications from expired rows
          const newNotifications = expiredRows.map(row => `Your ${row.ingredient} (${row.barCode}) has expired!`);
  
          // Only add new notifications if they are unique
          setNotifications(prevNotifications => {
            const uniqueNotifications = newNotifications.filter(notification => 
              !prevNotifications.includes(notification)
            );
  
            if (uniqueNotifications.length > 0) {
              hasNewNotifications = true;  // Mark that there are new notifications
              // Return previous notifications plus new unique ones
              return [...prevNotifications, ...uniqueNotifications];
            }
  
            return prevNotifications;  // Return existing notifications if no new ones
          });
        }
      }
  
      // Optionally, log the result
      if (hasNewNotifications) {
        console.log('New notifications added.');
      }
  
      // Update the ref with the current expiry dates
      prevExpiryDatesRef.current = currentExpiryDates;
    };
  
    // Set the interval to check notifications every 5 seconds
    const interval = setInterval(checkNotifications, 5000);
  
    return () => clearInterval(interval);  // Clean up interval on unmount
  }, [goodsInRows]);  // Depend on goodsInRows to track when rows change  
  
  const updateNotifications = (newNotifications) => {
    setNotifications(newNotifications);
  };

  const [shouldCheckProcessed, setShouldCheckProcessed] = useState(false);
  useEffect(() => {
    const checkAndUpdateProcessedStatus = () => {
      const updatedRows = goodsInRows.map((row) => {
        if (row.stockRemaining === 0 && row.processed !== "Yes") {
          return { ...row, processed: "Yes" }; // Mark as "Yes" if stock is zero
        }
        if (row.stockRemaining > 0 && row.processed !== "No") {
          return { ...row, processed: "No" }; // Mark as "No" if stock is > 0
        }
        return row; // No changes
      });
  
      setGoodsInRows(updatedRows); // Update state
      localStorage.setItem("goodsInRows", JSON.stringify(updatedRows)); // Persist changes
    };
  
    if (shouldCheckProcessed) {
      checkAndUpdateProcessedStatus();
      setShouldCheckProcessed(false); // Reset flag
    }
  }, [shouldCheckProcessed, goodsInRows]);
  
  // Trigger the check on row updates (e.g., when goodsInRows change or after user edits)
  const handleRowUpdate = () => {
    setShouldCheckProcessed(true); // Set the flag to trigger the useEffect
  };  
  
  const addGoodsInRow = (row) => {
    if (!row.ingredient || !row.stockReceived) {
      console.warn("Invalid row data:", row);
      return;
    }
  
    // Ensure the row has a unique ID (e.g., combining barcode and timestamp)
    const newRow = {
      ...row,
      id: `${row.barCode}-${Date.now()}`, // Ensure uniqueness with barcode and timestamp
      stockRemaining: row.stockReceived,
      expiryDate: row.expiryDate, // Ensure expiryDate is converted to a Date object
    };
  
    console.log("Formatted Row:", newRow); // Log the formatted row
  
    // Update goods in rows state
    setGoodsInRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      console.log("Updated Goods In Rows:", updatedRows); // Log the updated state
  
      // Persist the updated rows to localStorage
      localStorage.setItem('goodsInRows', JSON.stringify(updatedRows));
      setShouldCheckProcessed(true);
  
      return updatedRows;
    });
  
    // Update ingredient inventory using function-based state update
    setIngredientInventory((prevInventory) => {
      // Check if the ingredient exists in the inventory
      const existingIngredient = prevInventory.find(item => item.ingredient === row.ingredient);
      
      if (existingIngredient) {
        // If the ingredient exists, update the amount
        return prevInventory.map(item =>
          item.ingredient === row.ingredient
            ? { ...item, amount: item.amount + row.stockReceived }
            : item
        );
      } else {
        // If the ingredient doesn't exist, add it to the inventory
        console.log("Adding new ingredient to inventory");
        return [
          ...prevInventory,
          { ingredient: row.ingredient, amount: row.stockReceived, barcode: row.barCode }
        ];
      }
    });
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
  
    const newLog = { id: `${log.recipe}-${Date.now()}`, batchremaining: log.batchesProduced, ...log };
    setProductionLogs((prevLogs) => {
      const updatedLogs = [...prevLogs, newLog];
      localStorage.setItem("productionLog", JSON.stringify(updatedLogs)); // Save production logs
      return updatedLogs;
    });
  
    // Update recipeInventory
    const updatedInventory = recipeInventory.map((item) =>
      item.recipe === log.recipe
        ? {
            ...item,
            quantity: item.quantity + log.batchesProduced,
            date: log.date,
            batchCode: item.batchCode || log.batchCode, // Only set batchCode if it doesn't exist
          }
        : item
    );
  
    // Check if recipe exists in the inventory
    const recipeExists = recipeInventory.some((item) => item.recipe === log.recipe);
  
    if (!recipeExists) {
      updatedInventory.push({
        recipe: log.recipe,
        quantity: log.batchesProduced,
        date: log.date,
        batchCode: log.batchCode,
      });
    }
  
    setRecipeInventory(updatedInventory);
    localStorage.setItem("recipeInventory", JSON.stringify(updatedInventory)); // Save recipe inventory
  
    // Update Stock Usage with actual ingredients and quantities from the recipe
    const ingredientsForUsage = getIngredientsByRecipeName(log.recipe); // Get ingredients by recipe name
    const quantitiesForUsage = getQuantitiesByRecipeName(log.recipe); // Get quantities by recipe name
  
    // Create an array of objects with ingredient and corresponding quantity
    const stockUsageData = ingredientsForUsage.map((ingredient, index) => ({
      ingredient,
      quantity: quantitiesForUsage[index] * log.batchesProduced || 0, // Default to 0 if no quantity found
    }));
  
    addStockUsageRow({
      recipeName: log.recipe,
      date: log.date,
      ingredients: stockUsageData, // Use the array of objects
      batchCode: log.batchCode,
    });
  
    setShouldUpdateBarcodes(true);
  };

  const deductFromProductionLogs = (recipe, amountToDeduct) => {
    const updatedLogs = [...productionLogs];
    let remainingAmount = amountToDeduct;
  
    updatedLogs.forEach((batch) => {
      if (batch.recipe === recipe && remainingAmount > 0) {
        if (batch.batchremaining >= remainingAmount) {
          batch.batchremaining -= remainingAmount; // Deduct stock from the batch
          remainingAmount = 0; // All amount deducted
        } else {
          remainingAmount -= batch.batchremaining; // Deduct all of the batch remaining
          batch.batchremaining = 0; // Set batch remaining to 0
        }
      }
    });
  
    return [updatedLogs, remainingAmount];
  };
  
  const addGoodsOutRow = (log) => {
    console.log("=== Adding Goods Out Row ===");
    console.log("Input Log:", log);
  
    // Track batch codes before any updates
    let batchcodesBeforeRemoval = {};
    recipeInventory.forEach((item) => {
      batchcodesBeforeRemoval[item.recipe.trim().toLowerCase()] = item.batchCode || "No batchcode assigned";
    });
  
    // Process deductions from production logs first
    console.log("=== Deducting from Production Logs ===");
    const [updatedLogs, remainingAmount] = deductFromProductionLogs(log.recipe, log.stockAmount);
    console.log("Updated Production Logs after Deduction:", updatedLogs);
    console.log("Remaining Stock to Deduct (if any):", remainingAmount);
  
    // Update production logs to reflect deductions
    setProductionLogs(updatedLogs);
  
    // Update recipe inventory only after deduction
    console.log("=== Updating Recipe Inventory ===");
    setRecipeInventory((prevInventory) => {
      const updatedInventory = prevInventory.map((item) => {
        if (item.recipe === log.recipe) {
          const nextBatch = updatedLogs.find(
            (batch) => batch.recipe === log.recipe && batch.batchremaining > 0
          );
  
          if (nextBatch) {
            console.log(`Changing batch code in Recipe Inventory from ${item.batchCode} to ${nextBatch.batchCode}`);
            return {
              ...item,
              quantity: item.quantity - (log.stockAmount - remainingAmount), // Update quantity
              batchCode: nextBatch.batchCode, // Update batch code
            };
          }
        }
        return item;
      });
  
      console.log("Updated Recipe Inventory:", updatedInventory);
      localStorage.setItem("recipeInventory", JSON.stringify(updatedInventory));
      return updatedInventory;
    });
  
    // After all data updates are done, handle batch code changes
    const previousBatchcodes = { ...batchcodesBeforeRemoval };
  
    // Handle delayed updates for batch codes
    setTimeout(() => {
      setRecipeInventory((updatedInventory) => {
        let batchcodesAfterRemoval = {};
        updatedInventory.forEach((item) => {
          batchcodesAfterRemoval[item.recipe.trim().toLowerCase()] = item.batchCode || "No batchcode assigned";
        });
  
        const batchcodeChanges = Object.keys(previousBatchcodes).map((recipe) => ({
          recipe,
          prevBatchcode: previousBatchcodes[recipe],
          currentBatchcode: batchcodesAfterRemoval[recipe],
        }));
  
        // Add the new Goods Out row
        const newLog = {
          id: `${log.recipe}-${Date.now()}`,
          amount: log.stockAmount,
          recipients: Array.isArray(log.recipient) ? log.recipient : [log.recipient], // Ensure recipients is always an array
          ...log,
          batchcodeChanges,
        };
        console.log("Generated Goods Out Log:", newLog);
  
        // Update GoodsOut logs after everything is processed
        setGoodsOut((prevLogs) => {
          const updatedLogs = Array.isArray(prevLogs) ? [...prevLogs, newLog] : [newLog];
          console.log("Updated GoodsOut Logs:", updatedLogs);
          localStorage.setItem("GoodsOut", JSON.stringify(updatedLogs));
          return updatedLogs;
        });
  
        return updatedInventory;
      });
    }, 5000);
  };    

  const addStockUsageRow = (row) => {
    console.log("addStockUsageRow called with:", row);
  
    // Reset barcode tracking arrays
    let barcodesBeforeRemoval = {};
  
    ingredientInventory.forEach((item) => {
      barcodesBeforeRemoval[item.ingredient.trim().toLowerCase()] = item.barcode || "No barcode assigned";
    });
  
    let updatedInventory = [...ingredientInventory];
    let updatedGoodsInRows = [...goodsInRows];
  
    row.ingredients.forEach((ingredientUsed) => {
      let quantityToSubtract = ingredientUsed.quantity;
  
      for (let i = 0; i < updatedGoodsInRows.length && quantityToSubtract > 0; i++) {
        let goodRow = updatedGoodsInRows[i];
        if (goodRow.ingredient === ingredientUsed.ingredient) {
          const stockRemaining = goodRow.stockRemaining;
  
          if (stockRemaining >= quantityToSubtract) {
            updatedGoodsInRows[i] = { ...goodRow, stockRemaining: stockRemaining - quantityToSubtract };
            quantityToSubtract = 0;
          } else {
            updatedGoodsInRows[i] = { ...goodRow, stockRemaining: 0 };
            quantityToSubtract -= stockRemaining;
          }
        }
      }
  
      updatedInventory = updatedInventory.map((item) => {
        if (item.ingredient === ingredientUsed.ingredient) {
          const updatedAmount = Math.max(0, item.amount - ingredientUsed.quantity);
          return { ...item, amount: updatedAmount };
        }
        return item;

      });
    });
    updateBarcodesAfterProcessing();
    setGoodsInRows(updatedGoodsInRows);
    setIngredientInventory(updatedInventory);
  
    // Sync with localStorage
    localStorage.setItem("goodsInRows", JSON.stringify(updatedGoodsInRows));
    localStorage.setItem("ingredientInventory", JSON.stringify(updatedInventory));
  
    setShouldCheckProcessed(true);
  
    const previousBarcodes = { ...barcodesBeforeRemoval };
  
    setTimeout(() => {
      setIngredientInventory((latestInventory) => {
        let barcodesAfterRemoval = {};
        latestInventory.forEach((item) => {
          barcodesAfterRemoval[item.ingredient.trim().toLowerCase()] = item.barcode || "No barcode assigned";
        });
  
        const stockUsageRow = {
          ...row,
          ingredients: row.ingredients.map((ingredientUsed) => {
            const normalizedIngredient = ingredientUsed.ingredient.trim().toLowerCase();
            return {
              ...ingredientUsed,
              prevBarcode: previousBarcodes[normalizedIngredient],
              currentBarcode: barcodesAfterRemoval[normalizedIngredient],
            };
          }),
        };
  
        setStockUsage((prevStockUsage) => {
          const isDuplicate = prevStockUsage.some((usageRow) =>  {
            // Add your actual duplicate check logic here
            return false; // Replace this with the real condition
          });
          return isDuplicate ? prevStockUsage : [...prevStockUsage, stockUsageRow];
        });
  
        return latestInventory;
      });
    }, 5000);
  };  
  
  const updateBarcodesAfterProcessing = useCallback(() => {
    setIngredientInventory((prevIngredientInventory) => {
      const updatedInventory = prevIngredientInventory.map((inventoryItem) => {
        const matchingGoodsInRows = goodsInRows.filter(
          (row) => row.ingredient === inventoryItem.ingredient
        );
  
        const currentRow = matchingGoodsInRows.find(
          (row) => row.processed === "Yes" && row.stockRemaining === 0
        );
  
        if (currentRow) {
          const nextRow = matchingGoodsInRows.find(
            (row) => row.processed === "No" || row.processed === undefined
          );
  
          if (nextRow) {
            console.log("Updating barcode for:", inventoryItem.ingredient);
            console.log("Old Barcode:", inventoryItem.barcode);
            console.log("New Barcode:", nextRow.barCode);
  
            return {
              ...inventoryItem,
              barcode: nextRow.barCode, // Update barcode to next unprocessed row
            };
          }
        }
  
        return inventoryItem; // Return unchanged if no updates are needed
      });
  
      console.log("Final Updated Inventory:", updatedInventory);
  
      return updatedInventory; // Return the new state
    });
  
    setShouldUpdateBarcodes(false);
  }, [goodsInRows]);

  const debouncedUpdateBarcodes = useCallback(() => {
    let timeoutId;
    const debouncedFunction = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateBarcodesAfterProcessing(...args);
      }, 3000);
    };
    return debouncedFunction;
  }, [updateBarcodesAfterProcessing]);  
  
  useEffect(() => {
    if (shouldUpdateBarcodes) {
      const timeoutId = setTimeout(() => {
        updateBarcodesAfterProcessing();
        setShouldUpdateBarcodes(false); // Ensure this is reset to prevent loops
      }, 3000);
  
      return () => clearTimeout(timeoutId); // Cleanup to prevent overlapping timeouts
    }
  }, [updateBarcodesAfterProcessing,shouldUpdateBarcodes]); // Minimal dependencies to prevent over-triggering 
  
  useEffect(() => {
    if (shouldUpdateBarcodes) {
      debouncedUpdateBarcodes(); // Make sure this is defined correctly
    }
  }, [shouldUpdateBarcodes, debouncedUpdateBarcodes]); // Include debouncedUpdateBarcodes  

  const previousGoodsInRows = useRef(goodsInRows);

  useEffect(() => {
    const hasRelevantChanges = goodsInRows.some(
      (row, idx) =>
        row.barCode !== previousGoodsInRows.current[idx]?.barCode
    );
  
    if (hasRelevantChanges) {
      setShouldUpdateBarcodes(true);
    }
  
    previousGoodsInRows.current = goodsInRows;
  }, [goodsInRows]);
  
  // Function to clear stock usage
  const clearStockUsage = () => {
    setStockUsage([]);
    localStorage.removeItem('stockUsage');
    localStorage.clear('stockUsage');
  };

  // Function to clear production logs
  const clearProductionLogs = () => {
    setProductionLogs([]);
    localStorage.removeItem('productionLogs');
    localStorage.clear('productionLogs');
  };
 
  // Function to clear production logs
  const clearGoodsOut = () => {
    setGoodsOut([]);
    localStorage.removeItem('GoodsOut');
    localStorage.clear('GoodsOut');
  };

  // Function to clear recipe inventory
  const clearRecipeInventory = () => {
    setRecipeInventory([]);
    localStorage.removeItem('recipeInventory');
    localStorage.clear('recipeInventory');
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
      GoodsOut,
      setGoodsOut,
      clearGoodsOut,
      addGoodsOutRow,
      stockUsage, // Expose stock usage state
      addStockUsageRow, // Expose function to add stock usage
      clearStockUsage,
      getQuantitiesByRecipeName, // Expose the function
      getIngredientsByRecipeName, // Expose the new function
      updateBarcodesAfterProcessing,
      updateNotifications,
      notifications,
      setNotifications,
      handleRowUpdate,
      debouncedUpdateBarcodes,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);