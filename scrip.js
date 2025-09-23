// --- Referencias al DOM ---
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

// --- Estado de la Aplicación ---
let imageBase64 = null;
let userProfile = null;
let userPlan = null;
let analysisResult = null;
let currentPlanType = 'byPace';

// --- URL del Web App de Google Apps Script ---
// IMPORTANTE: Reemplaza esta URL con la URL de tu script desplegado.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxcDQiIiudcZg_-cS6E83jkAtLU46R8wV7CjlGVzo0pfWySXFtgtjfNRNYeGzIXUYKW/exec';


// --- INICIO: Lógica de Planificación de Pérdida de Peso ---
function calcWeightLossPlan({
    sex, age, weightKg, heightCm, activityKey, planType,
    kgGoal = 0, days = 30, paceKgPerWeek = 0.5,
}) {
    const ACTIVITY_FACTORS = { "sedentary": 1.20, "light": 1.375, "moderate": 1.55, "active": 1.725 };
    const MIN_KCAL = { M: 1500, F: 1200 };
    const MAX_DAILY_DEFICIT = 1000;
    const KCAL_PER_KG = 7700;

    const bmr = (sex === 'M') ? (10 * weightKg + 6.25 * heightCm - 5 * age + 5) : (10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    const activityFactor = ACTIVITY_FACTORS[activityKey] || 1.2;
    const tdee = bmr * activityFactor;
    
    let totalKcalNeeded, finalKgGoal, finalDays;

    if (planType === "byPace") {
        finalDays = days > 0 ? days : 30;
        const weeks = Math.max(finalDays / 7, 1);
        finalKgGoal = paceKgPerWeek * weeks;
        totalKcalNeeded = finalKgGoal * KCAL_PER_KG;
    } else { // byKg
        finalKgGoal = kgGoal > 0 ? kgGoal : 1;
        finalDays = days > 0 ? days : 30;
        totalKcalNeeded = finalKgGoal * KCAL_PER_KG;
    }

    let dailyDeficit = totalKcalNeeded / Math.max(finalDays, 1);
    let warnings = [];

    if (dailyDeficit > MAX_DAILY_DEFICIT) {
        warnings.push(`Déficit diario solicitado (${Math.round(dailyDeficit)} kcal) es muy alto. Se limitará a ${MAX_DAILY_DEFICIT} kcal para mayor seguridad.`);
        dailyDeficit = MAX_DAILY_DEFICIT;
    }

    let targetKcal = tdee - dailyDeficit;
    const minKcalAllowed = MIN_KCAL[sex] || 1200;

    if (targetKcal < minKcalAllowed) {
        warnings.push(`El objetivo calórico (${Math.round(targetKcal)} kcal) se ajustó al mínimo seguro de ${minKcalAllowed} kcal. Considere un plan menos agresivo.`);
        targetKcal = minKcalAllowed;
    }

    return {
        bmr: parseFloat(bmr.toFixed(1)),
        tdee: parseFloat(tdee.toFixed(1)),
        target_kcal: Math.round(targetKcal),
        daily_deficit: Math.round(dailyDeficit),
        kg_goal: parseFloat(finalKgGoal.toFixed(2)),
        days: finalDays,
        warnings
    };
}
// --- FIN: Lógica de Planificación ---

// --- Lógica de persistencia (localStorage) ---
function saveToStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function loadFromStorage(key) { const data = localStorage.getItem(key); return data ? JSON.parse(data) : null; }

function loadDailyData() {
    const data = loadFromStorage('dailyData');
    const today = new Date().toISOString().split('T')[0];
    if (!data || data.date !== today) return { consumed: 0 };
    return { consumed: data.consumed || 0 };
}

// --- Lógica de Comunicación con Google Sheets ---
async function saveDataToSheet(data) {
    if (GOOGLE_SCRIPT_URL === 'URL_DE_TU_WEB_APP_AQUI') {
        console.warn("La URL de Google Apps Script no ha sido configurada. Los datos no se guardarán en la nube.");
        return;
    }
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante para evitar errores de CORS con el modo de despliegue simple
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        console.log("Datos enviados a Google Sheets.");
    } catch (error) {
        console.error('Error al guardar en Google Sheets:', error);
    }
}


// --- Actualización de UI ---
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

// --- Lógica Principal de la App ---
window.onload = function() {
    startClock();
    userProfile = loadFromStorage('userProfile');
    userPlan = loadFromStorage('userPlan');
    
    if (userProfile && userPlan) {
        const dailyData = loadDailyData();
        updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
    } else if (userProfile && !userPlan) {
        planSetupModal.classList.remove('hidden');
    } else {
        userProfileModal.classList.remove('hidden');
    }
    analyzeButton.disabled = true;
};

// --- Event Listeners ---
document.getElementById('save-profile-button').addEventListener('click', () => {
    const profile = {
        age: parseInt(document.getElementById('age').value, 10),
        heightCm: parseInt(document.getElementById('height').value, 10),
        weightKg: parseFloat(document.getElementById('weight').value),
        sex: document.getElementById('gender').value,
        activityKey: document.getElementById('activityKey').value,
        userId: userProfile?.userId || `user_${Date.now()}` // Genera un ID de usuario simple
    };
    if (!profile.age || !profile.heightCm || !profile.weightKg) {
        alert("Por favor, completa todos los campos del perfil.");
        return;
    }
    userProfile = profile;
    saveToStorage('userProfile', profile);
    
    // Guarda el perfil inicial en Google Sheets
    saveDataToSheet({ type: 'profile', payload: userProfile });

    userProfileModal.classList.add('hidden');
    planSetupModal.classList.remove('hidden');
});

document.getElementById('plan-tabs').addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    currentPlanType = e.target.dataset.planType;
    document.querySelectorAll('.plan-tab-button').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    e.target.classList.add('border-blue-500', 'text-blue-600');
    document.querySelectorAll('.plan-type-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`plan-${currentPlanType}`).classList.remove('hidden');
});

document.getElementById('calculate-plan-button').addEventListener('click', () => {
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
    document.getElementById('save-plan-button').disabled = false;
});

document.getElementById('save-plan-button').addEventListener('click', () => {
    if (!userPlan) return;
    saveToStorage('userPlan', userPlan);
    
    // Guarda el plan en Google Sheets
    saveDataToSheet({ type: 'plan', payload: { ...userPlan, userId: userProfile.userId } });

    planSetupModal.classList.add('hidden');
    const dailyData = loadDailyData();
    updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
            analyzeButton.disabled = false;
            imageBase64 = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    }
});

analyzeButton.addEventListener('click', () => {
    if (imageBase64) analyzeImage(imageBase64);
});

addCaloriesButton.addEventListener('click', () => {
    if (!analysisResult) return;
    let dailyData = loadDailyData();
    dailyData.consumed += Math.round(analysisResult.totalCalories);
    saveToStorage('dailyData', { date: new Date().toISOString().split('T')[0], consumed: dailyData.consumed });
    
    // Guarda el registro de comida en Google Sheets
    saveDataToSheet({ type: 'mealLog', payload: { ...analysisResult, userId: userProfile.userId, date: new Date().toISOString() } });
    
    updateNutritionTrackerUI(userPlan.target_kcal, dailyData.consumed);
    resultsContainer.classList.add('hidden');
    fileInput.value = '';
    analyzeButton.disabled = true;
});

async function analyzeImage(base64ImageData) {
    resultsContainer.classList.remove('hidden');
    resultContent.classList.add('hidden');
    loader.classList.remove('hidden');
    analyzeButton.disabled = true;
    
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const systemPrompt = `Eres un nutricionista experto y un analista de alimentos. Tu tarea es analizar la imagen de una comida. Sigue estas instrucciones AL PIE DE LA LETRA:
1.  **PRIMERO, USA EL CONTEXTO VISUAL:** Observa el emplatado general. Si ves un solo plato, asume que es una porción para UNA SOLA PERSONA.
2.  **SEGUNDO, ESTIMA LOS GRAMOS BASADO EN LAS PORCIONES:** Una vez que determines que es una porción, estima la cantidad en gramos de los ingredientes para que se ajusten a esa realidad.
3.  **USA TU TABLA COMO GUÍA:** Esta es tu fuente de verdad para los tamaños de porciones estándar por persona.
    | Item | Average_grams_per_person |
    |---|---|
    | Red meat (cooked) | 85 |
    | Poultry (cooked) | 88 |
    | Fish (cooked) | 126.6 |
    | Rice (cooked, side) | 131.4 |
    | Potato (medium, whole) | 186.8 |
    | Fries (medium) | 116.4 |
    | Salad (raw leafy) | 79 |
    | Vegetables (cooked side) | 82.6 |
4.  **CREA EL ANÁLISIS:** Calcula las calorías totales y escribe un breve análisis ('portionAnalysis') comparando los gramos que estimaste con los gramos estándar de tu tabla.
5.  **RESPUESTA EN JSON:** Tu respuesta DEBE ser un objeto JSON VÁLIDO sin texto adicional y en Español.
El JSON debe contener: 'dishName', 'estimatedServings', 'totalCalories', 'portionAnalysis', y 'ingredients' (array de objetos con 'name', 'quantity', 'unit', 'calories'). NO incluyas 'instructions'.`;

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: "Analiza este platillo." }, { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }] }],
            generationConfig: { responseMimeType: "application/json" }
        })});
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();
        const candidate = result.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            analysisResult = JSON.parse(candidate.content.parts[0].text);
            displayResults(analysisResult);
        } else { throw new Error("Respuesta inválida."); }
    } catch (error) {
        console.error("Error detallado:", error);
        document.getElementById('error-message').textContent = 'Lo siento, no pude analizar la imagen.';
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
