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
          // Ensure the processed field is initialized if not present
          if (row.processed === undefined) {
            row.processed = "No"; // Initialize "processed" if it is not set
          }
  
          // Only update rows where stockRemaining is 0 and the processed status is not already "Yes"
          if (row.stockRemaining === 0 && row.processed !== "Yes") {
            return {
              ...row,
              processed: "Yes", // Mark as processed if stockRemaining is 0 and not already marked
            };
          }
          
          // If stockRemaining > 0, set processed to "No" unless already "No"
          if (row.stockRemaining > 0 && row.processed !== "No") {
            return {
              ...row,
              processed: "No", // Mark as unprocessed if stockRemaining > 0
            };
          }
  
          return row; // Return the row unchanged if no condition is met
        })
      );
    };
  
    // Trigger status checks periodically or based on flag
    if (shouldCheckProcessed) {
      checkAndUpdateProcessedStatus();
      setShouldCheckProcessed(false); // Reset the trigger after processing
    }
  }, [goodsInRows, shouldCheckProcessed]);
  
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
    }, 20000);
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
      handleRowUpdate,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);