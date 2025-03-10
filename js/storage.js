function showLoading() { document.getElementById("loading").style.display = "block"; }
function hideLoading() { document.getElementById("loading").style.display = "none"; }

function saveToLocalStorage() {
    const rows = elements.resultBody.querySelectorAll("tr");
    const data = Array.from(rows).map(row => ({
        subject: row.cells[0].textContent,
        c: row.cells[1].textContent,
        b: row.cells[2].textContent,
        a: row.cells[3].textContent,
        credits: row.cells[4].textContent,
        score10: row.cells[5].textContent,
        score4: row.cells[6].textContent,
        grade: row.cells[7].textContent,
        semester: row.dataset.semester
    }));
    localStorage.setItem("studentGrades", JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem("studentGrades");
    if (savedData) {
        JSON.parse(savedData).forEach(item => addToResults(item.subject, item.c, item.b, item.a, item.credits, item.score10, item.score4, item.grade, item.semester));
        updateSemester();
    }
}

function exportToCSV() {
    showLoading();
    setTimeout(() => {
        const rows = elements.resultBody.querySelectorAll("tr");
        let csvContent = "Môn học,Điểm C,Điểm B,Điểm A,Tín chỉ,Điểm hệ 10,Điểm hệ 4,Điểm chữ,Kỳ học\n";
        rows.forEach(row => csvContent += Array.from(row.cells).slice(0, 9).map(cell => cell.textContent).join(",") + "\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
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

function importFromCSV(event) {
    showLoading();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        const rows = e.target.result.split('\n').slice(1);
        rows.forEach(row => {
            const [subject, c, b, a, credits, , , , semester] = row.split(',');
            if (subject && c && b && a && credits && semester) {
                const { score10, score4, grade } = calculateScores(parseFloat(c), parseFloat(b), parseFloat(a));
                addToResults(subject, parseFloat(c), parseFloat(b), parseFloat(a), parseInt(credits), score10, score4, grade, semester.trim());
            }
        });
        saveToLocalStorage();
        updateUI();
        hideLoading();
    };
    reader.readAsText(file);
}