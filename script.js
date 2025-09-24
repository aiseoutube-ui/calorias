// --- Referencias al DOM (Elementos de la página) ---
const userProfileModal = document.getElementById('user-profile-modal');
const planSetupModal = document.getElementById('plan-setup-modal');
const datetimeDisplay = document.getElementById('datetime-display');
const analyzeButton = document.getElementById('analyze-button');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const uploadPrompt = document.getElementById('upload-prompt');
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const addCaloriesButton = document.getElementById('add-calories-button');
const calculatePlanButton = document.getElementById('calculate-plan-button');
const savePlanButton = document.getElementById('save-plan-button');
const planTabsContainer = document.getElementById('plan-tabs');

// Nuevas referencias para Ajustes y Edición
const settingsMenuContainer = document.getElementById('settings-menu-container');
const settingsButton = document.getElementById('settings-button');
const settingsDropdown = document.getElementById('settings-dropdown');
const editProfileLink = document.getElementById('edit-profile-link');
const deleteDataLink = document.getElementById('delete-data-link');
const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileLoader = document.getElementById('edit-profile-loader');
const editProfileForm = document.getElementById('edit-profile-form');
const cancelEditButton = document.getElementById('cancel-edit-button');
const saveChangesButton = document.getElementById('save-changes-button');

// **NUEVAS REFERENCIAS PARA EL MODAL PERSONALIZADO**
const customAlertModal = document.getElementById('custom-alert-modal');
const customAlertTitle = document.getElementById('custom-alert-title');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertConfirmButton = document.getElementById('custom-alert-confirm-button');
const customAlertCancelButton = document.getElementById('custom-alert-cancel-button');


// --- Estado de la Aplicación (Variables Globales) ---
let userProfile = null;
let userPlan = null;
let analysisResult = null;
let currentPlanType = 'byPace';

// --- URL del Web App de Google Apps Script ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw5d7fnHa9LF-c1dmf0FnpSeiqQ9HK4yQBpbE6eon-Ag2JJdIN6BO8yqMnmkdvS92a/exec';


//================================================================================
// --- LÓGICA DE LA APLICACIÓN ---
//================================================================================

window.onload = function() {
    startClock();
    userProfile = loadFromStorage('userProfile');
    userPlan = loadFromStorage('userPlan');
    
    if (userProfile && userPlan) {
        const dailyData = loadDailyData();
        updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
        settingsMenuContainer.classList.remove('hidden');
    } else if (userProfile && !userPlan) {
        planSetupModal.classList.remove('hidden');
    } else {
        userProfileModal.classList.remove('hidden');
    }
    analyzeButton.disabled = true;
};

//================================================================================
// --- EVENT LISTENERS (Manejadores de eventos para botones, etc.) ---
//================================================================================

// --- Registro y Planificación ---
document.getElementById('save-profile-button').addEventListener('click', async () => {
    const profile = {
        alias: document.getElementById('alias').value,
        age: parseInt(document.getElementById('age').value, 10),
        heightCm: parseInt(document.getElementById('height').value, 10),
        weightKg: parseFloat(document.getElementById('weight').value),
        sex: document.getElementById('gender').value,
        activityKey: document.getElementById('activityKey').value,
        userId: userProfile?.userId || `user_${Date.now()}`
    };
    if (!profile.alias || !profile.age || !profile.heightCm || !profile.weightKg) {
        showCustomAlert("Por favor, completa todos los campos del perfil.");
        return;
    }
    userProfile = profile;
    saveToStorage('userProfile', profile);

    const saveButton = document.getElementById('save-profile-button');
    setButtonLoading(saveButton, true);
    await sendDataToBackend({ action: 'saveData', sheet: 'Perfiles', payload: profile });
    setButtonLoading(saveButton, false);

    userProfileModal.classList.add('hidden');
    planSetupModal.classList.remove('hidden');
});

planTabsContainer.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    const planType = e.target.dataset.planType;
    currentPlanType = planType;
    document.querySelectorAll('.plan-tab-button').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    e.target.classList.add('border-blue-500', 'text-blue-600');
    e.target.classList.remove('border-transparent', 'text-gray-500');
    document.querySelectorAll('.plan-type-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`plan-${planType}`).classList.remove('hidden');
});

calculatePlanButton.addEventListener('click', () => {
    const planInputs = {
        ...userProfile,
        planType: currentPlanType,
        paceKgPerWeek: parseFloat(document.getElementById('pace').value),
        days: parseInt(currentPlanType === 'byPace' ? document.getElementById('pace-days').value : document.getElementById('kg-days').value, 10),
        kgGoal: parseFloat(document.getElementById('kg-goal').value)
    };
    const calculatedPlan = calcWeightLossPlan(planInputs);
    userPlan = calculatedPlan;
    const summaryDiv = document.getElementById('plan-summary-text');
    summaryDiv.innerHTML = `Tu objetivo diario será de <strong>${calculatedPlan.target_kcal} kcal</strong> para perder ~<strong>${calculatedPlan.kg_goal} kg</strong> en <strong>${calculatedPlan.days} días</strong>.`;
    const warningsDiv = document.getElementById('plan-warnings');
    warningsDiv.innerHTML = calculatedPlan.warnings.join('<br>');
    warningsDiv.style.display = calculatedPlan.warnings.length > 0 ? 'block' : 'none';
    document.getElementById('plan-preview').classList.remove('hidden');
    savePlanButton.disabled = false;
});

savePlanButton.addEventListener('click', () => {
    if (!userPlan) return;
    saveToStorage('userPlan', userPlan);
    sendDataToBackend({ action: 'saveData', sheet: 'Planes', payload: { ...userPlan, userId: userProfile.userId } });
    planSetupModal.classList.add('hidden');
    const dailyData = loadDailyData();
    updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
    settingsMenuContainer.classList.remove('hidden');
});

// --- Análisis de Comida ---
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
            analyzeButton.disabled = false;
        };
        reader.readAsDataURL(file);
    }
});

analyzeButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (file) {
        resultsContainer.classList.remove('hidden');
        resultContent.classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
        loader.classList.remove('hidden');
        analyzeButton.disabled = true;
        try {
            const resizedBase64 = await resizeImage(file);
            await analyzeImage(resizedBase64);
        } catch (error) {
            document.getElementById('error-message').textContent = 'Error al procesar la imagen.';
            document.getElementById('error-message').classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }
});

addCaloriesButton.addEventListener('click', () => {
    if (!analysisResult) return;
    let dailyData = loadDailyData();
    dailyData.consumed += Math.round(analysisResult.totalCalories);
    saveToStorage('dailyData', { date: new Date().toISOString().split('T')[0], consumed: dailyData.consumed });
    sendDataToBackend({ action: 'saveData', sheet: 'RegistrosComida', payload: { ...analysisResult, userId: userProfile.userId, date: new Date().toISOString() } });
    updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
    resetFileInputUI();
});

// --- Menú de Ajustes y Edición de Perfil ---
settingsButton.addEventListener('click', () => {
    settingsDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (event) => {
    if (!settingsMenuContainer.contains(event.target)) {
        settingsDropdown.classList.add('hidden');
    }
});

editProfileLink.addEventListener('click', async (e) => {
    e.preventDefault();
    settingsDropdown.classList.add('hidden');
    editProfileModal.classList.remove('hidden');
    editProfileForm.classList.add('hidden');
    editProfileLoader.classList.remove('hidden');
    try {
        const response = await sendDataToBackend({ action: 'getUserProfile', payload: { userId: userProfile.userId } });
        if (response.status === 'success') {
            const { alias, age, heightCm, weightKg, sex, activityKey } = response.profile;
            document.getElementById('edit-alias').value = alias;
            document.getElementById('edit-age').value = age;
            document.getElementById('edit-height').value = heightCm;
            document.getElementById('edit-weight').value = weightKg;
            document.getElementById('edit-gender').value = sex;
            document.getElementById('edit-activityKey').value = activityKey;
            editProfileLoader.classList.add('hidden');
            editProfileForm.classList.remove('hidden');
        } else { throw new Error(response.message); }
    } catch (error) {
        showCustomAlert('Error al cargar el perfil: ' + error.message, 'Error');
        editProfileModal.classList.add('hidden');
    }
});

cancelEditButton.addEventListener('click', () => {
    editProfileModal.classList.add('hidden');
});

saveChangesButton.addEventListener('click', async () => {
    const updatedProfile = {
        userId: userProfile.userId,
        alias: document.getElementById('edit-alias').value,
        age: parseInt(document.getElementById('edit-age').value, 10),
        heightCm: parseInt(document.getElementById('edit-height').value, 10),
        weightKg: parseFloat(document.getElementById('edit-weight').value),
        sex: document.getElementById('edit-gender').value,
        activityKey: document.getElementById('edit-activityKey').value
    };

    if (!updatedProfile.alias || !updatedProfile.age || !updatedProfile.heightCm || !updatedProfile.weightKg) {
        showCustomAlert("Por favor, completa todos los campos del perfil.");
        return;
    }

    setButtonLoading(saveChangesButton, true);
    try {
        const response = await sendDataToBackend({ action: 'updateUserProfile', payload: updatedProfile });
        if (response.status === 'success') {
            userProfile = updatedProfile;
            saveToStorage('userProfile', userProfile);
            showCustomAlert('Perfil actualizado. Tu plan anterior fue eliminado.<br>Por favor, crea uno nuevo.', 'Éxito');
            editProfileModal.classList.add('hidden');
            localStorage.removeItem('userPlan');
            setTimeout(() => location.reload(), 2500);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        showCustomAlert('Error al guardar los cambios: ' + error.message, 'Error');
    } finally {
        setButtonLoading(saveChangesButton, false);
    }
});

deleteDataLink.addEventListener('click', async (e) => {
    e.preventDefault();
    settingsDropdown.classList.add('hidden');
    
    const userConfirmed = await showCustomConfirm(
        "Esta acción eliminará permanentemente tu perfil, plan y todos tus registros.<br><strong>¿Deseas continuar?</strong>", 
        "¿ESTÁS SEGURO?"
    );

    if (userConfirmed) {
        // Cambiamos el estilo del enlace para mostrar que está "cargando"
        deleteDataLink.textContent = 'Eliminando...';
        deleteDataLink.classList.add('text-gray-400');
        deleteDataLink.style.pointerEvents = 'none'; // Evita más clics

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
            // Si hay error, restauramos el enlace a su estado original
            deleteDataLink.textContent = 'Eliminar Todos los Datos';
            deleteDataLink.classList.remove('text-gray-400');
            deleteDataLink.style.pointerEvents = 'auto';
        }
    }
});


//================================================================================
// --- FUNCIONES DE SOPORTE (Cálculos, Backend, UI, etc.) ---
//================================================================================

async function sendDataToBackend(data) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
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

async function analyzeImage(resizedBase64ImageData) {
    try {
        const responseData = await sendDataToBackend({ action: 'analyzeImage', payload: { imageData: resizedBase64ImageData } });
        if (responseData && responseData.dishName) {
            analysisResult = responseData;
            displayResults(analysisResult);
        } else { throw new Error("Respuesta inválida del backend."); }
    } catch (error) {
        document.getElementById('error-message').textContent = `Error: ${error.message}`;
        document.getElementById('error-message').classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
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
    resultContent.classList.remove('hidden');
    addCaloriesButton.classList.remove('hidden');
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
                let width = img.width; let height = img.height;
                if (width > height) {
                    if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

function calcWeightLossPlan({ sex, age, weightKg, heightCm, activityKey, planType, kgGoal = 0, days = 30, paceKgPerWeek = 0.5 }) {
    const ACTIVITY_FACTORS = { "sedentary": 1.20, "light": 1.375, "moderate": 1.55, "active": 1.725 };
    const MIN_KCAL = { M: 1500, F: 1200 };
    const MAX_DAILY_DEFICIT = 1000;
    const KCAL_PER_KG = 7700;
    const bmr = (sex === 'M') ? (10 * weightKg + 6.25 * heightCm - 5 * age + 5) : (10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    const tdee = bmr * (ACTIVITY_FACTORS[activityKey] || 1.2);
    let totalKcalNeeded, finalKgGoal, finalDays;
    if (planType === "byPace") {
        finalDays = days > 0 ? days : 30;
        finalKgGoal = paceKgPerWeek * Math.max(finalDays / 7, 1);
    } else {
        finalKgGoal = kgGoal > 0 ? kgGoal : 1;
        finalDays = days > 0 ? days : 30;
    }
    totalKcalNeeded = finalKgGoal * KCAL_PER_KG;
    let dailyDeficit = totalKcalNeeded / Math.max(finalDays, 1);
    let warnings = [];
    if (dailyDeficit > MAX_DAILY_DEFICIT) {
        warnings.push(`Déficit diario solicitado (${Math.round(dailyDeficit)} kcal) es muy alto. Se limitará a ${MAX_DAILY_DEFICIT} kcal.`);
        dailyDeficit = MAX_DAILY_DEFICIT;
    }
    let targetKcal = tdee - dailyDeficit;
    const minKcalAllowed = MIN_KCAL[sex] || 1200;
    if (targetKcal < minKcalAllowed) {
        warnings.push(`El objetivo calórico (${Math.round(targetKcal)} kcal) se ajustó al mínimo seguro de ${minKcalAllowed} kcal.`);
        targetKcal = minKcalAllowed;
    }
    return { bmr: parseFloat(bmr.toFixed(1)), tdee: parseFloat(tdee.toFixed(1)), target_kcal: Math.round(targetKcal), daily_deficit: Math.round(dailyDeficit), kg_goal: parseFloat(finalKgGoal.toFixed(2)), days: finalDays, warnings };
}

function saveToStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function loadFromStorage(key) { const data = localStorage.getItem(key); return data ? JSON.parse(data) : null; }

function loadDailyData() {
    const data = loadFromStorage('dailyData');
    const today = new Date().toISOString().split('T')[0];
    if (!data || data.date !== today) return { consumed: 0 };
    return { consumed: data.consumed || 0 };
}

function updateNutritionTrackerUI(goal, consumed) {
    if (!userPlan || goal === null) {
        document.getElementById('nutrition-tracker').classList.add('hidden');
        return;
    }
    const tracker = document.getElementById('nutrition-tracker');
    tracker.classList.remove('hidden');
    const remaining = goal - consumed;
    document.getElementById('calorie-goal').textContent = goal;
    document.getElementById('calories-consumed').textContent = consumed;
    document.getElementById('calories-remaining').textContent = remaining;
}

function startClock() {
    const updateTime = () => datetimeDisplay.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    updateTime();
    setInterval(updateTime, 60000);
}

function resetFileInputUI() {
    imagePreview.classList.add('hidden');
    uploadPrompt.classList.remove('hidden');
    fileInput.value = '';
    analyzeButton.disabled = true;
    resultsContainer.classList.add('hidden');
    resultContent.classList.add('hidden');
}

//================================================================================
// --- NUEVAS FUNCIONES PARA MODAL PERSONALIZADO ---
//================================================================================

function showCustomAlert(message, title = 'Aviso') {
    customAlertTitle.textContent = title;
    customAlertMessage.innerHTML = message;
    customAlertCancelButton.classList.add('hidden');
    customAlertConfirmButton.textContent = 'Aceptar';
    customAlertModal.classList.remove('hidden');
    const onConfirm = () => {
        customAlertModal.classList.add('hidden');
        customAlertConfirmButton.removeEventListener('click', onConfirm);
    };
    customAlertConfirmButton.addEventListener('click', onConfirm);
}

function showCustomConfirm(message, title = 'Confirmación') {
    return new Promise(resolve => {
        customAlertTitle.textContent = title;
        customAlertMessage.innerHTML = message;
        customAlertConfirmButton.textContent = 'Confirmar';
        customAlertCancelButton.classList.remove('hidden');
        customAlertModal.classList.remove('hidden');
        const onConfirm = () => {
            cleanup();
            resolve(true);
        };
        const onCancel = () => {
            cleanup();
            resolve(false);
        };
        const cleanup = () => {
            customAlertModal.classList.add('hidden');
            customAlertConfirmButton.removeEventListener('click', onConfirm);
            customAlertCancelButton.removeEventListener('click', onCancel);
        };
        customAlertConfirmButton.addEventListener('click', onConfirm);
        customAlertCancelButton.addEventListener('click', onCancel);
    });
}

/**
 * Activa o desactiva el estado de carga de un botón.
 * @param {HTMLButtonElement} button - El elemento del botón.
 * @param {boolean} isLoading - True para mostrar el loader, false para mostrar el texto.
 */
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
