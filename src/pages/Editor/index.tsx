import { useState, useRef, useEffect } from "react";
import { Button } from "../../components/button";
import { useAuth } from "../../context/AuthContext";
import { createProject, generateThumbnail, uploadImageToStorage } from "../../services/projectService";
import { useNavigate } from "react-router-dom";
import Input from "../../components/input";

export default function VideoEditor() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [storyboardFrames, setStoryboardFrames] = useState<string[]>([]);
    const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [selectedFrames, setSelectedFrames] = useState<number[]>([]); // Индексы выбранных кадров
    const [aiFrameRanges, setAiFrameRanges] = useState<Array<{start: number, end: number, count: number}>>([]); // Диапазоны AI кадров
    const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(-1); // Текущий кадр для отображения в плеере
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const storyboardRef = useRef<HTMLDivElement>(null);

    // Автоматическая генерация раскадровки когда загружено видео и известна длительность
    useEffect(() => {
        if (videoFile && duration > 0 && storyboardFrames.length === 0 && !isGeneratingStoryboard) {
            console.log('Автогенерация раскадровки: videoFile готов, duration =', duration);
            generateStoryboard();
        }
    }, [videoFile, duration]);

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            // Сбрасываем состояние при загрузке нового видео
            setStoryboardFrames([]);
            setSelectedFrames([]);
            setAiFrameRanges([]);
            setCurrentFrameIndex(-1);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            // Сбрасываем состояние при загрузке нового видео
            setStoryboardFrames([]);
            setSelectedFrames([]);
            setAiFrameRanges([]);
            setCurrentFrameIndex(-1);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (storyboardFrames.length > 0 && storyboardRef.current) {
                const currentFrameIndex = Math.floor((videoRef.current.currentTime / duration) * storyboardFrames.length);
                const frameElement = storyboardRef.current.children[0]?.children[currentFrameIndex] as HTMLElement;
                if (frameElement) {
                    frameElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest', 
                        inline: 'center' 
                    });
                }
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            // Раскадровка будет сгенерирована автоматически через useEffect
        }
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };


    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const generateStoryboard = async () => {
        console.log('🎬 generateStoryboard вызван. videoFile:', videoFile ? videoFile.name : 'null', 'duration:', duration);
        
        if (!videoFile) {
            console.error('❌ Нет видео файла для генерации раскадровки');
            return;
        }
        
        if (duration === 0) {
            console.error('❌ Длительность видео еще не определена');
            return;
        }

        setIsGeneratingStoryboard(true);
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://cors-anywhere.herokuapp.com/https://ffmpeg-production-2a8b.up.railway.app';
            console.log(`📤 Отправка видео на API: ${apiUrl}/api/storyboard/extract-frames`);
            console.log(`📦 Размер файла: ${(videoFile.size / 1024 / 1024).toFixed(2)} MB`);
                        
            const formData = new FormData();
            formData.append('video', videoFile);
            
            // Отправляем запрос на API с параметрами высокого качества
            // Добавляем query параметры для высокого разрешения кадров
            const response = await fetch(`${apiUrl}/api/storyboard/extract-frames?quality=high&width=1920&height=1080`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📥 Ответ от API получен:', Object.keys(data));
            
            // API может вернуть frames в разных форматах, поддерживаем оба
            let frames: string[] = [];
            
            if (data.frames && Array.isArray(data.frames)) {
                frames = data.frames;
            } else if (Array.isArray(data)) {
                frames = data;
            } else {
                throw new Error('Неверный формат ответа от API. Ожидается массив frames.');
        }

        setStoryboardFrames(frames);
            console.log(`✅ Получено ${frames.length} кадров раскадровки от API`);
            
        } catch (error: any) {
            console.error('❌ Ошибка генерации раскадровки:', error);
            
            let errorMessage = 'Ошибка при генерации раскадровки.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = `API недоступен. Убедитесь, что сервер запущен на ${import.meta.env.VITE_API_URL || 'https://cors-anywhere.herokuapp.com/https://ffmpeg-production-2a8b.up.railway.app'}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
        setIsGeneratingStoryboard(false);
        }
    };

    const handleStoryboardClick = (frameIndex: number, event?: React.MouseEvent) => {
        // Проверяем клик с Shift для выбора кадров
        if (event?.shiftKey) {
            handleFrameSelection(frameIndex);
        } else {
            // Обычный клик - показываем выбранный кадр в плеере
            setCurrentFrameIndex(frameIndex);
            console.log(`🎯 Показываем кадр #${frameIndex + 1} в плеере`);
        }
    };

    const handleFrameSelection = (frameIndex: number) => {
        setSelectedFrames(prev => {
            // Если кадр уже выбран - убираем
            if (prev.includes(frameIndex)) {
                return prev.filter(idx => idx !== frameIndex);
            }
            
            // Если выбрано меньше 2 кадров - добавляем
            if (prev.length < 2) {
                return [...prev, frameIndex].sort((a, b) => a - b);
            }
            
            // Если уже выбрано 2 - заменяем последний
            return [prev[0], frameIndex].sort((a, b) => a - b);
        });
    };

    const handleSaveProject = async () => {
        if (!user || !projectName.trim()) {
            alert('Пожалуйста, введите название проекта');
            return;
        }

        if (storyboardFrames.length === 0) {
            alert('Раскадровка пуста. Загрузите видео.');
            return;
        }

        setIsSaving(true);
        try {
            console.log('💾 Сохранение проекта:', projectName);
            console.log('🎬 Генерация финального видео из раскадровки...');
            console.log(`📊 Всего кадров в раскадровке: ${storyboardFrames.length} (оригинал + AI вставки между выбранными кадрами)`);
            
            // Шаг 1: Генерируем финальное видео из ВСЕЙ раскадровки (оригинал + AI кадры между выбранными)
            const apiUrl = import.meta.env.VITE_API_URL || 'https://cors-anywhere.herokuapp.com/https://ffmpeg-production-2a8b.up.railway.app';
            
            const requestData = {
                frames: storyboardFrames,  // ВСЕ кадры (оригинал + AI вставки)
                fps: 30,
                quality: 'high',
                bitrate: '5000k',
                preset: 'slow',
                crf: 18
            };

            console.log(`📤 Генерация финального видео из ${storyboardFrames.length} кадров...`);
            
            const response = await fetch(`${apiUrl}/api/storyboard/frames-to-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            // Получаем видео как blob
            let videoBlob: Blob;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('📥 Ответ от API:', data);
                
                if (data.videoUrl) {
                    console.log('🎬 Загружаем видео по URL:', data.videoUrl);
                    
                    // Проверяем, нужно ли добавить базовый URL
                    let videoUrl = data.videoUrl;
                    if (videoUrl.startsWith('/')) {
                        videoUrl = `${apiUrl}${videoUrl}`;
                    }
                    
                    console.log('🔗 Полный URL видео:', videoUrl);
                    
                    const videoResponse = await fetch(videoUrl);
                    if (!videoResponse.ok) {
                        throw new Error(`Не удалось загрузить видео: ${videoResponse.status} ${videoResponse.statusText}`);
                    }
                    
                    videoBlob = await videoResponse.blob();
                    console.log('✅ Видео загружено как blob:', videoBlob.size, 'bytes');
                } else {
                    throw new Error('API не вернул URL видео');
                }
            } else {
                videoBlob = await response.blob();
            }

            console.log(`✅ Финальное видео сгенерировано: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

            // Шаг 2: Конвертируем blob в File
            const finalVideoFile = new File(
                [videoBlob], 
                `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`,
                { type: 'video/mp4' }
            );

            // Шаг 3: Генерация миниатюры
            let thumbnailBlob: Blob | undefined;
            if (videoRef.current) {
                console.log('🖼️ Генерация миниатюры...');
                thumbnailBlob = await generateThumbnail(videoRef.current);
            }

            // Шаг 4: Форматирование длительности
            const durationFormatted = formatTime(duration);

            // Шаг 5: Загрузка в Firebase Storage и сохранение проекта
            console.log('☁️ Загрузка финального видео в Firebase...');
            await createProject(
                {
                    name: projectName,
                    duration: durationFormatted,
                    videoUrl: '', // будет заполнено в сервисе
                    userId: user.uid
                },
                finalVideoFile,  // Сохраняем ФИНАЛЬНОЕ видео с AI кадрами
                thumbnailBlob
            );

            console.log('✅ Проект с финальным видео сохранен в Firebase!');
            alert('✅ Проект успешно сохранен!');
            setShowSaveModal(false);
            setProjectName("");
            navigate('/projects');
        } catch (error: any) {
            console.error('❌ Ошибка сохранения проекта:', error);
            
            let errorMessage = 'Ошибка при сохранении проекта.';
            
            if (error.message.includes('API error')) {
                errorMessage = 'Не удалось сгенерировать финальное видео. Проверьте API сервер.';
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.code === 'storage/unauthorized') {
                errorMessage = 'Нет доступа к Storage. Проверьте правила Firebase.';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'Доступ запрещен. Проверьте правила безопасности.';
            }
            
            alert(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (storyboardFrames.length === 0) {
            alert('Раскадровка пуста. Сначала загрузите видео для генерации раскадровки.');
            return;
        }

        if (!text.trim()) {
            alert('Пожалуйста, введите промпт для генерации.');
            return;
        }

        if (selectedFrames.length !== 2) {
            alert('Выберите 2 кадра из раскадровки.\nУдерживайте Shift и кликайте на кадры для выбора.');
            return;
        }

        setIsGeneratingVideo(true);

        try {
            if (!user) {
                throw new Error('Пользователь не авторизован');
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'https://cors-anywhere.herokuapp.com/https://ffmpeg-production-2a8b.up.railway.app';
            console.log('🎬 Генерация AI видео...');
            console.log(`💬 Промпт: ${text}`);
            
            // Берем выбранные кадры (base64)
            const firstFrameBase64 = storyboardFrames[selectedFrames[0]];
            const lastFrameBase64 = storyboardFrames[selectedFrames[1]];
            
            console.log(`🖼️ Выбранные кадры: #${selectedFrames[0]} и #${selectedFrames[1]} из ${storyboardFrames.length}`);

            // Шаг 1: Загружаем кадры в Firebase Storage
            console.log('☁️ Загрузка кадров в Firebase Storage...');
            const firstImageUrl = await uploadImageToStorage(firstFrameBase64, user.uid, 'first_frame');
            const lastImageUrl = await uploadImageToStorage(lastFrameBase64, user.uid, 'last_frame');
            
            console.log('✅ Кадры загружены в Firebase Storage');

            // Шаг 2: Подготовка данных для отправки - формат API generate-ai-video
            const requestData = {
                firstImage: firstImageUrl,   // URL из Firebase Storage
                lastImage: lastImageUrl,     // URL из Firebase Storage
                prompt: text.trim(),
                duration: 6,        // Длительность генерируемого видео в секундах
                fps: 24,            // FPS для извлечения кадров
                width: 1280         // Ширина кадров
            };

            // Логируем размер данных
            const dataSize = JSON.stringify(requestData).length;
            console.log(`📦 Размер данных: ${(dataSize / 1024).toFixed(2)} KB`);
            console.log(`🔗 First Image URL: ${firstImageUrl}`);
            console.log(`🔗 Last Image URL: ${lastImageUrl}`);
            console.log(`⏱️ Длительность: ${requestData.duration} сек`);
            console.log(`🎞️ FPS: ${requestData.fps}`);
            console.log(`📐 Ширина: ${requestData.width}px`);

            // Отправляем запрос на API
            const response = await fetch(`${apiUrl}/api/storyboard/generate-ai-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                let errorText = '';
                let errorData = null;
                
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        errorData = await response.json();
                        errorText = JSON.stringify(errorData);
                    } else {
                        errorText = await response.text();
                    }
                } catch (e) {
                    errorText = 'Не удалось прочитать ответ от сервера';
                }
                
                console.error('❌ Ошибка API:', errorData || errorText);
                
                // Специфичные сообщения для известных ошибок
                if (errorData?.error?.includes('ffmpeg')) {
                    throw new Error(
                        'FFmpeg не смог обработать кадры. ' +
                        'Возможные причины:\n' +
                        '• Неверный формат изображений\n' +
                        '• Недостаточно памяти на сервере\n' +
                        '• FFmpeg не установлен на сервере\n\n' +
                        'Детали: ' + errorData.error
                    );
                }
                
                throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
            }

            // Получаем ответ от API
            const data = await response.json();
            console.log('📥 Ответ от API:', data);
            
            // Проверяем наличие новой раскадровки
            if (!data.frames || !Array.isArray(data.frames)) {
                throw new Error('API не вернул массив кадров (frames)');
            }

            const newFrames = data.frames;
            console.log(`📥 Получено ${newFrames.length} новых кадров раскадровки`);

            // 🎯 ПРАВИЛЬНО: Вставляем AI кадры между выбранными кадрами в старую раскадровку
            const startIndex = selectedFrames[0];
            const endIndex = selectedFrames[1];
            
            console.log(`🔄 Вставляем AI кадры между кадрами ${startIndex} и ${endIndex}...`);
            console.log(`📊 Было кадров: ${storyboardFrames.length}, AI кадров для вставки: ${newFrames.length}`);
            
            // Создаем обновленную раскадровку:
            // - Кадры до первого выбранного (включая его)
            // - Новые AI кадры между выбранными
            // - Кадры после второго выбранного (включая его)
            const updatedStoryboard = [
                ...storyboardFrames.slice(0, startIndex + 1),  // Кадры до первого выбранного (включая)
                ...newFrames,                                   // AI кадры между выбранными
                ...storyboardFrames.slice(endIndex)            // Кадры после второго выбранного (включая)
            ];
            
            setStoryboardFrames(updatedStoryboard);
            console.log(`✅ Раскадровка обновлена: было ${storyboardFrames.length} кадров, стало ${updatedStoryboard.length}`);
            console.log(`📊 Вставлено ${newFrames.length} AI кадров между позициями ${startIndex} и ${endIndex}`);
            
            // Сохраняем информацию о диапазоне AI кадров для визуальной индикации
            const newAiRange = {
                start: startIndex + 1,
                end: startIndex + 1 + newFrames.length,
                count: newFrames.length
            };
            setAiFrameRanges(prev => [...prev, newAiRange]);
            
            // Сбрасываем выбор кадров
            setSelectedFrames([]);
            
            // Обновляем основное видео в плеере с новой раскадровкой
            if (data.videoUrl) {
                console.log('📥 Обновление видео в плеере с новой раскадровкой...');
                
                // Проверяем, нужно ли добавить базовый URL
                let videoUrl = data.videoUrl;
                if (videoUrl.startsWith('/')) {
                    videoUrl = `${apiUrl}${videoUrl}`;
                }
                
                console.log('🔗 Полный URL видео:', videoUrl);
                
                const videoResponse = await fetch(videoUrl);
                if (!videoResponse.ok) {
                    throw new Error(`Не удалось загрузить видео: ${videoResponse.status} ${videoResponse.statusText}`);
                }
                
                const blob = await videoResponse.blob();
                console.log('✅ Видео загружено:', blob.size, 'bytes');
                
                // Создаем новый URL для видео
                const newVideoUrl = window.URL.createObjectURL(blob);
                
                // Освобождаем старый URL если был
                if (videoUrl && videoUrl.startsWith('blob:')) {
                    window.URL.revokeObjectURL(videoUrl);
                }
                
                // Обновляем видео на экране
                setVideoUrl(newVideoUrl);
                
                // Ждем загрузки метаданных нового видео для обновления длительности
                const tempVideo = document.createElement('video');
                tempVideo.src = newVideoUrl;
                tempVideo.onloadedmetadata = () => {
                    console.log(`🎬 Новое видео загружено: длительность ${tempVideo.duration.toFixed(2)}s`);
                    setDuration(tempVideo.duration);
                    
                    // Обновляем текущее время если оно превышает новую длительность
                    if (videoRef.current && currentTime > tempVideo.duration) {
                        videoRef.current.currentTime = tempVideo.duration;
                        setCurrentTime(tempVideo.duration);
                    }
                };
                
                // Также скачиваем видео
                const a = document.createElement('a');
                a.href = newVideoUrl;
                a.download = `ai-enhanced-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                console.log('✅ Видео в плеере обновлено с новой раскадровкой');
                
                // Обновляем videoRef для корректного воспроизведения
                if (videoRef.current) {
                    videoRef.current.load();
                }
            }
            
            alert(`✅ Видео и раскадровка синхронизированы!\nAI кадров вставлено: ${newFrames.length}\nВсего кадров: ${updatedStoryboard.length}\nВидео в плеере обновлено с новой раскадровкой!`);
            
            console.log('✅ Генерация AI видео завершена');
            
        } catch (error: any) {
            console.error('❌ Ошибка генерации видео:', error);
            console.error('Stack trace:', error.stack);
            
            let errorMessage = 'Ошибка при генерации видео.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = `API недоступен. Убедитесь, что сервер запущен на ${import.meta.env.VITE_API_URL || 'https://cors-anywhere.herokuapp.com/https://ffmpeg-production-2a8b.up.railway.app'}`;
            } else if (error.message.includes('ffmpeg')) {
                errorMessage = 
                    '⚠️ FFmpeg не смог обработать кадры\n\n' +
                    'Проверьте на сервере:\n' +
                    '1. FFmpeg установлен (ffmpeg -version)\n' +
                    '2. Кадры сохраняются правильно\n' +
                    '3. Формат изображений корректный (JPEG/PNG)\n' +
                    '4. Достаточно свободного места\n\n' +
                    'Откройте консоль (F12) для деталей';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    return (
        <div className="h-screen flex flex-col justify-between relative">
            {isGeneratingStoryboard && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-custom-black rounded-lg p-8 border-2 border-custom-lime max-w-md">
                        <div className="relative mb-6 flex justify-center">
                            <div className="w-24 h-24 border-4 border-gray-600 border-t-custom-lime rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-custom-lime rounded-full animate-pulse opacity-50"></div>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-bold text-white">Generating storyboard... 💡 Shift + Click for frame selection</h3> 
                            <div className="space-y-2 text-sm text-gray-400">
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse"></span>
                                    Loading video to server
                                </p>
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                    Extracting frames (FFmpeg)
                                </p>
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                                    Conversion to base64
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <p className="text-xs text-gray-500">⏱️ Usually takes 5-10 seconds</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Video Generation Loader */}
            {isGeneratingVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-custom-black rounded-lg p-8 border-2 border-custom-lime max-w-md">
                        <div className="relative mb-6 flex justify-center">
                            <div className="w-24 h-24 border-4 border-gray-600 border-t-custom-lime rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-custom-lime rounded-full animate-pulse opacity-50"></div>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-bold text-white">AI is generating video...</h3> 
                            <div className="space-y-2 text-sm text-gray-400">
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse"></span>
                                    Loading frames to Firebase
                                </p>
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                    Sending request to Higgsfield AI
                                </p>
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                                    Video generation (1-3 minutes)
                                </p>
                                <p className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></span>
                                    Extracting storyboard
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <p className="text-xs text-gray-500">☕ This will take 1-3 minutes</p>
                                <p className="text-xs text-gray-500 mt-1">Please do not close the window</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex h-4/5 p-6">
                <div
                    className="h-full w-full border-2 border-black bg-white rounded-lg overflow-hidden relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {currentFrameIndex >= 0 && storyboardFrames.length > 0 ? (
                        // Показываем выбранный кадр из таймлайна
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                            <img
                                src={storyboardFrames[currentFrameIndex]}
                                alt={`Selected frame ${currentFrameIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />
                            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
                                Frame #{currentFrameIndex + 1} of {storyboardFrames.length}
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <video
                            ref={videoRef}
                            className="w-full h-full border-2 border-custom-lime rounded-lg"
                            src={videoUrl}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="mb-4">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-2">Upload your video</p>
                                <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label
                                    htmlFor="video-upload"
                                    className="cursor-pointer bg-custom-lime text-black px-6 py-2 rounded-lg font-semibold hover:bg-custom-lime/90 transition-colors"
                                >
                                    Choose Video File
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="h-1/5 flex justify-center items-start gap-6 p-6 pt-0">
                <div className="w-3/5 flex flex-col h-full gap-4">
                    <div className="bg-white border-2 border-custom-lime rounded-lg min-h-full flex flex-col p-4 relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                                <button
                                    onClick={handlePlayPause}
                                    className="w-8 h-8 bg-custom-lime rounded-full flex items-center justify-center hover:bg-custom-lime/90 transition-colors"
                                >
                                    {isPlaying ? (
                                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col absolute justify-center top-0 left-0 w-full h-full">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {isGeneratingStoryboard && (
                                        <span className="text-xs text-gray-500">Generating storyboard... 💡 Shift + Click for frame selection</span>
                                    )}
                                    {!isGeneratingStoryboard && storyboardFrames.length === 0 && duration > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">No storyboard yet 💡 Shift + Click for frame selection</span>
                                            <button
                                                onClick={generateStoryboard}
                                                className="px-2 py-1 bg-custom-lime text-black rounded text-xs hover:bg-custom-lime/90 transition-colors"
                                            >
                                                Generate 💡 Shift + Click for frame selection   
                                            </button>
                                        </div>
                                    )}
                                    {storyboardFrames.length > 0 && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-600">
                                                💡 Shift + Click for frame selection
                                            </span>
                                            <span className={`text-xs font-semibold ${selectedFrames.length === 2 ? 'text-green-600' : 'text-gray-500'}`}>
                                                Selected: {selectedFrames.length}/2
                                            </span>
                                            {selectedFrames.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedFrames([])}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div
                                className="relative w-full h-full bg-gray-200 rounded-lg overflow-hidden"
                            >

                                {storyboardFrames.length > 0 && (
                                    <div ref={storyboardRef} className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 z-20">
                                        <div className="flex items-center h-full gap-1 px-2" style={{ width: `${storyboardFrames.length * 68}px` }}>
                                            {storyboardFrames.map((frame, index) => {
                                                const isSelected = selectedFrames.includes(index);
                                                const selectionOrder = selectedFrames.indexOf(index);
                                                
                                                return (
                                                <div
                                                    key={index}
                                                    className="flex-shrink-0 relative group cursor-pointer h-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                            handleStoryboardClick(index, e);
                                                    }}
                                                >
                                                    <img
                                                        src={frame}
                                                        alt={`Frame ${index + 1}`}
                                                            className={`w-16 h-full object-cover rounded border-2 transition-colors ${
                                                                isSelected 
                                                                    ? 'border-yellow-400 shadow-lg' 
                                                                    : currentFrameIndex === index
                                                                    ? 'border-custom-lime shadow-lg'
                                                                    : 'border-gray-300 hover:border-custom-lime'
                                                            }`}
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs text-center py-0.5 rounded-b">
                                                            {index + 1}
                                                        </div>
                                                        {/* Индикация AI кадров */}
                                                        {aiFrameRanges.some(range => index >= range.start && index < range.end) && (
                                                            <div className="absolute top-1 left-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                                                                AI
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <div className="absolute top-1 right-1 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                                {selectionOrder + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex h-full w-2/5 gap-4">
                    <div className="flex-1 border-2 border-custom-lime rounded-lg p-4 flex flex-col">
                        <textarea
                            className="flex-1 resize-none border-none outline-none bg-transparent"
                            placeholder="Input your prompt here"
                            rows={3}
                            maxLength={500}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <div className="text-right text-sm text-gray-500 mt-2">
                            {text.length}/500
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button 
                            variant="square" 
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo || storyboardFrames.length === 0 || !text.trim() || selectedFrames.length !== 2}
                        >
                            {isGeneratingVideo ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                'Generate'
                            )}
                        </Button>
                        <Button 
                            variant="square" 
                            onClick={() => setShowSaveModal(true)}
                            disabled={storyboardFrames.length === 0 || isSaving}
                        >
                            {isSaving ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Save Project Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-custom-black rounded-lg p-6 w-96 border-2 border-custom-lime relative">
                        {/* Loading Overlay */}
                        {isSaving && (
                            <div className="absolute inset-0 bg-custom-black bg-opacity-95 rounded-lg flex flex-col items-center justify-center z-10">
                                <div className="relative mb-6">
                                    {/* Outer spinning ring */}
                                    <div className="w-20 h-20 border-4 border-gray-600 border-t-custom-lime rounded-full animate-spin"></div>
                                    {/* Inner pulsing circle */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-custom-lime rounded-full animate-pulse opacity-50"></div>
                                    </div>
                                </div>
                                
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-white">Saving project...</h3>
                                    <div className="space-y-1 text-sm text-gray-400">
                                        <p className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse"></span>
                                            Generating video
                                        </p>
                                        <p className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                            Creating thumbnail
                                        </p>
                                        <p className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-2 h-2 bg-custom-lime rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                                            Загрузка в Firebase
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Это может занять несколько секунд...</p>
                                </div>
                            </div>
                        )}
                        
                        <h2 className="text-2xl font-bold mb-4">Save project</h2>
                        <div className="mb-4">
                            <label htmlFor="project-name" className="block font-semibold mb-2">
                                Project name
                            </label>
                            <Input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="square"
                                onClick={() => {
                                    setShowSaveModal(false);
                                    setProjectName("");
                                }}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="square"
                                onClick={handleSaveProject}
                                disabled={isSaving || !projectName.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden canvas for frame generation */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}