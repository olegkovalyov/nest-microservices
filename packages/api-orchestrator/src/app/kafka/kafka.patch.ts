/**
 * Этот патч исправляет проблему с отрицательными таймаутами в kafkajs
 */
export function patchKafkaJsTimeouts() {
  try {
    // Сохраняем оригинальную функцию setTimeout
    const originalSetTimeout = global.setTimeout;
    
    // Переопределяем setTimeout, чтобы избежать отрицательных таймаутов
    global.setTimeout = function patchedSetTimeout(callback: Function, ms?: number, ...args: any[]) {
      // Если таймаут отрицательный, устанавливаем его в 0
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