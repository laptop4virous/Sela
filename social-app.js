// Data Storage
const ADMIN_EMAIL = 'admin@khawater.com';
const ADMIN_PASSWORD = 'admin@2025';

let currentUser = null;
let users = JSON.parse(localStorage.getItem('socialUsers')) || [];
let posts = JSON.parse(localStorage.getItem('socialPosts')) || [];
let comments = JSON.parse(localStorage.getItem('socialComments')) || [];
let reactions = JSON.parse(localStorage.getItem('socialReactions')) || [];
let follows = JSON.parse(localStorage.getItem('socialFollows')) || [];
let savedPosts = JSON.parse(localStorage.getItem('socialSavedPosts')) || [];

// Initialize Admin Account
if (!users.find(u => u.email === ADMIN_EMAIL)) {
    users.push({
        id: 1,
        name: 'مدير الموقع',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        bio: 'مرحباً بكم في شبكة خواطر 🌟',
        avatar: 'م',
        joinDate: new Date().toISOString(),
        isAdmin: true,
        details: {
            birthPlace: 'دمشق',
            currentCity: 'دمشق',
            education: 'إدارة أعمال',
            work: 'مدير الموقع'
        },
        settings: {
            privacy: 'public',
            notifications: true,
            emailNotifications: true
        }
    });
    localStorage.setItem('socialUsers', JSON.stringify(users));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showFeed();
    } else {
        document.getElementById('authModal').classList.add('active');
    }
    
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
});

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    document.getElementById('themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';
}

// Auth Functions
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('الرجاء إدخال جميع البيانات');
        return;
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('authModal').classList.remove('active');
        showFeed();
    } else {
        alert('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
}

function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
        alert('الرجاء إدخال جميع البيانات');
        return;
    }
    
    if (users.find(u => u.email === email)) {
        alert('البريد الإلكتروني مستخدم مسبقاً');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        bio: 'مرحباً بكم في صفحتي! 👋',
        avatar: name.charAt(0).toUpperCase(),
        joinDate: new Date().toISOString(),
        isAdmin: false,
        details: {
            birthPlace: '',
            currentCity: '',
            education: '',
            work: ''
        },
        settings: {
            privacy: 'public',
            notifications: true,
            emailNotifications: true
        }
    };
    
    users.push(newUser);
    localStorage.setItem('socialUsers', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    document.getElementById('authModal').classList.remove('active');
    showFeed();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('authModal').classList.add('active');
    document.getElementById('mainContainer').innerHTML = '';
}

// Navigation
function updateNavbar() {
    const navLinks = document.getElementById('navLinks');
    const searchContainer = document.getElementById('searchContainer');
    
    if (currentUser) {
        searchContainer.style.display = 'block';
        
        navLinks.innerHTML = `
            <button class="theme-toggle" onclick="toggleTheme()" id="themeToggle">🌙</button>
            <button class="nav-link" onclick="showFeed()">🏠 الرئيسية</button>
            ${currentUser.isAdmin ? '<button class="nav-link" onclick="showAdminPanel()">👑 لوحة التحكم</button>' : ''}
            <button class="nav-link" onclick="showSuggestedFriends()">👥 اقتراح أصدقاء</button>
            <button class="nav-link" onclick="showSavedPosts()">🔖 المحفوظات</button>
            <button class="nav-link" onclick="showProfile('${currentUser.id}')">👤 صفحتي</button>
            <button class="nav-link" onclick="showSettings()">⚙️ الإعدادات</button>
            <button class="nav-link" onclick="logout()">🚪 خروج</button>
            <div class="user-avatar" onclick="showProfile('${currentUser.id}')">${currentUser.avatar}</div>
        `;
    }
    updateThemeIcon();
}

// Search Users
function searchUsers() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    const results = users.filter(u => 
        u.id !== currentUser.id && 
        (u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    );
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-light);">لا توجد نتائج</div>';
        resultsDiv.classList.add('active');
        return;
    }
    
    resultsDiv.innerHTML = results.map(user => `
        <div class="search-result-item" onclick="showProfile('${user.id}'); document.getElementById('searchResults').classList.remove('active');">
            <div class="search-avatar">${user.avatar}</div>
            <div>
                <div style="font-weight: 700;">${user.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-light);">${user.email}</div>
            </div>
        </div>
    `).join('');
    
    resultsDiv.classList.add('active');
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById('searchResults')?.classList.remove('active');
    }
});

// Show Feed
function showFeed() {
    updateNavbar();
    
    const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    document.getElementById('mainContainer').innerHTML = `
        <aside class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">حسابي</div>
                <div class="sidebar-item" onclick="showProfile('${currentUser.id}')">
                    <span>👤</span>
                    <span>${currentUser.name}</span>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">مستخدمون مقترحون</div>
                ${getSuggestedUsers()}
            </div>
        </aside>
        
        <div class="main-feed">
            ${createPostCreator()}
            <div id="postsContainer">
                ${sortedPosts.map(post => createPostCard(post)).join('')}
            </div>
        </div>
        
        <aside class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">📊 إحصائيات</div>
                <div style="padding: 10px;">
                    <p><strong>${posts.length}</strong> خاطرة</p>
                    <p><strong>${users.length}</strong> مستخدم</p>
                    <p><strong>${comments.length}</strong> تعليق</p>
                </div>
            </div>
        </aside>
    `;
}

function getSuggestedUsers() {
    const otherUsers = users.filter(u => u.id !== currentUser.id).slice(0, 5);
    return otherUsers.map(user => `
        <div class="sidebar-item" onclick="showProfile('${user.id}')">
            <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                ${user.avatar}
            </div>
            <span>${user.name}</span>
        </div>
    `).join('');
}

// Post Creator
function createPostCreator() {
    return `
        <div class="post-creator">
            <textarea id="postContent" placeholder="ما الذي يدور في ذهنك؟" maxlength="700" oninput="updateCharCount()"></textarea>
            <div class="char-counter" id="charCounter">0 / 700</div>
            <div class="post-actions">
                <div class="image-upload">
                    <input type="file" id="postImage" accept="image/*" style="display: none;" onchange="previewImage()">
                    <button class="upload-btn" onclick="document.getElementById('postImage').click()">📷 إضافة صورة</button>
                    <img id="imagePreview" class="image-preview hidden">
                </div>
                <button class="post-btn" onclick="createPost()">نشر</button>
            </div>
        </div>
    `;
}

function updateCharCount() {
    const content = document.getElementById('postContent').value;
    const counter = document.getElementById('charCounter');
    counter.textContent = `${content.length} / 700`;
    
    if (content.length > 650) {
        counter.classList.add('danger');
        counter.classList.remove('warning');
    } else if (content.length > 600) {
        counter.classList.add('warning');
        counter.classList.remove('danger');
    } else {
        counter.classList.remove('warning', 'danger');
    }
}

function previewImage() {
    const file = document.getElementById('postImage').files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const imageFile = document.getElementById('postImage').files[0];
    
    if (!content && !imageFile) {
        alert('الرجاء كتابة خاطرة أو إضافة صورة');
        return;
    }
    
    const newPost = {
        id: Date.now(),
        userId: currentUser.id,
        content,
        image: null,
        createdAt: new Date().toISOString()
    };
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newPost.image = e.target.result;
            posts.push(newPost);
            localStorage.setItem('socialPosts', JSON.stringify(posts));
            showFeed();
        }
        reader.readAsDataURL(imageFile);
    } else {
        posts.push(newPost);
        localStorage.setItem('socialPosts', JSON.stringify(posts));
        showFeed();
    }
}

// Post Card
function createPostCard(post) {
    const author = users.find(u => u.id === post.userId);
    if (!author) return '';
    
    const postReactions = reactions.filter(r => r.postId === post.id);
    const postComments = comments.filter(c => c.postId === post.id);
    
    const reactionCounts = {
        '❤️': postReactions.filter(r => r.type === '❤️').length,
        '😍': postReactions.filter(r => r.type === '😍').length,
        '😂': postReactions.filter(r => r.type === '😂').length,
        '😮': postReactions.filter(r => r.type === '😮').length,
        '😢': postReactions.filter(r => r.type === '😢').length,
        '😡': postReactions.filter(r => r.type === '😡').length
    };
    
    const userReaction = postReactions.find(r => r.userId === currentUser.id);
    const timeAgo = getTimeAgo(post.createdAt);
    const isSaved = savedPosts.some(sp => sp.userId === currentUser.id && sp.postId === post.id);
    
    return `
        <div class="post-card">
            <div class="post-header">
                <div class="post-author" onclick="showProfile('${author.id}')">
                    <div class="post-avatar">${author.avatar}</div>
                    <div class="post-author-info">
                        <h4>${author.name}</h4>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <div class="post-menu" onclick="toggleSavePost('${post.id}')" title="${isSaved ? 'إلغاء الحفظ' : 'حفظ'}">
                        ${isSaved ? '🔖' : '📌'}
                    </div>
                    ${post.userId === currentUser.id || currentUser.isAdmin ? `
                        <div class="post-menu" onclick="deletePost('${post.id}')">🗑️</div>
                    ` : ''}
                </div>
            </div>
            
            <div class="post-content">${post.content}</div>
            
            ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ''}
            
            <div class="post-reactions">
                <div class="reactions-dropdown">
                    <button class="reaction-btn ${userReaction ? 'active' : ''}" onmouseenter="showReactionsDropdown('${post.id}')" onmouseleave="hideReactionsDropdown('${post.id}')">
                        ${userReaction ? userReaction.type : '👍'}
                        <span class="reaction-count">${postReactions.length}</span>
                    </button>
                    <div class="reactions-options" id="reactions-${post.id}" onmouseenter="showReactionsDropdown('${post.id}')" onmouseleave="hideReactionsDropdown('${post.id}')">
                        <span class="reaction-option" onclick="addReaction('${post.id}', '❤️')">❤️</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😍')">😍</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😂')">😂</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😮')">😮</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😢')">😢</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😡')">😡</span>
                    </div>
                </div>
                
                <button class="reaction-btn" onclick="toggleComments('${post.id}')">
                    💬 <span class="reaction-count">${postComments.length}</span>
                </button>
            </div>
            
            <div class="comments-section hidden" id="comments-${post.id}">
                <div class="comment-input">
                    <input type="text" id="comment-input-${post.id}" placeholder="اكتب تعليقاً...">
                    <button class="comment-btn" onclick="addComment('${post.id}')">نشر</button>
                </div>
                <div id="comments-list-${post.id}">
                    ${postComments.map(c => createCommentCard(c)).join('')}
                </div>
            </div>
        </div>
    `;
}

function createCommentCard(comment) {
    const author = users.find(u => u.id === comment.userId);
    if (!author) return '';
    
    return `
        <div class="comment">
            <div class="comment-avatar">${author.avatar}</div>
            <div class="comment-content">
                <div class="comment-author">${author.name}</div>
                <div class="comment-text">${comment.content}</div>
            </div>
        </div>
    `;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;
    return date.toLocaleDateString('ar-SA');
}

// Reactions
function showReactionsDropdown(postId) {
    document.getElementById(`reactions-${postId}`).classList.add('active');
}

function hideReactionsDropdown(postId) {
    setTimeout(() => {
        document.getElementById(`reactions-${postId}`).classList.remove('active');
    }, 200);
}

function addReaction(postId, type) {
    const existingReaction = reactions.find(r => r.postId === postId && r.userId === currentUser.id);
    
    if (existingReaction) {
        existingReaction.type = type;
    } else {
        reactions.push({
            id: Date.now(),
            postId,
            userId: currentUser.id,
            type,
            createdAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('socialReactions', JSON.stringify(reactions));
    showFeed();
}

// Comments
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('hidden');
}

function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    const newComment = {
        id: Date.now(),
        postId,
        userId: currentUser.id,
        content,
        createdAt: new Date().toISOString()
    };
    
    comments.push(newComment);
    localStorage.setItem('socialComments', JSON.stringify(comments));
    
    input.value = '';
    
    const commentsList = document.getElementById(`comments-list-${postId}`);
    commentsList.innerHTML = comments.filter(c => c.postId === postId)
        .map(c => createCommentCard(c)).join('');
}

// Delete Post
function deletePost(postId) {
    if (confirm('هل أنت متأكد من حذف هذه الخاطرة؟')) {
        posts = posts.filter(p => p.id !== parseInt(postId));
        localStorage.setItem('socialPosts', JSON.stringify(posts));
        showFeed();
    }
}

// Profile Page
function showProfile(userId) {
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return;
    
    const userPosts = posts.filter(p => p.userId === user.id);
    const followers = follows.filter(f => f.followedId === user.id);
    const following = follows.filter(f => f.followerId === user.id);
    const isFollowing = follows.some(f => f.followerId === currentUser.id && f.followedId === user.id);
    const isOwnProfile = user.id === currentUser.id;
    
    updateNavbar();
    
    document.getElementById('mainContainer').innerHTML = `
        <div style="grid-column: 1 / -1;">
            <div class="profile-header">
                <div class="profile-avatar">${user.avatar}</div>
                <h1 class="profile-name">${user.name}</h1>
                <p class="profile-bio">${user.bio}</p>
                
                <div class="profile-stats">
                    <div class="stat">
                        <div class="stat-number">${userPosts.length}</div>
                        <div class="stat-label">خاطرة</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${followers.length}</div>
                        <div class="stat-label">متابع</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${following.length}</div>
                        <div class="stat-label">يتابع</div>
                    </div>
                </div>
                
                ${!isOwnProfile ? `
                    <button class="follow-btn ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${user.id}')">
                        ${isFollowing ? 'إلغاء المتابعة' : '+ متابعة'}
                    </button>
                ` : ''}
            </div>
            
            ${user.details && (user.details.birthPlace || user.details.currentCity || user.details.education || user.details.work) ? `
                <div class="profile-details">
                    <h3 style="margin-bottom: 15px; color: var(--primary);">ℹ️ معلومات إضافية</h3>
                    ${user.details.birthPlace ? `
                        <div class="detail-row">
                            <span class="detail-label">🏙️ مكان الولادة:</span>
                            <span class="detail-value">${user.details.birthPlace}</span>
                        </div>
                    ` : ''}
                    ${user.details.currentCity ? `
                        <div class="detail-row">
                            <span class="detail-label">📍 مكان الإقامة:</span>
                            <span class="detail-value">${user.details.currentCity}</span>
                        </div>
                    ` : ''}
                    ${user.details.education ? `
                        <div class="detail-row">
                            <span class="detail-label">🎓 الدراسة:</span>
                            <span class="detail-value">${user.details.education}</span>
                        </div>
                    ` : ''}
                    ${user.details.work ? `
                        <div class="detail-row">
                            <span class="detail-label">💼 العمل:</span>
                            <span class="detail-value">${user.details.work}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <h2 style="margin: 30px 0 20px; font-size: 1.5rem;">📝 الخواطر</h2>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
                ${userPosts.length > 0 ? userPosts.map(post => createPostCard(post)).join('') : '<p style="text-align: center; color: var(--text-light); padding: 40px;">لا توجد خواطر بعد</p>'}
            </div>
        </div>
    `;
}

function toggleFollow(userId) {
    const followRecord = follows.find(f => f.followerId === currentUser.id && f.followedId === parseInt(userId));
    
    if (followRecord) {
        follows = follows.filter(f => f.id !== followRecord.id);
    } else {
        follows.push({
            id: Date.now(),
            followerId: currentUser.id,
            followedId: parseInt(userId),
            createdAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('socialFollows', JSON.stringify(follows));
    showProfile(userId);
}

// Settings Page
function showSettings() {
    updateNavbar();
    
    const user = currentUser;
    
    document.getElementById('mainContainer').innerHTML = `
        <div class="settings-container" style="grid-column: 1 / -1; max-width: 800px; margin: 0 auto;">
            <h1 style="margin-bottom: 30px;">⚙️ الإعدادات</h1>
            
            <div class="settings-section">
                <h3 class="settings-title">الملف الشخصي</h3>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>الاسم</label>
                        <input type="text" id="settingsName" value="${user.name}">
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>النبذة التعريفية</label>
                        <input type="text" id="settingsBio" value="${user.bio}">
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3 class="settings-title">ℹ️ معلومات إضافية</h3>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>🏙️ مكان الولادة</label>
                        <input type="text" id="settingsBirthPlace" value="${user.details?.birthPlace || ''}" placeholder="مثال: دمشق">
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>📍 مكان الإقامة الحالي</label>
                        <input type="text" id="settingsCurrentCity" value="${user.details?.currentCity || ''}" placeholder="مثال: الرياض">
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>🎓 الدراسة</label>
                        <input type="text" id="settingsEducation" value="${user.details?.education || ''}" placeholder="مثال: هندسة معلوماتية">
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>💼 العمل</label>
                        <input type="text" id="settingsWork" value="${user.details?.work || ''}" placeholder="مثال: مطور برمجيات">
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3 class="settings-title">🔒 الأمان</h3>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="settingsEmail" value="${user.email}">
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>كلمة المرور الجديدة</label>
                        <input type="password" id="settingsPassword" placeholder="اتركه فارغاً إذا لم ترد التغيير">
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3 class="settings-title">🔔 الإشعارات</h3>
                
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>تفعيل الإشعارات</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="settingsNotifications" ${user.settings.notifications ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>إشعارات البريد الإلكتروني</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="settingsEmailNotifications" ${user.settings.emailNotifications ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3 class="settings-title">🔐 الخصوصية</h3>
                
                <div class="setting-item">
                    <div class="input-group">
                        <label>خصوصية الحساب</label>
                        <select id="settingsPrivacy">
                            <option value="public" ${user.settings.privacy === 'public' ? 'selected' : ''}>عام - يمكن للجميع رؤية خواطري</option>
                            <option value="followers" ${user.settings.privacy === 'followers' ? 'selected' : ''}>المتابعون فقط</option>
                            <option value="private" ${user.settings.privacy === 'private' ? 'selected' : ''}>خاص - أنا فقط</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <button class="submit-btn" onclick="saveSettings()">💾 حفظ التغييرات</button>
            
            <div class="settings-section">
                <button class="submit-btn" style="background: var(--danger);" onclick="deleteAccount()">🗑️ حذف الحساب</button>
            </div>
        </div>
    `;
}

function saveSettings() {
    const name = document.getElementById('settingsName').value.trim();
    const bio = document.getElementById('settingsBio').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    const password = document.getElementById('settingsPassword').value;
    const notifications = document.getElementById('settingsNotifications').checked;
    const emailNotifications = document.getElementById('settingsEmailNotifications').checked;
    const privacy = document.getElementById('settingsPrivacy').value;
    
    // Details
    const birthPlace = document.getElementById('settingsBirthPlace').value.trim();
    const currentCity = document.getElementById('settingsCurrentCity').value.trim();
    const education = document.getElementById('settingsEducation').value.trim();
    const work = document.getElementById('settingsWork').value.trim();
    
    if (!name || !email) {
        alert('الرجاء إدخال الاسم والبريد الإلكتروني');
        return;
    }
    
    currentUser.name = name;
    currentUser.bio = bio;
    currentUser.email = email;
    currentUser.avatar = name.charAt(0).toUpperCase();
    
    if (password) {
        currentUser.password = password;
    }
    
    currentUser.details = {
        birthPlace,
        currentCity,
        education,
        work
    };
    
    currentUser.settings = {
        notifications,
        emailNotifications,
        privacy
    };
    
    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('socialUsers', JSON.stringify(users));
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    alert('✅ تم حفظ التغييرات بنجاح!');
    showFeed();
}

function deleteAccount() {
    if (confirm('هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        // Delete user
        users = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('socialUsers', JSON.stringify(users));
        
        // Delete user's posts
        posts = posts.filter(p => p.userId !== currentUser.id);
        localStorage.setItem('socialPosts', JSON.stringify(posts));
        
        // Delete user's comments
        comments = comments.filter(c => c.userId !== currentUser.id);
        localStorage.setItem('socialComments', JSON.stringify(comments));
        
        // Delete user's reactions
        reactions = reactions.filter(r => r.userId !== currentUser.id);
        localStorage.setItem('socialReactions', JSON.stringify(reactions));
        
        // Delete follows
        follows = follows.filter(f => f.followerId !== currentUser.id && f.followedId !== currentUser.id);
        localStorage.setItem('socialFollows', JSON.stringify(follows));
        
        logout();
    }
}

// Save/Unsave Post
function toggleSavePost(postId) {
    const saved = savedPosts.find(sp => sp.userId === currentUser.id && sp.postId === parseInt(postId));
    
    if (saved) {
        savedPosts = savedPosts.filter(sp => sp.id !== saved.id);
        alert('تم إلغاء حفظ الخاطرة');
    } else {
        savedPosts.push({
            id: Date.now(),
            userId: currentUser.id,
            postId: parseInt(postId),
            savedAt: new Date().toISOString()
        });
        alert('✅ تم حفظ الخاطرة');
    }
    
    localStorage.setItem('socialSavedPosts', JSON.stringify(savedPosts));
    showFeed();
}

// Show Saved Posts
function showSavedPosts() {
    updateNavbar();
    
    const userSavedPosts = savedPosts.filter(sp => sp.userId === currentUser.id);
    const savedPostsData = userSavedPosts.map(sp => posts.find(p => p.id === sp.postId)).filter(p => p);
    
    document.getElementById('mainContainer').innerHTML = `
        <div style="grid-column: 1 / -1;">
            <h1 style="margin-bottom: 30px;">🔖 المنشورات المحفوظة</h1>
            
            ${savedPostsData.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${savedPostsData.map(post => createPostCard(post)).join('')}
                </div>
            ` : `
                <div style="text-align: center; padding: 60px; background: var(--bg); border-radius: 12px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📌</div>
                    <h2 style="margin-bottom: 10px;">لا توجد منشورات محفوظة</h2>
                    <p style="color: var(--text-light);">احفظ المنشورات المهمة لتجدها هنا</p>
                </div>
            `}
        </div>
    `;
}

// Suggested Friends
function showSuggestedFriends() {
    updateNavbar();
    
    const currentFollowing = follows.filter(f => f.followerId === currentUser.id).map(f => f.followedId);
    const suggested = users.filter(u => 
        u.id !== currentUser.id && 
        !currentFollowing.includes(u.id)
    ).slice(0, 20);
    
    document.getElementById('mainContainer').innerHTML = `
        <div style="grid-column: 1 / -1;">
            <h1 style="margin-bottom: 30px;">👥 اقتراح أصدقاء</h1>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${suggested.map(user => {
                    const userPosts = posts.filter(p => p.userId === user.id);
                    const followers = follows.filter(f => f.followedId === user.id);
                    
                    return `
                        <div style="background: var(--bg); border-radius: 12px; padding: 25px; text-align: center; box-shadow: var(--shadow);">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; margin: 0 auto 15px;">
                                ${user.avatar}
                            </div>
                            <h3 style="margin-bottom: 10px;">${user.name}</h3>
                            <p style="color: var(--text-light); margin-bottom: 15px; font-size: 0.9rem;">${user.bio}</p>
                            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 15px;">
                                <div>
                                    <strong>${userPosts.length}</strong>
                                    <div style="font-size: 0.85rem; color: var(--text-light);">خاطرة</div>
                                </div>
                                <div>
                                    <strong>${followers.length}</strong>
                                    <div style="font-size: 0.85rem; color: var(--text-light);">متابع</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button class="post-btn" onclick="showProfile('${user.id}')" style="flex: 1;">عرض الصفحة</button>
                                <button class="post-btn" onclick="toggleFollow('${user.id}'); showSuggestedFriends();" style="flex: 1; background: var(--secondary);">متابعة</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Admin Panel
function showAdminPanel() {
    if (!currentUser.isAdmin) {
        alert('غير مصرح لك بالدخول');
        return;
    }
    
    updateNavbar();
    
    const totalUsers = users.length;
    const totalPosts = posts.length;
    const totalComments = comments.length;
    const totalReactions = reactions.length;
    
    const usersList = users.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
    
    document.getElementById('mainContainer').innerHTML = `
        <div style="grid-column: 1 / -1;">
            <div class="admin-header">
                <h1 style="font-size: 2.5rem; margin-bottom: 10px;">👑 لوحة تحكم المدير</h1>
                <p style="opacity: 0.9;">مرحباً ${currentUser.name}، إليك نظرة عامة على الموقع</p>
            </div>
            
            <div class="admin-stats">
                <div class="admin-stat-card">
                    <div class="admin-stat-number">${totalUsers}</div>
                    <div class="admin-stat-label">👥 المستخدمون</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-number">${totalPosts}</div>
                    <div class="admin-stat-label">📝 الخواطر</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-number">${totalComments}</div>
                    <div class="admin-stat-label">💬 التعليقات</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-number">${totalReactions}</div>
                    <div class="admin-stat-label">❤️ التفاعلات</div>
                </div>
            </div>
            
            <div class="admin-panel">
                <h2 style="margin-bottom: 20px;">📊 إدارة المستخدمين</h2>
                
                <div class="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>البريد</th>
                                <th>تاريخ التسجيل</th>
                                <th>الخواطر</th>
                                <th>المتابعون</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usersList.map(user => {
                                const userPosts = posts.filter(p => p.userId === user.id);
                                const followers = follows.filter(f => f.followedId === user.id);
                                const joinDate = new Date(user.joinDate).toLocaleDateString('ar-SA');
                                
                                return `
                                    <tr>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                                    ${user.avatar}
                                                </div>
                                                ${user.name}
                                                ${user.isAdmin ? '<span style="background: var(--warning); color: white; padding: 2px 8px; border-radius: 5px; font-size: 0.75rem; margin-right: 5px;">مدير</span>' : ''}
                                            </div>
                                        </td>
                                        <td>${user.email}</td>
                                        <td>${joinDate}</td>
                                        <td>${userPosts.length}</td>
                                        <td>${followers.length}</td>
                                        <td>
                                            <button class="action-btn view" onclick="showProfile('${user.id}')">عرض</button>
                                            ${!user.isAdmin ? `
                                                <button class="action-btn delete" onclick="adminDeleteUser('${user.id}')">حذف</button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="admin-panel" style="margin-top: 20px;">
                <h2 style="margin-bottom: 20px;">📝 إدارة الخواطر</h2>
                
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${posts.slice(0, 10).map(post => {
                        const author = users.find(u => u.id === post.userId);
                        return `
                            <div style="background: var(--light); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <strong>${author?.name || 'مستخدم محذوف'}</strong>
                                        <p style="margin: 10px 0; color: var(--text-light);">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                                        <small style="color: var(--text-light);">${getTimeAgo(post.createdAt)}</small>
                                    </div>
                                    <button class="action-btn delete" onclick="adminDeletePost('${post.id}')">حذف</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function adminDeleteUser(userId) {
    if (!currentUser.isAdmin) return;
    
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return;
    
    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) {
        // Delete user
        users = users.filter(u => u.id !== parseInt(userId));
        localStorage.setItem('socialUsers', JSON.stringify(users));
        
        // Delete user's posts
        posts = posts.filter(p => p.userId !== parseInt(userId));
        localStorage.setItem('socialPosts', JSON.stringify(posts));
        
        // Delete user's comments
        comments = comments.filter(c => c.userId !== parseInt(userId));
        localStorage.setItem('socialComments', JSON.stringify(comments));
        
        // Delete user's reactions
        reactions = reactions.filter(r => r.userId !== parseInt(userId));
        localStorage.setItem('socialReactions', JSON.stringify(reactions));
        
        // Delete follows
        follows = follows.filter(f => f.followerId !== parseInt(userId) && f.followedId !== parseInt(userId));
        localStorage.setItem('socialFollows', JSON.stringify(follows));
        
        alert('✅ تم حذف المستخدم بنجاح');
        showAdminPanel();
    }
}

function adminDeletePost(postId) {
    if (!currentUser.isAdmin) return;
    
    if (confirm('هل أنت متأكد من حذف هذه الخاطرة؟')) {
        posts = posts.filter(p => p.id !== parseInt(postId));
        localStorage.setItem('socialPosts', JSON.stringify(posts));
        
        alert('✅ تم حذف الخاطرة بنجاح');
        showAdminPanel();
    }
}
