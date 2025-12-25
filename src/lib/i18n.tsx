import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'zh' | 'en';

interface Translations {
    [key: string]: {
        zh: string;
        en: string;
    };
}

const translations: Translations = {
    // Navigation & Common
    'nav.supervised': { zh: '监督学习', en: 'Supervised Learning' },
    'nav.unsupervised': { zh: '无监督学习', en: 'Unsupervised Learning' },
    'nav.home': { zh: '首页', en: 'Home' },
    'footer.credits': { zh: '基于 TensorFlow.js 构建', en: 'Built with TensorFlow.js' },

    // Auth - Teacher
    'teacher.login_title': { zh: '教师登录', en: 'Teacher Login' },
    'teacher.login_subtitle': { zh: '输入凭据以管理课堂。', en: 'Enter your credentials to manage the classroom.' },
    'teacher.username': { zh: '用户名', en: 'Username' },
    'teacher.password': { zh: '密码', en: 'Password' },
    'teacher.login_btn': { zh: '登录', en: 'Login' },
    'teacher.login_error': { zh: '凭据无效，请重试。', en: 'Invalid credentials. Please try again.' },

    // Auth - Student
    'student.login_title': { zh: '加入课堂', en: 'Join Classroom' },
    'student.login_subtitle': { zh: '输入房间代码和您的名字以加入。', en: 'Enter the room code and your name to join.' },
    'student.code': { zh: '房间代码', en: 'Room Code' },
    'student.nickname': { zh: '昵称', en: 'Nickname' },
    'student.join_btn': { zh: '加入课堂', en: 'Join Class' },
    'student.iam_teacher': { zh: '我是老师', en: 'I am a Teacher' },
    'student.code_error': { zh: '代码格式无效或名字为空。', en: 'Invalid code format or empty name.' },

    // Unsupervised Lab
    'unsupervised.title': { zh: '无监督学习实验室', en: 'Unsupervised Learning Lab' },
    'unsupervised.loading': { zh: '正在加载 MobileNet 模型...', en: 'Loading MobileNet Model...' },
    'unsupervised.capture': { zh: '采集样本', en: 'Capture Example' },
    'unsupervised.clustering_controls': { zh: '聚类控制', en: 'Clustering Controls' },
    'unsupervised.clusters_k': { zh: '聚类数量 (K):', en: 'Clusters (K):' },
    'unsupervised.run_kmeans': { zh: '运行 K-Means', en: 'Run K-Means' },
    'unsupervised.step_kmeans': { zh: 'K-Means 单步迭代', en: 'Step K-Means' },
    'unsupervised.converged': { zh: '已收敛', en: 'Converged' },
    'unsupervised.reset': { zh: '重置所有', en: 'Reset All' },
    'unsupervised.embedding_space': { zh: '嵌入空间 (PCA 投影)', en: 'Embedding Space (PCA Projection)' },
    'unsupervised.empty_state': { zh: '采集图像以在 2D 空间中查看映射。', en: 'Capture images to see them mapped in 2D space.' },
    'unsupervised.selected': { zh: '已选中', en: 'Selected' },
    'unsupervised.no_image': { zh: '无图像', en: 'No image' },
    'unsupervised.points': { zh: '数据点', en: 'Points' },
    'unsupervised.clusters': { zh: '聚类', en: 'Clusters' },
    'unsupervised.tab.webcam': { zh: '自己试试', en: 'Try it yourself' },
    'unsupervised.tab.iris': { zh: '鸢尾花 (Iris) K-Means', en: 'Iris K-Means' },
    'unsupervised.iris.show_labels': { zh: '显示真实类别', en: 'Show True Labels' },
    'unsupervised.iris.hide_labels': { zh: '隐藏真实类别', en: 'Hide True Labels' },
    'unsupervised.iris.compare_tip': { zh: '对比聚类结果和真实类别，看看算法表现如何！', en: 'Compare clusters with true species to see how well the algorithm performed!' },
    'unsupervised.iris.true_species': { zh: '真实鸢尾花类别', en: 'True Iris Species' },
    'unsupervised.iris.cluster_assignments': { zh: 'K-Means 聚类结果', en: 'K-Means Cluster Assignments' },

    // Supervised Lab
    'supervised.title': { zh: '监督学习实验室', en: 'Supervised Learning Lab' },
    'supervised.loading': { zh: '正在加载 MobileNet 模型...', en: 'Loading MobileNet Model...', },
    'supervised.instructions.title': { zh: '操作说明:', en: 'Instructions:' },
    'supervised.instructions.text': {
        zh: '在右侧选择一个类别，点击“采集样本”按钮来捕捉图像。教模型识别不同的物体，例如脸部、手、本子、水瓶等。',
        en: 'Select a class on the right and hold "Add Example" to capture images. Teach the model to recognize different objects (e.g. your face vs your hand).'
    },
    'supervised.dataset.title': { zh: '数据集', en: 'Dataset' },
    'supervised.dataset.total': { zh: '总样本数:', en: 'Total examples:' },
    'supervised.dataset.add_class': { zh: '添加类别', en: 'Add Class' },
    'supervised.class.add_example': { zh: '采集样本', en: 'Add Example' },
    'supervised.class.samples': { zh: '样本', en: 'samples' },
    'supervised.prediction.title': { zh: '实时预测', en: 'Real-time Prediction' },
    'supervised.prediction.confidence': { zh: '置信度', en: 'Confidence' },
    'supervised.prediction.waiting': { zh: '等待预测...', en: 'Waiting for prediction...' },
    'supervised.prediction.no_model': { zh: '模型尚未训练', en: 'Model not trained' },
    'supervised.dataset.train': { zh: '训练模型', en: 'Train Model' },
    'supervised.dataset.training': { zh: '正在训练...', en: 'Training...' },
    'supervised.dataset.trained': { zh: '模型已训练', en: 'Model Trained' },
    'supervised.prediction.start': { zh: '开始预测', en: 'Start Prediction' },
    'supervised.prediction.stop': { zh: '停止预测', en: 'Stop Prediction' },

    // Home
    'home.hero.title': { zh: '在浏览器中探索机器学习', en: 'Explore Machine Learning in Your Browser' },
    'home.hero.subtitle': { zh: '无需安装，完全隐私。使用您的摄像头实时训练模型。', en: 'No installation, completely private. Train models in real-time using your webcam.' },
    'home.card.supervised.title': { zh: '监督学习', en: 'Supervised Learning' },
    'home.card.supervised.desc': { zh: '教机器识别物体。采集样本，训练分类器，并进行实时预测。', en: 'Teach the machine to recognize objects. Collect examples, train a classifier, and make real-time predictions.' },
    'home.card.unsupervised.title': { zh: '无监督学习', en: 'Unsupervised Learning' },
    'home.card.unsupervised.desc': { zh: '探索数据中的隐藏模式。使用 K-Means 算法对摄像头图像进行聚类。', en: 'Discover patterns in data. Cluster webcam images using the K-Means algorithm.' },
    'home.start': { zh: '开始使用', en: 'Get Started' },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Default to Chinese ('zh')
    const [language, setLanguage] = useState<Language>('zh');

    const t = (key: string) => {
        const item = translations[key];
        if (!item) return key; // Fallback to key if missing
        return item[language];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
