import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface ShareTaskOptions {
  title: string;
  url: string;
}

/**
 * Share a task using native share dialog or Web Share API
 * @param options - Task title and URL to share
 * @returns Promise that resolves when sharing is complete or cancelled
 */
export const shareTask = async (options: ShareTaskOptions): Promise<void> => {
  try {
    // Check if sharing is supported
    const canShareResult = await Share.canShare();
    
    if (!canShareResult.value) {
      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${options.title}\n${options.url}`);
        alert('Ссылка скопирована в буфер обмена');
      } else {
        throw new Error('Sharing is not supported on this platform');
      }
      return;
    }

    // Share using native dialog
    await Share.share({
      title: options.title,
      text: `Задача: ${options.title}`,
      url: options.url,
      dialogTitle: 'Поделиться задачей',
    });

    console.log('Task shared successfully');
  } catch (error) {
    // User cancelled share or error occurred
    if (error instanceof Error && error.message.includes('Share canceled')) {
      console.log('User cancelled share');
      return;
    }
    
    console.error('Error sharing task:', error);
    throw error;
  }
};

/**
 * Check if native share is available
 * @returns true if running on native platform, false otherwise
 */
export const isNativeShareAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Generate shareable link for a task
 * @param taskId - ID of the task
 * @returns Full URL to the task
 */
export const getTaskShareUrl = (taskId: number): string => {
  const baseUrl = 'https://planer.moldahasank.workers.dev';
  return `${baseUrl}/task/${taskId}`;
};
