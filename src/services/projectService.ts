import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Project {
  id?: string;
  name: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
  userId: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

const PROJECTS_COLLECTION = 'projects';

// Создать новый проект
export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  videoFile: File,
  thumbnailBlob?: Blob
): Promise<string> => {
  try {
    console.log('Начало загрузки видео...', videoFile.name);
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const sanitizedFileName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const videoPath = `videos/${projectData.userId}/${timestamp}_${sanitizedFileName}`;
    
    console.log('Путь для загрузки:', videoPath);
    
    // Загрузка видео в Storage
    const videoRef = ref(storage, videoPath);
    const uploadResult = await uploadBytes(videoRef, videoFile);
    
    console.log('Видео загружено успешно:', uploadResult.metadata.fullPath);
    
    // Получаем URL загруженного видео
    const videoUrl = await getDownloadURL(uploadResult.ref);
    console.log('URL видео получен:', videoUrl);

    // Загрузка миниатюры (если есть)
    let thumbnailUrl = '';
    if (thumbnailBlob) {
      console.log('Загрузка миниатюры...');
      const thumbnailPath = `thumbnails/${projectData.userId}/${timestamp}_thumbnail.jpg`;
      const thumbnailRef = ref(storage, thumbnailPath);
      const thumbnailUploadResult = await uploadBytes(thumbnailRef, thumbnailBlob);
      thumbnailUrl = await getDownloadURL(thumbnailUploadResult.ref);
      console.log('Миниатюра загружена:', thumbnailUrl);
    }

    console.log('Сохранение метаданных в Firestore...');
    
    // Сохранение метаданных в Firestore
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      videoUrl,
      thumbnailUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Проект создан с ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Ошибка создания проекта:', error);
    console.error('Код ошибки:', error.code);
    console.error('Сообщение:', error.message);
    
    if (error.code === 'storage/unauthorized') {
      throw new Error('Нет доступа к Storage. Проверьте правила безопасности.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Загрузка отменена.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Неизвестная ошибка Storage. Проверьте, что Storage создан в Firebase Console.');
    }
    
    throw error;
  }
};

// Получить все проекты пользователя
export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('userId', '==', userId)
      // orderBy убран временно, чтобы не требовался индекс
      // Сортировка будет на клиенте
    );

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });

    // Сортируем на клиенте по дате создания (новые первыми)
    return projects.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).toMillis();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).toMillis();
      return bTime - aTime;
    });
  } catch (error: any) {
    console.error('Ошибка получения проектов:', error);
    if (error.code === 'permission-denied') {
      console.error('Доступ запрещен. Проверьте правила безопасности Firestore.');
    } else if (error.code === 'failed-precondition') {
      console.error('Firestore еще не инициализирован. Создайте базу данных в Firebase Console.');
    }
    // Возвращаем пустой массив вместо выброса ошибки
    return [];
  }
};

// Получить все проекты (для админа или общего списка)
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION)
      // orderBy убран, сортировка на клиенте
    );

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });

    // Сортируем на клиенте
    return projects.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).toMillis();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).toMillis();
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Ошибка получения проектов:', error);
    throw error;
  }
};

// Обновить проект
export const updateProject = async (
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Ошибка обновления проекта:', error);
    throw error;
  }
};

// Удалить проект
export const deleteProject = async (projectId: string, videoUrl: string, thumbnailUrl?: string): Promise<void> => {
  try {
    // Удаление файлов из Storage
    if (videoUrl) {
      const videoRef = ref(storage, videoUrl);
      await deleteObject(videoRef).catch(err => console.warn('Видео не найдено:', err));
    }

    if (thumbnailUrl) {
      const thumbnailRef = ref(storage, thumbnailUrl);
      await deleteObject(thumbnailRef).catch(err => console.warn('Миниатюра не найдена:', err));
    }

    // Удаление документа из Firestore
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    throw error;
  }
};

// Генерация миниатюры из видео
export const generateThumbnail = (videoElement: HTMLVideoElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 225;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Не удалось получить контекст canvas'));
        return;
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Не удалось создать миниатюру'));
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      reject(error);
    }
  });
};

// Конвертация base64 в Blob
export const base64ToBlob = (base64: string): Blob => {
  const base64Data = base64.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/jpeg' });
};

// Загрузить изображение в Storage и получить URL
export const uploadImageToStorage = async (
  imageBase64: string,
  userId: string,
  imageName: string
): Promise<string> => {
  try {
    console.log(`📤 Загрузка изображения ${imageName} в Storage...`);
    
    // Конвертируем base64 в blob
    const blob = base64ToBlob(imageBase64);
    
    // Создаем путь в Storage
    const timestamp = Date.now();
    const imagePath = `frames/${userId}/${timestamp}_${imageName}.jpg`;
    
    // Загружаем в Storage
    const imageRef = ref(storage, imagePath);
    const uploadResult = await uploadBytes(imageRef, blob);
    
    // Получаем URL
    const imageUrl = await getDownloadURL(uploadResult.ref);
    console.log(`✅ Изображение загружено: ${imageUrl}`);
    
    return imageUrl;
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    throw error;
  }
};

// Генерация миниатюры из кадра раскадровки (base64)
export const generateThumbnailFromFrame = (frameBase64: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 225;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Не удалось получить контекст canvas'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Не удалось создать миниатюру из кадра'));
            }
          }, 'image/jpeg', 0.8);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Не удалось загрузить изображение кадра'));
      };
      
      img.src = frameBase64;
    } catch (error) {
      reject(error);
    }
  });
};

