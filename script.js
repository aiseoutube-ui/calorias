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
const customAlertModal = document.getElementById('custom-alert-modal');
const customAlertTitle = document.getElementById('custom-alert-title');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertConfirmButton = document.getElementById('custom-alert-confirm-button');
const customAlertCancelButton = document.getElementById('custom-alert-cancel-button');

// **NUEVAS REFERENCIAS PARA ACTIVIDAD FÍSICA**
const fabContainer = document.getElementById('fab-container');
const addActivityFab = document.getElementById('add-activity-fab');
const activityModal = document.getElementById('activity-modal');
const activityDescription = document.getElementById('activity-description');
const calculateActivityButton = document.getElementById('calculate-activity-button');
const activityResultContainer = document.getElementById('activity-result-container');
const activityCaloriesResult = document.getElementById('activity-calories-result');
const addActivityCaloriesButton = document.getElementById('add-activity-calories-button');
const cancelActivityButton = document.getElementById('cancel-activity-button');
// **NUEVAS REFERENCIAS PARA SUGERENCIAS DE COMIDA**
const getSuggestionFab = document.getElementById('get-suggestion-fab');
const suggestionModal = document.getElementById('suggestion-modal');
const suggestionOptionsContainer = document.getElementById('suggestion-options');
const suggestionPromptTextarea = document.getElementById('suggestion-prompt');
const getSuggestionButton = document.getElementById('get-suggestion-button');
const suggestionResultContainer = document.getElementById('suggestion-result-container');
const suggestionList = document.getElementById('suggestion-list');
const cancelSuggestionButton = document.getElementById('cancel-suggestion-button');
const suggestionModalTitle = document.getElementById('suggestion-modal-title');
const suggestionOptionBtns = document.querySelectorAll('.suggestion-option-btn');
const addSelectedDishesButton = document.getElementById('add-selected-dishes-button');
// --- Estado de la Aplicación (Variables Globales) ---
let userProfile = null;
let userPlan = null;
let analysisResult = null;
let currentPlanType = 'byPace';
let caloriesBurned = 0; // Para guardar el resultado de la actividad

// --- URL del Web App de Google Apps Script ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzdKQ5jUJdU3gADPRtAvgO1qx1G3Sv0MD6ohC8cwW-_JRZ6YWxeAtLj3wmZ8cItmg1b/exec';
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
        fabContainer.classList.remove('hidden');
        // Mostrar el contenedor de los FABs
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
    fabContainer.classList.remove('hidden');
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
    saveToStorage('dailyData', { date: getLocalDateString(), consumed: dailyData.consumed });
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
        deleteDataLink.textContent = 'Eliminando...';
        deleteDataLink.classList.add('text-gray-400');
        deleteDataLink.style.pointerEvents = 'none';

        try 
        {
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
            deleteDataLink.textContent = 'Eliminar Todos los Datos';
            deleteDataLink.classList.remove('text-gray-400');
            deleteDataLink.style.pointerEvents = 'auto';
        }
    }
});

// **SECCIÓN: REGISTRO DE ACTIVIDAD FÍSICA**
addActivityFab.addEventListener('click', () => {
    activityModal.classList.remove('hidden');
});
cancelActivityButton.addEventListener('click', () => {
    activityModal.classList.add('hidden');
    activityResultContainer.classList.add('hidden');
    activityDescription.value = '';
    caloriesBurned = 0;
});
calculateActivityButton.addEventListener('click', async () => {
    const description = activityDescription.value.trim();
    if (!description) {
        showCustomAlert("Por favor, describe tu actividad física.");
        return;
    }
    if (!userProfile || !userProfile.weightKg) {
        showCustomAlert("No se pudo encontrar tu peso en el perfil. Asegúrate de que tu perfil esté completo.");
        return;
    }
    setButtonLoading(calculateActivityButton, true);
    activityResultContainer.classList.add('hidden');
    try {
        const prompt = `Calcula las calorías aproximadas quemadas por una persona de ${userProfile.weightKg} kg que realizó la siguiente actividad: "${description}". Responde únicamente con el número entero de calorías.`;
        const response = await sendDataToBackend({
            action: 'askGemini',
            payload: { prompt: prompt }
        });
        if (response.status === 'success' && response.answer) {
            const calories = parseInt(response.answer.match(/\d+/)[0], 10);
            if (!isNaN(calories)) {
                caloriesBurned = calories;
                activityCaloriesResult.textContent = caloriesBurned;
                activityResultContainer.classList.remove('hidden');
            } else {
                throw new Error("La respuesta de la IA no fue un número válido.");
            }
        } else {
            throw new Error(response.message || "No se pudo calcular las calorías.");
        }
    } catch (error) {
        showCustomAlert(`Error al calcular las calorías: ${error.message}`, "Error");
    } finally {
        setButtonLoading(calculateActivityButton, false);
    }
});
addActivityCaloriesButton.addEventListener('click', () => {
    if (caloriesBurned <= 0) return;
    let dailyData = loadDailyData();
    dailyData.consumed -= caloriesBurned;
    saveToStorage('dailyData', dailyData);
    sendDataToBackend({ 
        action: 'saveData', 
        sheet: 'Actividades',
        payload: { 
            userId: userProfile.userId,
            date: new Date().toISOString(),
            description: activityDescription.value.trim(),
            caloriesBurned: caloriesBurned 
        } 
    });
    updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
    showCustomAlert(`¡Excelente! Has ganado ${caloriesBurned} kcal en tu margen diario.`, "Actividad Registrada");
    cancelActivityButton.click();
});
// **SECCIÓN: SUGERENCIAS DE COMIDA**
getSuggestionFab.addEventListener('click', () => {
    const dailyData = loadDailyData();
    const remaining = userPlan.target_kcal - dailyData.consumed;
    
    if (remaining <= 0) {
        showCustomAlert("¡Ya has alcanzado tu objetivo calórico de hoy! Intenta registrar una actividad física para quemar calorías.", "Kcal restantes agotadas");
        return;
    }

    suggestionModalTitle.innerHTML = `Consejos del Gurú 🍏<br>(${remaining} Kcal restantes)`;
    suggestionModal.classList.remove('hidden');
    suggestionResultContainer.classList.add('hidden');
    suggestionPromptTextarea.value = '';
    
    // Resetear el estado de los botones de opción
    suggestionOptionBtns.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
    });

    addSelectedDishesButton.classList.add('hidden');
});
suggestionOptionsContainer.addEventListener('click', (e) => {
    const target = e.target.closest('.suggestion-option-btn');
    if (!target) return;

    // Resetear el estado de todos los botones
    suggestionOptionBtns.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
    });
    
    // Marcar el botón seleccionado
    target.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    target.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
});
getSuggestionButton.addEventListener('click', async () => {
    const dailyData = loadDailyData();
    const remaining = userPlan.target_kcal - dailyData.consumed;
    
    if (remaining <= 0) {
        showCustomAlert("¡Ya has alcanzado tu objetivo calórico de hoy! Intenta registrar una actividad física para quemar calorías.", "Kcal restantes agotadas");
        return;
    }
    
    setButtonLoading(getSuggestionButton, true);
    suggestionResultContainer.classList.add('hidden');
    
    const selectedOption = document.querySelector('.suggestion-option-btn.bg-blue-600')?.dataset.option;
    const userPrompt = suggestionPromptTextarea.value.trim();

    if (!selectedOption) {
        showCustomAlert("Por favor, selecciona una opción de calorías.");
        setButtonLoading(getSuggestionButton, false);
        return;
    }

    let promptText = "";
    const basePrompt = `Estoy en un ${userPrompt || 'restaurante genérico'}.`;

    switch (selectedOption) {
        case '300':
            promptText = `Dame 4 opciones de colaciones o snacks que no superen las 300 kcal.`;
            break;
        case '600':
            promptText = `Dame 4 opciones de comidas o platos ligeros que no superen las 600 kcal.`;
            break;
        case 'total':
            promptText = `Dame 4 opciones de platos principales que utilicen la mayoría de mis ${remaining} kcal restantes.`;
            break;
        default:
            break;
    }
    
    const fullPrompt = `Actúa como un nutricionista experto. Me quedan ${remaining} kcal.
${basePrompt} ${promptText}. Las sugerencias deben ser platos con ingredientes comunes, variados (ejemplo: pastas, pizzas, etc., no solo ensaladas) y realistas para una dieta.
Proporciona solo la lista de platos con las calorías estimadas, sin formato de lista numerada.
Ejemplo de formato: "Tostadas con aguacate y huevo (~350 kcal). Ensalada de pollo a la parrilla (~400 kcal)."`;
    try {
        const response = await sendDataToBackend({
            action: 'askGemini',
            payload: { prompt: fullPrompt }
        });
        if (response.status === 'success' && response.answer) {
            displayGeminiSuggestions(response.answer);
            suggestionResultContainer.classList.remove('hidden');
            addSelectedDishesButton.classList.remove('hidden');
        } else {
            throw new Error(response.message || "No se pudo obtener una sugerencia.");
        }
    } catch (error) {
        showCustomAlert(`Error al obtener el consejo: ${error.message}`, "Error");
    } finally {
        setButtonLoading(getSuggestionButton, false);
    }
});
function displayGeminiSuggestions(text) {
    suggestionList.innerHTML = ''; // Limpiar lista anterior
    const suggestions = text.split('.').filter(s => s.trim() !== ''); // CAMBIO AQUÍ: dividir por punto
    suggestions.forEach(suggestion => {
        // Extraer las calorías del texto
        const caloriesMatch = suggestion.match(/\((~?\d+)\s*kcal\)/);
        const calories = caloriesMatch ? parseInt(caloriesMatch[1].replace('~', ''), 10) : 0;
        
        const listItem = document.createElement('div');
        listItem.classList.add('flex', 'items-center', 'space-x-2', 'py-2', 'px-3', 'rounded-lg', 'border', 'border-gray-200', 'cursor-pointer', 'hover:bg-gray-100');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('h-4', 'w-4', 'text-blue-600', 'rounded', 'border-gray-300', 'focus:ring-blue-500');
        
        const label = document.createElement('label');
        label.textContent = suggestion;
        label.classList.add('text-gray-800', 'flex-1');
        
        // Guardar la información en el dataset del elemento para un fácil acceso
        listItem.dataset.description = suggestion;
        listItem.dataset.calories = calories;

        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        suggestionList.appendChild(listItem);

        // Permitir que el clic en todo el div seleccione el checkbox
        listItem.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
        });
    });
}

addSelectedDishesButton.addEventListener('click', () => {
    const selectedItems = Array.from(document.querySelectorAll('#suggestion-list input[type="checkbox"]:checked'));
    if (selectedItems.length === 0) {
        showCustomAlert("Por favor, selecciona al menos un plato para añadir.");
        return;
    }

    let totalCaloriesToAdd = 0;
    const dishesToSave = [];

    selectedItems.forEach(item => {
        const parentDiv = item.closest('div');
        const description = parentDiv.dataset.description;
        const calories = parseInt(parentDiv.dataset.calories, 10);
        
        totalCaloriesToAdd += calories;
        dishesToSave.push({
            userId: userProfile.userId,
            date: new Date().toISOString(),
            description: description,
            caloriesganadas: calories
        });
    });
    
    let dailyData = loadDailyData();
    dailyData.consumed += totalCaloriesToAdd;
    saveToStorage('dailyData', dailyData);
    // Enviar cada plato seleccionado al backend
    dishesToSave.forEach(dish => {
        sendDataToBackend({
            action: 'saveData',
            sheet: 'Alimentos',
            payload: dish
        });
    });
    updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
    showCustomAlert(`Se han añadido ${totalCaloriesToAdd} kcal a tu consumo diario.`, "Platos Añadidos");
    cancelSuggestionButton.click();
});
cancelSuggestionButton.addEventListener('click', () => {
    suggestionModal.classList.add('hidden');
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
// --- FUNCIONES PARA MODAL PERSONALIZADO Y BOTONES ---
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