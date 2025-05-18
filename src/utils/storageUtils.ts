import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clears all data from AsyncStorage
 * @returns {Promise<void>}
 */
export const clearAllAsyncStorage = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    console.log('AsyncStorage successfully cleared');
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
  }
};

/**
 * Clears only specific keys from AsyncStorage
 * @param {string[]} keysToExclude - Keys to keep (not clear)
 * @returns {Promise<void>}
 */
export const clearSelectiveAsyncStorage = async (keysToExclude: string[] = []): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(key => !keysToExclude.includes(key));
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('AsyncStorage selectively cleared. Removed keys:', keysToRemove);
    } else {
      console.log('No keys to remove from AsyncStorage');
    }
  } catch (error) {
    console.error('Error selectively clearing AsyncStorage:', error);
  }
};

/**
 * A configurable function to clear AsyncStorage based on development mode or other conditions
 * @param {boolean} forceClear - Override to force clearing AsyncStorage
 * @param {string[]} keysToPreserve - Keys to preserve (not clear)
 * @returns {Promise<void>}
 */
export const clearAsyncStorageBeforeFirstAction = async (
  forceClear = false,
  keysToPreserve: string[] = []
): Promise<void> => {
  // Get current environment - you can replace this with your app's environment check
  const isDevelopment = __DEV__;
  
  // Flag to check if this is the first run
  const firstRunKey = 'app_first_run_complete';
  
  try {
    // Check if this is first run
    const isFirstRun = await AsyncStorage.getItem(firstRunKey) === null;
    
    if (forceClear || (isDevelopment && isFirstRun)) {
      if (keysToPreserve.length > 0) {
        // Selectively clear AsyncStorage
        await clearSelectiveAsyncStorage([...keysToPreserve, firstRunKey]);
      } else {
        // Clear all AsyncStorage except the first run flag
        await clearSelectiveAsyncStorage([firstRunKey]);
      }
      
      // Set flag to indicate app has run before
      await AsyncStorage.setItem(firstRunKey, 'true');
      console.log('AsyncStorage cleared before first action');
    } else {
      console.log('AsyncStorage clearing skipped - not first run or not in development mode');
      // If this is the first run but we're not clearing, still set the flag
      if (isFirstRun) {
        await AsyncStorage.setItem(firstRunKey, 'true');
      }
    }
  } catch (error) {
    console.error('Error in clearAsyncStorageBeforeFirstAction:', error);
  }
}; 