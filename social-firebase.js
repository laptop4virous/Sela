// =====================================================
// Firebase Configuration - استبدل هذه البيانات ببياناتك من Firebase Console
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyBXPOLoPiWgQkXT0zvu3-ESxBz4btguwvE",
  authDomain: "sela-x.firebaseapp.com",
  databaseURL: "https://sela-x-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sela-x",
  storageBucket: "sela-x.firebasestorage.app",
  messagingSenderId: "590252697932",
  appId: "1:590252697932:web:ee3c9f5c0b11e45ece07e9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

// =====================================================
// Global Variables
// =====================================================
let currentUser = null;
const ADMIN_EMAIL = 'admin@khawater.com';

// =====================================================
// Authentication & User Management
// =====================================================

// Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showFeed();
    } else {
        document.getElementById('authModal').classList.add('active');
    }
});

// Auth UI
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

// Login
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('الرجاء إدخال جميع البيانات');
        return;
    }
    
    try {
        const snapshot = await database.ref('users').orderByChild('email').equalTo(email).once('value');
        
        if (!snapshot.exists()) {
            alert('البريد الإلكتروني غير موجود');
            return;
        }
        
        const users = snapshot.val();
        const userId = Object.keys(users)[0];
        const user = users[userId];
        
        if (user.password !== password) {
            alert('كلمة المرور غير صحيحة');
            return;
        }
        
        currentUser = { ...user, id: userId };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        document.getElementById('authModal').classList.remove('active');
        showFeed();
    } catch (error) {
        console.error('Login error:', error);
        alert('حدث خطأ في تسجيل الدخول');
    }
}

// Register
async function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
        alert('الرجاء إدخال جميع البيانات');
        return;
    }
    
    try {
        // Check if email exists
        const snapshot = await database.ref('users').orderByChild('email').equalTo(email).once('value');
        
        if (snapshot.exists()) {
            alert('البريد الإلكتروني مستخدم مسبقاً');
            return;
        }
        
        // Create new user
        const newUserRef = database.ref('users').push();
        const userId = newUserRef.key;
        
        const newUser = {
            id: userId,
            name,
            email,
            password,
            bio: 'مرحباً بكم في صفحتي! 👋',
            avatar: name.charAt(0).toUpperCase(),
            profileImage: '',
            coverImage: '',
            joinDate: new Date().toISOString(),
            isAdmin: email === ADMIN_EMAIL,
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
        
        await newUserRef.set(newUser);
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        document.getElementById('authModal').classList.remove('active');
        showFeed();
    } catch (error) {
        console.error('Register error:', error);
        alert('حدث خطأ في إنشاء الحساب');
    }
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('authModal').classList.add('active');
    document.getElementById('mainContainer').innerHTML = '';
    document.getElementById('searchContainer').style.display = 'none';
}

// =====================================================
// Navigation & UI
// =====================================================

function updateNavbar() {
    const navLinks = document.getElementById('navLinks');
    const searchContainer = document.getElementById('searchContainer');
    
    if (currentUser) {
        searchContainer.style.display = 'block';
        
        const avatarDisplay = currentUser.profileImage 
            ? `<img src="${currentUser.profileImage}" alt="${currentUser.name}">` 
            : currentUser.avatar;
        
        navLinks.innerHTML = `
            <button class="theme-toggle" onclick="toggleTheme()" id="themeToggle">🌙</button>
            <div style="position: relative;">
                <button class="notifications-btn" onclick="toggleNotifications()">
                    🔔
                    <span class="notification-badge" id="notifBadge" style="display: none;">0</span>
                </button>
                <div class="notifications-panel" id="notificationsPanel"></div>
            </div>
            <button class="nav-link" onclick="showFeed()">🏠 الرئيسية</button>
            ${currentUser.isAdmin ? '<button class="nav-link" onclick="showAdminPanel()">👑 لوحة التحكم</button>' : ''}
            <button class="nav-link" onclick="showSuggestedFriends()">👥 أصدقاء</button>
            <button class="nav-link" onclick="showSavedPosts()">🔖 محفوظات</button>
            <button class="nav-link" onclick="showProfile('${currentUser.id}')">👤 صفحتي</button>
            <button class="nav-link" onclick="showSettings()">⚙️ إعدادات</button>
            <button class="nav-link" onclick="logout()">🚪 خروج</button>
            <div class="user-avatar" onclick="showProfile('${currentUser.id}')">
                ${avatarDisplay}
            </div>
        `;
    }
    updateThemeIcon();
    loadNotifications();
}

// Search Users
async function searchUsers() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    try {
        const snapshot = await database.ref('users').once('value');
        const users = snapshot.val();
        
        if (!users) {
            resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-light);">لا توجد نتائج</div>';
            resultsDiv.classList.add('active');
            return;
        }
        
        const results = Object.entries(users).filter(([id, user]) => 
            id !== currentUser.id && 
            (user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
        );
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-light);">لا توجد نتائج</div>';
            resultsDiv.classList.add('active');
            return;
        }
        
        resultsDiv.innerHTML = results.map(([id, user]) => {
            const avatarDisplay = user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}">` 
                : user.avatar;
            
            return `
                <div class="search-result-item" onclick="showProfile('${id}'); document.getElementById('searchResults').classList.remove('active');">
                    <div class="search-avatar">${avatarDisplay}</div>
                    <div>
                        <div style="font-weight: 700; display: flex; align-items: center; gap: 5px;">
                            ${user.name}
                            ${user.isAdmin ? '<span class="verified-badge">✓</span>' : ''}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-light);">${user.email}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultsDiv.classList.add('active');
    } catch (error) {
        console.error('Search error:', error);
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById('searchResults')?.classList.remove('active');
    }
    if (!e.target.closest('.notifications-btn') && !e.target.closest('.notifications-panel')) {
        const panel = document.getElementById('notificationsPanel');
        if (panel) panel.classList.remove('active');
    }
});

// =====================================================
// Notifications
// =====================================================

async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const snapshot = await database.ref('notifications').orderByChild('userId').equalTo(currentUser.id).once('value');
        const notifications = snapshot.val();
        
        if (!notifications) {
            document.getElementById('notifBadge').style.display = 'none';
            return;
        }
        
        const notifArray = Object.entries(notifications).map(([id, notif]) => ({ id, ...notif }));
        const unreadCount = notifArray.filter(n => !n.read).length;
        
        const badge = document.getElementById('notifBadge');
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Load notifications error:', error);
    }
}

async function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('active');
    
    if (!panel.classList.contains('active')) return;
    
    try {
        const snapshot = await database.ref('notifications').orderByChild('userId').equalTo(currentUser.id).once('value');
        const notifications = snapshot.val();
        
        if (!notifications) {
            panel.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-light);">لا توجد إشعارات</div>';
            return;
        }
        
        const notifArray = Object.entries(notifications)
            .map(([id, notif]) => ({ id, ...notif }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        panel.innerHTML = notifArray.map(notif => {
            const user = notif.fromUser || { name: 'مستخدم', avatar: '👤' };
            const avatarDisplay = user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                : user.avatar;
            
            return `
                <div class="notification-item ${!notif.read ? 'unread' : ''}" onclick="handleNotificationClick('${notif.id}', '${notif.type}', '${notif.relatedId}')">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; overflow: hidden;">
                        ${avatarDisplay}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${notif.message}</div>
                        <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 3px;">${getTimeAgo(notif.createdAt)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Mark all as read
        notifArray.forEach(notif => {
            if (!notif.read) {
                database.ref(`notifications/${notif.id}`).update({ read: true });
            }
        });
        
        setTimeout(loadNotifications, 500);
    } catch (error) {
        console.error('Toggle notifications error:', error);
    }
}

async function handleNotificationClick(notifId, type, relatedId) {
    document.getElementById('notificationsPanel').classList.remove('active');
    
    if (type === 'follow') {
        showProfile(relatedId);
    } else if (type === 'comment' || type === 'reaction') {
        showFeed();
    }
}

async function createNotification(userId, type, message, relatedId, fromUser) {
    try {
        await database.ref('notifications').push({
            userId,
            type,
            message,
            relatedId,
            fromUser: {
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                profileImage: currentUser.profileImage || ''
            },
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Create notification error:', error);
    }
}

// =====================================================
// Feed & Posts
// =====================================================

async function showFeed() {
    updateNavbar();
    
    try {
        const postsSnapshot = await database.ref('posts').once('value');
        const posts = postsSnapshot.val();
        
        let sortedPosts = [];
        if (posts) {
            sortedPosts = Object.entries(posts)
                .map(([id, post]) => ({ id, ...post }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        const suggestedUsers = await getSuggestedUsersHTML();
        
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
                    ${suggestedUsers}
                </div>
            </aside>
            
            <div class="main-feed">
                ${createPostCreator()}
                <div id="postsContainer">
                    ${sortedPosts.length > 0 ? sortedPosts.map(post => createPostCard(post)).join('') : '<div class="loading">لا توجد خواطر بعد</div>'}
                </div>
            </div>
            
            <aside class="sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-title">📊 إحصائيات</div>
                    <div style="padding: 10px;">
                        <p><strong>${sortedPosts.length}</strong> خاطرة</p>
                    </div>
                </div>
            </aside>
        `;
    } catch (error) {
        console.error('Show feed error:', error);
    }
}

async function getSuggestedUsersHTML() {
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val();
        
        if (!users) return '';
        
        const followsSnapshot = await database.ref('follows').orderByChild('followerId').equalTo(currentUser.id).once('value');
        const follows = followsSnapshot.val();
        const followingIds = follows ? Object.values(follows).map(f => f.followedId) : [];
        
        const otherUsers = Object.entries(users)
            .filter(([id, user]) => id !== currentUser.id && !followingIds.includes(id))
            .slice(0, 5);
        
        return otherUsers.map(([id, user]) => {
            const avatarDisplay = user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                : user.avatar;
            
            return `
                <div class="sidebar-item" onclick="showProfile('${id}')">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; overflow: hidden;">
                        ${avatarDisplay}
                    </div>
                    <span>${user.name}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Get suggested users error:', error);
        return '';
    }
}

function createPostCreator() {
    return `
        <div class="post-creator">
            <textarea id="postContent" placeholder="ما الذي يدور في ذهنك؟" maxlength="700" oninput="updateCharCount()"></textarea>
            <div class="char-counter" id="charCounter">0 / 700</div>
            <div class="post-actions">
                <div class="image-upload">
                    <input type="file" id="postImage" accept="image/*" style="display: none;" onchange="previewPostImage()">
                    <button class="upload-btn" onclick="document.getElementById('postImage').click()">📷 صورة</button>
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

function previewPostImage() {
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

async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const imageFile = document.getElementById('postImage').files[0];
    
    if (!content && !imageFile) {
        alert('الرجاء كتابة خاطرة أو إضافة صورة');
        return;
    }
    
    try {
        let imageUrl = '';
        
        if (imageFile) {
            const storageRef = storage.ref(`posts/${Date.now()}_${imageFile.name}`);
            const snapshot = await storageRef.put(imageFile);
            imageUrl = await snapshot.ref.getDownloadURL();
        }
        
        await database.ref('posts').push({
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            userProfileImage: currentUser.profileImage || '',
            isAdmin: currentUser.isAdmin || false,
            content,
            image: imageUrl,
            createdAt: new Date().toISOString()
        });
        
        showFeed();
    } catch (error) {
        console.error('Create post error:', error);
        alert('حدث خطأ في نشر الخاطرة');
    }
}

function createPostCard(post) {
    const avatarDisplay = post.userProfileImage 
        ? `<img src="${post.userProfileImage}" alt="${post.userName}">` 
        : post.userAvatar;
    
    const timeAgo = getTimeAgo(post.createdAt);
    
    return `
        <div class="post-card">
            <div class="post-header">
                <div class="post-author" onclick="showProfile('${post.userId}')">
                    <div class="post-avatar">${avatarDisplay}</div>
                    <div class="post-author-info">
                        <h4>
                            ${post.userName}
                            ${post.isAdmin ? '<span class="verified-badge" title="موثق">✓</span>' : ''}
                        </h4>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <div class="post-menu" onclick="toggleSavePost('${post.id}')" title="حفظ">🔖</div>
                    ${post.userId === currentUser.id || currentUser.isAdmin ? `
                        <div class="post-menu" onclick="deletePost('${post.id}')">🗑️</div>
                    ` : ''}
                </div>
            </div>
            
            <div class="post-content">${post.content}</div>
            
            ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ''}
            
            <div class="post-reactions" id="reactions-${post.id}">
                <div class="reactions-dropdown">
                    <button class="reaction-btn" onmouseenter="showReactionsDropdown('${post.id}')" onmouseleave="hideReactionsDropdown('${post.id}')" onclick="handleReactionClick('${post.id}')">
                        <span id="reaction-icon-${post.id}">👍</span>
                        <span class="reaction-count" id="reaction-count-${post.id}">0</span>
                    </button>
                    <div class="reactions-options" id="reactions-options-${post.id}" onmouseenter="showReactionsDropdown('${post.id}')" onmouseleave="hideReactionsDropdown('${post.id}')">
                        <span class="reaction-option" onclick="addReaction('${post.id}', '❤️')">❤️</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😍')">😍</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😂')">😂</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😮')">😮</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😢')">😢</span>
                        <span class="reaction-option" onclick="addReaction('${post.id}', '😡')">😡</span>
                    </div>
                </div>
                
                <button class="reaction-btn" onclick="toggleComments('${post.id}')">
                    💬 <span class="reaction-count" id="comment-count-${post.id}">0</span>
                </button>
            </div>
            
            <div class="comments-section hidden" id="comments-${post.id}">
                <div class="comment-input">
                    <input type="text" id="comment-input-${post.id}" placeholder="اكتب تعليقاً..." onkeypress="if(event.key==='Enter') addComment('${post.id}')">
                    <button class="comment-btn" onclick="addComment('${post.id}')">نشر</button>
                </div>
                <div id="comments-list-${post.id}"></div>
            </div>
        </div>
    `;
}

// Load reactions and comments for posts
async function loadPostInteractions() {
    try {
        const postsSnapshot = await database.ref('posts').once('value');
        const posts = postsSnapshot.val();
        
        if (!posts) return;
        
        for (const postId in posts) {
            loadReactions(postId);
            loadComments(postId);
        }
    } catch (error) {
        console.error('Load interactions error:', error);
    }
}

async function loadReactions(postId) {
    try {
        const snapshot = await database.ref('reactions').orderByChild('postId').equalTo(postId).once('value');
        const reactions = snapshot.val();
        
        const countEl = document.getElementById(`reaction-count-${postId}`);
        const iconEl = document.getElementById(`reaction-icon-${postId}`);
        
        if (!reactions) {
            if (countEl) countEl.textContent = '0';
            if (iconEl) iconEl.textContent = '👍';
            return;
        }
        
        const reactionsArray = Object.values(reactions);
        if (countEl) countEl.textContent = reactionsArray.length;
        
        const userReaction = reactionsArray.find(r => r.userId === currentUser.id);
        if (iconEl && userReaction) {
            iconEl.textContent = userReaction.type;
        } else if (iconEl) {
            iconEl.textContent = '👍';
        }
    } catch (error) {
        console.error('Load reactions error:', error);
    }
}

async function loadComments(postId) {
    try {
        const snapshot = await database.ref('comments').orderByChild('postId').equalTo(postId).once('value');
        const comments = snapshot.val();
        
        const countEl = document.getElementById(`comment-count-${postId}`);
        const listEl = document.getElementById(`comments-list-${postId}`);
        
        if (!comments) {
            if (countEl) countEl.textContent = '0';
            if (listEl) listEl.innerHTML = '';
            return;
        }
        
        const commentsArray = Object.entries(comments)
            .map(([id, comment]) => ({ id, ...comment }))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        if (countEl) countEl.textContent = commentsArray.length;
        
        if (listEl) {
            listEl.innerHTML = commentsArray.map(comment => createCommentCard(comment)).join('');
        }
    } catch (error) {
        console.error('Load comments error:', error);
    }
}

function createCommentCard(comment) {
    const avatarDisplay = comment.userProfileImage 
        ? `<img src="${comment.userProfileImage}" alt="${comment.userName}">` 
        : comment.userAvatar;
    
    return `
        <div class="comment">
            <div class="comment-avatar">${avatarDisplay}</div>
            <div class="comment-content">
                <div class="comment-author">${comment.userName}</div>
                <div class="comment-text">${comment.content}</div>
            </div>
        </div>
    `;
}

function showReactionsDropdown(postId) {
    const dropdown = document.getElementById(`reactions-options-${postId}`);
    if (dropdown) dropdown.classList.add('active');
}

function hideReactionsDropdown(postId) {
    setTimeout(() => {
        const dropdown = document.getElementById(`reactions-options-${postId}`);
        if (dropdown) dropdown.classList.remove('active');
    }, 200);
}

function handleReactionClick(postId) {
    addReaction(postId, '👍');
}

async function addReaction(postId, type) {
    try {
        const snapshot = await database.ref('reactions').orderByChild('postId').equalTo(postId).once('value');
        const reactions = snapshot.val();
        
        let existingReactionKey = null;
        if (reactions) {
            for (const [key, reaction] of Object.entries(reactions)) {
                if (reaction.userId === currentUser.id) {
                    existingReactionKey = key;
                    break;
                }
            }
        }
        
        if (existingReactionKey) {
            await database.ref(`reactions/${existingReactionKey}`).update({ type });
        } else {
            const postSnapshot = await database.ref(`posts/${postId}`).once('value');
            const post = postSnapshot.val();
            
            await database.ref('reactions').push({
                postId,
                userId: currentUser.id,
                type,
                createdAt: new Date().toISOString()
            });
            
            if (post && post.userId !== currentUser.id) {
                await createNotification(
                    post.userId,
                    'reaction',
                    `أعجب ${currentUser.name} بخاطرتك`,
                    postId
                );
            }
        }
        
        loadReactions(postId);
    } catch (error) {
        console.error('Add reaction error:', error);
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
        commentsSection.classList.toggle('hidden');
        if (!commentsSection.classList.contains('hidden')) {
            loadComments(postId);
        }
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const postSnapshot = await database.ref(`posts/${postId}`).once('value');
        const post = postSnapshot.val();
        
        await database.ref('comments').push({
            postId,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            userProfileImage: currentUser.profileImage || '',
            content,
            createdAt: new Date().toISOString()
        });
        
        if (post && post.userId !== currentUser.id) {
            await createNotification(
                post.userId,
                'comment',
                `علق ${currentUser.name} على خاطرتك`,
                postId
            );
        }
        
        input.value = '';
        loadComments(postId);
    } catch (error) {
        console.error('Add comment error:', error);
    }
}

async function deletePost(postId) {
    if (confirm('هل أنت متأكد من حذف هذه الخاطرة؟')) {
        try {
            await database.ref(`posts/${postId}`).remove();
            showFeed();
        } catch (error) {
            console.error('Delete post error:', error);
        }
    }
}

async function toggleSavePost(postId) {
    try {
        const snapshot = await database.ref('savedPosts').orderByChild('userId').equalTo(currentUser.id).once('value');
        const savedPosts = snapshot.val();
        
        let existingKey = null;
        if (savedPosts) {
            for (const [key, saved] of Object.entries(savedPosts)) {
                if (saved.postId === postId) {
                    existingKey = key;
                    break;
                }
            }
        }
        
        if (existingKey) {
            await database.ref(`savedPosts/${existingKey}`).remove();
            alert('تم إلغاء حفظ الخاطرة');
        } else {
            await database.ref('savedPosts').push({
                userId: currentUser.id,
                postId,
                savedAt: new Date().toISOString()
            });
            alert('✅ تم حفظ الخاطرة');
        }
    } catch (error) {
        console.error('Toggle save error:', error);
    }
}

async function showSavedPosts() {
    updateNavbar();
    
    try {
        const snapshot = await database.ref('savedPosts').orderByChild('userId').equalTo(currentUser.id).once('value');
        const savedPosts = snapshot.val();
        
        let savedPostsData = [];
        if (savedPosts) {
            const postIds = Object.values(savedPosts).map(sp => sp.postId);
            const postsSnapshot = await database.ref('posts').once('value');
            const allPosts = postsSnapshot.val();
            
            if (allPosts) {
                savedPostsData = postIds
                    .map(id => allPosts[id] ? { id, ...allPosts[id] } : null)
                    .filter(p => p);
            }
        }
        
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
        
        setTimeout(loadPostInteractions, 100);
    } catch (error) {
        console.error('Show saved posts error:', error);
    }
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

// Load interactions after feed loads
setTimeout(() => {
    if (document.getElementById('postsContainer')) {
        loadPostInteractions();
    }
}, 500);

// Continue in next part...

// =====================================================
// Profile
// =====================================================

async function showProfile(userId) {
    updateNavbar();
    
    try {
        const userSnapshot = await database.ref(`users/${userId}`).once('value');
        const user = userSnapshot.val();
        
        if (!user) {
            alert('المستخدم غير موجود');
            showFeed();
            return;
        }
        
        const postsSnapshot = await database.ref('posts').orderByChild('userId').equalTo(userId).once('value');
        const posts = postsSnapshot.val();
        const userPosts = posts ? Object.entries(posts).map(([id, post]) => ({ id, ...post})) : [];
        
        const followsSnapshot = await database.ref('follows').once('value');
        const follows = followsSnapshot.val();
        const followers = follows ? Object.values(follows).filter(f => f.followedId === userId) : [];
        const following = follows ? Object.values(follows).filter(f => f.followerId === userId) : [];
        const isFollowing = follows ? Object.values(follows).some(f => f.followerId === currentUser.id && f.followedId === userId) : false;
        const isOwnProfile = userId === currentUser.id;
        
        const avatarDisplay = user.profileImage 
            ? `<img src="${user.profileImage}" alt="${user.name}">` 
            : user.avatar;
        
        const coverDisplay = user.coverImage 
            ? `<img src="${user.coverImage}" class="profile-cover" alt="Cover">` 
            : '';
        
        document.getElementById('mainContainer').innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="profile-header">
                    ${coverDisplay}
                    ${isOwnProfile ? `
                        <input type="file" id="coverUpload" accept="image/*" style="display: none;" onchange="uploadCover()">
                        <button onclick="document.getElementById('coverUpload').click()" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; z-index: 2;">
                            📷 تغيير الغلاف
                        </button>
                    ` : ''}
                    
                    <div class="profile-avatar" style="position: relative;">
                        ${avatarDisplay}
                        ${isOwnProfile ? `
                            <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="uploadAvatar()">
                            <button onclick="document.getElementById('avatarUpload').click()" style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 1.2rem;">
                                📷
                            </button>
                        ` : ''}
                    </div>
                    
                    <h1 class="profile-name">
                        ${user.name}
                        ${user.isAdmin ? '<span class="verified-badge" title="موثق">✓</span>' : ''}
                    </h1>
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
                        <button class="follow-btn ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${userId}')">
                            ${isFollowing ? 'إلغاء المتابعة' : '+ متابعة'}
                        </button>
                    ` : ''}
                </div>
                
                ${user.details && (user.details.birthPlace || user.details.currentCity || user.details.education || user.details.work) ? `
                    <div style="background: var(--bg); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 15px; color: var(--primary);">ℹ️ معلومات إضافية</h3>
                        <div style="display: grid; gap: 10px;">
                            ${user.details.birthPlace ? `<div><strong>🏙️ مكان الولادة:</strong> ${user.details.birthPlace}</div>` : ''}
                            ${user.details.currentCity ? `<div><strong>📍 مكان الإقامة:</strong> ${user.details.currentCity}</div>` : ''}
                            ${user.details.education ? `<div><strong>🎓 الدراسة:</strong> ${user.details.education}</div>` : ''}
                            ${user.details.work ? `<div><strong>💼 العمل:</strong> ${user.details.work}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <h2 style="margin: 30px 0 20px; font-size: 1.5rem;">📝 الخواطر</h2>
                
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${userPosts.length > 0 ? userPosts.map(post => createPostCard(post)).join('') : '<p style="text-align: center; color: var(--text-light); padding: 40px;">لا توجد خواطر بعد</p>'}
                </div>
            </div>
        `;
        
        setTimeout(loadPostInteractions, 100);
    } catch (error) {
        console.error('Show profile error:', error);
    }
}

async function uploadAvatar() {
    const file = document.getElementById('avatarUpload').files[0];
    if (!file) return;
    
    try {
        const storageRef = storage.ref(`avatars/${currentUser.id}_${Date.now()}`);
        const snapshot = await storageRef.put(file);
        const url = await snapshot.ref.getDownloadURL();
        
        await database.ref(`users/${currentUser.id}`).update({ profileImage: url });
        currentUser.profileImage = url;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showProfile(currentUser.id);
    } catch (error) {
        console.error('Upload avatar error:', error);
        alert('حدث خطأ في رفع الصورة');
    }
}

async function uploadCover() {
    const file = document.getElementById('coverUpload').files[0];
    if (!file) return;
    
    try {
        const storageRef = storage.ref(`covers/${currentUser.id}_${Date.now()}`);
        const snapshot = await storageRef.put(file);
        const url = await snapshot.ref.getDownloadURL();
        
        await database.ref(`users/${currentUser.id}`).update({ coverImage: url });
        currentUser.coverImage = url;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showProfile(currentUser.id);
    } catch (error) {
        console.error('Upload cover error:', error);
        alert('حدث خطأ في رفع الصورة');
    }
}

async function toggleFollow(userId) {
    try {
        const snapshot = await database.ref('follows').once('value');
        const follows = snapshot.val();
        
        let existingKey = null;
        if (follows) {
            for (const [key, follow] of Object.entries(follows)) {
                if (follow.followerId === currentUser.id && follow.followedId === userId) {
                    existingKey = key;
                    break;
                }
            }
        }
        
        if (existingKey) {
            await database.ref(`follows/${existingKey}`).remove();
        } else {
            await database.ref('follows').push({
                followerId: currentUser.id,
                followedId: userId,
                createdAt: new Date().toISOString()
            });
            
            await createNotification(
                userId,
                'follow',
                `بدأ ${currentUser.name} بمتابعتك`,
                currentUser.id
            );
        }
        
        showProfile(userId);
    } catch (error) {
        console.error('Toggle follow error:', error);
    }
}

// =====================================================
// Settings
// =====================================================

async function showSettings() {
    updateNavbar();
    
    const user = currentUser;
    
    document.getElementById('mainContainer').innerHTML = `
        <div style="grid-column: 1 / -1; max-width: 800px; margin: 0 auto; background: var(--bg); border-radius: 12px; padding: 30px;">
            <h1 style="margin-bottom: 30px;">⚙️ الإعدادات</h1>
            
            <div style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid var(--border);">
                <h3 style="margin-bottom: 20px;">الملف الشخصي</h3>
                
                <div class="input-group">
                    <label>الاسم</label>
                    <input type="text" id="settingsName" value="${user.name}">
                </div>
                
                <div class="input-group">
                    <label>النبذة التعريفية</label>
                    <input type="text" id="settingsBio" value="${user.bio}">
                </div>
            </div>
            
            <div style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid var(--border);">
                <h3 style="margin-bottom: 20px;">ℹ️ معلومات إضافية</h3>
                
                <div class="input-group">
                    <label>🏙️ مكان الولادة</label>
                    <input type="text" id="settingsBirthPlace" value="${user.details?.birthPlace || ''}" placeholder="مثال: دمشق">
                </div>
                
                <div class="input-group">
                    <label>📍 مكان الإقامة الحالي</label>
                    <input type="text" id="settingsCurrentCity" value="${user.details?.currentCity || ''}" placeholder="مثال: الرياض">
                </div>
                
                <div class="input-group">
                    <label>🎓 الدراسة</label>
                    <input type="text" id="settingsEducation" value="${user.details?.education || ''}" placeholder="مثال: هندسة معلوماتية">
                </div>
                
                <div class="input-group">
                    <label>💼 العمل</label>
                    <input type="text" id="settingsWork" value="${user.details?.work || ''}" placeholder="مثال: مطور برمجيات">
                </div>
            </div>
            
            <div style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid var(--border);">
                <h3 style="margin-bottom: 20px;">🔒 الأمان</h3>
                
                <div class="input-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="settingsEmail" value="${user.email}">
                </div>
                
                <div class="input-group">
                    <label>كلمة المرور الجديدة</label>
                    <input type="password" id="settingsPassword" placeholder="اتركه فارغاً إذا لم ترد التغيير">
                </div>
            </div>
            
            <button class="submit-btn" onclick="saveSettings()">💾 حفظ التغييرات</button>
            
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid var(--border);">
                <button class="submit-btn" style="background: var(--danger);" onclick="deleteAccount()">🗑️ حذف الحساب</button>
            </div>
        </div>
    `;
}

async function saveSettings() {
    const name = document.getElementById('settingsName').value.trim();
    const bio = document.getElementById('settingsBio').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    const password = document.getElementById('settingsPassword').value;
    const birthPlace = document.getElementById('settingsBirthPlace').value.trim();
    const currentCity = document.getElementById('settingsCurrentCity').value.trim();
    const education = document.getElementById('settingsEducation').value.trim();
    const work = document.getElementById('settingsWork').value.trim();
    
    if (!name || !email) {
        alert('الرجاء إدخال الاسم والبريد الإلكتروني');
        return;
    }
    
    try {
        const updates = {
            name,
            bio,
            email,
            avatar: name.charAt(0).toUpperCase(),
            details: {
                birthPlace,
                currentCity,
                education,
                work
            }
        };
        
        if (password) {
            updates.password = password;
        }
        
        await database.ref(`users/${currentUser.id}`).update(updates);
        
        currentUser = { ...currentUser, ...updates };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        alert('✅ تم حفظ التغييرات بنجاح!');
        showFeed();
    } catch (error) {
        console.error('Save settings error:', error);
        alert('حدث خطأ في حفظ التغييرات');
    }
}

async function deleteAccount() {
    if (confirm('هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        try {
            await database.ref(`users/${currentUser.id}`).remove();
            
            const postsSnapshot = await database.ref('posts').orderByChild('userId').equalTo(currentUser.id).once('value');
            const posts = postsSnapshot.val();
            if (posts) {
                for (const postId in posts) {
                    await database.ref(`posts/${postId}`).remove();
                }
            }
            
            logout();
        } catch (error) {
            console.error('Delete account error:', error);
            alert('حدث خطأ في حذف الحساب');
        }
    }
}

// =====================================================
// Suggested Friends
// =====================================================

async function showSuggestedFriends() {
    updateNavbar();
    
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val();
        
        const followsSnapshot = await database.ref('follows').orderByChild('followerId').equalTo(currentUser.id).once('value');
        const follows = followsSnapshot.val();
        const followingIds = follows ? Object.values(follows).map(f => f.followedId) : [];
        
        const suggested = Object.entries(users || {})
            .filter(([id, user]) => id !== currentUser.id && !followingIds.includes(id))
            .slice(0, 20);
        
        const suggestedHTML = await Promise.all(suggested.map(async ([id, user]) => {
            const postsSnapshot = await database.ref('posts').orderByChild('userId').equalTo(id).once('value');
            const posts = postsSnapshot.val();
            const userPosts = posts ? Object.keys(posts).length : 0;
            
            const followersSnapshot = await database.ref('follows').orderByChild('followedId').equalTo(id).once('value');
            const followers = followersSnapshot.val();
            const followersCount = followers ? Object.keys(followers).length : 0;
            
            const avatarDisplay = user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                : user.avatar;
            
            return `
                <div style="background: var(--bg); border-radius: 12px; padding: 25px; text-align: center; box-shadow: var(--shadow);">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; margin: 0 auto 15px; overflow: hidden;">
                        ${avatarDisplay}
                    </div>
                    <h3 style="margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        ${user.name}
                        ${user.isAdmin ? '<span class="verified-badge">✓</span>' : ''}
                    </h3>
                    <p style="color: var(--text-light); margin-bottom: 15px; font-size: 0.9rem;">${user.bio}</p>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 15px;">
                        <div>
                            <strong>${userPosts}</strong>
                            <div style="font-size: 0.85rem; color: var(--text-light);">خاطرة</div>
                        </div>
                        <div>
                            <strong>${followersCount}</strong>
                            <div style="font-size: 0.85rem; color: var(--text-light);">متابع</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="post-btn" onclick="showProfile('${id}')" style="flex: 1;">عرض الصفحة</button>
                        <button class="post-btn" onclick="toggleFollow('${id}'); setTimeout(showSuggestedFriends, 500);" style="flex: 1; background: var(--secondary);">متابعة</button>
                    </div>
                </div>
            `;
        }));
        
        document.getElementById('mainContainer').innerHTML = `
            <div style="grid-column: 1 / -1;">
                <h1 style="margin-bottom: 30px;">👥 اقتراح أصدقاء</h1>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${suggestedHTML.join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Show suggested friends error:', error);
    }
}

// =====================================================
// Admin Panel
// =====================================================

async function showAdminPanel() {
    if (!currentUser.isAdmin) {
        alert('غير مصرح لك بالدخول');
        return;
    }
    
    updateNavbar();
    
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val();
        const totalUsers = users ? Object.keys(users).length : 0;
        
        const postsSnapshot = await database.ref('posts').once('value');
        const posts = postsSnapshot.val();
        const totalPosts = posts ? Object.keys(posts).length : 0;
        
        const commentsSnapshot = await database.ref('comments').once('value');
        const comments = commentsSnapshot.val();
        const totalComments = comments ? Object.keys(comments).length : 0;
        
        const reactionsSnapshot = await database.ref('reactions').once('value');
        const reactions = reactionsSnapshot.val();
        const totalReactions = reactions ? Object.keys(reactions).length : 0;
        
        const usersList = Object.entries(users || {})
            .sort(([, a], [, b]) => new Date(b.joinDate) - new Date(a.joinDate));
        
        const usersHTML = await Promise.all(usersList.map(async ([id, user]) => {
            const userPostsSnapshot = await database.ref('posts').orderByChild('userId').equalTo(id).once('value');
            const userPosts = userPostsSnapshot.val();
            const postsCount = userPosts ? Object.keys(userPosts).length : 0;
            
            const followersSnapshot = await database.ref('follows').orderByChild('followedId').equalTo(id).once('value');
            const followers = followersSnapshot.val();
            const followersCount = followers ? Object.keys(followers).length : 0;
            
            const joinDate = new Date(user.joinDate).toLocaleDateString('ar-SA');
            
            const avatarDisplay = user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                : user.avatar;
            
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; overflow: hidden;">
                                ${avatarDisplay}
                            </div>
                            ${user.name}
                            ${user.isAdmin ? '<span style="background: var(--warning); color: white; padding: 2px 8px; border-radius: 5px; font-size: 0.75rem; margin-right: 5px;">مدير</span>' : ''}
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${joinDate}</td>
                    <td>${postsCount}</td>
                    <td>${followersCount}</td>
                    <td>
                        <button style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin: 0 3px;" onclick="showProfile('${id}')">عرض</button>
                        ${!user.isAdmin ? `
                            <button style="background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin: 0 3px;" onclick="adminDeleteUser('${id}')">حذف</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }));
        
        document.getElementById('mainContainer').innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 10px;">👑 لوحة تحكم المدير</h1>
                    <p style="opacity: 0.9;">مرحباً ${currentUser.name}، إليك نظرة عامة على الموقع</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: var(--bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border);">
                        <div style="font-size: 2.5rem; font-weight: 900; color: var(--primary);">${totalUsers}</div>
                        <div style="color: var(--text-light); font-weight: 600;">👥 المستخدمون</div>
                    </div>
                    <div style="background: var(--bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border);">
                        <div style="font-size: 2.5rem; font-weight: 900; color: var(--primary);">${totalPosts}</div>
                        <div style="color: var(--text-light); font-weight: 600;">📝 الخواطر</div>
                    </div>
                    <div style="background: var(--bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border);">
                        <div style="font-size: 2.5rem; font-weight: 900; color: var(--primary);">${totalComments}</div>
                        <div style="color: var(--text-light); font-weight: 600;">💬 التعليقات</div>
                    </div>
                    <div style="background: var(--bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border);">
                        <div style="font-size: 2.5rem; font-weight: 900; color: var(--primary);">${totalReactions}</div>
                        <div style="color: var(--text-light); font-weight: 600;">❤️ التفاعلات</div>
                    </div>
                </div>
                
                <div style="background: var(--bg); border-radius: 12px; padding: 30px;">
                    <h2 style="margin-bottom: 20px;">📊 إدارة المستخدمين</h2>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--light); border-bottom: 2px solid var(--border);">
                                    <th style="padding: 15px; text-align: right; font-weight: 700;">الاسم</th>
                                    <th style="padding: 15px; text-align: right; font-weight: 700;">البريد</th>
                                    <th style="padding: 15px; text-align: right; font-weight: 700;">تاريخ التسجيل</th>
                                    <th style="padding: 15px; text-align: right; font-weight: 700;">الخواطر</th>
                                    <th style="padding: 15px; text-align: right; font-weight: 700;">المتابعون</th>
                                    <th style="padding: 15px; text-align: right; font-weight: 700;">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersHTML.join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Show admin panel error:', error);
    }
}

async function adminDeleteUser(userId) {
    if (!currentUser.isAdmin) return;
    
    const userSnapshot = await database.ref(`users/${userId}`).once('value');
    const user = userSnapshot.val();
    
    if (!user) return;
    
    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) {
        try {
            await database.ref(`users/${userId}`).remove();
            
            const postsSnapshot = await database.ref('posts').orderByChild('userId').equalTo(userId).once('value');
            const posts = postsSnapshot.val();
            if (posts) {
                for (const postId in posts) {
                    await database.ref(`posts/${postId}`).remove();
                }
            }
            
            alert('✅ تم حذف المستخدم بنجاح');
            showAdminPanel();
        } catch (error) {
            console.error('Admin delete user error:', error);
            alert('حدث خطأ في حذف المستخدم');
        }
    }
}
