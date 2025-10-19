import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProjects, type Project } from '../../services/projectService';

interface ProjectCardProps {
    name: string;
    duration: string;
    image: string;
    videoUrl: string;
    onClick: () => void;
}

const ProjectCard = ({ name, duration, image, onClick }: ProjectCardProps) => {
    return (
        <div 
            className="border-2 bg-custom-black border-custom-lime rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <div className="aspect-video bg-gray-200 overflow-hidden">
                <img 
                    src={image} 
                    alt={name}
                    className="w-full h-full object-cover border-b-2 border-custom-lime"
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-custom-lime mb-2">{name}</h3>
                <p className="text-sm text-gray-600">{duration}</p>
            </div>
        </div>
    );
};

export const Projects = () => {
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState(1);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(projects.length / itemsPerPage);

    useEffect(() => {
        const loadProjects = async () => {
            if (!user) return;
            
            setLoading(true);
            setError(null);
            try {
                const userProjects = await getUserProjects(user.uid);
                setProjects(userProjects);
            } catch (error: any) {
                console.error('Ошибка загрузки проектов:', error);
                if (error.code === 'failed-precondition') {
                    setError('Firestore не настроен. Создайте базу данных в Firebase Console.');
                } else if (error.code === 'permission-denied') {
                    setError('Доступ запрещен. Проверьте правила безопасности.');
                } else {
                    setError('Ошибка загрузки проектов. Попробуйте позже.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, [user]);

    const getCurrentProjects = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return projects.slice(startIndex, endIndex);
    };

    const goToNextPage = () => {
        setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
    };

    const goToPrevPage = () => {
        setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
    };

    const currentProjects = getCurrentProjects();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-custom-lime rounded-full animate-spin"></div>
                    <span className="text-lg">Загрузка проектов...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col">
            <div className="w-full h-24 mb-6 flex items-center justify-center">
                <h1 className="text-5xl font-bold">Projects</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
                    <p className="text-red-700 font-semibold">⚠️ {error}</p>
                    <p className="text-sm text-red-600 mt-2">
                        Перейдите в Firebase Console и создайте Firestore Database.
                    </p>
                </div>
            )}
            
            {projects.length === 0 && !error ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl text-gray-600 mb-4">У вас пока нет проектов</p>
                        <a 
                            href="/editor" 
                            className="px-6 py-3 bg-custom-lime text-black rounded-lg font-semibold hover:bg-custom-lime/90 transition-colors inline-block"
                        >
                            Создать первый проект
                        </a>
                    </div>
                </div>
            ) : projects.length > 0 ? (
                <>
                    <div className="grid grid-cols-3 grid-rows-2 gap-4 flex-1">
                        {currentProjects.map((project) => (
                            <ProjectCard 
                                key={project.id}
                                name={project.name}
                                duration={project.duration}
                                image={project.thumbnailUrl || project.videoUrl}
                                videoUrl={project.videoUrl}
                                onClick={() => setSelectedVideo(project.videoUrl)}
                            />
                        ))}
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                                className="px-6 py-3 border-2 border-black rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                            >
                                Назад
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg border-2 border-custom-lime font-semibold transition-colors ${
                                            currentPage === page 
                                                ? 'bg-custom-lime text-custom-black hover:bg-custom-lime hover:text-custom-black' 
                                                : 'bg-custom-black hover:text-custom-black hover:bg-custom-lime'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className="px-6 py-3 border-2 border-black rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                            >
                                Вперед
                            </button>
                        </div>
                    )}
                </>
            ) : null}

            {/* Video Modal */}
            {selectedVideo && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div 
                        className="relative max-w-4xl w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute -top-10 right-0 text-white hover:text-custom-lime text-2xl font-bold"
                        >
                            ✕
                        </button>
                        <video
                            src={selectedVideo}
                            controls
                            autoPlay
                            className="w-full rounded-lg border-2 border-custom-lime"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )}
        </div>
    )
}
