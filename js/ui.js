const elements = {
    subjectsTable: document.getElementById("subjects-table"),
    resultBody: document.getElementById("result-body"),
    semesterSelect: document.getElementById("semester-select"),
    viewAllSemesters: document.getElementById("view-all-semesters"),
    gpaDisplay: document.getElementById("gpa-display"),
    gradeChart: document.getElementById("gradeChart"),
    pieChart: document.getElementById("pieChart"),
};

let history = JSON.parse(localStorage.getItem("gradeHistory")) || [];

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function showToast(message, type = "error") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupUIEvents() {
    document.getElementById("add-subject").addEventListener("click", addSubjectRow);
    document.getElementById("speech-input").addEventListener("click", startSpeechRecognition);
    document.getElementById("export-csv").addEventListener("click", exportToCSV);
    document.getElementById("export-pdf").addEventListener("click", exportToPDF);
    document.getElementById("toggle-dark-mode").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        this.textContent = document.body.classList.contains("dark-mode") ? "Chuyển chế độ sáng" : "Chuyển chế độ tối";
    });
    document.getElementById("search").addEventListener("input", debounce(searchSubjects, 300));
    elements.semesterSelect.addEventListener("change", updateSemester);
    elements.viewAllSemesters.addEventListener("change", updateSemester);
    document.getElementById("calculate-target").addEventListener("click", calculateTargetGPA);
    document.getElementById("suggest-improvement").addEventListener("click", suggestImprovement);
    document.getElementById("import-csv").addEventListener("change", importFromCSV);
    document.getElementById("import-csv-btn").addEventListener("click", () => document.getElementById("import-csv").click());
    document.getElementById("trend-chart").addEventListener("click", drawGPATrendChart);
    document.getElementById("set-reminder").addEventListener("click", setGPAReminder);
    document.getElementById("check-graduation").addEventListener("click", checkGraduation);
    document.getElementById("compare-gpa").addEventListener("click", compareGPA);
    document.getElementById("save-weights").addEventListener("click", saveWeights);
    document.getElementById("add-forecast").addEventListener("click", addForecastRow);
    document.getElementById("calculate-forecast").addEventListener("click", calculateForecastGPA);
    document.getElementById("view-history").addEventListener("click", viewHistory);
    document.getElementById("share-result").addEventListener("click", shareResult);
    document.getElementById("compare-friend").addEventListener("click", compareWithFriend);
}

function addSubjectRow() {
    const row = elements.subjectsTable.insertRow();
    row.innerHTML = `
        <td data-label="Môn học"><input type="text" class="subject-name" placeholder="Tên môn" required></td>
        <td data-label="Điểm C"><input type="number" min="0" max="10" step="0.1" class="score-c"></td>
        <td data-label="Điểm B"><input type="number" min="0" max="10" step="0.1" class="score-b"></td>
        <td data-label="Điểm A"><input type="number" min="0" max="10" step="0.1" class="score-a"></td>
        <td data-label="Tín chỉ"><input type="number" min="1" max="10" step="1" class="credits" value="1"></td>
        <td data-label="Điểm Hệ 10"><span class="score-10">0</span></td>
        <td data-label="Điểm Hệ 4"><span class="score-4">0</span></td>
        <td data-label="Điểm Chữ"><span class="grade-letter">F</span></td>
        <td data-label="Hành động">
            <button class="save">Lưu</button>
            <button class="delete">Xóa</button>
        </td>
    `;

    row.querySelector(".delete").addEventListener("click", () => row.remove());
    row.querySelectorAll(".score-c, .score-b, .score-a").forEach(input => {
        input.addEventListener("input", debounce(() => {
            validateInput(input);
            updateRowScores(row);
        }, 300));
    });
    row.querySelector(".save").addEventListener("click", () => saveSubject(row));
}

function validateInput(input) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0 || value > 10) {
        showToast("Điểm phải trong khoảng 0 - 10!");
        input.value = "";
        return false;
    }
    return true;
}

function updateRowScores(row) {
    const c = parseFloat(row.querySelector(".score-c").value) || 0;
    const b = parseFloat(row.querySelector(".score-b").value) || 0;
    const a = parseFloat(row.querySelector(".score-a").value) || 0;
    const { score10, score4, grade } = calculateScores(c, b, a);
    row.querySelector(".score-10").textContent = score10;
    row.querySelector(".score-4").textContent = score4;
    row.querySelector(".grade-letter").textContent = grade;
}

function saveSubject(row) {
    const subject = row.querySelector(".subject-name").value.trim();
    if (!subject) return showToast("Vui lòng nhập tên môn học!");
    const c = parseFloat(row.querySelector(".score-c").value) || 0;
    const b = parseFloat(row.querySelector(".score-b").value) || 0;
    const a = parseFloat(row.querySelector(".score-a").value) || 0;
    const credits = parseInt(row.querySelector(".credits").value) || 1;
    const semester = elements.semesterSelect.value;

    if (!validateInput(row.querySelector(".score-c")) || !validateInput(row.querySelector(".score-b")) || !validateInput(row.querySelector(".score-a"))) return;
    if (credits < 1 || credits > 10) return showToast("Tín chỉ phải từ 1 đến 10!");

    const { score10, score4, grade } = calculateScores(c, b, a);
    addToResults(subject, c, b, a, credits, score10, score4, grade, semester);
    logHistory("Thêm", { subject, c, b, a, credits, semester });
    row.remove();
    saveToLocalStorage();
    updateUI();
}

function addToResults(subject, c, b, a, credits, score10, score4, grade, semester) {
    const row = elements.resultBody.insertRow();
    row.dataset.semester = semester;
    row.innerHTML = `
        <td data-label="Môn học">${subject}</td>
        <td data-label="Điểm C">${c}</td>
        <td data-label="Điểm B">${b}</td>
        <td data-label="Điểm A">${a}</td>
        <td data-label="Tín chỉ">${credits}</td>
        <td data-label="Điểm hệ 10">${score10}</td>
        <td data-label="Điểm hệ 4">${score4}</td>
        <td data-label="Điểm chữ">${grade}</td>
        <td data-label="Kỳ học">${semester}</td>
        <td data-label="Hành động">
            <button class="edit">Sửa</button>
            <button class="delete">Xóa</button>
        </td>
    `;
    attachRowEvents(row);
}

function attachRowEvents(row) {
    row.querySelector(".delete").addEventListener("click", () => {
        logHistory("Xóa", { subject: row.cells[0].textContent, semester: row.dataset.semester });
        row.remove();
        saveToLocalStorage();
        updateUI();
    });
    row.querySelector(".edit").addEventListener("click", () => editSubject(row));
}

function editSubject(row) {
    if (row.classList.contains("editing")) return;
    row.classList.add("editing");

    const cells = row.cells;
    const originalData = {
        subject: cells[0].textContent,
        c: cells[1].textContent,
        b: cells[2].textContent,
        a: cells[3].textContent,
        credits: cells[4].textContent,
        semester: cells[8].textContent
    };

    cells[0].innerHTML = `<input type="text" value="${originalData.subject}" class="edit-subject">`;
    cells[1].innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${originalData.c}" class="edit-score-c">`;
    cells[2].innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${originalData.b}" class="edit-score-b">`;
    cells[3].innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${originalData.a}" class="edit-score-a">`;
    cells[4].innerHTML = `<input type="number" min="1" max="10" step="1" value="${originalData.credits}" class="edit-credits">`;
    cells[9].innerHTML = `<button class="save-edit">Lưu</button> <button class="cancel-edit">Hủy</button>`;

    row.querySelector(".save-edit").addEventListener("click", () => {
        const subject = row.querySelector(".edit-subject").value.trim();
        const c = parseFloat(row.querySelector(".edit-score-c").value) || 0;
        const b = parseFloat(row.querySelector(".edit-score-b").value) || 0;
        const a = parseFloat(row.querySelector(".edit-score-a").value) || 0;
        const credits = parseInt(row.querySelector(".edit-credits").value) || 1;

        if (!subject) return showToast("Vui lòng nhập tên môn học!");
        if (!validateInput(row.querySelector(".edit-score-c")) || !validateInput(row.querySelector(".edit-score-b")) || !validateInput(row.querySelector(".edit-score-a"))) return;
        if (credits < 1 || credits > 10) return showToast("Tín chỉ phải từ 1 đến 10!");

        const { score10, score4, grade } = calculateScores(c, b, a);
        cells[0].textContent = subject;
        cells[1].textContent = c;
        cells[2].textContent = b;
        cells[3].textContent = a;
        cells[4].textContent = credits;
        cells[5].textContent = score10;
        cells[6].textContent = score4;
        cells[7].textContent = grade;
        cells[8].textContent = originalData.semester;
        cells[9].innerHTML = `<button class="edit">Sửa</button> <button class="delete">Xóa</button>`;

        logHistory("Sửa", { subject, old: originalData, new: { c, b, a, credits } });
        row.classList.remove("editing");
        attachRowEvents(row);
        saveToLocalStorage();
        updateUI();
    });

    row.querySelector(".cancel-edit").addEventListener("click", () => {
        cells[0].textContent = originalData.subject;
        cells[1].textContent = originalData.c;
        cells[2].textContent = originalData.b;
        cells[3].textContent = originalData.a;
        cells[4].textContent = originalData.credits;
        const { score10, score4, grade } = calculateScores(originalData.c, originalData.b, originalData.a);
        cells[5].textContent = score10;
        cells[6].textContent = score4;
        cells[7].textContent = grade;
        cells[8].textContent = originalData.semester;
        cells[9].innerHTML = `<button class="edit">Sửa</button> <button class="delete">Xóa</button>`;

        row.classList.remove("editing");
        attachRowEvents(row);
    });
}

function updateSemester() {
    const viewAll = elements.viewAllSemesters.checked;
    const semester = elements.semesterSelect.value;
    elements.resultBody.querySelectorAll("tr").forEach(row => {
        row.style.display = viewAll || row.dataset.semester === semester ? "" : "none";
    });
    updateUI();
}

function searchSubjects() {
    const query = document.getElementById("search").value.toLowerCase();
    const viewAll = elements.viewAllSemesters.checked;
    const semester = elements.semesterSelect.value;
    elements.resultBody.querySelectorAll("tr").forEach(row => {
        const subject = row.cells[0].textContent.toLowerCase();
        row.style.display = (viewAll || row.dataset.semester === semester) && subject.includes(query) ? "" : "none";
    });
}

function drawCharts() {
    const grades = { "A+": 0, "A": 0, "B+": 0, "B": 0, "C+": 0, "C": 0, "D+": 0, "D": 0, "F": 0 };
    const viewAll = elements.viewAllSemesters.checked;
    const semester = elements.semesterSelect.value;
    elements.resultBody.querySelectorAll("tr").forEach(row => {
        if ((viewAll || row.dataset.semester === semester) && row.style.display !== "none") {
            grades[row.cells[7].textContent]++;
        }
    });

    if (window.myBarChart) window.myBarChart.destroy();
    window.myBarChart = new Chart(elements.gradeChart.getContext("2d"), {
        type: "bar",
        data: {
            labels: Object.keys(grades),
            datasets: [{
                label: "Số môn",
                data: Object.values(grades),
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    if (window.myPieChart) window.myPieChart.destroy();
    window.myPieChart = new Chart(elements.pieChart.getContext("2d"), {
        type: "pie",
        data: {
            labels: Object.keys(grades),
            datasets: [{
                data: Object.values(grades),
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF", "#E7E9ED", "#D3D3D3"]
            }]
        }
    });
}

function drawGPATrendChart() {
    const semesters = ["Ky1", "Ky2", "He"];
    const gpaData = semesters.map(sem => {
        const rows = Array.from(elements.resultBody.querySelectorAll("tr")).filter(row => row.dataset.semester === sem);
        const { gpa4 } = calculateGPA(rows, true, sem);
        return gpa4;
    });

    if (window.myBarChart) window.myBarChart.destroy();
    window.myBarChart = new Chart(elements.gradeChart.getContext("2d"), {
        type: "line",
        data: {
            labels: semesters,
            datasets: [{ label: "GPA qua các kỳ", data: gpaData, fill: false, borderColor: "rgba(75, 192, 192, 1)", tension: 0.1 }]
        },
        options: { scales: { y: { beginAtZero: true, max: 4 } } }
    });
}

function compareGPA() {
    const semesters = ["Ky1", "Ky2", "He"];
    const gpaData = semesters.map(sem => {
        const rows = Array.from(elements.resultBody.querySelectorAll("tr")).filter(row => row.dataset.semester === sem);
        const { gpa4 } = calculateGPA(rows, true, sem);
        return gpa4;
    });

    document.getElementById("gpa-comparison").innerHTML = `
        <h3>So sánh GPA các kỳ</h3>
        <ul>${semesters.map((sem, i) => `<li>${sem}: ${gpaData[i]}</li>`).join("")}</ul>
    `;
}

function calculateTargetGPA() {
    const targetGPA = parseFloat(document.getElementById("target-gpa").value);
    const remainingSubjects = parseInt(document.getElementById("remaining-subjects").value);
    const rows = elements.resultBody.querySelectorAll("tr");
    const viewAll = elements.viewAllSemesters.checked;
    const semester = elements.semesterSelect.value;

    // Kiểm tra input hợp lệ
    if (isNaN(targetGPA) || isNaN(remainingSubjects) || targetGPA < 0 || targetGPA > 4 || remainingSubjects < 1) {
        document.getElementById("target-result").innerHTML = "Vui lòng nhập mục tiêu GPA (0-4) và số môn còn lại hợp lệ!";
        return;
    }

    // Tính GPA hiện tại
    const { gpa4, totalCredits } = calculateGPA(rows, viewAll, semester);
    const currentWeightedScore4 = gpa4 * totalCredits;

    // Nếu không có dữ liệu hiện tại
    if (totalCredits === 0) {
        document.getElementById("target-result").innerHTML = 
            `Chưa có dữ liệu hiện tại. Để đạt GPA ${targetGPA}, bạn cần trung bình ${targetGPA.toFixed(2)} (hệ 4) cho ${remainingSubjects} môn còn lại.`;
        return;
    }

    // Tính số tín chỉ còn lại
    const remainingCredits = remainingSubjects;

    // Tính điểm cần đạt
    const totalCreditsWithRemaining = totalCredits + remainingCredits;
    const requiredTotalScore4 = targetGPA * totalCreditsWithRemaining;
    const requiredRemainingScore4 = requiredTotalScore4 - currentWeightedScore4;

    // Kiểm tra xem có thể đạt được điểm cần thiết hay không
    if (remainingCredits > 0) {
        const avgScorePerSubject = (requiredRemainingScore4 / remainingCredits).toFixed(2);

        // Xử lý kết quả
        if (avgScorePerSubject > 4.0) {
            document.getElementById("target-result").innerHTML = 
                `Mục tiêu GPA ${targetGPA} không khả thi! Cần trung bình ${avgScorePerSubject} (hệ 4), vượt mức tối đa 4.0.`;
        } else if (avgScorePerSubject < 0) {
            document.getElementById("target-result").innerHTML = 
                `GPA hiện tại (${gpa4}) đã vượt mục tiêu ${targetGPA}! Bạn không cần thêm điểm.`;
        } else {
            document.getElementById("target-result").innerHTML = 
                `Để đạt GPA ${targetGPA}, bạn cần trung bình ${avgScorePerSubject} (hệ 4) cho ${remainingSubjects} môn còn lại.`;
        }
    } else {
        document.getElementById("target-result").innerHTML = "Số môn còn lại không hợp lệ!";
    }
}

function suggestImprovement() {
    const rows = elements.resultBody.querySelectorAll("tr");
    const viewAll = elements.viewAllSemesters.checked;
    const semester = elements.semesterSelect.value;
    let suggestions = [], totalWeightedScore4 = 0, totalCredits = 0;

    // Tính tổng điểm và tín chỉ hiện tại
    rows.forEach(row => {
        if (viewAll || row.dataset.semester === semester) {
            const subject = row.cells[0].textContent;
            const score10 = parseFloat(row.cells[5].textContent);
            const score4 = parseFloat(row.cells[6].textContent);
            const credits = parseInt(row.cells[4].textContent);
            totalWeightedScore4 += score4 * credits;
            totalCredits += credits;

            // Kiểm tra nếu điểm có thể tăng
            if (score10 < 10) {
                const newScore10 = Math.min(score10 + 1, 10);
                const newScore4 = getScore4(newScore10);
                const gpaIncrease = ((totalWeightedScore4 - score4 * credits + newScore4 * credits) / totalCredits) - (totalWeightedScore4 / totalCredits);
                suggestions.push(`Tăng "${subject}" từ ${score10} lên ${newScore10}: GPA tăng ${gpaIncrease.toFixed(2)}.`);
            }
        }
    });

    const currentGPA = totalCredits > 0 ? (totalWeightedScore4 / totalCredits).toFixed(2) : 0;
    document.getElementById("suggestion-display").innerHTML = `
        <p>GPA hiện tại: ${currentGPA}</p>
        <ul>${suggestions.length > 0 ? suggestions.map(s => `<li>${s}</li>`).join("") : "<li>Không có gợi ý cải thiện nào.</li>"}</ul>
    `;

    // Hiển thị gợi ý cải thiện dựa trên mục tiêu GPA
    const targetGPA = parseFloat(document.getElementById("target-gpa").value);
    if (!isNaN(targetGPA) && totalCredits > 0) {
        const requiredIncrease = (targetGPA * (totalCredits + suggestions.length) - totalWeightedScore4) / suggestions.length;
        document.getElementById("suggestion-display").innerHTML += `
            <p>Để đạt GPA mục tiêu ${targetGPA}, bạn cần tăng trung bình ${requiredIncrease.toFixed(2)} (hệ 4) cho các môn học.</p>
        `;
    }
}

function checkEmptyInputs() {
    const semester = elements.semesterSelect.value;
    const viewAll = elements.viewAllSemesters.checked;
    if (elements.subjectsTable.rows.length === 0 && elements.resultBody.rows.length === 0) {
        showToast("Bạn chưa nhập môn học nào!");
    } else if (!viewAll && Array.from(elements.resultBody.rows).every(row => row.dataset.semester !== semester)) {
        showToast(`Không có dữ liệu cho kỳ ${semester}!`);
    }
}

function checkGraduation() {
    const requiredCredits = parseInt(document.getElementById("required-credits").value);
    const minGPA = parseFloat(document.getElementById("min-gpa").value);
    const rows = elements.resultBody.querySelectorAll("tr");

    if (isNaN(requiredCredits) || isNaN(minGPA) || requiredCredits < 1 || minGPA < 0 || minGPA > 4) {
        document.getElementById("graduation-result").innerHTML = "Vui lòng nhập yêu cầu hợp lệ!";
        return;
    }

    const { gpa4, totalCredits } = calculateGPA(rows, true, "");
    document.getElementById("graduation-result").innerHTML = totalCredits >= requiredCredits && gpa4 >= minGPA
        ? "Chúc mừng! Bạn đủ điều kiện tốt nghiệp."
        : `Chưa đủ điều kiện. Tín chỉ: ${totalCredits}/${requiredCredits}, GPA: ${gpa4}/${minGPA}.`;
}

function setGPAReminder() {
    const targetGPA = parseFloat(document.getElementById("target-gpa").value);
    if (isNaN(targetGPA) || targetGPA < 0 || targetGPA > 4) return showToast("Nhập mục tiêu GPA hợp lệ (0-4)!");
    if (Notification.permission === "granted") {
        setInterval(() => {
            const { gpa4 } = calculateGPA(elements.resultBody.querySelectorAll("tr"), elements.viewAllSemesters.checked, elements.semesterSelect.value);
            if (gpa4 < targetGPA) new Notification("Cảnh báo GPA", { body: `GPA hiện tại (${gpa4}) thấp hơn mục tiêu (${targetGPA})!` });
        }, 60000);
    } else {
        Notification.requestPermission().then(perm => { if (perm === "granted") setGPAReminder(); });
    }
}

function updateUI() {
    const { gpa10, gpa4 } = calculateGPA(elements.resultBody.querySelectorAll("tr"), elements.viewAllSemesters.checked, elements.semesterSelect.value);
    elements.gpaDisplay.innerHTML = elements.viewAllSemesters.checked
        ? `<h3>GPA tổng quát: Hệ 10: ${gpa10} | Hệ 4: ${gpa4}</h3>`
        : `<h3>GPA kỳ ${elements.semesterSelect.value}: Hệ 10: ${gpa10} | Hệ 4: ${gpa4}</h3>`;
    drawCharts();
    if (gpa4 < 2.0 && elements.resultBody.rows.length > 0) showToast(`GPA ${elements.viewAllSemesters.checked ? "tổng quát" : "kỳ " + elements.semesterSelect.value} dưới 2.0!`, "warning");
}

function saveWeights() {
    const weightC = parseFloat(document.getElementById("weight-c").value) / 100;
    const weightB = parseFloat(document.getElementById("weight-b").value) / 100;
    const weightA = parseFloat(document.getElementById("weight-a").value) / 100;
    const total = weightC + weightB + weightA;

    if (total !== 1) {
        document.getElementById("weight-error").textContent = "Tổng tỉ trọng phải bằng 100%!";
        return;
    }

    scoreWeights = { c: weightC, b: weightB, a: weightA };
    localStorage.setItem("scoreWeights", JSON.stringify(scoreWeights));
    document.getElementById("weight-error").textContent = "";
    showToast("Đã lưu cấu hình tỉ trọng!", "success");
    
    elements.resultBody.querySelectorAll("tr").forEach(row => {
        const c = parseFloat(row.cells[1].textContent);
        const b = parseFloat(row.cells[2].textContent);
        const a = parseFloat(row.cells[3].textContent);
        const { score10, score4, grade } = calculateScores(c, b, a);
        row.cells[5].textContent = score10;
        row.cells[6].textContent = score4;
        row.cells[7].textContent = grade;
    });
    updateUI();
}

function initWeights() {
    document.getElementById("weight-c").value = (scoreWeights.c * 100).toFixed(0);
    document.getElementById("weight-b").value = (scoreWeights.b * 100).toFixed(0);
    document.getElementById("weight-a").value = (scoreWeights.a * 100).toFixed(0);
}

function addForecastRow() {
    const numSubjects = parseInt(document.getElementById("forecast-subjects").value) || 1;
    const tbody = document.getElementById("forecast-body");
    for (let i = 0; i < numSubjects; i++) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="text" class="forecast-subject" placeholder="Tên môn" required></td>
            <td><input type="number" min="0" max="10" step="0.1" class="forecast-score"></td>
            <td><input type="number" min="1" max="10" step="1" class="forecast-credits" value="1"></td>
            <td><button class="delete">Xóa</button></td>
        `;
        row.querySelector(".delete").addEventListener("click", () => row.remove());
    }
}

function calculateForecastGPA() {
    const currentRows = elements.resultBody.querySelectorAll("tr");
    const forecastRows = document.getElementById("forecast-body").querySelectorAll("tr");
    let totalWeightedScore4 = 0, totalCredits = 0;

    currentRows.forEach(row => {
        const score4 = parseFloat(row.cells[6].textContent);
        const credits = parseInt(row.cells[4].textContent);
        totalWeightedScore4 += score4 * credits;
        totalCredits += credits;
    });

    forecastRows.forEach(row => {
        const score10 = parseFloat(row.querySelector(".forecast-score").value) || 0;
        const credits = parseInt(row.querySelector(".forecast-credits").value) || 1;
        if (score10 < 0 || score10 > 10) return showToast("Điểm dự kiến phải từ 0-10!");
        if (credits < 1 || credits > 10) return showToast("Tín chỉ phải từ 1-10!");
        const score4 = getScore4(score10);
        totalWeightedScore4 += score4 * credits;
        totalCredits += credits;
    });

    const forecastGPA = totalCredits > 0 ? (totalWeightedScore4 / totalCredits).toFixed(2) : 0;
    document.getElementById("forecast-result").innerHTML = `GPA dự kiến: ${forecastGPA} (hệ 4) với ${totalCredits} tín chỉ.`;
}

function logHistory(action, details) {
    const timestamp = new Date().toLocaleString();
    history.push({ timestamp, action, details });
    localStorage.setItem("gradeHistory", JSON.stringify(history));
}

function viewHistory() {
    const display = document.getElementById("history-display");
    display.style.display = "block";
    display.innerHTML = `<h3>Lịch sử thay đổi</h3><ul>${
        history.map(h => `<li>${h.timestamp}: ${h.action} - ${JSON.stringify(h.details)}</li>`).join("")
    }</ul>`;
}

function shareResult() {
    const { gpa4, totalCredits } = calculateGPA(elements.resultBody.querySelectorAll("tr"), elements.viewAllSemesters.checked, elements.semesterSelect.value);
    const text = `GPA của tôi: ${gpa4} (hệ 4) với ${totalCredits} tín chỉ! Tính bằng Hệ thống Tính Điểm Học Tập An's. #GPA #HocTap`;
    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    showToast("Đã mở cửa sổ chia sẻ!", "success");
}

function compareWithFriend() {
    const friendGPA = parseFloat(document.getElementById("friend-gpa").value);
    if (isNaN(friendGPA) || friendGPA < 0 || friendGPA > 4) {
        showToast("Vui lòng nhập GPA hợp lệ (0-4)!");
        return;
    }

    const { gpa4 } = calculateGPA(elements.resultBody.querySelectorAll("tr"), elements.viewAllSemesters.checked, elements.semesterSelect.value);
    const diff = (gpa4 - friendGPA).toFixed(2);
    document.getElementById("friend-result").innerHTML = `
        GPA của bạn: ${gpa4} | GPA bạn bè: ${friendGPA}<br>
        ${diff > 0 ? `Bạn cao hơn ${diff}` : diff < 0 ? `Bạn thấp hơn ${Math.abs(diff)}` : "Bằng nhau!"}
    `;
}