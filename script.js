document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const tasksCount = document.getElementById('tasks-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const currentYear = document.getElementById('current-year');
    const themeToggle = document.getElementById('theme-toggle');
    const taskSearch = document.getElementById('task-search');
    const clearSearch = document.getElementById('clear-search');
    const taskPriority = document.getElementById('task-priority');
    const taskDue = document.getElementById('task-due');
    const exportBtn = document.getElementById('export-tasks');
    const newTipBtn = document.getElementById('new-tip');
    const tipElement = document.querySelector('.tip');
    
    // Initialize variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentSort = 'date-desc';
    let searchQuery = '';
    
    // Productivity tips
    const tips = [
        '"The secret of getting ahead is getting started." - Mark Twain',
        '"You don\'t have to see the whole staircase, just take the first step." - Martin Luther King Jr.',
        '"Focus on being productive instead of busy." - Tim Ferriss',
        '"Eat that frog! Do the most challenging task first thing in the morning." - Brian Tracy',
        '"Small daily improvements over time lead to stunning results." - Robin Sharma',
        '"Productivity is never an accident. It is always the result of a commitment to excellence." - Paul J. Meyer',
        '"The key is not to prioritize what\'s on your schedule, but to schedule your priorities." - Stephen Covey',
        '"Done is better than perfect." - Sheryl Sandberg',
        '"Your mind is for having ideas, not holding them." - David Allen',
        '"Concentrate all your thoughts upon the work at hand. The sun\'s rays do not burn until brought to a focus." - Alexander Graham Bell'
    ];
    
    // Set current year in footer
    currentYear.textContent = new Date().getFullYear();
    
    // Initialize the app
    function init() {
        renderTasks();
        updateTaskCount();
        showRandomTip();
        
        // Event listeners
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            });
        });
        
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        themeToggle.addEventListener('click', toggleTheme);
        taskSearch.addEventListener('input', handleSearch);
        clearSearch.addEventListener('click', clearSearchQuery);
        exportBtn.addEventListener('click', exportTasks);
        newTipBtn.addEventListener('click', showRandomTip);
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    }
    
    // Add a new task
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            animateInputError();
            return;
        }
        
        const dueDate = taskDue.value ? new Date(taskDue.value) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: taskPriority.value,
            dueDate: dueDate ? dueDate.toISOString() : null,
            createdAt: new Date().toISOString(),
            isOverdue: dueDate ? new Date(dueDate) < today : false,
            isDueToday: dueDate ? isSameDay(new Date(dueDate), today) : false
        };
        
        tasks.unshift(newTask);
        saveTasks();
        taskInput.value = '';
        taskDue.value = '';
        renderTasks();
        updateTaskCount();
        
        // Add animation to new task
        const newTaskElement = taskList.firstChild;
        if (newTaskElement) {
            newTaskElement.style.animation = 'fadeInDown 0.5s ease';
            setTimeout(() => {
                newTaskElement.style.animation = '';
            }, 500);
        }
    }
    
    // Render tasks based on current filter and search
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = filterTasks();
        
        if (filteredTasks.length === 0) {
            const noTasksMsg = document.createElement('p');
            noTasksMsg.className = 'no-tasks';
            noTasksMsg.textContent = getNoTasksMessage();
            noTasksMsg.style.animation = 'fadeIn 0.5s ease';
            taskList.appendChild(noTasksMsg);
            return;
        }
        
        // Sort tasks based on current sort option
        sortTasks(filteredTasks);
        
        filteredTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }
    
    // Filter tasks based on current filter and search
    function filterTasks() {
        let filteredTasks = tasks;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Apply filter
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (currentFilter === 'today') {
            filteredTasks = tasks.filter(task => {
                if (task.completed) return false;
                if (!task.dueDate) return false;
                return isSameDay(new Date(task.dueDate), today);
            });
        }
        
        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(query)
            );
        }
        
        return filteredTasks;
    }
    
    // Sort tasks based on current sort option
    function sortTasks(tasksArray) {
        switch (currentSort) {
            case 'date-desc':
                tasksArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'date-asc':
                tasksArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'priority':
                const priorityOrder = { 'urgent': 0, 'high': 1, 'normal': 2, 'low': 3 };
                tasksArray.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'due-date':
                tasksArray.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
        }
    }
    
    // Create task element
    function createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
        taskItem.dataset.id = task.id;
        
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Update overdue status
        if (dueDate && !task.completed) {
            task.isOverdue = dueDate < today && !isSameDay(dueDate, today);
            task.isDueToday = isSameDay(dueDate, today);
        }
        
        const dueDateFormatted = dueDate ? formatDate(dueDate) : '';
        const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">${priorityLabel}</span>
                    ${dueDate ? `
                        <span class="task-due ${task.isOverdue ? 'overdue' : ''} ${task.isDueToday ? 'today' : ''}">
                            <i class="far fa-calendar-alt"></i> ${dueDateFormatted}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        const checkbox = taskItem.querySelector('.task-checkbox');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        const editBtn = taskItem.querySelector('.edit-btn');
        const taskText = taskItem.querySelector('.task-text');
        
        checkbox.addEventListener('change', function() {
            const taskId = parseInt(taskItem.dataset.id);
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = this.checked;
                taskText.classList.toggle('completed', this.checked);
                taskItem.classList.toggle('completed', this.checked);
                saveTasks();
                updateTaskCount();
                
                // Add completion animation
                if (this.checked) {
                    taskItem.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        taskItem.style.animation = '';
                    }, 500);
                }
            }
        });
        
        deleteBtn.addEventListener('click', function() {
            // Add deletion animation
            taskItem.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
                updateTaskCount();
            }, 300);
        });
        
        editBtn.addEventListener('click', function() {
            editTask(task, taskItem);
        });
        
        return taskItem;
    }
    
    // Edit task
    function editTask(task, taskItem) {
        const taskText = taskItem.querySelector('.task-text');
        const taskMeta = taskItem.querySelector('.task-meta');
        
        // Create edit form
        const editForm = document.createElement('form');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
            <input type="text" class="edit-input" value="${task.text}">
            <div class="edit-options">
                <select class="edit-priority">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="normal" ${task.priority === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                </select>
                <input type="date" class="edit-due" value="${task.dueDate ? formatDateForInput(new Date(task.dueDate)) : ''}">
                <div class="edit-buttons">
                    <button type="submit" class="save-btn">Save</button>
                    <button type="button" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Replace task content with edit form
        taskText.replaceWith(editForm);
        taskMeta.style.display = 'none';
        
        const editInput = editForm.querySelector('.edit-input');
        const editPriority = editForm.querySelector('.edit-priority');
        const editDue = editForm.querySelector('.edit-due');
        const saveBtn = editForm.querySelector('.save-btn');
        const cancelBtn = editForm.querySelector('.cancel-btn');
        
        editInput.focus();
        
        // Handle form submission
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTaskChanges(task, editInput.value, editPriority.value, editDue.value, taskItem);
        });
        
        // Handle cancel
        cancelBtn.addEventListener('click', function() {
            editForm.replaceWith(taskText);
            taskMeta.style.display = 'flex';
        });
    }
    
    // Save task changes after editing
    function saveTaskChanges(task, newText, newPriority, newDueDate, taskItem) {
        if (!newText.trim()) {
            animateInputError();
            return;
        }
        
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex === -1) return;
        
        const dueDate = newDueDate ? new Date(newDueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            text: newText.trim(),
            priority: newPriority,
            dueDate: dueDate ? dueDate.toISOString() : null,
            isOverdue: dueDate ? dueDate < today && !isSameDay(dueDate, today) : false,
            isDueToday: dueDate ? isSameDay(dueDate, today) : false
        };
        
        saveTasks();
        renderTasks();
    }
    
    // Clear completed tasks
    function clearCompletedTasks() {
        // Add confirmation animation
        const completedTasks = document.querySelectorAll('.task-item.completed');
        if (completedTasks.length === 0) return;
        
        completedTasks.forEach(task => {
            task.style.animation = 'fadeOut 0.3s ease';
        });
        
        setTimeout(() => {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateTaskCount();
        }, 300);
    }
    
    // Update task counter
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        const totalTasks = tasks.length;
        
        let countText = '';
        if (currentFilter === 'all') {
            countText = `${activeTasks} of ${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'} remaining`;
        } else if (currentFilter === 'active') {
            countText = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} to do`;
        } else if (currentFilter === 'completed') {
            const completedTasks = totalTasks - activeTasks;
            countText = `${completedTasks} ${completedTasks === 1 ? 'task' : 'tasks'} completed`;
        } else if (currentFilter === 'today') {
            const todayTasks = tasks.filter(task => {
                if (task.completed) return false;
                if (!task.dueDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return isSameDay(new Date(task.dueDate), today);
            }).length;
            countText = `${todayTasks} ${todayTasks === 1 ? 'task' : 'tasks'} due today`;
        }
        
        tasksCount.textContent = countText;
    }
    
    // Get appropriate message when no tasks are found
    function getNoTasksMessage() {
        if (searchQuery && currentFilter === 'all') {
            return 'No tasks match your search.';
        } else if (searchQuery) {
            return `No ${currentFilter} tasks match your search.`;
        } else if (currentFilter === 'all') {
            return 'No tasks yet. Add one above!';
        } else if (currentFilter === 'active') {
            return 'No active tasks. Great job!';
        } else if (currentFilter === 'completed') {
            return 'No completed tasks yet.';
        } else if (currentFilter === 'today') {
            return 'No tasks due today.';
        }
        return 'No tasks found.';
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Handle search
    function handleSearch() {
        searchQuery = taskSearch.value.trim();
        renderTasks();
        
        if (searchQuery) {
            clearSearch.style.display = 'flex';
        } else {
            clearSearch.style.display = 'none';
        }
    }
    
    // Clear search
    function clearSearchQuery() {
        taskSearch.value = '';
        searchQuery = '';
        clearSearch.style.display = 'none';
        renderTasks();
    }
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    }
    
    // Set theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    // Export tasks
    function exportTasks() {
        let exportText = 'TaskMaster Pro Tasks\n\n';
        exportText += `Status: ${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}\n`;
        exportText += `Total: ${tasks.length} | Active: ${tasks.filter(t => !t.completed).length} | Completed: ${tasks.filter(t => t.completed).length}\n\n`;
        
        const priorityLabels = {
            low: 'Low',
            normal: 'Normal',
            high: 'High',
            urgent: 'Urgent'
        };
        
        tasks.forEach(task => {
            const status = task.completed ? '✓' : '◯';
            const priority = priorityLabels[task.priority] || 'Normal';
            const dueDate = task.dueDate ? formatDate(new Date(task.dueDate)) : 'No due date';
            
            exportText += `${status} ${task.text}\n`;
            exportText += `  Priority: ${priority} | Due: ${dueDate}\n\n`;
        });
        
        exportText += `Exported on ${formatDate(new Date())}`;
        
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TaskMaster_Tasks_${formatDateForFilename(new Date())}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Show random productivity tip
    function showRandomTip() {
        const randomIndex = Math.floor(Math.random() * tips.length);
        tipElement.textContent = tips[randomIndex];
    }
    
    // Helper function to animate input error
    function animateInputError() {
        const input = taskInput;
        input.style.borderColor = 'var(--danger)';
        input.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            input.style.borderColor = 'var(--gray)';
            input.style.animation = '';
        }, 500);
    }
    
    // Helper function to format date
    function formatDate(date) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }
    
    // Helper function to format date for input field
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Helper function to format date for filename
    function formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    // Helper function to check if two dates are the same day
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Add custom animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        .edit-form {
            width: 100%;
        }
        .edit-input {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 2px solid var(--gray);
            border-radius: 6px;
            font-size: 1rem;
        }
        .edit-options {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .edit-priority, .edit-due {
            padding: 8px;
            border: 2px solid var(--gray);
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .edit-buttons {
            display: flex;
            gap: 10px;
            margin-left: auto;
        }
        .save-btn, .cancel-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        .save-btn {
            background-color: var(--primary);
            color: white;
        }
        .cancel-btn {
            background-color: var(--light);
            color: var(--text);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the app
    init();
});