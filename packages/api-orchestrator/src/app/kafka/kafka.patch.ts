/**
 * This patch fixes the problem with negative timeouts in kafkajs
 */
export function patchKafkaJsTimeouts() {
  try {
    // Save the original setTimeout function
    const originalSetTimeout = global.setTimeout;
    
    // Override setTimeout to avoid negative timeouts
    global.setTimeout = function patchedSetTimeout(callback: Function, ms?: number, ...args: any[]) {
      // If timeout is negative, set it to 0
      if (ms !== undefined && ms < 0) {
        console.warn(`Fixed negative timeout value: ${ms} -> 0`);
        ms = 0;
      }
      return originalSetTimeout(callback, ms, ...args);
    } as typeof setTimeout;
    
    console.log('KafkaJS timeout patch applied successfully');
  } catch (error) {
    console.error('Failed to apply KafkaJS timeout patch:', error);
  }
} 