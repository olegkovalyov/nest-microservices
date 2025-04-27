import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  warn(message: any, context?: string) {
    // --- Отладка --- 
    console.log('--- CustomLogger received warning ---');
    console.log('Type:', typeof message);
    console.log('Content:', JSON.stringify(message, null, 2)); // Попробуем вывести как JSON
    console.log('Name property:', message?.name);
    console.log('Message property:', message?.message);
    console.log('--- End CustomLogger debug ---');
    // --- Конец отладки ---
    
    let messageString = '';
    if (typeof message === 'string') {
      messageString = message;
    } else if (message?.message && typeof message.message === 'string') {
      // Обработка случая, когда предупреждение - объект со свойством message
      messageString = message.message;
    } else if (typeof message === 'object' && message?.name === 'TimeoutNegativeWarning'){
      // Обработка случая, когда предупреждение - объект со свойством name
      // Подавляем это предупреждение
      console.log('--- CustomLogger suppressed TimeoutNegativeWarning ---'); // Добавим лог подавления
      return;
    } else if (message?.toString) {
      messageString = message.toString();
    }

    // Проверяем, содержит ли строка текста предупреждение (на всякий случай)
    // И проверяем имя, если это объект
    if (messageString.includes('TimeoutNegativeWarning') || message?.name === 'TimeoutNegativeWarning') {
      // Подавляем это предупреждение
      console.log('--- CustomLogger suppressed TimeoutNegativeWarning ---'); // Добавим лог подавления
      return;
    }

    // Для всех остальных предупреждений вызываем стандартный метод
    super.warn(message, context);
  }

  // Можно переопределить log, error, debug, verbose, если нужно
}
