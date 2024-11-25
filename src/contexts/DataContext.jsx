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
    console.log("Updated IngredientInventory:", ingredientInventory);
  }, [ingredientInventory]); // Track changes in IngredientInventory state

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
      setGoodsInRows((prevRows) =>
        prevRows.map((row) => {
          // Only update rows where stockRemaining is 0
          if (row.stockRemaining === 0) {
            const newProcessedStatus = "Yes"; // Mark as processed if stockRemaining is 0
            // Only update if the processed status is not already "Yes"
            if (row.processed !== newProcessedStatus) {
              return {
                ...row,
                processed: newProcessedStatus,
              };
            }
          } else {
            // Leave rows with stockRemaining > 0 unchanged
            return row;
          }
          return row; // For rows where no change is needed, return them as is
        })
      );
    };
  
    // Trigger status checks periodically or based on flag
    if (shouldCheckProcessed) {
      checkAndUpdateProcessedStatus();
      setShouldCheckProcessed(false); // Reset the trigger after processing
    }
  }, [goodsInRows, shouldCheckProcessed]);

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
    setShouldUpdateBarcodes(true);
  };

  const addStockUsageRow = (row) => {
    console.log("addStockUsageRow called with:", row);
  
    // Reset the barcode tracking arrays at the start
    let barcodesBeforeRemoval = {};
    let barcodesAfterRemoval = {}; // Initialize barcodesAfterRemoval here
    console.log("Reset barcode tracking arrays:", { barcodesBeforeRemoval, barcodesAfterRemoval });
  
    // Populate barcodesBeforeRemoval with the current state of the ingredient inventory
    ingredientInventory.forEach((item) => {
      const normalizedIngredient = item.ingredient.trim().toLowerCase(); // Normalize ingredient names
      barcodesBeforeRemoval[normalizedIngredient] = item.barcode || "No barcode assigned";
    });
    console.log("Barcodes before stock removal populated:", barcodesBeforeRemoval);
  
    // Create copies of ingredientInventory and goodsInRows for updating
    let updatedInventory = [...ingredientInventory];
    let updatedGoodsInRows = [...goodsInRows];
  
    // Process each ingredient used in the row
    row.ingredients.forEach((ingredientUsed) => {
      let quantityToSubtract = ingredientUsed.quantity;
      console.log(`Processing ingredient: ${ingredientUsed.ingredient}, Quantity to subtract: ${quantityToSubtract}`);
  
      // Loop through goodsInRows to update stockRemaining
      for (let i = 0; i < updatedGoodsInRows.length && quantityToSubtract > 0; i++) {
        let goodRow = updatedGoodsInRows[i];
        if (goodRow.ingredient === ingredientUsed.ingredient) {
          const stockRemaining = goodRow.stockRemaining;
  
          if (stockRemaining >= quantityToSubtract) {
            updatedGoodsInRows[i] = {
              ...goodRow,
              stockRemaining: stockRemaining - quantityToSubtract,
            };
            console.log(`Stock remaining after deduction: ${updatedGoodsInRows[i].stockRemaining}`);
            quantityToSubtract = 0;
          } else {
            updatedGoodsInRows[i] = {
              ...goodRow,
              stockRemaining: 0,
            };
            quantityToSubtract -= stockRemaining;
            console.log(`Stock fully deducted. Remaining quantity to subtract: ${quantityToSubtract}`);
          }
        }
      }
  
      // Update ingredientInventory after stock removal
      updatedInventory = updatedInventory.map((item) => {
        if (item.ingredient === ingredientUsed.ingredient) {
          const updatedAmount = Math.max(0, item.amount - ingredientUsed.quantity);
          const previousBarcode = barcodesBeforeRemoval[item.ingredient.trim().toLowerCase()]; // Normalize
  
          console.log(
            `Inventory for ingredient: ${item.ingredient} updated. Previous amount: ${item.amount}, New amount: ${updatedAmount}`
          );
          console.log(`Ingredient: ${item.ingredient}, Previous Barcode: ${previousBarcode}`);
  
          // Update inventory with the new amount and ensure barcode is properly handled
          return { ...item, amount: updatedAmount };
        }
        return item;
      });
    });
  
    // Save updated rows to state immediately after processing
    setGoodsInRows(updatedGoodsInRows);
    setIngredientInventory(updatedInventory);
    console.log("GoodsInRows updated and saved:", updatedGoodsInRows);
    setShouldCheckProcessed(true);
  
    // Capture barcodes before timeout for final comparison after delay
    const previousBarcodes = { ...barcodesBeforeRemoval };
  
    // Set timeout to update ingredientInventory after 20 seconds
    setTimeout(() => {
      setIngredientInventory((latestInventory) => {
        // Reset barcodesAfterRemoval again inside the timeout to ensure it's cleared for each run
        let barcodesAfterRemoval = {};
  
        latestInventory.forEach((item) => {
          const normalizedIngredient = item.ingredient.trim().toLowerCase(); // Normalize
          const newBarcode = item.barcode || "No barcode assigned";
          const prevBarcode = previousBarcodes[normalizedIngredient] || "No barcode assigned";
          barcodesAfterRemoval[normalizedIngredient] = newBarcode;
  
          if (prevBarcode !== newBarcode) {
            console.log(
              `Ingredient: ${item.ingredient}, Previous Barcode: ${prevBarcode}, New Barcode: ${newBarcode}`
            );
          } else {
            console.log(`Ingredient: ${item.ingredient}, Barcode unchanged: ${newBarcode}`);
          }
        });
  
        console.log("Barcodes after stock removal (with delay):", barcodesAfterRemoval);
  
        // Add the row to stock usage with barcodes for tracking
        const stockUsageRow = {
          ...row,
          ingredients: row.ingredients.map((ingredientUsed) => {
            const normalizedIngredient = ingredientUsed.ingredient.trim().toLowerCase();
            const prevBarcode = previousBarcodes[normalizedIngredient] || "No previous barcode";
            const currentBarcode = barcodesAfterRemoval[normalizedIngredient] || "No current barcode";
  
            console.log(
              `Stock Usage - Ingredient: ${ingredientUsed.ingredient}, Prev Barcode: ${prevBarcode}, Current Barcode: ${currentBarcode}`
            );
  
            return {
              ...ingredientUsed,
              prevBarcode,
              currentBarcode,
            };
          }),
        };
  
        // Check if the row already exists in stockUsage to prevent duplicates
        setStockUsage((prevStockUsage) => {
          const isDuplicate = prevStockUsage.some(
            (usageRow) =>
              usageRow.recipeName === stockUsageRow.recipeName &&
              usageRow.date === stockUsageRow.date &&
              usageRow.batchCode === stockUsageRow.batchCode &&
              usageRow.ingredients.every((ingredient, index) => {
                const currentIngredient = stockUsageRow.ingredients[index];
                return (
                  ingredient.ingredient === currentIngredient.ingredient &&
                  ingredient.prevBarcode === currentIngredient.prevBarcode &&
                  ingredient.currentBarcode === currentIngredient.currentBarcode &&
                  ingredient.quantity === currentIngredient.quantity
                );
              })
          );
  
          if (!isDuplicate) {
            console.log("Row added to stock usage after delay:", stockUsageRow);
            return [...prevStockUsage, stockUsageRow];
          } else {
            console.warn("Duplicate row detected; not adding to stock usage.");
            return prevStockUsage;
          }
        });
  
        return latestInventory; // No further modification
      });
    }, 20000); // 20-second delay
  };  
  
  const updateBarcodesAfterProcessing = useCallback(() => {
    console.log('Starting barcode update process...');
    
    // Create a copy of the ingredient inventory and goods in rows to ensure immutability
    let updatedInventory = [...ingredientInventory];   
    let updatedGoodsInRows = [...goodsInRows];         
    
    let hasChanges = false;  
    
    // Log initial state of ingredient inventory to check for existing barcodes
    console.log('Initial Ingredient Inventory:', updatedInventory);
    
    updatedInventory.forEach((inventoryItem) => {     
      console.log(`Checking inventory item: ${inventoryItem.ingredient}`);
      
      // Ensure that each inventory item has a barcode (even if it is undefined or null initially)
      if (!inventoryItem.barcode) {
        console.log(`No barcode found for ingredient ${inventoryItem.ingredient}. It will be updated.`);
      } else {
        console.log(`Barcode for ingredient ${inventoryItem.ingredient}: ${inventoryItem.barcode}`);
      }
      
      // Filter rows in goodsInRows that match the current inventory item
      const matchingGoodsInRows = updatedGoodsInRows.filter(
        (row) => row.ingredient === inventoryItem.ingredient
      );
      
      console.log(`Matching goods in rows for ${inventoryItem.ingredient}:`, matchingGoodsInRows);
    
      // Find a matching row that is processed and has 0 stock remaining
      const currentRow = matchingGoodsInRows.find(
        (row) => row.processed === 'Yes' && row.stockRemaining === 0
      );
    
      console.log(`Current row (processed = 'Yes' and stockRemaining = 0) for ${inventoryItem.ingredient}:`, currentRow);
    
      if (currentRow) {   
        console.log(`Found processed row for ${inventoryItem.ingredient}, barcode: ${currentRow.barCode}`);
    
        // Log each row to check the 'processed' value
        matchingGoodsInRows.forEach(row => {
          const processedStatus = row.processed || 'No'; // Default to 'No' if processed is undefined
          console.log(`Row barcode: ${row.barCode}, processed: ${processedStatus}`);
        });
    
        // Find the next unprocessed row with the same ingredient, handling undefined processed values
        const nextRow = matchingGoodsInRows.find((row) => (row.processed || 'No') === 'No');
        console.log(`Next unprocessed row for ${inventoryItem.ingredient}:`, nextRow);
    
        if (nextRow) {   
          console.log(`Updating barcode for ${inventoryItem.ingredient} to ${nextRow.barCode}`);
          
          // Update the barcode in the ingredient inventory to the barcode of the next unprocessed row
          updatedInventory = updatedInventory.map((item) =>
            item.ingredient === inventoryItem.ingredient
              ? { ...item, barcode: nextRow.barCode }  
              : item
          );
    
          console.log(`Updated inventory after barcode change:`, updatedInventory);
          hasChanges = true;   
        } else {
          console.log(`No unprocessed row found for ${inventoryItem.ingredient}`);
        }
      } else {
        console.log(`No processed row found for ${inventoryItem.ingredient}`);
      }
    });
    
    // If any changes were made, update the state with the modified inventory
    if (hasChanges) {
      console.log("Updated Inventory before state change:", updatedInventory);
      setIngredientInventory(updatedInventory);  
      setShouldUpdateBarcodes(false);             
    } else {
      console.log("No changes made to inventory.");
    }
    
    console.log('Barcode update process completed.');
  }, [ingredientInventory, goodsInRows]);
  
  useEffect(() => {
    console.log('useEffect for shouldUpdateBarcodes triggered');
    if (shouldUpdateBarcodes) {
      const timeoutId = setTimeout(() => {
        console.log('Calling updateBarcodesAfterProcessing with timeout');
        updateBarcodesAfterProcessing();
      }, 2000);
  
      return () => {
        console.log('Clearing timeout for barcode update');
        clearTimeout(timeoutId);
      };
    }
  }, [shouldUpdateBarcodes, updateBarcodesAfterProcessing]);
  
  useEffect(() => {
    console.log('useEffect for periodic barcode update triggered');
    const interval = setInterval(() => {
      if (shouldUpdateBarcodes) {
        console.log('Calling updateBarcodesAfterProcessing at interval');
        updateBarcodesAfterProcessing();
      }
    }, 5000);
  
    return () => {
      console.log('Clearing interval for barcode update');
      clearInterval(interval);
    };
  }, [shouldUpdateBarcodes, updateBarcodesAfterProcessing]);
  
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
      stockUsage, // Expose stock usage state
      addStockUsageRow, // Expose function to add stock usage
      clearStockUsage,
      getQuantitiesByRecipeName, // Expose the function
      getIngredientsByRecipeName, // Expose the new function
      updateBarcodesAfterProcessing,
      updateNotifications,
      notifications,
      setNotifications,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);