document.addEventListener('DOMContentLoaded', () => {
    const sbdInput = document.getElementById('sbdInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    let studentData = [];

    function isValidScore(score) {
        if (!score || score === '') return false;
        if (typeof score === 'string') {
            if (score.toUpperCase() === 'VẮNG' || score.toUpperCase() === 'VANG') return false;
            const normalizedScore = score.replace(',', '.');
            const numValue = parseFloat(normalizedScore);
            return !isNaN(numValue);
        }
        return !isNaN(parseFloat(score));
    }

    function parseScore(score) {
        if (!score || score === '') return null;
        if (typeof score === 'string') {
            if (score.toUpperCase() === 'VẮNG' || score.toUpperCase() === 'VANG') return 'VẮNG';
            const normalizedScore = score.replace(',', '.');
            const numValue = parseFloat(normalizedScore);
            return isNaN(numValue) ? score : numValue;
        }
        return isNaN(parseFloat(score)) ? score : parseFloat(score);
    }

    function calculateTotalScore(student) {
        let total = 0;
        const subjects = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh'];
        subjects.forEach(subject => {
            if (student[subject] && isValidScore(student[subject])) {
                const score = parseScore(student[subject]);
                if (typeof score === 'number') total += score;
            }
        });
        return total;
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const students = [];
        const knownStringColumns = ['sbd', 'họ và tên', 'ngày tháng năm sinh', 'giới tính', 'số phòng', 'điểm thi'];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = [];
            let currentValue = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());

            if (values.length === headers.length) {
                const student = {};
                headers.forEach((header, index) => {
                    const lowerHeader = header.toLowerCase();
                    if (knownStringColumns.includes(lowerHeader)) {
                        student[header] = values[index];
                    } else {
                        student[header] = parseScore(values[index]);
                    }
                });
                student['Tổng điểm'] = calculateTotalScore(student);
                students.push(student);
            } else {
                console.warn(`Dòng ${i + 1} không khớp số cột`);
            }
        }

        return students;
    }

    async function loadStudentData() {
        try {
            const response = await fetch('diem_thi.csv');
            if (!response.ok) {
                resultContainer.innerHTML = '<p style="color: red;">Lỗi: Không thể tải file dữ liệu điểm (diem_thi.csv).</p>';
                console.error('Không thể fetch diem_thi.csv:', response.statusText);
                return false;
            }
            const csvText = await response.text();
            studentData = parseCSV(csvText);
            if (studentData.length === 0) {
                resultContainer.innerHTML = '<p style="color: orange;">File diem_thi.csv trống hoặc sai định dạng.</p>';
                return false;
            }
            return true;
        } catch (error) {
            resultContainer.innerHTML = '<p style="color: red;">Lỗi khi xử lý file dữ liệu điểm.</p>';
            console.error('Lỗi xử lý file CSV:', error);
            return false;
        }
    }

    loadStudentData();

    function findStudentBySBD(sbdToFind) {
        if (studentData.length === 0 || !studentData[0]) return null;

        const possibleSbdFields = ['SBD', 'sbd', 'Số báo danh', 'Số Báo Danh'];
        let sbdKey = possibleSbdFields.find(field => studentData[0][field] !== undefined);
        if (!sbdKey) return null;

        const normalizedSearchSBD = sbdToFind.trim();
        return studentData.find(student => String(student[sbdKey]).trim() === normalizedSearchSBD);
    }

    searchBtn.addEventListener('click', async () => {
        const sbd = sbdInput.value.trim();
        if (sbd === '') {
            resultContainer.innerHTML = '<p style="color: red;">Vui lòng nhập số báo danh.</p>';
            return;
        }

        if (studentData.length === 0) {
            const loaded = await loadStudentData();
            if (!loaded) {
                resultContainer.innerHTML = '<p style="color: red;">Dữ liệu chưa được tải. Thử lại sau.</p>';
                return;
            }
        }

        const student = findStudentBySBD(sbd);
        if (student) {
            displayScores(student);
        } else {
            resultContainer.innerHTML = `<p style="color: orange;">Không tìm thấy thông tin cho số báo danh: <strong>${sbd}</strong>.</p>`;
        }
    });

    function displayScores(data) {
        resultContainer.innerHTML = '';
        if (!data) {
            resultContainer.innerHTML = '<p style="color: red;">Lỗi: Dữ liệu không hợp lệ.</p>';
            return;
        }

        const infoFields = ['SBD', 'HỌ VÀ TÊN', 'NGÀY THÁNG NĂM SINH', 'GIỚI TÍNH', 'Số Phòng', 'Điểm thi'];
        const scoreFields = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Tổng điểm'];

        let tableHTML = `
            <div class="student-info">
                <h2>Thông tin học sinh</h2>
                <table class="info-table">
                    <tbody>`;
        
        infoFields.forEach(field => {
            if (data[field] !== undefined) {
                tableHTML += `
                    <tr>
                        <th>${field}:</th>
                        <td>${data[field]}</td>
                    </tr>`;
            }
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
            <div class="score-info">
                <h2>Kết quả điểm</h2>
                <table class="score-table">
                    <thead>
                        <tr>`;
        
        scoreFields.forEach(field => {
            tableHTML += `<th>${field}</th>`;
        });

        tableHTML += `
                        </tr>
                    </thead>
                    <tbody>
                        <tr>`;
        
        scoreFields.forEach(field => {
            const value = data[field] !== undefined ? data[field] : '-';
            tableHTML += `<td>${value}</td>`;
        });

        tableHTML += `
                        </tr>
                    </tbody>
                </table>
            </div>`;

        resultContainer.innerHTML = tableHTML;
    }
});
