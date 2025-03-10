function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        showToast("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        showToast("Đang lắng nghe... Nói: 'Môn [tên môn], điểm C [số], điểm B [số], điểm A [số], tín chỉ [số]'", "info");
    };

    recognition.onresult = event => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const parts = transcript.match(/môn (.+), điểm c (\d+(\.\d+)?), điểm b (\d+(\.\d+)?), điểm a (\d+(\.\d+)?), tín chỉ (\d+)/);
        if (parts) {
            const [_, subject, c, , b, , a, , credits] = parts;
            const row = elements.subjectsTable.insertRow();
            row.innerHTML = `
                <td data-label="Môn học"><input type="text" class="subject-name" value="${subject}" required></td>
                <td data-label="Điểm C"><input type="number" min="0" max="10" step="0.1" class="score-c" value="${c}"></td>
                <td data-label="Điểm B"><input type="number" min="0" max="10" step="0.1" class="score-b" value="${b}"></td>
                <td data-label="Điểm A"><input type="number" min="0" max="10" step="0.1" class="score-a" value="${a}"></td>
                <td data-label="Tín chỉ"><input type="number" min="1" max="10" step="1" class="credits" value="${credits}"></td>
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
            updateRowScores(row);
            showToast("Đã nhập dữ liệu từ giọng nói!", "success");
        } else {
            showToast("Không nhận diện được dữ liệu. Vui lòng nói rõ ràng theo định dạng!", "error");
        }
    };

    recognition.onerror = () => showToast("Lỗi khi nhận diện giọng nói!", "error");
    recognition.onend = () => showToast("Đã dừng lắng nghe.", "info");
    recognition.start();
}