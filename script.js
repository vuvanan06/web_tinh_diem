document.addEventListener("DOMContentLoaded", function () {
    loadFromLocalStorage();
    document.getElementById("add-subject").addEventListener("click", addSubjectRow);
    document.getElementById("export-csv").addEventListener("click", exportToCSV);
    document.getElementById("export-pdf").addEventListener("click", exportToPDF);
    document.getElementById("toggle-dark-mode").addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
        this.textContent = document.body.classList.contains("dark-mode") ? "Chuyển chế độ sáng" : "Chuyển chế độ tối";
    });
    document.getElementById("search").addEventListener("input", searchSubjects);
    document.getElementById("semester-select").addEventListener("change", updateSemester);
    document.getElementById("view-all-semesters").addEventListener("change", updateSemester);
    document.getElementById("calculate-target").addEventListener("click", calculateTargetGPA);
    document.getElementById("suggest-improvement").addEventListener("click", suggestImprovement);
    document.getElementById("import-csv").addEventListener("change", importFromCSV);
    document.getElementById("import-csv-btn").addEventListener("click", () => document.getElementById("import-csv").click());
    document.getElementById("trend-chart").addEventListener("click", drawGPATrendChart);
    document.getElementById("set-reminder").addEventListener("click", setGPAReminder);
    document.getElementById("check-graduation").addEventListener("click", checkGraduation);
    drawChart();
    checkEmptyInputs();
});

function showLoading() {
    document.getElementById("loading").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

function addSubjectRow() {
    let table = document.getElementById("subjects-table");
    let row = table.insertRow();
    row.innerHTML = `
        <td><input type="text" class="subject-name" placeholder="Tên môn" required></td>
        <td><input type="number" min="0" max="10" step="0.1" class="score-c"></td>
        <td><input type="number" min="0" max="10" step="0.1" class="score-b"></td>
        <td><input type="number" min="0" max="10" step="0.1" class="score-a"></td>
        <td><input type="number" min="1" max="10" step="1" class="credits" value="1"></td>
        <td><span class="score-10">0</span></td>
        <td><span class="score-4">0</span></td>
        <td><span class="grade-letter">F</span></td>
        <td>
            <button class="save">Lưu</button>
            <button class="delete">Xóa</button>
        </td>
    `;

    row.querySelector(".delete").addEventListener("click", () => row.remove());
    row.querySelectorAll(".score-c, .score-b, .score-a").forEach(input => {
        input.addEventListener("input", () => {
            validateInput(input);
            calculateScores(row);
        });
    });
    row.querySelector(".save").addEventListener("click", () => saveSubject(row));
}

// function validateInput(input) {
//     let value = parseFloat(input.value);
//     if (isNaN(value) || value < 0 || value > 10) {
//         alert("Điểm phải trong khoảng 0 - 10!");
//         input.value = 0;
//     }
// }

function calculateScores(row) {
    let c = parseFloat(row.querySelector(".score-c").value) || 0;
    let b = parseFloat(row.querySelector(".score-b").value) || 0;
    let a = parseFloat(row.querySelector(".score-a").value) || 0;
    let score10 = (a * 0.6 + b * 0.3 + c * 0.1).toFixed(2);
    let score4 = getScore4(score10);
    let grade = getGrade(score10);

    row.querySelector(".score-10").textContent = score10;
    row.querySelector(".score-4").textContent = score4;
    row.querySelector(".grade-letter").textContent = grade;
}

function getScore4(score10) {
    if (score10 >= 9) return 4.0;
    if (score10 >= 8.5) return 3.7;
    if (score10 >= 8) return 3.5;
    if (score10 >= 7) return 3.0;
    if (score10 >= 6.5) return 2.5;
    if (score10 >= 5.5) return 2.0;
    if (score10 >= 5.0) return 1.5;
    if (score10 >= 4) return 1;
    return 0.0;
}

function getGrade(score10) {
    if (score10 >= 9) return "A+";
    if (score10 >= 8.5) return "A";
    if (score10 >= 8) return "B+";
    if (score10 >= 7) return "B";
    if (score10 >= 6.5) return "C+";
    if (score10 >= 5.5) return "C";
    if (score10 >= 5.0) return "D+";
    if (score10 >= 4) return "D";
    return "F";
}

function saveSubject(row) {
    let subject = row.querySelector(".subject-name").value.trim();
    if (subject === "") {
        alert("Vui lòng nhập tên môn học!");
        return;
    }
    let c = parseFloat(row.querySelector(".score-c").value) || 0;
    let b = parseFloat(row.querySelector(".score-b").value) || 0;
    let a = parseFloat(row.querySelector(".score-a").value) || 0;
    let credits = parseInt(row.querySelector(".credits").value) || 1;
    let semester = document.getElementById("semester-select").value;

    if (c < 0 || c > 10 || b < 0 || b > 10 || a < 0 || a > 10) {
        alert("Điểm phải trong khoảng 0 - 10!");
        return;
    }
    if (credits < 1 || credits > 10) {
        alert("Tín chỉ phải từ 1 đến 10!");
        return;
    }

    let score10 = (a * 0.6 + b * 0.3 + c * 0.1).toFixed(2);
    let score4 = getScore4(score10);
    let grade = getGrade(score10);

    addToResults(subject, c, b, a, credits, score10, score4, grade, semester);
    row.remove();
    saveToLocalStorage();
    calculateGPA();
    drawChart();
    checkEmptyInputs();
}

function addToResults(subject, c, b, a, credits, score10, score4, grade, semester) {
    let resultsTable = document.getElementById("result-body");
    let row = resultsTable.insertRow();
    row.dataset.semester = semester;
    row.innerHTML = `
        <td>${subject}</td>
        <td>${c}</td>
        <td>${b}</td>
        <td>${a}</td>
        <td>${credits}</td>
        <td>${score10}</td>
        <td>${score4}</td>
        <td>${grade}</td>
        <td>${semester}</td>
        <td>
            <button class="edit">Sửa</button>
            <button class="delete">Xóa</button>
        </td>
    `;
    attachRowEvents(row);
}

function attachRowEvents(row) {
    row.querySelector(".delete").addEventListener("click", () => {
        row.remove();
        saveToLocalStorage();
        calculateGPA();
        drawChart();
    });
    row.querySelector(".edit").addEventListener("click", () => editSubject(row));
}

function editSubject(row) {
    if (row.classList.contains("editing")) return;
    row.classList.add("editing");

    let cells = row.cells;
    let originalData = {
        subject: cells[0].textContent,
        c: cells[1].textContent,
        b: cells[2].textContent,
        a: cells[3].textContent,
        credits: cells[4].textContent,
        score10: cells[5].textContent,
        score4: cells[6].textContent,
        grade: cells[7].textContent,
        semester: cells[8].textContent
    };

    cells[0].innerHTML = `<input type="text" value="${originalData.subject}" class="edit-subject">`;
    cells[1].innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${originalData.c}" class="edit-score-c">`;
    cells[2].innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${originalData.b}" class="edit-score-b">`;
    cells[3].innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${originalData.a}" class="edit-score-a">`;
    cells[4].innerHTML = `<input type="number" min="1" max="10" step="1" value="${originalData.credits}" class="edit-credits">`;
    cells[9].innerHTML = `<button class="save-edit">Lưu</button> <button class="cancel-edit">Hủy</button>`;

    row.querySelector(".save-edit").addEventListener("click", () => {
        let subject = row.querySelector(".edit-subject").value.trim();
        let c = parseFloat(row.querySelector(".edit-score-c").value) || 0;
        let b = parseFloat(row.querySelector(".edit-score-b").value) || 0;
        let a = parseFloat(row.querySelector(".edit-score-a").value) || 0;
        let credits = parseInt(row.querySelector(".edit-credits").value) || 1;

        if (subject === "") {
            alert("Vui lòng nhập tên môn học!");
            return;
        }
        if (c < 0 || c > 10 || b < 0 || b > 10 || a < 0 || a > 10) {
            alert("Điểm phải trong khoảng 0 - 10!");
            return;
        }
        if (credits < 1 || credits > 10) {
            alert("Tín chỉ phải từ 1 đến 10!");
            return;
        }

        let score10 = (a * 0.6 + b * 0.3 + c * 0.1).toFixed(2);
        let score4 = getScore4(score10);
        let grade = getGrade(score10);

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

        row.classList.remove("editing");
        attachRowEvents(row);
        saveToLocalStorage();
        calculateGPA();
        drawChart();
    });

    row.querySelector(".cancel-edit").addEventListener("click", () => {
        cells[0].textContent = originalData.subject;
        cells[1].textContent = originalData.c;
        cells[2].textContent = originalData.b;
        cells[3].textContent = originalData.a;
        cells[4].textContent = originalData.credits;
        cells[5].textContent = originalData.score10;
        cells[6].textContent = originalData.score4;
        cells[7].textContent = originalData.grade;
        cells[8].textContent = originalData.semester;
        cells[9].innerHTML = `<button class="edit">Sửa</button> <button class="delete">Xóa</button>`;

        row.classList.remove("editing");
        attachRowEvents(row);
    });
}

function calculateGPA() {
    let resultRows = document.querySelectorAll("#result-body tr");
    let viewAll = document.getElementById("view-all-semesters").checked;
    let semester = document.getElementById("semester-select").value;
    let totalWeightedScore10 = 0;
    let totalWeightedScore4 = 0;
    let totalCredits = 0;

    resultRows.forEach(row => {
        if (viewAll || row.dataset.semester === semester) {
            let score10 = parseFloat(row.cells[5].textContent);
            let score4 = parseFloat(row.cells[6].textContent);
            let credits = parseInt(row.cells[4].textContent);
            totalWeightedScore10 += score10 * credits;
            totalWeightedScore4 += score4 * credits;
            totalCredits += credits;
        }
    });

    let gpa10 = totalCredits > 0 ? (totalWeightedScore10 / totalCredits).toFixed(2) : 0;
    let gpa4 = totalCredits > 0 ? (totalWeightedScore4 / totalCredits).toFixed(2) : 0;

    document.getElementById("gpa-display").innerHTML = viewAll
        ? `<h3>GPA tổng quát (tất cả kỳ): Hệ 10: ${gpa10} | Hệ 4: ${gpa4}</h3>`
        : `<h3>GPA kỳ ${semester}: Hệ 10: ${gpa10} | Hệ 4: ${gpa4}</h3>`;

    if (gpa4 < 2.0 && totalCredits > 0) {
        alert(`Cảnh báo: GPA ${viewAll ? "tổng quát" : "kỳ " + semester} của bạn (${gpa4}) dưới ngưỡng 2.0!`);
    }
}

function saveToLocalStorage() {
    let resultRows = document.querySelectorAll("#result-body tr");
    let data = [];
    resultRows.forEach(row => {
        data.push({
            subject: row.cells[0].textContent,
            c: row.cells[1].textContent,
            b: row.cells[2].textContent,
            a: row.cells[3].textContent,
            credits: row.cells[4].textContent,
            score10: row.cells[5].textContent,
            score4: row.cells[6].textContent,
            grade: row.cells[7].textContent,
            semester: row.dataset.semester
        });
    });
    localStorage.setItem("studentGrades", JSON.stringify(data));
}

function loadFromLocalStorage() {
    let savedData = localStorage.getItem("studentGrades");
    if (savedData) {
        let data = JSON.parse(savedData);
        data.forEach(item => {
            addToResults(item.subject, item.c, item.b, item.a, item.credits, item.score10, item.score4, item.grade, item.semester);
        });
        updateSemester();
    }
}

function updateSemester() {
    let viewAll = document.getElementById("view-all-semesters").checked;
    let semester = document.getElementById("semester-select").value;
    let rows = document.querySelectorAll("#result-body tr");
    rows.forEach(row => {
        row.style.display = viewAll || row.dataset.semester === semester ? "" : "none";
    });
    calculateGPA();
    drawChart();
}

function exportToCSV() {
    showLoading();
    setTimeout(() => {
        let resultRows = document.querySelectorAll("#result-body tr");
        let csvContent = "Môn học,Điểm C,Điểm B,Điểm A,Tín chỉ,Điểm hệ 10,Điểm hệ 4,Điểm chữ,Kỳ học\n";
        resultRows.forEach(row => {
            let rowData = [];
            for (let i = 0; i < 9; i++) {
                rowData.push(row.cells[i].textContent);
            }
            csvContent += rowData.join(",") + "\n";
        });

        let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "KetQuaHocTap.csv";
        link.click();
        hideLoading();
    }, 500);
}

function exportToPDF() {
    showLoading();
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Kết Quả Học Tập", 10, 10);
        doc.autoTable({ html: "#result-table" });
        doc.save("KetQuaHocTap.pdf");
        hideLoading();
    }, 500);
}

function searchSubjects() {
    let query = document.getElementById("search").value.toLowerCase();
    let viewAll = document.getElementById("view-all-semesters").checked;
    let semester = document.getElementById("semester-select").value;
    let rows = document.querySelectorAll("#result-body tr");
    rows.forEach(row => {
        let subject = row.cells[0].textContent.toLowerCase();
        row.style.display = (viewAll || row.dataset.semester === semester) && subject.includes(query) ? "" : "none";
    });
}

function drawChart() {
    let grades = { "A+": 0, "A": 0, "B+": 0, "B": 0, "C+": 0, "C": 0, "D+": 0, "D": 0, "F": 0 };
    let viewAll = document.getElementById("view-all-semesters").checked;
    let semester = document.getElementById("semester-select").value;
    let resultRows = document.querySelectorAll("#result-body tr");
    resultRows.forEach(row => {
        if ((viewAll || row.dataset.semester === semester) && row.style.display !== "none") {
            grades[row.cells[7].textContent]++;
        }
    });

    let ctx = document.getElementById("gradeChart").getContext("2d");
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
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
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function drawGPATrendChart() {
    let semesters = ["Ky1", "Ky2", "He"];
    let gpaData = semesters.map(sem => {
        let rows = Array.from(document.querySelectorAll("#result-body tr")).filter(row => row.dataset.semester === sem);
        let totalWeightedScore4 = 0, totalCredits = 0;
        rows.forEach(row => {
            totalWeightedScore4 += parseFloat(row.cells[6].textContent) * parseInt(row.cells[4].textContent);
            totalCredits += parseInt(row.cells[4].textContent);
        });
        return totalCredits > 0 ? (totalWeightedScore4 / totalCredits).toFixed(2) : 0;
    });

    let ctx = document.getElementById("gradeChart").getContext("2d");
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: semesters,
            datasets: [{
                label: "GPA qua các kỳ",
                data: gpaData,
                fill: false,
                borderColor: "rgba(75, 192, 192, 1)",
                tension: 0.1
            }]
        },
        options: { scales: { y: { beginAtZero: true, max: 4 } } }
    });
}

function calculateTargetGPA() {
    let targetGPA = parseFloat(document.getElementById("target-gpa").value);
    let remainingSubjects = parseInt(document.getElementById("remaining-subjects").value);
    let resultRows = document.querySelectorAll("#result-body tr");
    let viewAll = document.getElementById("view-all-semesters").checked;
    let semester = document.getElementById("semester-select").value;
    let totalWeightedScore4 = 0;
    let totalCredits = 0;

    if (isNaN(targetGPA) || isNaN(remainingSubjects) || targetGPA < 0 || targetGPA > 4 || remainingSubjects < 1) {
        document.getElementById("target-result").innerHTML = "Vui lòng nhập mục tiêu GPA (0-4) và số môn còn lại hợp lệ!";
        return;
    }

    resultRows.forEach(row => {
        if (viewAll || row.dataset.semester === semester) {
            let score4 = parseFloat(row.cells[6].textContent);
            let credits = parseInt(row.cells[4].textContent);
            if (!isNaN(score4) && !isNaN(credits)) {
                totalWeightedScore4 += score4 * credits;
                totalCredits += credits;
            }
        }
    });

    let totalCreditsWithRemaining = totalCredits + remainingSubjects;
    let requiredTotalScore = targetGPA * totalCreditsWithRemaining;
    let requiredRemainingScore = requiredTotalScore - totalWeightedScore4;
    let avgScorePerSubject = (requiredRemainingScore / remainingSubjects).toFixed(2);

    if (avgScorePerSubject > 4.0) {
        document.getElementById("target-result").innerHTML = `
            Mục tiêu GPA ${targetGPA} không khả thi! Bạn cần đạt trung bình ${avgScorePerSubject} (hệ 4),
            cao hơn mức tối đa là 4.0.
        `;
    } else if (avgScorePerSubject < 0) {
        document.getElementById("target-result").innerHTML = `
            Bạn đã đạt được mục tiêu hoặc vượt quá mức cần thiết.
        `;
    } else {
        document.getElementById("target-result").innerHTML = `
            Để đạt GPA ${targetGPA}, bạn cần đạt trung bình ${avgScorePerSubject} (hệ 4) 
            cho ${remainingSubjects} môn còn lại.
        `;
    }
}

function suggestImprovement() {
    let resultRows = document.querySelectorAll("#result-body tr");
    let viewAll = document.getElementById("view-all-semesters").checked;
    let semester = document.getElementById("semester-select").value;
    let suggestions = [];
    let totalWeightedScore4 = 0;
    let totalCredits = 0;

    resultRows.forEach(row => {
        if (viewAll || row.dataset.semester === semester) {
            let subject = row.cells[0].textContent;
            let score10 = parseFloat(row.cells[5].textContent);
            let score4 = parseFloat(row.cells[6].textContent);
            let credits = parseInt(row.cells[4].textContent);
            totalWeightedScore4 += score4 * credits;
            totalCredits += credits;

            if (score10 < 10) {
                let newScore10 = Math.min(score10 + 1, 10);
                let newScore4 = getScore4(newScore10);
                let gpaIncrease = ((totalWeightedScore4 - score4 * credits + newScore4 * credits) / totalCredits) - (totalWeightedScore4 / totalCredits);
                suggestions.push(`Nếu tăng điểm môn "${subject}" từ ${score10} lên ${newScore10}, GPA sẽ tăng thêm ${gpaIncrease.toFixed(2)}.`);
            }
        }
    });

    let currentGPA = (totalWeightedScore4 / totalCredits).toFixed(2);
    document.getElementById("suggestion-display").innerHTML = `
        <p>GPA hiện tại: ${currentGPA}</p>
        <ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
    `;
}

function checkEmptyInputs() {
    let subjectsTable = document.getElementById("subjects-table");
    let resultTable = document.getElementById("result-body");
    let semester = document.getElementById("semester-select").value;
    let viewAll = document.getElementById("view-all-semesters").checked;

    if (subjectsTable.rows.length === 0 && resultTable.rows.length === 0) {
        alert("Bạn chưa nhập bất kỳ môn học nào!");
    } else if (!viewAll && Array.from(resultTable.rows).every(row => row.dataset.semester !== semester)) {
        alert(`Không có dữ liệu cho kỳ ${semester}. Vui lòng nhập điểm hoặc chọn kỳ khác!`);
    }
}

function importFromCSV(event) {
    showLoading();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').slice(1);
        rows.forEach(row => {
            const [subject, c, b, a, credits, , , , semester] = row.split(',');
            if (subject && c && b && a && credits && semester) {
                addToResults(subject, parseFloat(c), parseFloat(b), parseFloat(a), parseInt(credits),
                            (parseFloat(a) * 0.6 + parseFloat(b) * 0.3 + parseFloat(c) * 0.1).toFixed(2),
                            getScore4((parseFloat(a) * 0.6 + parseFloat(b) * 0.3 + parseFloat(c) * 0.1)),
                            getGrade((parseFloat(a) * 0.6 + parseFloat(b) * 0.3 + parseFloat(c) * 0.1)), semester.trim());
            }
        });
        saveToLocalStorage();
        calculateGPA();
        drawChart();
        hideLoading();
    };
    reader.readAsText(file);
}

function setGPAReminder() {
    let targetGPA = parseFloat(document.getElementById("target-gpa").value);
    if (isNaN(targetGPA) || targetGPA < 0 || targetGPA > 4) {
        alert("Vui lòng nhập mục tiêu GPA hợp lệ (0-4)!");
        return;
    }
    if (Notification.permission === "granted") {
        setInterval(() => {
            calculateGPA();
            let currentGPA = parseFloat(document.getElementById("gpa-display").textContent.match(/Hệ 4: (\d\.\d+)/)[1]);
            if (currentGPA < targetGPA) {
                new Notification("Cảnh báo GPA", { body: `GPA hiện tại (${currentGPA}) thấp hơn mục tiêu (${targetGPA})!` });
            }
        }, 60000);
    } else {
        Notification.requestPermission().then(perm => {
            if (perm === "granted") setGPAReminder();
        });
    }
}

function checkGraduation() {
    let requiredCredits = parseInt(document.getElementById("required-credits").value);
    let minGPA = parseFloat(document.getElementById("min-gpa").value);
    let resultRows = document.querySelectorAll("#result-body tr");
    let totalCredits = 0;
    let totalWeightedScore4 = 0;

    if (isNaN(requiredCredits) || isNaN(minGPA) || requiredCredits < 1 || minGPA < 0 || minGPA > 4) {
        document.getElementById("graduation-result").innerHTML = "Vui lòng nhập yêu cầu hợp lệ!";
        return;
    }

    resultRows.forEach(row => {
        let score4 = parseFloat(row.cells[6].textContent);
        let credits = parseInt(row.cells[4].textContent);
        totalWeightedScore4 += score4 * credits;
        totalCredits += credits;
    });

    let currentGPA = totalCredits > 0 ? (totalWeightedScore4 / totalCredits).toFixed(2) : 0;
    let result = totalCredits >= requiredCredits && currentGPA >= minGPA
        ? "Chúc mừng! Bạn đã đủ điều kiện tốt nghiệp."
        : `Bạn chưa đủ điều kiện tốt nghiệp. Tổng tín chỉ: ${totalCredits}/${requiredCredits}, GPA: ${currentGPA}/${minGPA}.`;

    document.getElementById("graduation-result").innerHTML = result;
}