// ============================================================================
// --- 1. CONFIGURACIÓN, ESTADO GLOBAL Y REFERENCIAS AL DOM ---
// ============================================================================
const CONFIG = {
    // Pega tu nueva URL aquí. Asegúrate de que esté entre las comillas simples ''.
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby6uhQQiusE-AjXjeDd6farnrhlq9ThRkIUHEuU_s9cRfdRru5vJJ9fpL9Q70TOg8S_/exec'
};

const DOM = {
    // Modales
    userProfileModal: document.getElementById('user-profile-modal'),
    planSetupModal: document.getElementById('plan-setup-modal'),
    editProfileModal: document.getElementById('edit-profile-modal'),
    activityModal: document.getElementById('activity-modal'),
    suggestionModal: document.getElementById('suggestion-modal'),
    endOfPlanModal: document.getElementById('end-of-plan-modal'),
    weightUpdateModal: document.getElementById('weight-update-modal'),
    customAlertModal: document.getElementById('custom-alert-modal'),
    golesHistoryModal: document.getElementById('goles-history-modal'),
    progressReportModal: document.getElementById('progress-report-modal'),
    
    // Contenido Principal
    datetimeDisplay: document.getElementById('datetime-display'),
    analyzeButton: document.getElementById('analyze-button'),
    fileInput: document.getElementById('file-input'),
    imagePreview: document.getElementById('image-preview'),
    uploadPrompt: document.getElementById('upload-prompt'),
    resultsContainer: document.getElementById('results-container'),
    loader: document.getElementById('loader'),
    resultContent: document.getElementById('result-content'),
    addCaloriesButton: document.getElementById('add-calories-button'),
    nutritionTracker: document.getElementById('nutrition-tracker'),
    progressGraphContainer: document.getElementById('progress-graph-container'),

    // Perfil y Plan
    saveProfileButton: document.getElementById('save-profile-button'),
    planTabsContainer: document.getElementById('plan-tabs'),
    calculatePlanButton: document.getElementById('calculate-plan-button'),
    savePlanButton: document.getElementById('save-plan-button'),

    // Menú de Iconos Superiores
    topIconsContainer: document.getElementById('top-icons-container'),
    settingsMenuContainer: document.getElementById('settings-menu-container'),
    settingsButton: document.getElementById('settings-button'),
    settingsDropdown: document.getElementById('settings-dropdown'),
    editProfileLink: document.getElementById('edit-profile-link'),
    deleteDataLink: document.getElementById('delete-data-link'),
    weightUpdateButtonIcon: document.getElementById('weight-update-button-icon'),
    golesHistoryTitleButton: document.getElementById('goles-history-title-button'),
    progressReportButtonIcon: document.getElementById('progress-report-button-icon'),

    // Historial de Goles
    golesHistoryLoader: document.getElementById('goles-history-loader'),
    golesHistoryContent: document.getElementById('goles-history-content'),
    golesHistoryList: document.getElementById('goles-history-list'),
    noGolesMessage: document.getElementById('no-goles-message'),
    closeGolesHistoryButton: document.getElementById('close-goles-history-button'),

    // Reporte de Progreso
    progressReportLoader: document.getElementById('progress-report-loader'),
    progressReportContent: document.getElementById('progress-report-content'),
    closeProgressReportButton: document.getElementById('close-progress-report-button'),
    progressDaysElapsed: document.getElementById('progress-days-elapsed'),
    progressDaysTotal: document.getElementById('progress-days-total'),
    progressPercentage: document.getElementById('progress-percentage'),
    progressExpectedLoss: document.getElementById('progress-expected-loss'),
    progressActualLoss: document.getElementById('progress-actual-loss'),
    progressNetDeficit: document.getElementById('progress-net-deficit'),
    
    // Formulario de Edición de Perfil
    editProfileLoader: document.getElementById('edit-profile-loader'),
    editProfileForm: document.getElementById('edit-profile-form'),
    cancelEditButton: document.getElementById('cancel-edit-button'),
    saveChangesButton: document.getElementById('save-changes-button'),

    // Alertas Personalizadas
    customAlertTitle: document.getElementById('custom-alert-title'),
    customAlertMessage: document.getElementById('custom-alert-message'),
    customAlertConfirmButton: document.getElementById('custom-alert-confirm-button'),
    customAlertCancelButton: document.getElementById('custom-alert-cancel-button'),

    // Fin del Plan
    planEndMessage: document.getElementById('plan-end-message'),
    planSummaryExpected: document.getElementById('plan-summary-expected'),
    planSummaryActual: document.getElementById('plan-summary-actual'),
    restartPlanButton: document.getElementById('restart-plan-button'),

    // Actualización de Peso
    newWeightInput: document.getElementById('new-weight'),
    saveNewWeightButton: document.getElementById('save-new-weight-button'),
    cancelWeightUpdateButton: document.getElementById('cancel-weight-update-button'),

    // Botones Flotantes (FAB)
    fabContainer: document.getElementById('fab-container'),
    addActivityFab: document.getElementById('add-activity-fab'),
    getSuggestionFab: document.getElementById('get-suggestion-fab'),

    // Actividad Física
    activityDescription: document.getElementById('activity-description'),
    calculateActivityButton: document.getElementById('calculate-activity-button'),
    activityResultContainer: document.getElementById('activity-result-container'),
    activityCaloriesResult: document.getElementById('activity-calories-result'),
    addActivityCaloriesButton: document.getElementById('add-activity-calories-button'),
    cancelActivityButton: document.getElementById('cancel-activity-button'),

    // Sugerencias de Comida
    suggestionModalTitle: document.getElementById('suggestion-modal-title'),
    suggestionOptionsContainer: document.getElementById('suggestion-options'),
    suggestionPromptTextarea: document.getElementById('suggestion-prompt'),
    getSuggestionButton: document.getElementById('get-suggestion-button'),
    suggestionResultContainer: document.getElementById('suggestion-result-container'),
    suggestionList: document.getElementById('suggestion-list'),
    cancelSuggestionButton: document.getElementById('cancel-suggestion-button'),
    addSelectedDishesButton: document.getElementById('add-selected-dishes-button'),
};

const state = {
    userProfile: null,
    userPlan: null,
    analysisResult: null,
    currentPlanType: 'byPace',
    caloriesBurned: 0,
    weightChart: null
};

// ============================================================================
// --- 2. INICIALIZACIÓN DE LA APP ---
// ============================================================================

window.onload = function() { init(); };

async function init() {
    startClock();
    loadStateFromStorage();
    setupInitialUI();
    addEventListeners();
    if (state.userProfile && state.userPlan) {
        await checkPlanCompletion();
        await loadWeightProgressGraph();
    }
}

function loadStateFromStorage() {
    state.userProfile = loadFromStorage('userProfile');
    state.userPlan = loadFromStorage('userPlan');
}

function setupInitialUI() {
    if (state.userProfile && state.userPlan) {
        const dailyData = loadDailyData();
        updateNutritionTrackerUI(state.userPlan.target_kcal, dailyData.consumed);
        DOM.topIconsContainer.classList.remove('hidden');
        DOM.golesHistoryTitleButton.classList.remove('hidden');
        DOM.fabContainer.classList.remove('hidden');
    } else if (state.userProfile && !state.userPlan) {
        DOM.planSetupModal.classList.remove('hidden');
    } else {
        DOM.userProfileModal.classList.remove('hidden');
    }
    DOM.analyzeButton.disabled = true;
}

// ============================================================================
// --- 3. MANEJADORES DE EVENTOS (EVENT LISTENERS) ---
// ============================================================================

function addEventListeners() {
    DOM.saveProfileButton.addEventListener('click', handleSaveProfile);
    DOM.planTabsContainer.addEventListener('click', handlePlanTabSwitch);
    DOM.calculatePlanButton.addEventListener('click', handleCalculatePlan);
    DOM.savePlanButton.addEventListener('click', handleSavePlan);
    DOM.fileInput.addEventListener('change', handleFileChange);
    DOM.analyzeButton.addEventListener('click', handleAnalyzeClick);
    DOM.addCaloriesButton.addEventListener('click', handleAddCalories);
    DOM.settingsButton.addEventListener('click', () => DOM.settingsDropdown.classList.toggle('hidden'));
    document.addEventListener('click', handleGlobalClickForSettings);
    DOM.editProfileLink.addEventListener('click', handleEditProfileLink);
    DOM.cancelEditButton.addEventListener('click', () => DOM.editProfileModal.classList.add('hidden'));
    DOM.saveChangesButton.addEventListener('click', handleSaveChanges);
    DOM.deleteDataLink.addEventListener('click', handleDeleteData);
    DOM.addActivityFab.addEventListener('click', () => DOM.activityModal.classList.remove('hidden'));
    DOM.cancelActivityButton.addEventListener('click', handleCancelActivity);
    DOM.calculateActivityButton.addEventListener('click', handleCalculateActivity);
    DOM.addActivityCaloriesButton.addEventListener('click', handleAddActivityCalories);
    DOM.getSuggestionFab.addEventListener('click', handleGetSuggestionFab);
    DOM.suggestionOptionsContainer.addEventListener('click', handleSuggestionOptionSelect);
    DOM.getSuggestionButton.addEventListener('click', handleGetSuggestion);
    DOM.addSelectedDishesButton.addEventListener('click', handleAddSelectedDishes);
    DOM.cancelSuggestionButton.addEventListener('click', () => DOM.suggestionModal.classList.add('hidden'));
    DOM.progressReportButtonIcon.addEventListener('click', handleProgressReportClick);
    DOM.closeProgressReportButton.addEventListener('click', () => DOM.progressReportModal.classList.add('hidden'));
    DOM.golesHistoryTitleButton.addEventListener('click', handleGolesHistoryClick);
    DOM.closeGolesHistoryButton.addEventListener('click', () => DOM.golesHistoryModal.classList.add('hidden'));
    DOM.weightUpdateButtonIcon.addEventListener('click', handleWeightUpdateIconClick);
    DOM.saveNewWeightButton.addEventListener('click', handleSaveNewWeight);
    DOM.cancelWeightUpdateButton.addEventListener('click', () => DOM.weightUpdateModal.classList.add('hidden'));
    DOM.restartPlanButton.addEventListener('click', () => {
        if (state.userPlan && state.userPlan.startDate) {
            localStorage.removeItem(`plan_archived_${state.userPlan.startDate}`);
        }
        localStorage.removeItem('userPlan');
        location.reload();
    });
}

// ============================================================================
// --- 4. HANDLERS DE EVENTOS ---
// ============================================================================

async function handleSaveNewWeight() {
    const newWeight = parseFloat(DOM.newWeightInput.value);
    if (isNaN(newWeight) || newWeight <= 0) {
        showCustomAlert("Por favor, ingresa un peso válido.");
        return;
    }
    setButtonLoading(DOM.saveNewWeightButton, true);
    try {
        await sendDataToBackend({ action: 'saveWeight', payload: { userId: state.userProfile.userId, weightKg: newWeight } });
        state.userProfile.weightKg = newWeight;
        saveToStorage('userProfile', state.userProfile);
        const originalStartDate = state.userPlan.startDate;
        const planInputs = {
            sex: state.userProfile.sex,
            age: state.userProfile.age,
            weightKg: state.userProfile.weightKg,
            heightCm: state.userProfile.heightCm,
            activityKey: state.userProfile.activityKey,
            planType: state.userPlan.planType,
            kgGoal: state.userPlan.kg_goal,
            days: state.userPlan.days,
            paceKgPerWeek: state.userPlan.paceKgPerWeek
        };
        const planResponse = await sendDataToBackend({
            action: 'calculatePlan',
            payload: planInputs
        });
        state.userPlan = planResponse.plan;
        state.userPlan.startDate = originalStartDate;
        await sendDataToBackend({
            action: 'updateActivePlan',
            payload: {
                userId: state.userProfile.userId,
                startDate: originalStartDate,
                updatedPlan: state.userPlan 
            }
        });
        saveToStorage('userPlan', state.userPlan);
        showCustomAlert('Peso y plan actualizados correctamente.', 'Éxito');
        DOM.weightUpdateModal.classList.add('hidden');
        location.reload();
    } catch (error) {
        showCustomAlert('Error al actualizar el peso: ' + error.message, 'Error');
    } finally {
        setButtonLoading(DOM.saveNewWeightButton, false);
    }
}

async function handleProgressReportClick() {
    DOM.progressReportModal.classList.remove('hidden');
    DOM.progressReportContent.classList.add('hidden');
    DOM.progressReportLoader.classList.remove('hidden');
    try {
        const response = await sendDataToBackend({
            action: 'getCurrentProgress',
            payload: { userId: state.userProfile.userId, startDate: state.userPlan.startDate }
        });
        if (response.status === 'success') {
            displayCurrentProgress(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        showCustomAlert('Error al calcular tu progreso: ' + error.message, 'Error');
        DOM.progressReportModal.classList.add('hidden');
    } finally {
        DOM.progressReportLoader.classList.add('hidden');
        DOM.progressReportContent.classList.remove('hidden');
    }
}

async function handleGolesHistoryClick() {
    DOM.golesHistoryModal.classList.remove('hidden');
    DOM.golesHistoryContent.classList.add('hidden');
    DOM.golesHistoryLoader.classList.remove('hidden');
    try {
        const response = await sendDataToBackend({
            action: 'getGolesHistory',
            payload: { userId: state.userProfile.userId }
        });
        if (response.status === 'success') {
            displayGolesHistory(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        showCustomAlert('Error al cargar el historial: ' + error.message, 'Error');
        DOM.golesHistoryModal.classList.add('hidden');
    } finally {
        DOM.golesHistoryLoader.classList.add('hidden');
        DOM.golesHistoryContent.classList.remove('hidden');
    }
}

function handleWeightUpdateIconClick() {
    if (state.userProfile && state.userProfile.weightKg) {
        DOM.newWeightInput.value = state.userProfile.weightKg;
    }
    DOM.weightUpdateModal.classList.remove('hidden');
}

async function handleSaveProfile() {
    const profile = {
        alias: document.getElementById('alias').value,
        age: parseInt(document.getElementById('age').value, 10),
        heightCm: parseInt(document.getElementById('height').value, 10),
        weightKg: parseFloat(document.getElementById('weight').value),
        sex: document.getElementById('gender').value,
        activityKey: document.getElementById('activityKey').value,
        userId: state.userProfile?.userId || `user_${Date.now()}`
    };
    if (!profile.alias || !profile.age || !profile.heightCm || !profile.weightKg) {
        showCustomAlert("Por favor, completa todos los campos del perfil.");
        return;
    }
    state.userProfile = profile;
    saveToStorage('userProfile', profile);
    setButtonLoading(DOM.saveProfileButton, true);
    await sendDataToBackend({ action: 'saveData', sheet: 'Perfiles', payload: profile });
    setButtonLoading(DOM.saveProfileButton, false);
    DOM.userProfileModal.classList.add('hidden');
    DOM.planSetupModal.classList.remove('hidden');
}

function handlePlanTabSwitch(e) {
    if (e.target.tagName !== 'BUTTON') return;
    state.currentPlanType = e.target.dataset.planType;
    document.querySelectorAll('.plan-tab-button').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    e.target.classList.add('border-blue-500', 'text-blue-600');
    e.target.classList.remove('border-transparent', 'text-gray-500');
    document.querySelectorAll('.plan-type-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`plan-${state.currentPlanType}`).classList.remove('hidden');
}

async function handleCalculatePlan() {
    const planInputs = { ...state.userProfile, planType: state.currentPlanType, paceKgPerWeek: parseFloat(document.getElementById('pace').value), days: parseInt(state.currentPlanType === 'byPace' ? document.getElementById('pace-days').value : document.getElementById('kg-days').value, 10), kgGoal: parseFloat(document.getElementById('kg-goal').value) };
    setButtonLoading(DOM.calculatePlanButton, true);
    try {
        const response = await sendDataToBackend({ action: 'calculatePlan', payload: planInputs });
        const calculatedPlan = response.plan;
        state.userPlan = calculatedPlan;
        document.getElementById('plan-summary-text').innerHTML = `Tu objetivo diario será de <strong>${calculatedPlan.target_kcal} kcal</strong> para perder ~<strong>${calculatedPlan.kg_goal} kg</strong> en <strong>${calculatedPlan.days} días</strong>.`;
        const warningsDiv = document.getElementById('plan-warnings');
        warningsDiv.innerHTML = calculatedPlan.warnings.join('<br>');
        warningsDiv.style.display = calculatedPlan.warnings.length > 0 ? 'block' : 'none';
        document.getElementById('plan-preview').classList.remove('hidden');
        DOM.savePlanButton.disabled = false;
    } catch (error) {
        showCustomAlert('Error al calcular el plan: ' + error.message, 'Error');
    } finally {
        setButtonLoading(DOM.calculatePlanButton, false);
    }
}

function handleSavePlan() {
    if (!state.userPlan) return;
    state.userPlan.startDate = new Date().toISOString();
    saveToStorage('userPlan', state.userPlan);
    sendDataToBackend({ action: 'saveData', sheet: 'Planes', payload: { ...state.userPlan, userId: state.userProfile.userId } });
    DOM.planSetupModal.classList.add('hidden');
    const dailyData = loadDailyData();
    updateNutritionTrackerUI(state.userPlan.target_kcal, dailyData.consumed);
    DOM.topIconsContainer.classList.remove('hidden');
    DOM.golesHistoryTitleButton.classList.remove('hidden');
    DOM.fabContainer.classList.remove('hidden');
}

function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            DOM.imagePreview.src = e.target.result;
            DOM.imagePreview.classList.remove('hidden');
            DOM.uploadPrompt.classList.add('hidden');
            DOM.analyzeButton.disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

async function handleAnalyzeClick() {
    const file = DOM.fileInput.files[0];
    if (file) {
        DOM.resultsContainer.classList.remove('hidden');
        DOM.resultContent.classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
        DOM.loader.classList.remove('hidden');
        DOM.analyzeButton.disabled = true;
        try {
            const resizedBase64 = await resizeImage(file);
            await analyzeImage(resizedBase64);
        } catch (error) {
            document.getElementById('error-message').textContent = 'Error al procesar la imagen.';
            document.getElementById('error-message').classList.remove('hidden');
            DOM.loader.classList.add('hidden');
        }
    }
}

function handleAddCalories() {
    if (!state.analysisResult) return;
    let dailyData = loadDailyData();
    dailyData.consumed += Math.round(state.analysisResult.totalCalories);
    saveToStorage('dailyData', { date: getLocalDateString(), consumed: dailyData.consumed });
    sendDataToBackend({ action: 'saveData', sheet: 'RegistrosComida', payload: { ...state.analysisResult, userId: state.userProfile.userId, date: new Date().toISOString() } });
    updateNutritionTrackerUI(state.userPlan.target_kcal, dailyData.consumed);
    resetFileInputUI();
}

function handleGlobalClickForSettings(event) {
    if (!DOM.settingsMenuContainer.contains(event.target) && !DOM.settingsButton.contains(event.target)) {
        DOM.settingsDropdown.classList.add('hidden');
    }
}

async function handleEditProfileLink(e) {
    e.preventDefault();
    DOM.settingsDropdown.classList.add('hidden');
    DOM.editProfileModal.classList.remove('hidden');
    DOM.editProfileForm.classList.add('hidden');
    DOM.editProfileLoader.classList.remove('hidden');
    try {
        const response = await sendDataToBackend({ action: 'getUserProfile', payload: { userId: state.userProfile.userId } });
        if (response.status === 'success') {
            const { alias, age, heightCm, weightKg, sex, activityKey } = response.profile;
            document.getElementById('edit-alias').value = alias;
            document.getElementById('edit-age').value = age;
            document.getElementById('edit-height').value = heightCm;
            document.getElementById('edit-weight').value = weightKg;
            document.getElementById('edit-gender').value = sex;
            document.getElementById('edit-activityKey').value = activityKey;
            DOM.editProfileLoader.classList.add('hidden');
            DOM.editProfileForm.classList.remove('hidden');
        } else { throw new Error(response.message); }
    } catch (error) {
        showCustomAlert('Error al cargar el perfil: ' + error.message, 'Error');
        DOM.editProfileModal.classList.add('hidden');
    }
}

async function handleSaveChanges() {
    const updatedProfile = { userId: state.userProfile.userId, alias: document.getElementById('edit-alias').value, age: parseInt(document.getElementById('edit-age').value, 10), heightCm: parseInt(document.getElementById('edit-height').value, 10), weightKg: parseFloat(document.getElementById('edit-weight').value), sex: document.getElementById('edit-gender').value, activityKey: document.getElementById('edit-activityKey').value };
    if (!updatedProfile.alias || !updatedProfile.age || !updatedProfile.heightCm || !updatedProfile.weightKg) {
        showCustomAlert("Por favor, completa todos los campos del perfil.");
        return;
    }
    setButtonLoading(DOM.saveChangesButton, true);
    try {
        const response = await sendDataToBackend({ action: 'updateUserProfile', payload: updatedProfile });
        if (response.status === 'success') {
            state.userProfile = updatedProfile;
            saveToStorage('userProfile', state.userProfile);
            showCustomAlert('Perfil actualizado. Tu plan anterior fue eliminado.<br>Por favor, crea uno nuevo.', 'Éxito');
            DOM.editProfileModal.classList.add('hidden');
            localStorage.removeItem('userPlan');
            setTimeout(() => location.reload(), 2500);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        showCustomAlert('Error al guardar los cambios: ' + error.message, 'Error');
    } finally {
        setButtonLoading(DOM.saveChangesButton, false);
    }
}

async function handleDeleteData(e) {
    e.preventDefault();
    DOM.settingsDropdown.classList.add('hidden');
    const userConfirmed = await showCustomConfirm("Esta acción eliminará permanentemente tu perfil, plan y todos tus registros.<br><strong>¿Deseas continuar?</strong>", "¿ESTÁS SEGURO?");
    if (userConfirmed) {
        DOM.deleteDataLink.textContent = 'Eliminando...';
        DOM.deleteDataLink.classList.add('text-gray-400');
        DOM.deleteDataLink.style.pointerEvents = 'none';
        try {
            const response = await sendDataToBackend({ action: 'limpiarTodo' });
            if (response.status === 'success') {
                showCustomAlert(response.message, 'Proceso Completado');
                setTimeout(() => {
                    localStorage.clear();
                    location.reload();
                }, 2500);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            showCustomAlert("Error al eliminar los datos: " + error.message, "Error");
            DOM.deleteDataLink.textContent = 'Eliminar Todos los Datos';
            DOM.deleteDataLink.classList.remove('text-gray-400');
            DOM.deleteDataLink.style.pointerEvents = 'auto';
        }
    }
}

function handleCancelActivity() {
    DOM.activityModal.classList.add('hidden');
    DOM.activityResultContainer.classList.add('hidden');
    DOM.activityDescription.value = '';
    state.caloriesBurned = 0;
}

async function handleCalculateActivity() {
    const description = DOM.activityDescription.value.trim();
    if (!description) {
        showCustomAlert("Por favor, describe tu actividad física.");
        return;
    }
    if (!state.userProfile || !state.userProfile.weightKg) {
        showCustomAlert("No se pudo encontrar tu peso en el perfil.");
        return;
    }
    setButtonLoading(DOM.calculateActivityButton, true);
    DOM.activityResultContainer.classList.add('hidden');
    try {
        const prompt = `Calcula las calorías aproximadas quemadas por una persona de ${state.userProfile.weightKg} kg que realizó la siguiente actividad: "${description}". Responde únicamente con el número entero de calorías.`;
        const response = await sendDataToBackend({ action: 'askGemini', payload: { prompt } });
        if (response.status === 'success' && response.answer) {
            const calories = parseInt(response.answer.match(/\d+/)[0], 10);
            if (!isNaN(calories)) {
                state.caloriesBurned = calories;
                DOM.activityCaloriesResult.textContent = state.caloriesBurned;
                DOM.activityResultContainer.classList.remove('hidden');
            } else {
                throw new Error("La respuesta de la IA no fue un número válido.");
            }
        } else {
            throw new Error(response.message || "No se pudo calcular las calorías.");
        }
    } catch (error) {
        showCustomAlert(`Error al calcular las calorías: ${error.message}`, "Error");
    } finally {
        setButtonLoading(DOM.calculateActivityButton, false);
    }
}

function handleAddActivityCalories() {
    if (state.caloriesBurned <= 0) return;
    let dailyData = loadDailyData();
    dailyData.consumed -= state.caloriesBurned;
    saveToStorage('dailyData', dailyData);
    sendDataToBackend({ action: 'saveData', sheet: 'Actividades', payload: { userId: state.userProfile.userId, date: new Date().toISOString(), description: DOM.activityDescription.value.trim(), caloriesBurned: state.caloriesBurned } });
    updateNutritionTrackerUI(state.userPlan.target_kcal, dailyData.consumed);
    showCustomAlert(`¡Excelente! Has ganado ${state.caloriesBurned} kcal en tu margen diario.`, "Actividad Registrada");
    handleCancelActivity();
}

function handleGetSuggestionFab() {
    const dailyData = loadDailyData();
    const remaining = state.userPlan.target_kcal - dailyData.consumed;
    if (remaining <= 0) {
        showCustomAlert("¡Ya has alcanzado tu objetivo calórico de hoy!", "Objetivo Cumplido");
        return;
    }
    DOM.suggestionModalTitle.innerHTML = `Consejos del Gurú 🍏<br>(${remaining} Kcal restantes)`;
    DOM.suggestionModal.classList.remove('hidden');
    DOM.suggestionResultContainer.classList.add('hidden');
    DOM.suggestionPromptTextarea.value = '';
    document.querySelectorAll('.suggestion-option-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
    });
    DOM.addSelectedDishesButton.classList.add('hidden');
}

function handleSuggestionOptionSelect(e) {
    const target = e.target.closest('.suggestion-option-btn');
    if (!target) return;
    document.querySelectorAll('.suggestion-option-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
    });
    target.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    target.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
}

async function handleGetSuggestion() {
    const dailyData = loadDailyData();
    const remaining = state.userPlan.target_kcal - dailyData.consumed;
    if (remaining <= 0) {
        showCustomAlert("¡Ya has alcanzado tu objetivo calórico de hoy!", "Objetivo Cumplido");
        return;
    }
    setButtonLoading(DOM.getSuggestionButton, true);
    DOM.suggestionResultContainer.classList.add('hidden');
    const selectedOption = document.querySelector('.suggestion-option-btn.bg-blue-600')?.dataset.option;
    const userPrompt = DOM.suggestionPromptTextarea.value.trim();
    if (!selectedOption) {
        showCustomAlert("Por favor, selecciona una opción de calorías.");
        setButtonLoading(DOM.getSuggestionButton, false);
        return;
    }
    try {
        const response = await sendDataToBackend({ action: 'getSuggestion', payload: { selectedOption, userPrompt, remainingKcal: remaining } });
        if (response.status === 'success' && response.answer) {
            displayGeminiSuggestions(response.answer);
            DOM.suggestionResultContainer.classList.remove('hidden');
            DOM.addSelectedDishesButton.classList.remove('hidden');
        } else {
            throw new Error(response.message || "No se pudo obtener una sugerencia.");
        }
    } catch (error) {
        showCustomAlert(`Error al obtener el consejo: ${error.message}`, "Error");
    } finally {
        setButtonLoading(DOM.getSuggestionButton, false);
    }
}

function handleAddSelectedDishes() {
    const selectedItems = Array.from(document.querySelectorAll('#suggestion-list input[type="checkbox"]:checked'));
    if (selectedItems.length === 0) {
        showCustomAlert("Por favor, selecciona al menos un plato para añadir.");
        return;
    }
    let totalCaloriesToAdd = 0;
    const dishesToSave = selectedItems.map(item => {
        const parentDiv = item.closest('div');
        const description = parentDiv.dataset.description;
        const calories = parseInt(parentDiv.dataset.calories, 10);
        totalCaloriesToAdd += calories;
        return { userId: state.userProfile.userId, date: new Date().toISOString(), description: description, caloriesganadas: calories };
    });
    let dailyData = loadDailyData();
    dailyData.consumed += totalCaloriesToAdd;
    saveToStorage('dailyData', dailyData);
    dishesToSave.forEach(dish => {
        sendDataToBackend({ action: 'saveData', sheet: 'Alimentos', payload: dish });
    });
    updateNutritionTrackerUI(state.userPlan.target_kcal, dailyData.consumed);
    showCustomAlert(`Se han añadido ${totalCaloriesToAdd} kcal a tu consumo diario.`, "Platos Añadidos");
    DOM.suggestionModal.classList.add('hidden');
}


// ============================================================================
// --- 5. LÓGICA PRINCIPAL DE LA APP ---
// ============================================================================

async function checkPlanCompletion() {
    if (!state.userPlan || !state.userProfile || !state.userPlan.startDate) return;
    if (loadFromStorage(`plan_archived_${state.userPlan.startDate}`)) {
        return;
    }
    const startDate = new Date(state.userPlan.startDate);
    const endDate = new Date(startDate.getTime() + state.userPlan.days * 24 * 60 * 60 * 1000);
    const now = new Date();
    if (now > endDate) {
        const summaryResponse = await sendDataToBackend({ action: 'getPlanSummary', payload: { userId: state.userProfile.userId, startDate: state.userPlan.startDate, days: state.userPlan.days } });
        if (summaryResponse.status === 'success') {
            DOM.planEndMessage.textContent = summaryResponse.message;
            DOM.planSummaryExpected.textContent = `Pérdida Esperada: ~${summaryResponse.expectedKgLoss} kg`;
            DOM.planSummaryActual.textContent = `Pérdida Real: ~${summaryResponse.actualKgLoss} kg`;
            DOM.endOfPlanModal.classList.remove('hidden');
          // Y REEMPLÁZALO con este bloque mejorado:
await sendDataToBackend({
    action: 'archiveCompletedPlan',
    payload: {
        userId: state.userProfile.userId,
        startDate: state.userPlan.startDate,
        days: state.userPlan.days,
        kg_goal: state.userPlan.kg_goal,
        expectedKgLoss: summaryResponse.expectedKgLoss,
        actualKgLoss: summaryResponse.actualKgLoss
    }
});
            saveToStorage(`plan_archived_${state.userPlan.startDate}`, true);
        }
    }
}

async function analyzeImage(resizedBase64ImageData) {
    try {
        const responseData = await sendDataToBackend({ action: 'analyzeImage', payload: { imageData: resizedBase64ImageData } });
        if (responseData && responseData.dishName) {
            state.analysisResult = responseData;
            displayResults(state.analysisResult);
        } else { throw new Error("Respuesta inválida del backend."); }
    } catch (error) {
        document.getElementById('error-message').textContent = `Error: ${error.message}`;
        document.getElementById('error-message').classList.remove('hidden');
    } finally {
        DOM.loader.classList.add('hidden');
    }
}

async function loadWeightProgressGraph() {
    try {
        const response = await sendDataToBackend({ action: 'getWeightProgress', payload: { userId: state.userProfile.userId } });
        if (response.status === 'success' && response.data.length > 1) {
            const labels = response.data.map(d => new Date(d.date).toLocaleDateString('es-ES'));
            const weights = response.data.map(d => d.weight);
            DOM.progressGraphContainer.classList.remove('hidden');
            const ctx = document.getElementById('weight-chart').getContext('2d');
            if (state.weightChart) {
                state.weightChart.destroy();
            }
            state.weightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Progreso de Peso (kg)',
                        data: weights,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: false } } }
            });
        }
    } catch (error) {
        console.error("Error al cargar el gráfico de progreso:", error);
    }
}

// ============================================================================
// --- 6. COMUNICACIÓN CON EL BACKEND ---
// ============================================================================

async function sendDataToBackend(data) {
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del servidor: ${response.status} ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error en backend para acción "${data.action}":`, error);
        throw error;
    }
}

// ============================================================================
// --- 7. FUNCIONES DE UTILIDAD (UI, DATOS, ETC.) ---
// ============================================================================

function displayCurrentProgress(data) {
    DOM.progressDaysElapsed.textContent = data.daysElapsed;
    DOM.progressDaysTotal.textContent = data.totalDaysInPlan;
    DOM.progressPercentage.textContent = data.planCompletionPercentage;
    DOM.progressExpectedLoss.textContent = data.expectedLossSoFar;
    DOM.progressActualLoss.textContent = data.actualLossSoFar;
    DOM.progressNetDeficit.textContent = data.netCalorieDeficitSoFar;
}

function displayGolesHistory(goles) {
    DOM.golesHistoryList.innerHTML = '';
    if (!goles || goles.length === 0) {
        DOM.noGolesMessage.classList.remove('hidden');
        return;
    }
    DOM.noGolesMessage.classList.add('hidden');
    goles.forEach(gol => {
        const startDate = new Date(gol.startDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const card = document.createElement('div');
        card.className = 'p-4 border rounded-lg bg-gray-50';
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <p class="font-bold text-lg text-gray-800">Plan iniciado el ${startDate}</p>
                <p class="text-sm text-gray-500">${gol.days} días</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                    <p class="text-2xl font-bold text-blue-600">${gol.kg_goal} <span class="text-lg font-medium">kg</span></p>
                    <p class="text-sm text-gray-600">Meta Original</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-green-600">${gol.expectedKgLoss} <span class="text-lg font-medium">kg</span></p>
                    <p class="text-sm text-gray-600">Pérdida Esperada</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-indigo-600">${gol.actualKgLoss} <span class="text-lg font-medium">kg</span></p>
                    <p class="text-sm text-gray-600">Pérdida Real</p>
                </div>
            </div>
        `;
        DOM.golesHistoryList.appendChild(card);
    });
}

function displayResults(data) {
    document.getElementById('dish-name').textContent = data.dishName || "Plato no identificado";
    document.getElementById('portion-analysis-text').textContent = data.portionAnalysis || "";
    const cartListEl = document.getElementById('cart-list');
    cartListEl.innerHTML = '';
    data.ingredients.forEach(ing => {
        cartListEl.innerHTML += `<li class="flex justify-between items-center"><span>${ing.name} (~${Math.round(ing.quantity)}${ing.unit})</span> <span class="font-medium text-gray-700">${Math.round(ing.calories)} kcal</span></li>`;
    });
    cartListEl.innerHTML += `<li class="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2"><span>Total</span> <span>${Math.round(data.totalCalories)} kcal</span></li>`;
    DOM.resultContent.classList.remove('hidden');
    DOM.addCaloriesButton.classList.remove('hidden');
}

function displayGeminiSuggestions(text) {
    DOM.suggestionList.innerHTML = '';
    const suggestions = text.split('.').filter(s => s.trim() !== '');
    suggestions.forEach(suggestion => {
        const caloriesMatch = suggestion.match(/\((~?\d+)\s*kcal\)/);
        const calories = caloriesMatch ? parseInt(caloriesMatch[1].replace('~', ''), 10) : 0;
        
        const listItem = document.createElement('div');
        listItem.className = 'flex items-center space-x-2 py-2 px-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100';
        listItem.dataset.description = suggestion;
        listItem.dataset.calories = calories;

        listItem.innerHTML = `
            <input type="checkbox" class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
            <label class="text-gray-800 flex-1">${suggestion}</label>
        `;
        
        DOM.suggestionList.appendChild(listItem);
        listItem.addEventListener('click', () => {
            const checkbox = listItem.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
        });
    });
}

function updateNutritionTrackerUI(goal, consumed) {
    if (!state.userPlan || goal === null) {
        DOM.nutritionTracker.classList.add('hidden');
        return;
    }
    DOM.nutritionTracker.classList.remove('hidden');
    const remaining = goal - consumed;
    document.getElementById('calorie-goal').textContent = goal;
    document.getElementById('calories-consumed').textContent = consumed;
    document.getElementById('calories-remaining').textContent = remaining;
}

function setButtonLoading(button, isLoading) {
    const buttonText = button.querySelector('.btn-text');
    const buttonLoader = button.querySelector('.btn-loader');
    if (isLoading) {
        button.disabled = true;
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
    } else {
        button.disabled = false;
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
    }
}

function resizeImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.9) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function getLocalDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadDailyData() {
    const today = getLocalDateString();
    const data = loadFromStorage('dailyData');
    if (!data || data.date !== today) {
        const newData = { date: today, consumed: 0 };
        saveToStorage('dailyData', newData);
        return newData;
    }
    return data;
}

function startClock() {
    const updateTime = () => DOM.datetimeDisplay.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    updateTime();
    setInterval(updateTime, 60000);
}

function resetFileInputUI() {
    DOM.imagePreview.classList.add('hidden');
    DOM.uploadPrompt.classList.remove('hidden');
    DOM.fileInput.value = '';
    DOM.analyzeButton.disabled = true;
    DOM.resultsContainer.classList.add('hidden');
    DOM.resultContent.classList.add('hidden');
}

function showCustomAlert(message, title = 'Aviso') {
    DOM.customAlertTitle.textContent = title;
    DOM.customAlertMessage.innerHTML = message;
    DOM.customAlertCancelButton.classList.add('hidden');
    DOM.customAlertConfirmButton.textContent = 'Aceptar';
    DOM.customAlertModal.classList.remove('hidden');
    
    const onConfirm = () => {
        DOM.customAlertModal.classList.add('hidden');
        DOM.customAlertConfirmButton.removeEventListener('click', onConfirm);
    };
    DOM.customAlertConfirmButton.addEventListener('click', onConfirm);
}

function showCustomConfirm(message, title = 'Confirmación') {
    return new Promise(resolve => {
        DOM.customAlertTitle.textContent = title;
        DOM.customAlertMessage.innerHTML = message;
        DOM.customAlertConfirmButton.textContent = 'Confirmar';
        DOM.customAlertCancelButton.classList.remove('hidden');
        DOM.customAlertModal.classList.remove('hidden');

        const cleanup = () => {
            DOM.customAlertModal.classList.add('hidden');
            DOM.customAlertConfirmButton.removeEventListener('click', onConfirm);
            DOM.customAlertCancelButton.removeEventListener('click', onCancel);
        };
        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        DOM.customAlertConfirmButton.addEventListener('click', onConfirm);
        DOM.customAlertCancelButton.addEventListener('click', onCancel);
    });
}