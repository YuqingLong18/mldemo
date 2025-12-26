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
    'nav.return_dashboard': { zh: '返回教师面板', en: 'Return to Teacher Dashboard' },
    'footer.credits': { zh: '基于 TensorFlow.js 构建', en: 'Built with TensorFlow.js' },
    'common.back': { zh: '返回', en: 'Back' },
    'common.unknown': { zh: '未知', en: 'Unknown' },
    'common.upload': { zh: '上传', en: 'Upload' },
    'common.clear': { zh: '清除', en: 'Clear' },
    'common.uploading': { zh: '正在上传...', en: 'Uploading...' },
    'common.error_not_image': { zh: '不是图片文件。', en: 'Not an image file.' },
    'common.error_file_too_large': { zh: '文件过大（最大 {max}MB）。', en: 'File too large (Max {max}MB).' },
    'common.error_canvas_context': { zh: '无法获取画布上下文。', en: 'Failed to get canvas context.' },
    'common.error_load_image': { zh: '加载图片失败。', en: 'Failed to load image.' },
    'common.error_read_file': { zh: '读取文件失败。', en: 'Failed to read file.' },

    // Auth - Teacher
    'teacher.login_title': { zh: '教师登录', en: 'Teacher Login' },
    'teacher.login_subtitle': { zh: '输入凭据以管理课堂。', en: 'Enter your credentials to manage the classroom.' },
    'teacher.username': { zh: '用户名', en: 'Username' },
    'teacher.password': { zh: '密码', en: 'Password' },
    'teacher.login_btn': { zh: '登录', en: 'Login' },
    'teacher.login_error': { zh: '凭据无效，请重试。', en: 'Invalid credentials. Please try again.' },
    'teacher.login_connection_error': { zh: '连接失败。请确认凭据数据库已启动。', en: 'Connection failed. Is the credential DB running?' },

    // Teacher Dashboard
    'teacher.dashboard.title': { zh: '教师面板', en: 'Teacher Dashboard' },
    'teacher.dashboard.subtitle': { zh: '创建课堂会话以开始。', en: 'Create a classroom session to get started.' },
    'teacher.dashboard.create_btn': { zh: '创建课堂', en: 'Create Classroom' },
    'teacher.dashboard.demo_btn': { zh: '演示模式', en: 'Go to Demo' },
    'teacher.dashboard.code_label': { zh: '房间代码', en: 'Classroom Code' },
    'teacher.dashboard.students_joined': { zh: '名学生已加入', en: 'Students Joined' },
    'teacher.dashboard.waiting': { zh: '等待学生加入，代码：', en: 'Waiting for students to join with code ' },
    'teacher.dashboard.attention_on': { zh: '专注模式已开启', en: 'ATTENTION MODE ON' },
    'teacher.dashboard.attention_off': { zh: '开启专注模式', en: 'Turn On Attention Mode' },
    'teacher.dashboard.tab.roster': { zh: '花名册', en: 'Roster' },
    'teacher.dashboard.tab.monitoring': { zh: '监控', en: 'Monitoring' },
    'teacher.dashboard.feature_student': { zh: '展示学生', en: 'Feature Student' },
    'teacher.dashboard.kick_student': { zh: '踢出学生', en: 'Kick Student' },
    'teacher.dashboard.status': { zh: '状态:', en: 'Status:' },
    'teacher.dashboard.samples': { zh: '样本数:', en: 'Samples:' },
    'teacher.dashboard.accuracy': { zh: '准确率:', en: 'Accuracy:' },
    'teacher.dashboard.k_clusters': { zh: 'K-聚类:', en: 'K-Clusters:' },
    'teacher.dashboard.feature_no_clustering': {
        zh: '学生“{name}”还没有聚类数据，请先采集样本并运行 K-Means。',
        en: 'Student "{name}" does not have clustering data yet. Please capture samples and run K-Means first.'
    },
    'teacher.dashboard.feature_no_model': {
        zh: '学生“{name}”还没有训练好的模型，请先训练模型。',
        en: 'Student "{name}" does not have a trained model yet. Please train the model first.'
    },
    'teacher.dashboard.feature_timeout': {
        zh: '请求超时。学生可能还没有训练模型或连接出现问题。',
        en: 'Request timed out. The student may not have a trained model or may be experiencing connection issues.'
    },
    'teacher.dashboard.copy_code': { zh: '点击复制', en: 'Click to copy' },
    'teacher.dashboard.end_session': { zh: '结束课堂', en: 'End Session' },

    // Auth - Student
    'student.login_title': { zh: '加入课堂', en: 'Join Classroom' },
    'student.login_subtitle': { zh: '输入房间代码和您的名字以加入。', en: 'Enter the room code and your name to join.' },
    'student.code': { zh: '房间代码', en: 'Room Code' },
    'student.nickname': { zh: '昵称', en: 'Nickname' },
    'student.join_btn': { zh: '加入课堂', en: 'Join Class' },
    'student.iam_teacher': { zh: '我是老师', en: 'I am a Teacher' },
    'student.code_error': { zh: '代码格式无效或名字为空。', en: 'Invalid code format or empty name.' },
    'student.connected': { zh: '已连接到课堂', en: 'Connected to Class' },
    'student.join_modal_title': { zh: '加入课堂', en: 'Join Classroom' },
    'student.join_modal_open': { zh: '加入课堂', en: 'Join Class' },
    'student.name': { zh: '你的名字', en: 'Your Name' },
    'student.name_placeholder': { zh: '请输入你的名字', en: 'Enter your name' },
    'student.join_short': { zh: '加入', en: 'Join' },

    // Camera
    'camera.webcam_feed': { zh: '摄像头画面', en: 'Webcam Feed' },
    'camera.permission_error': {
        zh: '无法访问摄像头，请允许摄像头权限以使用本应用。',
        en: 'Camera access denied or unavailable. Please allow camera permissions to use this app.'
    },

    // Attention Overlay
    'attention.title': { zh: '注意老师', en: 'EYES ON TEACHER' },
    'attention.message': {
        zh: '请暂停操作，注视教室前方以听取指示。',
        en: 'Please pause your work and look at the front of the classroom for instructions.'
    },

    // Layout
    'layout.running_local': { zh: '正在浏览器本地运行。', en: 'Running locally in browser.' },
    'layout.no_uploads': { zh: '不上传任何数据。', en: 'No data uploaded.' },
    'layout.title': { zh: 'ML Playground', en: 'ML Playground' },

    // Unsupervised Lab
    'unsupervised.title': { zh: '无监督学习实验室', en: 'Unsupervised Learning Lab' },
    'unsupervised.loading': { zh: '正在加载 MobileNet 模型...', en: 'Loading MobileNet Model...' },
    'unsupervised.loading_error': { zh: '无法加载 MobileNet 模型。', en: 'Failed to load MobileNet model.' },
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
    'unsupervised.upload_title': { zh: '上传图片', en: 'Upload images' },
    'unsupervised.uploaded_images': { zh: '已上传图片', en: 'Uploaded Images' },
    'unsupervised.clear_thumbnails': { zh: '清除缩略图', en: 'Clear thumbnails' },
    'unsupervised.error_pca': { zh: 'PCA 计算失败：{error}', en: 'PCA Calculation Failed: {error}' },
    'unsupervised.error_capture': { zh: '采集失败：{error}', en: 'Capture Failed: {error}' },
    'unsupervised.error_process_file': { zh: '处理文件 {name} 失败：{error}', en: 'Failed to process {name}: {error}' },
    'unsupervised.error_invalid_embedding': {
        zh: '嵌入向量包含无效数值 (NaN/Infinity)。',
        en: 'Embedding contains invalid numbers (NaN/Infinity).'
    },
    'unsupervised.featured.title': { zh: '查看学生聚类', en: 'Viewing Student Clustering' },
    'unsupervised.featured.subtitle': { zh: '{name} 的聚类', en: "{name}'s Clusters" },
    'unsupervised.point_preview_alt': { zh: '点预览', en: 'Point Preview' },
    'unsupervised.iris.show_labels': { zh: '显示真实类别', en: 'Show True Labels' },
    'unsupervised.iris.hide_labels': { zh: '隐藏真实类别', en: 'Hide True Labels' },
    'unsupervised.iris.compare_tip': { zh: '对比聚类结果和真实类别，看看算法表现如何！', en: 'Compare clusters with true species to see how well the algorithm performed!' },
    'unsupervised.iris.true_species': { zh: '真实鸢尾花类别', en: 'True Iris Species' },
    'unsupervised.iris.cluster_assignments': { zh: 'K-Means 聚类结果', en: 'K-Means Cluster Assignments' },
    'unsupervised.iris.about_title': { zh: '关于鸢尾花数据集', en: 'About Iris Dataset' },
    'unsupervised.iris.about_body': {
        zh: '1936 年 Ronald Fisher 提出的经典数据集，包含三种花：Setosa、Versicolor、Virginica。此处可视化花瓣长度与花瓣宽度。',
        en: 'A classic dataset introduced by Ronald Fisher in 1936. Includes 3 species: Setosa, Versicolor, and Virginica. We visualize Petal Length vs Petal Width.'
    },
    'unsupervised.iris.centroid': { zh: '质心', en: 'Centroid' },
    'unsupervised.iris.petal_length': { zh: '花瓣长度', en: 'Petal Length' },
    'unsupervised.iris.petal_width': { zh: '花瓣宽度', en: 'Petal Width' },

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
    'supervised.prediction.upload': { zh: '上传', en: 'Upload' },
    'supervised.prediction.upload_title': { zh: '上传图片进行预测', en: 'Upload images to predict' },
    'supervised.prediction.clear': { zh: '清除', en: 'Clear' },
    'supervised.prediction.clear_title': { zh: '清除预测结果', en: 'Clear predictions' },
    'supervised.prediction.uploaded_images': { zh: '已上传图片', en: 'Uploaded Images' },
    'supervised.prediction.live_camera': { zh: '实时摄像头预测', en: 'Live Camera Prediction' },
    'supervised.prediction.upload_or_start': { zh: '上传图片或点击“开始预测”', en: 'Upload images or press Start to predict' },
    'supervised.dataset.train': { zh: '训练模型', en: 'Train Model' },
    'supervised.dataset.training': { zh: '正在训练...', en: 'Training...' },
    'supervised.dataset.trained': { zh: '模型已训练', en: 'Model Trained' },
    'supervised.prediction.start': { zh: '开始预测', en: 'Start Prediction' },
    'supervised.prediction.stop': { zh: '停止预测', en: 'Stop Prediction' },
    'supervised.dataset.upload_title': { zh: '上传图片', en: 'Upload Images' },
    'supervised.dataset.empty': { zh: '暂无类别。', en: 'No classes added.' },
    'supervised.featured.title': { zh: '查看学生模型', en: 'Viewing Student Model' },
    'supervised.featured.subtitle': { zh: '{name} 的模型', en: "{name}'s Model" },

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
