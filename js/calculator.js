let scoreWeights = JSON.parse(localStorage.getItem("scoreWeights")) || { c: 0.1, b: 0.3, a: 0.6 };

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

function calculateScores(c, b, a) {
    const score10 = (a * scoreWeights.a + b * scoreWeights.b + c * scoreWeights.c).toFixed(2);
    const score4 = getScore4(score10);
    const grade = getGrade(score10);
    return { score10, score4, grade };
}

function calculateGPA(rows, viewAll, semester) {
    let totalWeightedScore10 = 0, totalWeightedScore4 = 0, totalCredits = 0;
    rows.forEach(row => {
        if (viewAll || row.dataset.semester === semester) {
            const score10 = parseFloat(row.cells[5].textContent);
            const score4 = parseFloat(row.cells[6].textContent);
            const credits = parseInt(row.cells[4].textContent);
            totalWeightedScore10 += score10 * credits;
            totalWeightedScore4 += score4 * credits;
            totalCredits += credits;
        }
    });

    const gpa10 = totalCredits > 0 ? (totalWeightedScore10 / totalCredits).toFixed(2) : 0;
    const gpa4 = totalCredits > 0 ? (totalWeightedScore4 / totalCredits).toFixed(2) : 0;
    return { gpa10, gpa4, totalCredits };
}