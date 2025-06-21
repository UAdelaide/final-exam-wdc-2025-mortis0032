document.addEventListener('DOMContentLoaded', () => {
  const loginPage = document.getElementById('login-page');
  const dashboardPage = document.getElementById('dashboard-page');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const userName = document.getElementById('user-name');
  const userType = document.getElementById('user-type');
  const ownerDashboard = document.getElementById('owner-dashboard');
  const walkerDashboard = document.getElementById('walker-dashboard');


  async function checkSession() {
    try {
      const response = await fetch('/api/auth/check-session');
      const data = await response.json();

      if (data.isLoggedIn) {
        showDashboard(data.user);
      } else {
        showLogin();
      }
    } catch (error) {
      console.error('Check for session failure:', error);
      showLogin();
    }
  }


  function showLogin() {
    loginPage.style.display = 'flex';
    dashboardPage.style.display = 'none';
  }


  function showDashboard(user) {
    loginPage.style.display = 'none';
    dashboardPage.style.display = 'block';


    userName.textContent = user.name;
    userType.textContent = user.type === 'owner' ? 'master' : 'dog walker';

    if (user.type === 'owner') {
      ownerDashboard.style.display = 'block';
      walkerDashboard.style.display = 'none';
      loadOwnerData(user.id);
    } else {
      ownerDashboard.style.display = 'none';
      walkerDashboard.style.display = 'block';
      loadWalkerData(user.id);
    }
  }

  async function loadOwnerData(ownerId) {
    try {
      const response = await fetch(`/api/dogs?ownerId=${ownerId}`);
      const dogs = await response.json();

      const dogsContainer = document.getElementById('owner-dogs');
      dogsContainer.innerHTML = '';

      if (dogs.length === 0) {
        dogsContainer.innerHTML = '<p> You have not added the dog yet </p>';
        return;
      }

      dogs.forEach(dog => {
        const dogElement = document.createElement('div');
        dogElement.className = 'card mb-2';
        dogElement.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${dog.name}</h5>
            <p class="card-text">variety: ${dog.breed} | age: ${dog.age}</p>
          </div>
        `;
        dogsContainer.appendChild(dogElement);
      });
    } catch (error) {
      console.error('Failed to load the dog data:', error);
    }
  }

  async function loadWalkerData(walkerId) {
    try {
      const response = await fetch(`/api/walks?walkerId=${walkerId}`);
      const tasks = await response.json();

      const tasksContainer = document.getElementById('walker-tasks');
      tasksContainer.innerHTML = '';

      if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p>您今天没有遛狗任务</p>';
        return;
      }

      tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'card mb-2';
        taskElement.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${task.dog_name}</h5>
            <p class="card-text">
              主人: ${task.owner_name}<br>
              时间: ${task.time} | 时长: ${task.duration}分钟
            </p>
          </div>
        `;
        tasksContainer.appendChild(taskElement);
      });
    } catch (error) {
      console.error('加载任务数据失败:', error);
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        showDashboard(data.user);
      } else {
        loginError.textContent = data.message || '登录失败';
        loginError.style.display = 'block';
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      loginError.textContent = '无法连接到服务器';
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showLogin();
    } catch (error) {
      console.error('注销失败:', error);
    }
  });

  checkSession();
});